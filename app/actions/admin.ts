"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const roleSchema = z.enum(["TRAVELER", "AGENCY", "STAFF", "ADMIN"]);
const staffRoleSchema = z.enum(["MANAGER", "AGENT", "SUPPORT"]);
const agencyIdSchema = z.string().cuid();

async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return session;
}

async function ensureActiveAgency(agencyId: string) {
  const agency = await prisma.agency.findFirst({
    where: { id: agencyId, active: true },
    select: { id: true },
  });
  if (!agency) throw new Error("The selected agency is not active.");
}

function agencySlug(name: string, userId: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agency";
  return `${base}-${userId.substring(0, 5)}`;
}

export async function changeUserRole(
  userId: string,
  role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN",
  agencyId?: string | null,
  staffRole?: "MANAGER" | "AGENT" | "SUPPORT" | null
) {
  try {
    const session = await verifyAdmin();

    const nextRole = roleSchema.parse(role);
    const nextStaffRole = staffRole ? staffRoleSchema.parse(staffRole) : "AGENT";
    if (agencyId) agencyIdSchema.parse(agencyId);
    if (session.user.id === userId && nextRole !== "ADMIN") return { error: "You cannot remove your own platform-admin access." };

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (user.role === "AGENCY" && nextRole !== "AGENCY") {
      return { error: "Agency owners cannot be converted because that could destroy operational data. Suspend the agency or transfer ownership through a dedicated workflow." };
    }
    if (nextRole === "STAFF") {
      if (!agencyId) return { error: "An agency must be assigned when changing a user to staff." };
      await ensureActiveAgency(agencyId);
    }

    await prisma.$transaction(async (tx) => {
      if (user.role === "STAFF" && nextRole !== "STAFF") {
        await tx.agencyStaff.deleteMany({ where: { userId } });
      }
      const updatedUser = await tx.user.update({ where: { id: userId }, data: { role: nextRole } });
      if (nextRole === "AGENCY") {
        const existingAgency = await tx.agency.findUnique({ where: { ownerId: userId } });
        if (!existingAgency) await tx.agency.create({ data: { name: updatedUser.name, slug: agencySlug(updatedUser.name, updatedUser.id), ownerId: updatedUser.id, email: updatedUser.email } });
      }
      if (nextRole === "STAFF" && agencyId) {
        await tx.agencyStaff.upsert({
          where: { userId },
          update: { agencyId, role: nextStaffRole, active: true },
          create: { userId, agencyId, role: nextStaffRole, active: true },
        });
      }
    });
    await writeAuditLog({ actorId: session.user.id, action: "user.role_changed", resourceType: "User", resourceId: userId, before: { role: user.role }, after: { role: nextRole, agencyId: agencyId ?? null, staffRole: nextRole === "STAFF" ? nextStaffRole : null } });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("[CHANGE_USER_ROLE_ERROR]", error);
    return { error: error.message || "Failed to change user role" };
  }
}

export async function createUserByAdmin(input: {
  name: string;
  email: string;
  role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN";
  phone?: string;
  agencyId?: string | null;
  staffRole?: "MANAGER" | "AGENT" | "SUPPORT" | null;
}) {
  try {
    await verifyAdmin();
    // A bare User row cannot authenticate and would prevent the person from
    // registering normally. Until a tokenized invitation workflow exists,
    // registrations must use the audited public/agency onboarding flow.
    return { error: "Direct account creation is disabled until email invitations are configured. Ask the user to register, then assign their role here." };
  } catch (error: any) {
    console.error("[CREATE_USER_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to create user" };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await verifyAdmin();
    if (session.user.id === userId) {
      return { error: "You cannot delete your own account" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) return { error: "User not found" };
    if (user.role === "AGENCY") return { error: "Agency owners cannot be deleted from the user directory. Suspend or close the agency through its governed workflow." };
    await prisma.user.delete({
      where: { id: userId },
    });
    await writeAuditLog({ actorId: session.user.id, action: "user.deleted", resourceType: "User", resourceId: userId, before: { role: user.role } });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_USER_ERROR]", error);
    return { error: error.message || "Failed to delete user" };
  }
}

