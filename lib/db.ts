import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reset cached instance if missing newly added models or fields (e.g. bankAccountName on Agency)
if (globalForPrisma.prisma) {
  const p = globalForPrisma.prisma as any;
  const hasAgencyPayout = "agencyPayout" in p;
  const hasPlatformSettings = "platformSettings" in p;
  const agencyFields = p._runtimeDataModel?.models?.Agency?.fields || [];
  const hasBankField = Array.isArray(agencyFields)
    ? agencyFields.some((f: any) => f.name === "bankAccountName")
    : true;

  if (!hasAgencyPayout || !hasPlatformSettings || !hasBankField) {
    try {
      p.$disconnect();
    } catch {
      // Ignore error
    }
    globalForPrisma.prisma = undefined;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function getDbClient(): PrismaClient {
  return prisma;
}


