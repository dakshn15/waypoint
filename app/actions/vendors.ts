"use server";

import { prisma } from "@/lib/db";

interface AddVendorInput {
  agencyId: string;
  name: string;
  category: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

export async function addVendor(input: AddVendorInput) {
  try {
    if (!input.name.trim()) {
      return { error: "Vendor name is required" };
    }

    const vendor = await prisma.vendor.create({
      data: {
        agencyId: input.agencyId,
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
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return { error: "Vendor not found" };

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
    await prisma.vendor.delete({ where: { id: vendorId } });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete vendor" };
  }
}