export async function toggleAgencyVerification(agencyId: string) {
  try {
    const session = await verifyAdmin();

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return { error: "Agency not found" };
    }

    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: { verified: !agency.verified },
    });
    await writeAuditLog({ actorId: session.user.id, action: "agency.verification_changed", resourceType: "Agency", resourceId: agencyId, before: { verified: agency.verified }, after: { verified: updated.verified } });

    revalidatePath("/dashboard/agencies");
    revalidatePath("/packages");
    return { success: true };
  } catch (error: any) {
    console.error("[TOGGLE_AGENCY_VERIFICATION_ERROR]", error);
    return { error: error.message || "Failed to update agency verification" };
  }
}

export async function toggleAgencyActive(agencyId: string) {
  try {
    const session = await verifyAdmin();

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return { error: "Agency not found" };
    }

    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: { active: !agency.active },
    });
    await writeAuditLog({ actorId: session.user.id, action: "agency.status_changed", resourceType: "Agency", resourceId: agencyId, before: { active: agency.active }, after: { active: updated.active } });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[TOGGLE_AGENCY_ACTIVE_ERROR]", error);
    return { error: error.message || "Failed to update agency status" };
  }
}

export async function updateUserByAdmin(
  userId: string,
  input: {
    name: string;
    email: string;
    phone?: string | null;
    role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN";
    agencyId?: string | null;
    staffRole?: "MANAGER" | "AGENT" | "SUPPORT" | null;
  }
) {
  try {
    const session = await verifyAdmin();
    const nextRole = roleSchema.parse(input.role);
    const nextStaffRole = input.staffRole ? staffRoleSchema.parse(input.staffRole) : "AGENT";
    if (input.agencyId) agencyIdSchema.parse(input.agencyId);
    if (session.user.id === userId && nextRole !== "ADMIN") return { error: "You cannot remove your own platform-admin access." };

    if (!input.name.trim() || !input.email.trim()) {
      return { error: "Name and email are required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User not found" };
    }
    if (user.role === "AGENCY" && nextRole !== "AGENCY") {
      return { error: "Agency owners cannot be converted because that could destroy operational data. Suspend the agency or transfer ownership through a dedicated workflow." };
    }
    if (nextRole === "STAFF") {
      if (!input.agencyId) return { error: "An agency must be assigned when changing a user to staff." };
      await ensureActiveAgency(input.agencyId);
    }

    // Check if email changed and is taken
    if (input.email.trim().toLowerCase() !== user.email) {
      const taken = await prisma.user.findUnique({
        where: { email: input.email.trim().toLowerCase() },
      });
      if (taken) {
        return { error: "Email is already in use by another user." };
      }
    }

    const sanitizedName = input.name.trim();
    const sanitizedEmail = input.email.trim().toLowerCase();
    await prisma.$transaction(async (tx) => {
      if (user.role === "STAFF" && nextRole !== "STAFF") await tx.agencyStaff.deleteMany({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { name: sanitizedName, email: sanitizedEmail, phone: input.phone || null, role: nextRole } });
      if (nextRole === "AGENCY") {
        const existingAgency = await tx.agency.findUnique({ where: { ownerId: userId } });
        if (!existingAgency) await tx.agency.create({ data: { name: sanitizedName, slug: agencySlug(sanitizedName, userId), ownerId: userId, email: sanitizedEmail } });
      }
      if (nextRole === "STAFF" && input.agencyId) {
        await tx.agencyStaff.upsert({
          where: { userId },
          update: { agencyId: input.agencyId, role: nextStaffRole, active: true },
          create: { userId, agencyId: input.agencyId, role: nextStaffRole, active: true },
        });
      }
    });
    await writeAuditLog({ actorId: session.user.id, action: "user.updated", resourceType: "User", resourceId: userId, before: { name: user.name, email: user.email, role: user.role }, after: { name: sanitizedName, email: sanitizedEmail, role: nextRole, agencyId: input.agencyId ?? null, staffRole: nextRole === "STAFF" ? nextStaffRole : null } });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_USER_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to update user" };
  }
}

