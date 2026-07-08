import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UsersTable } from "./users-table-client";
import { serializePrisma } from "@/lib/utils";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all users with their staff profiles if they have one
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      phone: true,
      agencyStaff: {
        select: {
          agencyId: true,
          role: true,
        },
      },
    },
  });

  // Fetch all active travel agencies for assignment drop-downs
  const agencies = await prisma.agency.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage system users, register traveler/agency/staff accounts, change roles, and delete accounts.
        </p>
      </div>

      <UsersTable
        initialUsers={serializePrisma(users)}
        agencies={serializePrisma(agencies)}
        currentUserId={session.user.id}
      />
    </div>
  );
}
