import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Hotel,
  Car,
  Utensils,
  Camera,
  Globe,
} from "lucide-react";
import AddVendorDialog from "./add-vendor-dialog";
import { serializePrisma } from "@/lib/utils";
import VendorsClient from "./vendors-client";

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  HOTEL: {
    icon: <Hotel className="h-4 w-4" />,
    color: "bg-indigo-50 text-indigo-600 border border-indigo-200/60",
  },
  TRANSPORT: {
    icon: <Car className="h-4 w-4" />,
    color: "bg-teal-50 text-teal-600 border border-teal-200/60",
  },
  RESTAURANT: {
    icon: <Utensils className="h-4 w-4" />,
    color: "bg-rose-50 text-rose-600 border border-rose-200/60",
  },
  ACTIVITY: {
    icon: <Camera className="h-4 w-4" />,
    color: "bg-amber-50 text-amber-600 border border-amber-200/60",
  },
  GUIDE: {
    icon: <Globe className="h-4 w-4" />,
    color: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
  },
  OTHER: {
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-purple-50 text-purple-600 border border-purple-200/60",
  },
};

export default async function VendorsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Please log in to view vendors.
      </div>
    );
  }

  const role = (session.user as any).role || "TRAVELER";

  if (role !== "AGENCY" && role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Vendor management is only available for agencies.
        </p>
      </div>
    );
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  const vendors = agency
    ? await prisma.vendor.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
    })
    : [];

  const categoryCounts = vendors.reduce(
    (acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Vendor Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage your hotel, transport, and service partners.
          </p>
        </div>
        {agency && <AddVendorDialog agencyId={agency.id} />}
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Card
            key={key}
            className="bg-white border border-slate-200/60 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center ${config.color}`}
              >
                {config.icon}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{categoryCounts[key] || 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {key}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendor List */}
      {vendors.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No vendors yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              Add your hotel, transport, and service partners to streamline your travel operations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <VendorsClient initialVendors={serializePrisma(vendors)} />
      )}
    </div>
  );
}
