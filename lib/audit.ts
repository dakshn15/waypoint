import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      before: input.before,
      after: input.after,
      metadata: input.metadata,
    },
  });
}
