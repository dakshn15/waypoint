"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";

export async function addAgencyStaff(data: {
  name: string;
  email: string;
  password?: string;
  role: "MANAGER" | "AGENT" | "SUPPORT";
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "AGENCY") {
    throw new Error("Unauthorized. Only agencies can manage staff.");
  }

  // Find the agency owned by the user
  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency) {
    throw new Error("Agency profile not found.");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("A user with this email address already exists.");
  }

  const defaultPassword = data.password || "password123";
  const passwordHash = await hashPassword(defaultPassword);

  const staffUser = await prisma.$transaction(async (tx) => {
    // 1. Create standard User record
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: "STAFF",
        accounts: {
          create: {
            id: `staff-${Date.now()}-acc`,
            accountId: `staff-${Date.now()}-acc-id`,
            providerId: "credential",
            password: passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    });

    // 2. Link User to the Agency as staff
    await tx.agencyStaff.create({
      data: {
        userId: user.id,
        agencyId: agency.id,
        role: data.role,
        active: true,
      },
    });

    return user;
  });

  revalidatePath("/dashboard/staff");
  return {
    success: true,
    user: {
      id: staffUser.id,
      name: staffUser.name,
      email: staffUser.email,
    },
  };
}

export async function deleteAgencyStaff(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "AGENCY") {
    throw new Error("Unauthorized. Only agencies can delete staff.");
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency) {
    throw new Error("Agency profile not found.");
  }

  // Verify that the target staff user actually belongs to this agency
  const staff = await prisma.agencyStaff.findUnique({
    where: { userId },
  });

  if (!staff || staff.agencyId !== agency.id) {
    throw new Error("Unauthorized or staff member not found.");
  }

  // Delete the staff user (cascade will delete AgencyStaff and Account records)
  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function toggleStaffStatus(userId: string) {
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

  const staff = await prisma.agencyStaff.findUnique({
    where: { userId },
  });

  if (!staff || staff.agencyId !== agency.id) {
    throw new Error("Unauthorized or staff member not found.");
  }

  const updated = await prisma.agencyStaff.update({
    where: { userId },
    data: { active: !staff.active },
  });

  revalidatePath("/dashboard/staff");
  return updated;
}

export async function updateAgencyStaff(data: {
  userId: string;
  name: string;
  role: "MANAGER" | "AGENT" | "SUPPORT";
  password?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "AGENCY") {
    throw new Error("Unauthorized. Only agencies can update staff.");
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  if (!agency) {
    throw new Error("Agency profile not found.");
  }

  // Verify staff user belongs to this agency
  const staff = await prisma.agencyStaff.findUnique({
    where: { userId: data.userId },
  });

  if (!staff || staff.agencyId !== agency.id) {
    throw new Error("Unauthorized or staff member not found.");
  }

  // Update in a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update User name
    await tx.user.update({
      where: { id: data.userId },
      data: { name: data.name },
    });

    // 2. Update AgencyStaff role
    await tx.agencyStaff.update({
      where: { userId: data.userId },
      data: { role: data.role },
    });

    // 3. Update password if provided
    if (data.password && data.password.trim() !== "") {
      const passwordHash = await hashPassword(data.password);
      
      const account = await tx.account.findFirst({
        where: { userId: data.userId, providerId: "credential" },
      });

      if (account) {
        await tx.account.update({
          where: { id: account.id },
          data: { password: passwordHash },
        });
      } else {
        await tx.account.create({
          data: {
            id: `staff-${Date.now()}-acc`,
            accountId: `staff-${Date.now()}-acc-id`,
            providerId: "credential",
            password: passwordHash,
            userId: data.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  });

  revalidatePath("/dashboard/staff");
  return { success: true };
}
