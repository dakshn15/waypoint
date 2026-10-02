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
    const session = await verifyAdmin();

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email) return { error: "Name and email are required." };

    const nextRole = roleSchema.parse(input.role);
    const nextStaffRole = input.staffRole ? staffRoleSchema.parse(input.staffRole) : "AGENT";
    if (input.agencyId) agencyIdSchema.parse(input.agencyId);

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: `A user with email "${email}" already exists.` };

    if (nextRole === "STAFF" && !input.agencyId) {
      return { error: "An agency must be assigned for staff accounts." };
    }
    if (nextRole === "STAFF" && input.agencyId) {
      await ensureActiveAgency(input.agencyId);
    }

    // Hash a temporary default password — the user should reset it on first login
    const { hashPassword } = await import("better-auth/crypto");
    const TEMP_PASSWORD = "Welcome@123";
    const hashedPw = await hashPassword(TEMP_PASSWORD);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          role: nextRole,
          emailVerified: false,
          phone: input.phone || null,
        },
      });

      // Create the better-auth credential Account so the user can log in
      const accountId = `adm_${newUser.id.substring(0, 20)}`;
      await tx.account.create({
        data: {
          id: accountId,
          accountId: newUser.id,
          providerId: "credential",
          userId: newUser.id,
          password: hashedPw,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // If AGENCY → also create the agency record
      if (nextRole === "AGENCY") {
        await tx.agency.create({
          data: {
            name: `${name}'s Agency`,
            slug: agencySlug(`${name}'s Agency`, newUser.id),
            ownerId: newUser.id,
            email,
          },
        });
      }

      // If STAFF → create staff membership
      if (nextRole === "STAFF" && input.agencyId) {
        await tx.agencyStaff.create({
          data: {
            userId: newUser.id,
            agencyId: input.agencyId,
            role: nextStaffRole,
            active: true,
          },
        });
      }

      return newUser;
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "user.created",
      resourceType: "User",
      resourceId: user.id,
      after: { name, email, role: nextRole },
    });

    revalidatePath("/dashboard/users");
    return { success: true, tempPassword: TEMP_PASSWORD };
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

    // Send notification to agency owner about suspension/reactivation
    try {
      if (updated.active) {
        await prisma.notification.create({
          data: {
            userId: agency.ownerId,
            title: "Agency Reactivated ✅",
            message: `Your agency "${agency.name}" has been reactivated by the platform administrator. All operations have been restored — you can now manage packages, accept bookings, and request payouts.`,
            type: "SYSTEM",
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: agency.ownerId,
            title: "Agency Suspended ⚠️",
            message: `Your agency "${agency.name}" has been suspended by the platform administrator. During suspension, you cannot create or edit packages, accept new bookings, or request payouts. Please contact the admin for more information.`,
            type: "SYSTEM",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Could not create suspension notification:", notifErr);
    }

    revalidatePath("/dashboard/agencies");
    revalidatePath("/dashboard");
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

    const ownerEmail = input.ownerEmail.trim().toLowerCase();
    const ownerName = input.ownerName.trim();

    // Find existing user or prepare to create one
    let ownerUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (ownerUser) {
      const ownsAgency = await prisma.agency.findUnique({
        where: { ownerId: ownerUser.id },
      });
      if (ownsAgency) {
        return { error: `User with email ${ownerEmail} already owns agency "${ownsAgency.name}"` };
      }
      if (ownerUser.role !== "TRAVELER") return { error: "Only traveler accounts can be upgraded to agency owners." };
    }

    const { hashPassword } = await import("better-auth/crypto");
    const TEMP_PASSWORD = "Welcome@123";
    const hashedPw = await hashPassword(TEMP_PASSWORD);

    const result = await prisma.$transaction(async (tx) => {
      let ownerId: string;
      let ownerCreated = false;

      if (ownerUser) {
        // Upgrade existing traveler to AGENCY
        await tx.user.update({ where: { id: ownerUser.id }, data: { role: "AGENCY" } });
        ownerId = ownerUser.id;
      } else {
        // Create the owner user + auth credentials inline
        const newOwner = await tx.user.create({
          data: {
            name: ownerName,
            email: ownerEmail,
            role: "AGENCY",
            emailVerified: false,
          },
        });
        ownerId = newOwner.id;
        ownerCreated = true;

        // Create the better-auth credential Account
        const accountId = `adm_${newOwner.id.substring(0, 20)}`;
        await tx.account.create({
          data: {
            id: accountId,
            accountId: newOwner.id,
            providerId: "credential",
            userId: newOwner.id,
            password: hashedPw,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      const agency = await tx.agency.create({
        data: {
          name: input.name.trim(),
          slug: agencySlug(input.name.trim(), ownerId),
          ownerId,
          description: input.description || null,
          website: input.website || null,
          phone: input.phone || null,
          email: ownerEmail,
          verified: false,
          active: true,
        },
      });

      return { agency, ownerId, ownerCreated };
    });

    await writeAuditLog({ actorId: session.user.id, action: "agency.created", resourceType: "Agency", resourceId: result.agency.id, after: { name: result.agency.name, ownerId: result.ownerId, verified: result.agency.verified, active: result.agency.active, ownerCreated: result.ownerCreated } });

    revalidatePath("/dashboard/agencies");
    revalidatePath("/dashboard/users");
    return {
      success: true,
      ownerCreated: result.ownerCreated,
      tempPassword: result.ownerCreated ? TEMP_PASSWORD : undefined,
    };
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

    // Find all bookings directly attached to the agency or attached to its packages
    const agencyBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { agencyId },
          { package: { agencyId } },
        ],
      },
      select: { id: true },
    });
    const bookingIds = agencyBookings.map((b) => b.id);

    // Find all staff user IDs so their roles can be cleanly reverted
    const staffMembers = await prisma.agencyStaff.findMany({
      where: { agencyId },
      select: { userId: true },
    });
    const staffUserIds = staffMembers.map((s) => s.userId);

    await prisma.$transaction(async (tx) => {
      // 1. Remove payments and documents tied to agency bookings, then the bookings
      if (bookingIds.length > 0) {
        await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.document.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      // 2. Remove payouts for this agency
      await tx.agencyPayout.deleteMany({ where: { agencyId } });

      // 3. Revert staff user accounts to TRAVELER
      if (staffUserIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: staffUserIds } },
          data: { role: "TRAVELER" },
        });
      }

      // 4. Delete the agency record (cascades to packages, itineraries, activities, staff, vendors, tasks)
      await tx.agency.delete({ where: { id: agencyId } });

      // 5. Revert agency owner's user account to TRAVELER
      await tx.user.update({
        where: { id: agency.ownerId },
        data: { role: "TRAVELER" },
      });
    });

    await writeAuditLog({
      actorId: session.user.id,
      action: "agency.deleted",
      resourceType: "Agency",
      resourceId: agencyId,
      before: { name: agency.name, ownerId: agency.ownerId },
    });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_AGENCY_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to delete agency" };
  }
}
