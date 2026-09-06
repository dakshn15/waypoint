import { prisma } from "../lib/db";

async function main() {
  const payouts: any[] = await prisma.$queryRaw`
    SELECT "id", "grossAmount", "netAmount", "status", "createdAt"
    FROM "AgencyPayout"
    ORDER BY "createdAt" ASC
  `;

  console.log("CURRENT PAYOUTS IN DB:", payouts);

  // Keep the first payout or keep 1 pending request, remove duplicate test clicks if multiple exist
  if (payouts.length > 1) {
    const keepId = payouts[0].id;
    const deleteIds = payouts.slice(1).map((p: any) => p.id);
    for (const id of deleteIds) {
      await prisma.$executeRaw`DELETE FROM "AgencyPayout" WHERE "id" = ${id}`;
    }
    console.log(`Cleaned up ${deleteIds.length} duplicate test payouts. Retained payout ID: ${keepId}`);
  }
}

main().finally(() => prisma.$disconnect());
