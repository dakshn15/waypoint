"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { writeAuditLog } from "@/lib/audit";
import { getCommissionRate, getPlatformSettings } from "@/lib/commission";
import { getUserAgencyAccess } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Agency user creates a payout request for their available earnings.
 */
export async function createPayoutRequestAction(input: { grossAmount: number }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Find user's agency access
  const access = await getUserAgencyAccess(session.user.id, session.user.role);
  if (!access) {
    throw new Error("Unauthorized: Agency membership required");
  }

  let agency: any = null;
  try {
    agency = await (prisma as any).agency.findUnique({
      where: { id: access.agencyId },
    });
  } catch (e) {
    // Ignore validator error
  }

  // Fetch agency bank details directly via raw query to bypass stale dev-server validator
  const rawAgencyRows: any[] = await prisma.$queryRaw`
    SELECT "id", "name", "bankAccountNumber", "upiId" FROM "Agency" WHERE "id" = ${access.agencyId}
  `;

  if (!rawAgencyRows || rawAgencyRows.length === 0) {
    throw new Error("Agency not found");
  }

  const agencyId = access.agencyId;
  const agencyName = agency?.name || rawAgencyRows[0].name || "Agency";
  const bankAccount = rawAgencyRows[0].bankAccountNumber || agency?.bankAccountNumber || null;
  const upiId = rawAgencyRows[0].upiId || agency?.upiId || null;

  if (!bankAccount && !upiId) {
    throw new Error("Please configure your agency bank account or UPI ID in settings before requesting a payout.");
  }

  if (!input.grossAmount || input.grossAmount <= 0) {
    throw new Error("Payout amount must be greater than zero.");
  }

  const platformSettings = await getPlatformSettings();
  if (input.grossAmount < platformSettings.minPayoutAmount) {
    throw new Error(`Minimum payout request amount is ₹${platformSettings.minPayoutAmount}`);
  }

  // 1. Check if there is already an active PENDING payout request for this agency
  const pendingRows: any[] = await prisma.$queryRaw`
    SELECT "id", "grossAmount", "netAmount", "createdAt"
    FROM "AgencyPayout"
    WHERE "agencyId" = ${agencyId} AND "status" = 'PENDING'
  `;

  if (pendingRows && pendingRows.length > 0) {
    const existingId = pendingRows[0].id.slice(-8).toUpperCase();
    throw new Error(
      `You already have an active pending payout request (#${existingId}). Please wait for Admin approval or settlement before submitting a new request.`
    );
  }

  const commissionRate = await getCommissionRate(agencyId);

  // 2. Validate requested amount against server-calculated available balance
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: {
      agencyId: agencyId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    select: { totalAmount: true, createdAt: true },
  });

  const holdPeriodMs = platformSettings.payoutHoldDays * 24 * 60 * 60 * 1000;
  let grossAvailableVolume = 0;
  bookings.forEach((b: any) => {
    const age = now.getTime() - new Date(b.createdAt).getTime();
    if (age >= holdPeriodMs) {
      grossAvailableVolume += Number(b.totalAmount);
    }
  });

  const existingPayoutsRows: any[] = await prisma.$queryRaw`
    SELECT "netAmount" FROM "AgencyPayout" WHERE "agencyId" = ${agencyId} AND "status" != 'CANCELLED'
  `;

  const alreadyRequestedOrPaidNet = existingPayoutsRows.reduce(
    (sum: number, p: any) => sum + Number(p.netAmount),
    0
  );

  const netAvailableTotal = grossAvailableVolume * (1 - commissionRate);
  const netAvailableForPayout = Math.max(0, netAvailableTotal - alreadyRequestedOrPaidNet);
  const grossAvailableForPayout = netAvailableForPayout / (1 - commissionRate);

  if (input.grossAmount > grossAvailableForPayout + 1) {
    throw new Error(
      `Requested payout amount (₹${Math.round(input.grossAmount).toLocaleString()}) exceeds your available payout balance (₹${Math.round(grossAvailableForPayout).toLocaleString()}).`
    );
  }

  const commissionAmount = input.grossAmount * commissionRate;
  const netAmount = input.grossAmount - commissionAmount;

  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let payout: any = null;

  try {
    payout = await (prisma as any).agencyPayout.create({
      data: {
        agencyId,
        periodStart,
        periodEnd: now,
        grossAmount: input.grossAmount,
        commissionAmount,
        netAmount,
        commissionRate,
        bookingCount: 0,
        bookingIds: [],
        status: "PENDING",
      },
    });
  } catch (err: any) {
    console.warn("Prisma create failed for AgencyPayout, using SQL fallback:", err.message);
    const newId = `cmq${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
    await prisma.$executeRaw`
      INSERT INTO "AgencyPayout" (
        "id", "agencyId", "periodStart", "periodEnd", "grossAmount",
        "commissionAmount", "netAmount", "commissionRate", "bookingCount",
        "status", "createdAt", "updatedAt"
      )
      VALUES (
        ${newId}, ${agencyId}, ${periodStart}, ${now}, ${input.grossAmount},
        ${commissionAmount}, ${netAmount}, ${commissionRate}, 0,
        'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;
    payout = { id: newId, grossAmount: input.grossAmount, netAmount, commissionAmount };
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "payout.created",
    resourceType: "AgencyPayout",
    resourceId: payout.id,
    after: {
      agencyName,
      agencyId,
      grossAmount: input.grossAmount,
      commissionAmount,
      netAmount,
      commissionRate,
    },
  });

  revalidatePath("/dashboard/payouts");
  return payout;
}

