import { prisma } from "../lib/db";

async function main() {
  const ag = await prisma.agency.findFirst();
  if (!ag) {
    console.log("No agency found");
    return;
  }
  const newId = `payout_test_${Date.now()}`;
  const now = new Date();
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const res = await (prisma as any).agencyPayout.create({
      data: {
        agencyId: ag.id,
        periodStart,
        periodEnd: now,
        grossAmount: 10000,
        commissionAmount: 1000,
        netAmount: 9000,
        commissionRate: 0.10,
        bookingCount: 0,
        bookingIds: [],
        status: "PENDING",
      },
    });
    console.log("PRISMA CREATE SUCCESS:", res);
  } catch (err: any) {
    console.log("PRISMA CREATE ERROR:", err.message);
  }
}

main().finally(() => prisma.$disconnect());
