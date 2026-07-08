"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { getUserAgencyAccess } from "@/lib/permissions";

interface AddVendorInput {
  agencyId?: string;
  name: string;
  category: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

export async function addVendor(input: AddVendorInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
      return { error: "Unauthorized. Only agencies or managers can add vendors." };
    }

    if (!input.name.trim()) {
      return { error: "Vendor name is required" };
    }

    const vendor = await prisma.vendor.create({
      data: {
        agencyId: access.agencyId,
        name: input.name.trim(),
        category: input.category as any,
        location: input.location || null,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        description: input.description || null,
        active: true,
      },
    });

    return { success: true, vendorId: vendor.id };
  } catch (error: any) {
    console.error("[ADD_VENDOR_ERROR]", error);
    return { error: error.message || "Failed to add vendor" };
  }
}

export async function toggleVendorStatus(vendorId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER" && access.staffRole !== "AGENT")) {
      return { error: "Unauthorized. Only managers, agents, or owners can update vendor status." };
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.agencyId !== access.agencyId) {
      return { error: "Vendor not found." };
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { active: !vendor.active },
    });

    return { success: true, active: updated.active };
  } catch (error: any) {
    return { error: error.message || "Failed to update vendor" };
  }
}

export async function deleteVendor(vendorId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
      return { error: "Unauthorized. Only managers or owners can delete vendors." };
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.agencyId !== access.agencyId) {
      return { error: "Vendor not found." };
    }

    await prisma.vendor.delete({ where: { id: vendorId } });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete vendor" };
  }
}
