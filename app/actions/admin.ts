"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return session;
}

export async function changeUserRole(
  userId: string,
  role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN",
  agencyId?: string | null,
  staffRole?: "MANAGER" | "AGENT" | "SUPPORT" | null
) {
  try {
    const session = await verifyAdmin();

    // Check current user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Clean up previous roles
    if (user.role === "STAFF" && role !== "STAFF") {
      await prisma.agencyStaff.deleteMany({
        where: { userId },
      });
    }

    if (user.role === "AGENCY" && role !== "AGENCY") {
      await prisma.agency.deleteMany({
        where: { ownerId: userId },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // If role changed to AGENCY and agency does not exist, create it
    if (role === "AGENCY") {
      const existingAgency = await prisma.agency.findUnique({
        where: { ownerId: userId },
      });

      if (!existingAgency) {
        const baseSlug = updatedUser.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await prisma.agency.create({
          data: {
            name: updatedUser.name,
            slug: `${baseSlug}-${updatedUser.id.substring(0, 5)}`,
            ownerId: updatedUser.id,
            email: updatedUser.email,
          },
        });
      }
    }

    // If role changed to STAFF, link to agency
    if (role === "STAFF") {
      if (!agencyId) {
        return { error: "An agency must be assigned when changing user to staff." };
      }

      const existingStaff = await prisma.agencyStaff.findUnique({
        where: { userId },
      });

      if (existingStaff) {
        await prisma.agencyStaff.update({
          where: { userId },
          data: {
            agencyId,
            role: staffRole || "AGENT",
          },
        });
      } else {
        await prisma.agencyStaff.create({
          data: {
            userId,
            agencyId,
            role: staffRole || "AGENT",
            active: true,
          },
        });
      }
    }

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

    if (!input.name.trim() || !input.email.trim()) {
      return { error: "Name and email are required." };
    }

    const existing = await prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });

    if (existing) {
      return { error: "A user with this email already exists." };
    }

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
        phone: input.phone || null,
      },
    });

    if (input.role === "AGENCY") {
      const baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await prisma.agency.create({
        data: {
          name: user.name,
          slug: `${baseSlug}-${user.id.substring(0, 5)}`,
          ownerId: user.id,
          email: user.email,
        },
      });
    }

    if (input.role === "STAFF") {
      if (!input.agencyId) {
        return { error: "An agency must be assigned for staff members." };
      }

      await prisma.agencyStaff.create({
        data: {
          userId: user.id,
          agencyId: input.agencyId,
          role: input.staffRole || "AGENT",
          active: true,
        },
      });
    }

    revalidatePath("/dashboard/users");
    return { success: true, userId: user.id };
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

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_USER_ERROR]", error);
    return { error: error.message || "Failed to delete user" };
  }
}

export async function toggleAgencyVerification(agencyId: string) {
  try {
    await verifyAdmin();

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return { error: "Agency not found" };
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: { verified: !agency.verified },
    });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[TOGGLE_AGENCY_VERIFICATION_ERROR]", error);
    return { error: error.message || "Failed to update agency verification" };
  }
}

export async function toggleAgencyActive(agencyId: string) {
  try {
    await verifyAdmin();

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return { error: "Agency not found" };
    }

    await prisma.agency.update({
      where: { id: agencyId },
      data: { active: !agency.active },
    });

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
    await verifyAdmin();

    if (!input.name.trim() || !input.email.trim()) {
      return { error: "Name and email are required." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User not found" };
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

    // Clean up previous role relations if role changed
    if (user.role === "STAFF" && input.role !== "STAFF") {
      await prisma.agencyStaff.deleteMany({ where: { userId } });
    }
    if (user.role === "AGENCY" && input.role !== "AGENCY") {
      await prisma.agency.deleteMany({ where: { ownerId: userId } });
    }

    // Update user details
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone || null,
        role: input.role,
      },
    });

    // Handle transition to agency owner
    if (input.role === "AGENCY") {
      const existingAgency = await prisma.agency.findUnique({
        where: { ownerId: userId },
      });

      if (!existingAgency) {
        const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await prisma.agency.create({
          data: {
            name: input.name,
            slug: `${baseSlug}-${userId.substring(0, 5)}`,
            ownerId: userId,
            email: input.email.trim().toLowerCase(),
          },
        });
      }
    }

    // Handle transition to staff member
    if (input.role === "STAFF") {
      if (!input.agencyId) {
        return { error: "An agency must be assigned when changing user to staff." };
      }

      const existingStaff = await prisma.agencyStaff.findUnique({
        where: { userId },
      });

      if (existingStaff) {
        await prisma.agencyStaff.update({
          where: { userId },
          data: {
            agencyId: input.agencyId,
            role: input.staffRole || "AGENT",
          },
        });
      } else {
        await prisma.agencyStaff.create({
          data: {
            userId,
            agencyId: input.agencyId,
            role: input.staffRole || "AGENT",
            active: true,
          },
        });
      }
    }

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
    await verifyAdmin();

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
      await prisma.user.update({
        where: { id: ownerUser.id },
        data: { role: "AGENCY" },
      });
    } else {
      ownerUser = await prisma.user.create({
        data: {
          name: input.ownerName.trim(),
          email: input.ownerEmail.trim().toLowerCase(),
          role: "AGENCY",
        },
      });
    }

    const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.agency.create({
      data: {
        name: input.name.trim(),
        slug: `${baseSlug}-${ownerUser.id.substring(0, 5)}`,
        ownerId: ownerUser.id,
        description: input.description || null,
        website: input.website || null,
        phone: input.phone || null,
        email: input.ownerEmail.trim().toLowerCase(),
        verified: true,
        active: true,
      },
    });

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
    await verifyAdmin();

    if (!input.name.trim()) {
      return { error: "Agency name is required." };
    }

    await prisma.agency.update({
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

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_AGENCY_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to update agency" };
  }
}

export async function deleteAgencyByAdmin(agencyId: string) {
  try {
    await verifyAdmin();

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!agency) {
      return { error: "Agency not found" };
    }

    // Delete agency record (cascade handles related objects)
    await prisma.agency.delete({
      where: { id: agencyId },
    });

    // Revert owner's role to TRAVELER
    await prisma.user.update({
      where: { id: agency.ownerId },
      data: { role: "TRAVELER" },
    });

    revalidatePath("/dashboard/agencies");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_AGENCY_BY_ADMIN_ERROR]", error);
    return { error: error.message || "Failed to delete agency" };
  }
}
