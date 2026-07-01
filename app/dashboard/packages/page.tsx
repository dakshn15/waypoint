import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package as PackageIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency, serializePrisma } from "@/lib/utils";
import AgencyPackagesListClient from "./packages-client";

export default async function AgencyPackagesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Unauthorized. Please log in.
      </div>
    );
  }

  // Fetch agency associated with this user
  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  const dbPackages = agency
    ? await prisma.package.findMany({
        where: { agencyId: agency.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const packages = dbPackages.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    slug: pkg.slug,
    status: pkg.status,
    basePrice: Number(pkg.basePrice),
    currency: pkg.currency,
    duration: pkg.duration,
    destinations: pkg.destinations,
    createdAt: pkg.createdAt,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your travel packages.
          </p>
        </div>
        <Link href="/dashboard/packages/new">
          <Button className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white gap-2">
            <Plus className="h-4 w-4" />
            Create Package
          </Button>
        </Link>
      </div>

      {packages.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Create your first travel package to start receiving bookings.
            </p>
            <Link href="/dashboard/packages/new">
              <Button className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white gap-2">
                <Plus className="h-4 w-4" />
                Create First Package
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <AgencyPackagesListClient initialPackages={serializePrisma(packages)} />
      )}
    </div>
  );
}
