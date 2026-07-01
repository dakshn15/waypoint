"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

  if (!session || session.user.role !== "AGENCY") {
    throw new Error("Unauthorized. Only agencies can create packages.");
  }

  // Find the agency owned by the user
  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency) {
    throw new Error("Agency profile not found. Please register as an agency.");
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
      agencyId: agency.id,
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

  if (!session || session.user.role !== "AGENCY") {
    throw new Error("Unauthorized. Only agencies can delete packages.");
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency) {
    throw new Error("Agency profile not found.");
  }

  // Ensure the package belongs to this agency
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg || pkg.agencyId !== agency.id) {
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

  if (!session || session.user.role !== "AGENCY") {
    throw new Error("Unauthorized.");
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency) {
    throw new Error("Agency profile not found.");
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg || pkg.agencyId !== agency.id) {
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
