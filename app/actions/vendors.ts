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

    let agencyId: string;
    if (session.user.role === "ADMIN") {
      if (input.agencyId) {
        agencyId = input.agencyId;
      } else {
        const firstAgency = await prisma.agency.findFirst({ select: { id: true } });
        if (!firstAgency) return { error: "No agency found to attach this vendor to." };
        agencyId = firstAgency.id;
      }
    } else {
      const access = await getUserAgencyAccess(session.user.id, session.user.role);
      if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
        return { error: "Unauthorized. Only agencies or managers can add vendors." };
      }
      agencyId = access.agencyId;
    }

    if (!input.name.trim()) {
      return { error: "Vendor name is required" };
    }

    const vendor = await prisma.vendor.create({
      data: {
        agencyId,
        name: input.name.trim(),
        category: (input.category || "OTHER").toUpperCase() as any,
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

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return { error: "Vendor not found." };
    }

    if (session.user.role !== "ADMIN") {
      const access = await getUserAgencyAccess(session.user.id, session.user.role);
      if (!access || (!access.isOwner && access.staffRole !== "MANAGER" && access.staffRole !== "AGENT")) {
        return { error: "Unauthorized. Only managers, agents, or owners can update vendor status." };
      }
      if (vendor.agencyId !== access.agencyId) {
        return { error: "Vendor belongs to another agency." };
      }
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

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return { error: "Vendor not found." };
    }

    if (session.user.role !== "ADMIN") {
      const access = await getUserAgencyAccess(session.user.id, session.user.role);
      if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
        return { error: "Unauthorized. Only managers or owners can delete vendors." };
      }
      if (vendor.agencyId !== access.agencyId) {
        return { error: "Vendor belongs to another agency." };
      }
    }

    await prisma.vendor.delete({ where: { id: vendorId } });
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete vendor" };
  }
}

export async function updateVendor(
  vendorId: string,
  data: {
    name: string;
    category: string;
    location?: string;
    contactEmail?: string;
    contactPhone?: string;
    description?: string;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return { error: "Vendor not found." };
    }

    if (session.user.role !== "ADMIN") {
      const access = await getUserAgencyAccess(session.user.id, session.user.role);
      if (!access || (!access.isOwner && access.staffRole !== "MANAGER" && access.staffRole !== "AGENT")) {
        return { error: "Unauthorized. Only managers, agents, or owners can update vendors." };
      }
      if (vendor.agencyId !== access.agencyId) {
        return { error: "Vendor belongs to another agency." };
      }
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name: data.name.trim(),
        category: (data.category || "OTHER").toUpperCase() as any,
        location: data.location || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        description: data.description || null,
      },
    });

    return { success: true, vendor: updated };
  } catch (error: any) {
    return { error: error.message || "Failed to update vendor" };
  }
}
