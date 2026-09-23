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
  imageUrl?: string;
  departureDates?: (string | Date)[];
  itineraries?: Array<{
    dayNumber: number;
    title: string;
    description?: string;
    hotelName?: string;
    activities?: Array<{
      time?: string;
      duration?: string;
      type?: string;
      title: string;
      description?: string;
      location?: string;
    }>;
  }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized. Please log in.");
  }

  let agencyId: string;
  if (session.user.role === "ADMIN") {
    const firstAgency = await prisma.agency.findFirst({ select: { id: true } });
    if (!firstAgency) throw new Error("No agency found to attach this package to.");
    agencyId = firstAgency.id;
  } else {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
      throw new Error("Unauthorized. Only agencies or managers can create packages.");
    }
    agencyId = access.agencyId;
  }

  const duration = typeof data.duration === "string" ? parseInt(data.duration) : data.duration;
  const maxGroupSize = data.maxGroupSize ? (typeof data.maxGroupSize === "string" ? parseInt(data.maxGroupSize) : data.maxGroupSize) : null;
  const basePrice = typeof data.basePrice === "string" ? parseFloat(data.basePrice) : data.basePrice;

  if (!data.destinations || data.destinations.length === 0) {
    throw new Error("At least one destination is required.");
  }

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
      agencyId,
      title: data.title,
      slug,
      description: data.description,
      duration: duration || 1,
      maxGroupSize: maxGroupSize,
      difficulty: data.difficulty,
      destinations: formattedDestinations,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      images: data.imageUrl ? [data.imageUrl] : [],
      basePrice: basePrice || 0,
      currency: data.currency || "INR",
      departureDates: (data.departureDates || [])
        .map((d) => new Date(d))
        .filter((d) => !isNaN(d.getTime())),
      status: "PUBLISHED", // Auto-publish for usability
    },
  });

  if (data.itineraries && data.itineraries.length > 0) {
    for (const it of data.itineraries) {
      await prisma.itinerary.create({
        data: {
          packageId: createdPackage.id,
          dayNumber: it.dayNumber,
          title: it.title,
          description: it.description || "",
          hotel: it.hotelName && it.hotelName.trim() ? {
            create: {
              name: it.hotelName.trim(),
              address: `${it.title} Region`,
              rating: 4.8,
            }
          } : undefined,
          activities: it.activities && it.activities.length > 0 ? {
            create: it.activities.map((act) => ({
              time: act.time || "10:00 AM",
              duration: act.duration || "1.5 hrs",
              type: (act.type as any) || "SIGHTSEEING",
              title: act.title,
              description: act.description || "",
              location: act.location || "",
            })),
          } : undefined,
        },
      });
    }
  }

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

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new Error("Package not found.");
  }

  if (session.user.role !== "ADMIN") {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
      throw new Error("Unauthorized. Only agencies or managers can delete packages.");
    }
    if (pkg.agencyId !== access.agencyId) {
      throw new Error("Unauthorized or package belongs to another agency.");
    }
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

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new Error("Package not found.");
  }

  if (session.user.role !== "ADMIN") {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    // Owner, MANAGER, and AGENT roles can publish/draft packages
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER" && access.staffRole !== "AGENT")) {
      throw new Error("Unauthorized. Only managers, agents, or owners can change status.");
    }
    if (pkg.agencyId !== access.agencyId) {
      throw new Error("Unauthorized or package belongs to another agency.");
    }
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

export async function updatePackage(
  packageId: string,
  data: {
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
    imageUrl?: string;
    itineraries?: Array<{
      dayNumber: number;
      title: string;
      description?: string;
      hotelName?: string;
      activities?: Array<{
        time?: string;
        duration?: string;
        type?: string;
        title: string;
        description?: string;
        location?: string;
      }>;
    }>;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    throw new Error("Package not found.");
  }

  if (session.user.role !== "ADMIN") {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || (!access.isOwner && access.staffRole !== "MANAGER")) {
      throw new Error("Unauthorized. Only agencies or managers can update packages.");
    }
    if (pkg.agencyId !== access.agencyId) {
      throw new Error("Package not found or unauthorized.");
    }
  }

  const duration = typeof data.duration === "string" ? parseInt(data.duration) : data.duration;
  const maxGroupSize = data.maxGroupSize
    ? typeof data.maxGroupSize === "string"
      ? parseInt(data.maxGroupSize)
      : data.maxGroupSize
    : null;
  const basePrice = typeof data.basePrice === "string" ? parseFloat(data.basePrice) : data.basePrice;

  const formattedDestinations = data.destinations.map((dest) => {
    const parts = dest.split(",");
    const name = parts[0]?.trim() || dest;
    const country = parts[1]?.trim() || "";
    return { name, country, lat: null, lng: null };
  });

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      title: data.title,
      description: data.description,
      duration: duration || 1,
      maxGroupSize,
      difficulty: data.difficulty,
      destinations: formattedDestinations,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      images: data.imageUrl !== undefined ? (data.imageUrl ? [data.imageUrl] : []) : undefined,
      basePrice: basePrice || 0,
      currency: data.currency,
    },
  });

  if (data.itineraries !== undefined) {
    await prisma.itinerary.deleteMany({ where: { packageId } });
    if (data.itineraries.length > 0) {
      for (const it of data.itineraries) {
        await prisma.itinerary.create({
          data: {
            packageId,
            dayNumber: it.dayNumber,
            title: it.title,
            description: it.description || "",
            hotel: it.hotelName && it.hotelName.trim() ? {
              create: {
                name: it.hotelName.trim(),
                address: `${it.title} Region`,
                rating: 4.8,
              }
            } : undefined,
            activities: it.activities && it.activities.length > 0 ? {
              create: it.activities.map((act) => ({
                time: act.time || "10:00 AM",
                duration: act.duration || "1.5 hrs",
                type: (act.type as any) || "SIGHTSEEING",
                title: act.title,
                description: act.description || "",
                location: act.location || "",
              })),
            } : undefined,
          },
        });
      }
    }
  }

  revalidatePath("/dashboard/packages");
  revalidatePath("/packages");

  return {
    ...updated,
    basePrice: Number(updated.basePrice),
  };
}