/**
 * Admin approves a pending payout request.
 */
export async function approvePayoutAction(payoutId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin role required");
  }

  let payout: any = null;
  try {
    payout = await (prisma as any).agencyPayout.findUnique({
      where: { id: payoutId },
      include: { agency: { select: { name: true } } },
    });
  } catch (e) {
    // Ignore validator error
  }

  if (!payout) {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT "id", "status" FROM "AgencyPayout" WHERE "id" = ${payoutId}
    `;
    if (!rawRows || rawRows.length === 0) throw new Error("Payout not found");
    payout = rawRows[0];
  }

  if (payout.status !== "PENDING") throw new Error("Only PENDING payouts can be approved.");

  let updated: any = null;
  try {
    updated = await (prisma as any).agencyPayout.update({
      where: { id: payoutId },
      data: { status: "APPROVED" },
    });
  } catch (err: any) {
    await prisma.$executeRaw`
      UPDATE "AgencyPayout" SET "status" = 'APPROVED', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${payoutId}
    `;
    updated = { id: payoutId, status: "APPROVED" };
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "payout.approved",
    resourceType: "AgencyPayout",
    resourceId: payoutId,
    before: { status: "PENDING" },
    after: { status: "APPROVED", agencyName: payout.agency?.name || "Agency" },
  });

  revalidatePath("/dashboard/payouts");
  return updated;
}

/**
 * Admin marks an approved payout as SETTLED by providing bank UTR number.
 */
export async function settlePayoutAction(payoutId: string, utrNumber: string, notes?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin role required");
  }

  if (!utrNumber || !utrNumber.trim()) {
    throw new Error("Bank UTR / Transaction Reference number is required.");
  }

  let payout: any = null;
  try {
    payout = await (prisma as any).agencyPayout.findUnique({
      where: { id: payoutId },
      include: { agency: { select: { name: true } } },
    });
  } catch (e) {
    // Ignore
  }

  if (!payout) {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT "id", "status", "netAmount" FROM "AgencyPayout" WHERE "id" = ${payoutId}
    `;
    if (!rawRows || rawRows.length === 0) throw new Error("Payout not found");
    payout = rawRows[0];
  }

  if (payout.status !== "APPROVED" && payout.status !== "PENDING") {
    throw new Error("Only PENDING or APPROVED payouts can be settled.");
  }

  const cleanUtr = utrNumber.trim().toUpperCase();
  const cleanNotes = notes?.trim() || null;

  let updated: any = null;

  try {
    updated = await (prisma as any).agencyPayout.update({
      where: { id: payoutId },
      data: {
        status: "SETTLED",
        settledAt: new Date(),
        settledBy: session.user.id,
        transactionRef: cleanUtr,
        notes: cleanNotes,
      },
    });
  } catch (err: any) {
    await prisma.$executeRaw`
      UPDATE "AgencyPayout"
      SET "status" = 'SETTLED',
          "settledAt" = CURRENT_TIMESTAMP,
          "settledBy" = ${session.user.id},
          "transactionRef" = ${cleanUtr},
          "notes" = ${cleanNotes},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${payoutId}
    `;
    updated = { id: payoutId, status: "SETTLED" };
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "payout.settled",
    resourceType: "AgencyPayout",
    resourceId: payoutId,
    after: {
      status: "SETTLED",
      agencyName: payout.agency?.name || "Agency",
      netAmount: Number(payout.netAmount || 0),
      utrNumber: cleanUtr,
    },
  });

  revalidatePath("/dashboard/payouts");
  return updated;
}

/**
 * Admin or Agency cancels a payout request.
 */
export async function cancelPayoutAction(payoutId: string, reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  let payout: any = null;

  try {
    payout = await (prisma as any).agencyPayout.findUnique({
      where: { id: payoutId },
      include: { agency: { select: { name: true } } },
    });
  } catch (e) {
    // Ignore
  }

  if (!payout) {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT "id", "status", "agencyId" FROM "AgencyPayout" WHERE "id" = ${payoutId}
    `;
    if (!rawRows || rawRows.length === 0) throw new Error("Payout not found");
    payout = rawRows[0];
  }

  if (session.user.role !== "ADMIN") {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || access.agencyId !== payout.agencyId) {
      throw new Error("Unauthorized to cancel this payout request");
    }
  }

  if (!["PENDING", "APPROVED"].includes(payout.status)) {
    throw new Error("Only PENDING or APPROVED payouts can be cancelled.");
  }

  let updated: any = null;

  try {
    updated = await (prisma as any).agencyPayout.update({
      where: { id: payoutId },
      data: {
        status: "CANCELLED",
        notes: reason?.trim() || payout.notes,
      },
    });
  } catch (err: any) {
    await prisma.$executeRaw`
      UPDATE "AgencyPayout"
      SET "status" = 'CANCELLED',
          "notes" = ${reason?.trim() || null},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${payoutId}
    `;
    updated = { id: payoutId, status: "CANCELLED" };
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "payout.cancelled",
    resourceType: "AgencyPayout",
    resourceId: payoutId,
    before: { status: payout.status },
    after: { status: "CANCELLED", agencyName: payout.agency?.name || "Agency", reason },
  });

  revalidatePath("/dashboard/payouts");
  return updated;
}