export async function createAgencyByAdmin(input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
}) {
  try {
    const session = await verifyAdmin();

    if (!input.name.trim() || !input.ownerName.trim() || !input.ownerEmail.trim()) {
      return { error: "Agency name, owner name, and owner email are required." };
    }

    // Find or create Owner User
    let ownerUser = await prisma.user.findUnique({
      where: { email: input.ownerEmail.trim().toLowerCase() },
    });

    if (ownerUser) {
      const ownsAgency = await prisma.agency.findUnique({
        where: { ownerId: ownerUser.id },
      });
      if (ownsAgency) {
        return { error: `User with email ${input.ownerEmail} already owns agency "${ownsAgency.name}"` };
      }
      if (ownerUser.role !== "TRAVELER") return { error: "Only traveler accounts can be upgraded to agency owners." };
    } else return { error: "The owner must register first so their account has valid authentication credentials." };

    const agency = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: ownerUser.id }, data: { role: "AGENCY" } });
      return tx.agency.create({
        data: {
          name: input.name.trim(),
          slug: agencySlug(input.name.trim(), ownerUser.id),
          ownerId: ownerUser.id,
          description: input.description || null,
          website: input.website || null,
          phone: input.phone || null,
          email: input.ownerEmail.trim().toLowerCase(),
          verified: false,
          active: true,
        },
      });
    });
    await writeAuditLog({ actorId: session.user.id, action: "agency.created", resourceType: "Agency", resourceId: agency.id, after: { name: agency.name, ownerId: agency.ownerId, verified: agency.verified, active: agency.active } });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[CREATE_AGENCY_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to create agency" };
  }
}

export async function updateAgencyByAdmin(
  agencyId: string,
  input: {
    name: string;
    description?: string | null;
    website?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    logo?: string | null;
    verified: boolean;
    active: boolean;
  }
) {
  try {
    const session = await verifyAdmin();

    if (!input.name.trim()) {
      return { error: "Agency name is required." };
    }

    const current = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!current) return { error: "Agency not found" };
    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        name: input.name.trim(),
        description: input.description || null,
        website: input.website || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        logo: input.logo || null,
        verified: input.verified,
        active: input.active,
      },
    });
    await writeAuditLog({ actorId: session.user.id, action: "agency.updated", resourceType: "Agency", resourceId: agencyId, before: { name: current.name, verified: current.verified, active: current.active }, after: { name: updated.name, verified: updated.verified, active: updated.active } });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_AGENCY_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to update agency" };
  }
}

export async function deleteAgencyByAdmin(agencyId: string) {
  try {
    const session = await verifyAdmin();

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return { error: "Agency not found" };
    }

    const dependencies = await prisma.agency.findUnique({ where: { id: agencyId }, select: { _count: { select: { packages: true, bookings: true, staff: true } } } });
    if (!dependencies) return { error: "Agency not found" };
    if (dependencies._count.packages || dependencies._count.bookings || dependencies._count.staff) {
      return { error: "Agencies with operational data cannot be deleted. Suspend the agency instead to preserve records." };
    }
    await prisma.$transaction([
      prisma.agency.delete({ where: { id: agencyId } }),
      prisma.user.update({ where: { id: agency.ownerId }, data: { role: "TRAVELER" } }),
    ]);
    await writeAuditLog({ actorId: session.user.id, action: "agency.deleted", resourceType: "Agency", resourceId: agencyId, before: { name: agency.name, ownerId: agency.ownerId } });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_AGENCY_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to delete agency" };
  }
}
