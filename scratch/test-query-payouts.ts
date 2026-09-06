import { prisma } from "../lib/db";

async function main() {
  const rows: any[] = await prisma.$queryRaw`SELECT * FROM "AgencyPayout"`;
  console.log("PAYOUT ROWS IN DB:", rows);
}

main().finally(() => prisma.$disconnect());
