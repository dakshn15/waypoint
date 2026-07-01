"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateTravelerProfile(data: {
  dateOfBirth?: string | Date | null;
  nationality?: string | null;
  passportNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  travelPreferences?: any;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to perform this action.");
  }

  const userId = session.user.id;

  const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

  const profile = await prisma.travelerProfile.upsert({
    where: { userId },
    update: {
      dateOfBirth: dob,
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      travelPreferences: data.travelPreferences || undefined,
    },
    create: {
      userId,
      dateOfBirth: dob,
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      travelPreferences: data.travelPreferences || {},
    },
  });

  revalidatePath("/dashboard/profile");
  return profile;
}
