import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { serializePrisma } from "@/lib/utils";
import { getCommissionRate, getPlatformSettings } from "@/lib/commission";
import { getUserAgencyAccess } from "@/lib/permissions";
import PayoutsClient from "./payouts-client";

function toPlainPayout(p: any) {
  if (!p) return null;
  return {
    id: String(p.id),
    agencyId: String(p.agencyId),
    periodStart: p.periodStart ? new Date(p.periodStart).toISOString() : new Date().toISOString(),
    periodEnd: p.periodEnd ? new Date(p.periodEnd).toISOString() : new Date().toISOString(),
    grossAmount: Number(p.grossAmount || 0),
    commissionAmount: Number(p.commissionAmount || 0),
    netAmount: Number(p.netAmount || 0),
    commissionRate: Number(p.commissionRate || 0),
    bookingCount: Number(p.bookingCount || 0),
    bookingIds: Array.isArray(p.bookingIds) ? p.bookingIds : [],
    status: String(p.status || "PENDING"),
    settledAt: p.settledAt ? new Date(p.settledAt).toISOString() : null,
    settledBy: p.settledBy ? String(p.settledBy) : null,
    transactionRef: p.transactionRef ? String(p.transactionRef) : null,
    notes: p.notes ? String(p.notes) : null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    agency: p.agency || p.agencyName
      ? {
          id: String(p.agency?.id || p.agencyId || ""),
          name: String(p.agency?.name || p.agencyName || "Agency"),
          logo: p.agency?.logo || p.agencyLogo ? String(p.agency?.logo || p.agencyLogo) : null,
          commissionRate: (p.agency?.commissionRate ?? p.agencyCommissionRate) != null ? Number(p.agency?.commissionRate ?? p.agencyCommissionRate) : null,
          bankAccountName: p.agency?.bankAccountName || p.bankAccountName ? String(p.agency?.bankAccountName || p.bankAccountName) : null,
          bankAccountNumber: p.agency?.bankAccountNumber || p.bankAccountNumber ? String(p.agency?.bankAccountNumber || p.bankAccountNumber) : null,
          bankIfscCode: p.agency?.bankIfscCode || p.bankIfscCode ? String(p.agency?.bankIfscCode || p.bankIfscCode) : null,
          bankName: p.agency?.bankName || p.bankName ? String(p.agency?.bankName || p.bankName) : null,
          upiId: p.agency?.upiId || p.upiId ? String(p.agency?.upiId || p.upiId) : null,
        }
      : null,
  };
}

