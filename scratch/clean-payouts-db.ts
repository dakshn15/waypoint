import { prisma } from "../lib/db";

async function main() {
  await prisma.$executeRaw`
    DELETE FROM "AgencyPayout" WHERE "status" = 'PENDING' OR "status" = 'CANCELLED'
  `;
  console.log("Cleaned PENDING and CANCELLED test payouts from DB.");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
