import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, DollarSign } from "lucide-react";

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

  // Get unique travelers
  const travelersMap = new Map<string, any>();
  bookings.forEach((b) => {
    if (!travelersMap.has(b.userId)) {
      travelersMap.set(b.userId, {
        user: b.user,
        bookingsCount: 0,
        totalSpent: 0,
        lastBooking: b.createdAt,
      });
    }
    const t = travelersMap.get(b.userId)!;
    t.bookingsCount += 1;
    t.totalSpent += Number(b.totalAmount);
  });

  const travelers = Array.from(travelersMap.values());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Travelers</h1>
        <p className="text-sm text-slate-500 font-medium">
          Customers who have booked with your agency.
        </p>
      </div>

      {travelers.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-violet-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No travelers yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              Travelers will appear here once you receive bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {travelers.map((t) => (
            <Card
              key={t.user.id}
              className="group bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white font-bold shadow-sm">
                    {t.user.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{t.user.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> {t.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                    {t.bookingsCount} booking{t.bookingsCount !== 1 ? "s" : ""}
                  </span>
                  <Badge variant="outline" className="text-xs font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/15">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    ₹{t.totalSpent.toLocaleString("en-IN")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
