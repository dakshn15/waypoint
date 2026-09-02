import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TravelersClient from "./travelers-client";
import { serializePrisma } from "@/lib/utils";

export default async function TravelersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const role = (session.user as any).role || "TRAVELER";
  if (role !== "AGENCY" && role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-sm text-slate-500 font-medium">This page is only available for agencies.</p>
      </div>
    );
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  const bookings = agency
    ? await prisma.booking.findMany({
      where: { agencyId: agency.id },
      include: { user: true, package: true },
      orderBy: { createdAt: "desc" },
    })
    : [];

  // Build enriched traveler map
  const travelersMap = new Map<string, any>();
  bookings.forEach((b) => {
    if (!travelersMap.has(b.userId)) {
      travelersMap.set(b.userId, {
        user: b.user,
        bookingsCount: 0,
        totalSpent: 0,
        lastBooking: b.createdAt,
        bookings: [],
      });
    }
    const t = travelersMap.get(b.userId)!;
    t.bookingsCount += 1;
    t.totalSpent += Number(b.totalAmount);
    if (new Date(b.createdAt) > new Date(t.lastBooking)) {
      t.lastBooking = b.createdAt;
    }
    t.bookings.push({
      id: b.id,
      packageTitle: b.package?.title || null,
      totalAmount: Number(b.totalAmount),
      currency: b.currency,
      status: b.status,
      travelDate: b.travelDate,
      createdAt: b.createdAt,
    });
  });

  const travelers = Array.from(travelersMap.values());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Travelers</h1>
        <p className="text-sm text-slate-500 font-medium">
          View and manage all customers who have booked with your agency.
        </p>
      </div>

      {travelers.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No travelers yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              Travelers will appear here once you receive bookings for your packages.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TravelersClient travelers={serializePrisma(travelers)} />
      )}
    </div>
  );
}
