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

export async function changeUserRole(userId: string, role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN") {
  try {
    await verifyAdmin();

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

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    console.error("[CHANGE_USER_ROLE_ERROR]", error);
    return { error: error.message || "Failed to change user role" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await verifyAdmin();

    // Prevent deleting self
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
