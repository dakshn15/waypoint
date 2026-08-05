import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Plus,
  Hotel,
  Car,
  Utensils,
  Camera,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AddVendorDialog from "./add-vendor-dialog";

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  HOTEL: {
    icon: <Hotel className="h-4 w-4" />,
    color: "bg-[#769ABC]/10 text-[#769ABC] border-[#769ABC]/20",
  },
  TRANSPORT: {
    icon: <Car className="h-4 w-4" />,
    color: "bg-[#1A3B5A]/10 text-[#1A3B5A] border-[#1A3B5A]/20",
  },
  RESTAURANT: {
    icon: <Utensils className="h-4 w-4" />,
    color: "bg-[#E46F44]/10 text-[#E46F44] border-[#E46F44]/20",
  },
  ACTIVITY: {
    icon: <Camera className="h-4 w-4" />,
    color: "bg-[#E8AA9B]/20 text-[#C85A35] border-[#E8AA9B]/30",
  },
  GUIDE: {
    icon: <Globe className="h-4 w-4" />,
    color: "bg-[#769ABC]/10 text-[#1A3B5A] border-[#769ABC]/20",
  },
  OTHER: {
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  },
};

import { serializePrisma } from "@/lib/utils";
import VendorsClient from "./vendors-client";

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
      <div className="p-6 text-center text-muted-foreground">
        Vendor management is only available for agencies.
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your hotel, transport, and service partners.
          </p>
        </div>
        {agency && <AddVendorDialog agencyId={agency.id} />}
      </div>

      {/* Category Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Card
            key={key}
            className="glass-card hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${config.color}`}
              >
                {config.icon}
              </div>
              <div>
                <p className="text-lg font-bold">{categoryCounts[key] || 0}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {key}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendor List */}
      {vendors.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vendors yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Add your hotel, transport, and service partners to streamline your
              travel operations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <VendorsClient initialVendors={serializePrisma(vendors)} />
      )}
    </div>
  );
}
