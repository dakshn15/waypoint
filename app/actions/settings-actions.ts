"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { writeAuditLog } from "@/lib/audit";
import { getPlatformSettings } from "@/lib/commission";
import { getUserAgencyAccess } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getPlatformSettingsAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return await getPlatformSettings();
}

export async function updatePlatformSettingsAction(data: {
  commissionRate?: number;
  minPayoutAmount?: number;
  payoutHoldDays?: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  const existing = await getPlatformSettings();

  let updated: any = null;

  try {
    updated = await (prisma as any).platformSettings.upsert({
      where: { id: "global" },
      update: {
        ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate }),
        ...(data.minPayoutAmount !== undefined && { minPayoutAmount: data.minPayoutAmount }),
        ...(data.payoutHoldDays !== undefined && { payoutHoldDays: data.payoutHoldDays }),
        updatedBy: session.user.id,
      },
      create: {
        id: "global",
        commissionRate: data.commissionRate ?? 0.10,
        minPayoutAmount: data.minPayoutAmount ?? 1000,
        payoutHoldDays: data.payoutHoldDays ?? 7,
        updatedBy: session.user.id,
      },
    });
  } catch (err: any) {
    console.warn("Standard upsert failed, using SQL fallback:", err.message);
    const comm = data.commissionRate ?? existing.commissionRate;
    const minAmt = data.minPayoutAmount ?? existing.minPayoutAmount;
    const hold = data.payoutHoldDays ?? existing.payoutHoldDays;

    await prisma.$executeRaw`
      INSERT INTO "PlatformSettings" ("id", "commissionRate", "minPayoutAmount", "payoutHoldDays", "platformName", "supportEmail", "updatedAt", "updatedBy")
      VALUES ('global', ${comm}, ${minAmt}, ${hold}, 'Waypoint', 'support@waypoint.dev', CURRENT_TIMESTAMP, ${session.user.id})
      ON CONFLICT ("id") DO UPDATE SET
        "commissionRate" = ${comm},
        "minPayoutAmount" = ${minAmt},
        "payoutHoldDays" = ${hold},
        "updatedBy" = ${session.user.id},
        "updatedAt" = CURRENT_TIMESTAMP
    `;

    updated = {
      id: "global",
      commissionRate: comm,
      minPayoutAmount: minAmt,
      payoutHoldDays: hold,
    };
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "UPDATE_PLATFORM_SETTINGS",
    resourceType: "PlatformSettings",
    resourceId: "global",
    before: {
      commissionRate: existing.commissionRate,
      minPayoutAmount: existing.minPayoutAmount,
      payoutHoldDays: existing.payoutHoldDays,
    },
    after: {
      commissionRate: updated.commissionRate,
      minPayoutAmount: updated.minPayoutAmount,
      payoutHoldDays: updated.payoutHoldDays,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/payouts");
  revalidatePath("/dashboard/payments");

  return updated;
}

export async function updateAgencyCommissionOverrideAction(agencyId: string, commissionRate: number | null) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  const existingAgency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { name: true, commissionRate: true },
  });

  if (!existingAgency) {
    throw new Error("Agency not found");
  }

  let updatedAgency: any = null;

  try {
    updatedAgency = await prisma.agency.update({
      where: { id: agencyId },
      data: { commissionRate: commissionRate },
    });
  } catch (err: any) {
    console.warn("Prisma update failed, using SQL fallback:", err.message);
    await prisma.$executeRaw`
      UPDATE "Agency"
      SET "commissionRate" = ${commissionRate},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${agencyId}
    `;
    updatedAgency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "UPDATE_AGENCY_COMMISSION",
    resourceType: "Agency",
    resourceId: agencyId,
    before: {
      agencyName: existingAgency.name,
      commissionRate: existingAgency.commissionRate,
    },
    after: {
      agencyName: existingAgency.name,
      commissionRate: commissionRate,
    },
  });

  revalidatePath("/dashboard/agencies");
  revalidatePath("/dashboard/payouts");

  return {
    ...updatedAgency,
    commissionRate: updatedAgency?.commissionRate != null ? Number(updatedAgency.commissionRate) : null,
  };
}

export async function updateAgencyBankDetailsAction(
  agencyId: string,
  bankData: {
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
    bankName?: string | null;
    upiId?: string | null;
  }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Admin or Agency owner/manager can update
  if (session.user.role !== "ADMIN") {
    const userAccess = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!userAccess || userAccess.agencyId !== agencyId || (!userAccess.isOwner && userAccess.staffRole !== "MANAGER")) {
      throw new Error("Unauthorized: You do not have manager access to this agency");
    }
  }

  let updatedAgency: any = null;

  try {
    updatedAgency = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        bankAccountName: bankData.bankAccountName || null,
        bankAccountNumber: bankData.bankAccountNumber || null,
        bankIfscCode: bankData.bankIfscCode || null,
        bankName: bankData.bankName || null,
        upiId: bankData.upiId || null,
      },
    });
  } catch (err: any) {
    console.warn("Standard Prisma update failed, running resilient SQL fallback:", err.message);
    await prisma.$executeRaw`
      UPDATE "Agency"
      SET "bankAccountName" = ${bankData.bankAccountName || null},
          "bankAccountNumber" = ${bankData.bankAccountNumber || null},
          "bankIfscCode" = ${bankData.bankIfscCode || null},
          "bankName" = ${bankData.bankName || null},
          "upiId" = ${bankData.upiId || null},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${agencyId}
    `;

    updatedAgency = await prisma.agency.findUnique({
      where: { id: agencyId },
    });
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "UPDATE_AGENCY_BANK_DETAILS",
    resourceType: "Agency",
    resourceId: agencyId,
    after: {
      agencyId,
      agencyName: updatedAgency?.name || "Agency",
      hasBank: Boolean(bankData.bankAccountNumber),
      hasUpi: Boolean(bankData.upiId),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/agency");
  revalidatePath("/dashboard/payouts");

  return {
    ...updatedAgency,
    commissionRate: updatedAgency?.commissionRate != null ? Number(updatedAgency.commissionRate) : null,
  };
}


