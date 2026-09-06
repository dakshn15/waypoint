import { prisma } from "../lib/db";

async function main() {
  const payouts = await prisma.$queryRaw`
    SELECT "id", "grossAmount", "commissionAmount", "netAmount", "status", "createdAt"
    FROM "AgencyPayout"
    ORDER BY "createdAt" DESC
  `;
  console.log("CURRENT PAYOUTS IN DB:");
  console.log(JSON.stringify(payouts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
