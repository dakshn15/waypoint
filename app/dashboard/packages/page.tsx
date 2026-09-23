import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package as PackageIcon } from "lucide-react";
import Link from "next/link";
import { serializePrisma } from "@/lib/utils";
import { getUserAgencyAccess } from "@/lib/permissions";
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

  const userRole = (session.user as any).role || "TRAVELER";
  const access = await getUserAgencyAccess(session.user.id, userRole);
  const agencyId = access?.agencyId;

  const dbPackages = userRole === "ADMIN"
    ? await prisma.package.findMany({
        orderBy: { createdAt: "desc" },
      })
    : agencyId
    ? await prisma.package.findMany({
        where: { agencyId },
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
    images: pkg.images,
    createdAt: pkg.createdAt,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Packages</h1>
          <p className="text-sm text-slate-500 font-medium">
            Create and manage your travel packages.
          </p>
        </div>
        <Link href="/dashboard/packages/new">
          <Button>
            <Plus className="h-4 w-4" /> Create Package
          </Button>
        </Link>
      </div>

      {packages.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <PackageIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No packages yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-5">
              Create your first travel package to start receiving bookings.
            </p>
            <Link href="/dashboard/packages/new">
              <Button>
                <Plus className="h-4 w-4" /> Create First Package
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
