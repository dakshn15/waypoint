import { prisma } from "../lib/db";
import { serializePrisma } from "../lib/utils";

async function main() {
  const payout = await prisma.agencyPayout.findFirst({
    include: { agency: true },
  });

  if (!payout) {
    console.log("No payout found in DB");
    return;
  }

  console.log("RAW PRISMA PAYOUT CONSTRUCTOR:");
  console.log("grossAmount constructor:", payout.grossAmount.constructor.name);
  console.log("grossAmount typeof:", typeof payout.grossAmount);

  const serialized = serializePrisma(payout);
  console.log("\nSERIALIZED PAYOUT:");
  console.log("grossAmount typeof:", typeof serialized.grossAmount);
  console.log("grossAmount constructor:", serialized.grossAmount?.constructor?.name);
  console.log("grossAmount value:", serialized.grossAmount);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
