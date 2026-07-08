"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getUserAgencyAccess } from "@/lib/permissions";

export async function createPackage(data: {
  title: string;
  description: string;
  duration: string | number;
  maxGroupSize?: string | number;
  difficulty: "EASY" | "MODERATE" | "CHALLENGING" | "EXTREME";
  destinations: string[];
  inclusions: string[];
  exclusions: string[];
  basePrice: string | number;
  currency: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const access = await getUserAgencyAccess(session.user.id, session.user.role);
  if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
    throw new Error("Unauthorized. Only agencies or managers can create packages.");
  }

  const duration = typeof data.duration === "string" ? parseInt(data.duration) : data.duration;
  const maxGroupSize = data.maxGroupSize ? (typeof data.maxGroupSize === "string" ? parseInt(data.maxGroupSize) : data.maxGroupSize) : null;
  const basePrice = typeof data.basePrice === "string" ? parseFloat(data.basePrice) : data.basePrice;

  // Format destinations array of strings as array of JSON objects [{name, country, lat, lng}]
  const formattedDestinations = data.destinations.map((dest) => {
    const parts = dest.split(",");
    const name = parts[0]?.trim() || dest;
    const country = parts[1]?.trim() || "";
    return { name, country, lat: null, lng: null };
  });

  const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

  const createdPackage = await prisma.package.create({
    data: {
      agencyId: access.agencyId,
      title: data.title,
      slug,
      description: data.description,
      duration: duration || 1,
      maxGroupSize: maxGroupSize,
      difficulty: data.difficulty,
      destinations: formattedDestinations,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      basePrice: basePrice || 0,
      currency: data.currency || "INR",
      status: "PUBLISHED", // Auto-publish for usability
    },
  });

  revalidatePath("/dashboard/packages");
  revalidatePath("/packages");

  return {
    ...createdPackage,
    basePrice: Number(createdPackage.basePrice),
  };
}

export async function deletePackage(packageId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const access = await getUserAgencyAccess(session.user.id, session.user.role);
  if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
    throw new Error("Unauthorized. Only agencies or managers can delete packages.");
  }

  // Ensure the package belongs to this agency
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg || pkg.agencyId !== access.agencyId) {
    throw new Error("Unauthorized or package not found.");
  }

  await prisma.package.delete({
    where: { id: packageId },
  });

  revalidatePath("/dashboard/packages");
  revalidatePath("/packages");
  return { success: true };
}

export async function togglePackageStatus(packageId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const access = await getUserAgencyAccess(session.user.id, session.user.role);
  // Owner, MANAGER, and AGENT roles can publish/draft packages
  if (!access || (!access.isOwner && access.staffRole !== "MANAGER" && access.staffRole !== "AGENT")) {
    throw new Error("Unauthorized. Only managers, agents, or owners can change status.");
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg || pkg.agencyId !== access.agencyId) {
    throw new Error("Unauthorized or package not found.");
  }

  const newStatus = pkg.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  const updatedPackage = await prisma.package.update({
    where: { id: packageId },
    data: { status: newStatus },
  });

  revalidatePath("/dashboard/packages");
  revalidatePath("/packages");
  
  return {
    ...updatedPackage,
    basePrice: Number(updatedPackage.basePrice),
  };
}
