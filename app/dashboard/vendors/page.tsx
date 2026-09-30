import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Building2 } from "lucide-react";
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

  let agency = null;
  if (role === "AGENCY") {
    agency = await prisma.agency.findUnique({
      where: { ownerId: session.user.id },
    });
  } else if (role === "ADMIN") {
    agency = await prisma.agency.findFirst();
  }

  const vendors =
    role === "ADMIN"
      ? await prisma.vendor.findMany({
          orderBy: { createdAt: "desc" },
        })
      : agency
      ? await prisma.vendor.findMany({
          where: { agencyId: agency.id },
          orderBy: { createdAt: "desc" },
        })
      : [];

  if (!agency) {
    return (
      <div className="p-6 text-center text-slate-500">
        No agency found. Please set up your agency first.
      </div>
    );
  }

  return (
    <VendorsClient initialVendors={serializePrisma(vendors)} agencyId={agency.id} />
  );
}
