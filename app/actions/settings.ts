"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUserAgencyAccess } from "@/lib/permissions";

export async function updateUserSettings(input: {
  name: string;
  phone?: string | null;
  image?: string | null;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    if (!input.name.trim()) {
      return { error: "Name is required." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: input.name.trim(),
        phone: input.phone || null,
        image: input.image || null,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_USER_SETTINGS_ERROR]", error);
    return { error: error.message || "Failed to update profile settings." };
  }
}

export async function updateAgencySettings(input: {
  name: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access) {
      return { error: "No associated travel agency found." };
    }

    // Only Owner or MANAGER can update agency settings
    if (!access.isOwner && access.staffRole !== "MANAGER") {
      return { error: "Permission denied. Only managers or owners can update agency settings." };
    }

    if (!input.name.trim()) {
      return { error: "Agency name is required." };
    }

    await prisma.agency.update({
      where: { id: access.agencyId },
      data: {
        name: input.name.trim(),
        description: input.description || null,
        website: input.website || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        logo: input.logo || null,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_AGENCY_SETTINGS_ERROR]", error);
    return { error: error.message || "Failed to update agency settings." };
  }
}
