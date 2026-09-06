import { prisma } from "../lib/db";

async function main() {
  const ag = await prisma.agency.findFirst();
  if (!ag) {
    console.log("No agency found");
    return;
  }
  const result = await prisma.$executeRaw`
    UPDATE "Agency"
    SET "bankAccountName" = ${"Wanderlust Travels Pvt Ltd"},
        "bankAccountNumber" = ${"50100987654321"},
        "bankIfscCode" = ${"HDFC0001234"},
        "bankName" = ${"HDFC Bank"},
        "upiId" = ${"wanderlust-travels@hdfcbank"}
    WHERE "id" = ${ag.id}
  `;
  console.log("RAW EXECUTE RESULT SUCCESS:", result);
}

main().finally(() => prisma.$disconnect());
