import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserAgencyAccess } from "@/lib/permissions";
import { serializePrisma } from "@/lib/utils";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Load user details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Check agency settings access
  const access = await getUserAgencyAccess(session.user.id, session.user.role);
  const canManageAgency = access ? (access.isOwner || access.staffRole === "MANAGER") : false;

  let agency = null;
  if (access && canManageAgency) {
    agency = await prisma.agency.findUnique({
      where: { id: access.agencyId },
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
      },
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account profile, credentials, and agency details.
        </p>
      </div>

      <SettingsClient
        user={serializePrisma(user)}
        agency={serializePrisma(agency)}
        canManageAgency={canManageAgency}
      />
    </div>
  );
}
