import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serializePrisma } from "@/lib/utils";
import AuditLogsClient from "./audit-logs-client";

export default async function AuditLogsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return <AuditLogsClient logs={serializePrisma(logs)} />;
}