export default async function PayoutsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role || "TRAVELER";
  const platformSettings = await getPlatformSettings();
  const db = prisma as any;

  // If user is ADMIN
  if (role === "ADMIN") {
    let rawPayouts: any[] = [];
    try {
      if (db.agencyPayout) {
        rawPayouts = await db.agencyPayout.findMany({
          include: {
            agency: true,
          },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (e) {
      // Ignore
    }

    if (!rawPayouts || rawPayouts.length === 0) {
      const rawRows: any[] = await prisma.$queryRaw`
        SELECT p.*, a."name" as "agencyName", a."logo" as "agencyLogo", a."commissionRate" as "agencyCommissionRate",
               a."bankAccountName", a."bankAccountNumber", a."bankIfscCode", a."bankName", a."upiId"
        FROM "AgencyPayout" p
        LEFT JOIN "Agency" a ON p."agencyId" = a."id"
        ORDER BY p."createdAt" DESC
      `;
      rawPayouts = rawRows || [];
    }

    const rawAgencies = await prisma.agency.findMany({
      orderBy: { name: "asc" },
    });

    const agencies = rawAgencies.map((a: any) => ({
      id: String(a.id),
      name: String(a.name || "Agency"),
      logo: a.logo ? String(a.logo) : null,
      commissionRate: a.commissionRate != null ? Number(a.commissionRate) : null,
      bankAccountName: a.bankAccountName ? String(a.bankAccountName) : null,
      bankAccountNumber: a.bankAccountNumber ? String(a.bankAccountNumber) : null,
      bankIfscCode: a.bankIfscCode ? String(a.bankIfscCode) : null,
      bankName: a.bankName ? String(a.bankName) : null,
      upiId: a.upiId ? String(a.upiId) : null,
    }));

    const payouts = (rawPayouts || []).map(toPlainPayout);

    // Calculate aggregated metrics for admin
    const pendingAmount = payouts
      .filter((p: any) => p.status === "PENDING" || p.status === "APPROVED")
      .reduce((sum: number, p: any) => sum + Number(p.netAmount), 0);

    const settledAmount = payouts
      .filter((p: any) => p.status === "SETTLED")
      .reduce((sum: number, p: any) => sum + Number(p.netAmount), 0);

    const totalCommissionEarned = payouts
      .filter((p: any) => p.status === "SETTLED")
      .reduce((sum: number, p: any) => sum + Number(p.commissionAmount), 0);

    return (
      <PayoutsClient
        role="ADMIN"
        payouts={payouts}
        agencies={agencies}
        platformSettings={platformSettings}
        adminMetrics={{
          pendingAmount,
          settledAmount,
          totalCommissionEarned,
          payoutCount: payouts.length,
        }}
      />
    );
  }

  // If user is AGENCY or STAFF user
  const userAccess = await getUserAgencyAccess(session.user.id, role);

  if (!userAccess) {
    redirect("/dashboard");
  }

  let agency: any = await prisma.agency.findUnique({
    where: { id: userAccess.agencyId },
  });

  if (!agency) {
    redirect("/dashboard");
  }

  if (!agency.bankAccountNumber && !agency.upiId) {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT "bankAccountName", "bankAccountNumber", "bankIfscCode", "bankName", "upiId"
      FROM "Agency" WHERE "id" = ${userAccess.agencyId}
    `;
    if (rawRows && rawRows.length > 0) {
      agency = {
        ...agency,
        bankAccountName: rawRows[0].bankAccountName ?? agency.bankAccountName ?? null,
        bankAccountNumber: rawRows[0].bankAccountNumber ?? agency.bankAccountNumber ?? null,
        bankIfscCode: rawRows[0].bankIfscCode ?? agency.bankIfscCode ?? null,
        bankName: rawRows[0].bankName ?? agency.bankName ?? null,
        upiId: rawRows[0].upiId ?? agency.upiId ?? null,
      };
    }
  }

  const plainAgency = {
    id: String(agency.id),
    name: String(agency.name || "Agency"),
    logo: agency.logo ? String(agency.logo) : null,
    commissionRate: agency.commissionRate != null ? Number(agency.commissionRate) : null,
    bankAccountName: agency.bankAccountName ? String(agency.bankAccountName) : null,
    bankAccountNumber: agency.bankAccountNumber ? String(agency.bankAccountNumber) : null,
    bankIfscCode: agency.bankIfscCode ? String(agency.bankIfscCode) : null,
    bankName: agency.bankName ? String(agency.bankName) : null,
    upiId: agency.upiId ? String(agency.upiId) : null,
  };

  const effectiveCommissionRate = await getCommissionRate(agency.id);

  let rawPayouts: any[] = [];
  try {
    if (db.agencyPayout) {
      rawPayouts = await db.agencyPayout.findMany({
        where: { agencyId: agency.id },
        include: {
          agency: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (e) {
    // Ignore
  }

  if (!rawPayouts || rawPayouts.length === 0) {
    const rawRows: any[] = await prisma.$queryRaw`
      SELECT p.*, a."name" as "agencyName", a."logo" as "agencyLogo", a."commissionRate" as "agencyCommissionRate",
             a."bankAccountName", a."bankAccountNumber", a."bankIfscCode", a."bankName", a."upiId"
      FROM "AgencyPayout" p
      LEFT JOIN "Agency" a ON p."agencyId" = a."id"
      WHERE p."agencyId" = ${agency.id}
      ORDER BY p."createdAt" DESC
    `;
    rawPayouts = rawRows || [];
  }

  const payouts = (rawPayouts || []).map(toPlainPayout);

  // Calculate earnings for this agency based on CONFIRMED or COMPLETED bookings
  const bookings = await prisma.booking.findMany({
    where: {
      agencyId: agency.id,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    select: {
      id: true,
      totalAmount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const now = new Date();
  const holdPeriodMs = platformSettings.payoutHoldDays * 24 * 60 * 60 * 1000;

  let grossVolume = 0;
  let grossAvailableVolume = 0;
  let grossHoldingVolume = 0;

  bookings.forEach((booking: any) => {
    const price = Number(booking.totalAmount);
    grossVolume += price;

    const age = now.getTime() - new Date(booking.createdAt).getTime();
    if (age >= holdPeriodMs) {
      grossAvailableVolume += price;
    } else {
      grossHoldingVolume += price;
    }
  });

  // Gross sales already requested or settled
  const alreadyRequestedOrPaidGross = payouts
    .filter((p: any) => p.status !== "CANCELLED")
    .reduce((sum: number, p: any) => sum + Number(p.grossAmount), 0);

  const totalSettledNet = payouts
    .filter((p: any) => p.status === "SETTLED")
    .reduce((sum: number, p: any) => sum + Number(p.netAmount), 0);

  // Available Gross Sales eligible for payout
  const availableGrossForPayout = Math.max(0, grossAvailableVolume - alreadyRequestedOrPaidGross);
  
  // Available Net Payout (what agency actually receives in bank)
  const availableNetForPayout = availableGrossForPayout * (1 - effectiveCommissionRate);

  const netEarningsTotal = grossVolume * (1 - effectiveCommissionRate);
  const netHoldingTotal = grossHoldingVolume * (1 - effectiveCommissionRate);

  return (
    <PayoutsClient
      role="AGENCY"
      agency={plainAgency}
      effectiveCommissionRate={effectiveCommissionRate}
      payouts={payouts}
      platformSettings={platformSettings}
      agencyMetrics={{
        grossVolume,
        netEarningsTotal,
        netHoldingTotal,
        availableGrossForPayout,
        availableNetForPayout,
        alreadyRequestedOrPaidGross,
        totalSettled: totalSettledNet,
      }}
    />
  );
}
