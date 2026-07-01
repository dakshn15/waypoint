"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AgenciesList } from "./agencies-list-client";

export default async function AdminAgenciesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          packages: true,
          bookings: true,
          staff: true,
        },
      },
    },
  });

  const formattedAgencies = agencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    description: agency.description,
    logo: agency.logo,
    website: agency.website,
    phone: agency.phone,
    email: agency.email,
    address: agency.address,
    verified: agency.verified,
    active: agency.active,
    ownerName: agency.owner.name,
    ownerEmail: agency.owner.email,
    packagesCount: agency._count.packages,
    bookingsCount: agency._count.bookings,
    staffCount: agency._count.staff,
    createdAt: agency.createdAt,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency Management</h1>
        <p className="text-muted-foreground mt-1">
          Verify agency profiles, toggle operations status, and inspect travel agency tenants.
        </p>
      </div>

      <AgenciesList initialAgencies={formattedAgencies} />
    </div>
  );
}
