import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TravelersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const role = (session.user as any).role || "TRAVELER";
  if (role !== "AGENCY" && role !== "ADMIN") {
    return (
      <div className="text-center text-muted-foreground p-12">
        This page is only available for agencies.
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Travelers</h1>
        <p className="text-muted-foreground mt-1">
          Customers who have booked with your agency.
        </p>
      </div>

      {travelers.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No travelers yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Travelers will appear here once you receive bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {travelers.map((t) => (
            <Card
              key={t.user.id}
              className="glass-card hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--waypoint-teal)] to-sky-400 flex items-center justify-center text-white font-bold">
                    {t.user.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.user.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {t.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t.bookingsCount} booking{t.bookingsCount !== 1 ? "s" : ""}
                  </span>
                  <Badge variant="outline" className="text-xs">
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
