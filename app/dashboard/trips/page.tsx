import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Sparkles, Calendar, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-[#E46F44]/10 text-[#E46F44] border-[#E46F44]/20",
  GENERATED: "bg-[#769ABC]/10 text-[#769ABC] border-[#769ABC]/20",
  SAVED: "bg-[#E8AA9B]/15 text-[#C85A35] border-[#E8AA9B]/25",
  BOOKED: "bg-[#1A3B5A]/10 text-[#1A3B5A] border-[#1A3B5A]/20",
  COMPLETED: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default async function TripsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Please log in to view your trips.
      </div>
    );
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Trips</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your AI-generated travel plans.
          </p>
        </div>
        <Link href="/trip-builder">
          <Button className="bg-gradient-to-r from-[var(--waypoint-teal)] to-sky-500 text-white gap-2 rounded-full px-6">
            <Sparkles className="h-4 w-4" /> Create New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Create your first AI-powered trip plan and it will appear here.
            </p>
            <Link href="/trip-builder">
              <Button className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white gap-2">
                <Sparkles className="h-4 w-4" /> Create AI Trip
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const destinations = (trip.destinations as any[]) || [];
            const destStr = destinations
              .map((d) => d.name || d)
              .join(", ");
            const days = Math.max(
              1,
              Math.ceil(
                (trip.endDate.getTime() - trip.startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );

            return (
              <Link key={trip.id} href={`/trip-builder/${trip.id}`}>
                <Card className="glass-card group cursor-pointer hover:shadow-2xl hover:shadow-[var(--waypoint-teal)]/10 transition-all hover:-translate-y-1 h-full">
                  {/* Visual header */}
                  <div className="h-32 bg-gradient-to-br from-[var(--waypoint-teal)]/15 to-[var(--waypoint-navy)]/25 flex items-center justify-center relative overflow-hidden">
                    <Sparkles className="h-10 w-10 text-[var(--waypoint-teal)]/40 group-hover:scale-110 transition-transform" />
                    <Badge
                      className={`absolute top-3 right-3 text-[10px] ${
                        STATUS_COLORS[trip.status] || ""
                      }`}
                    >
                      {trip.status}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-[var(--waypoint-teal)] transition-colors">
                      {trip.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                      <Map className="h-3.5 w-3.5" />
                      {destStr || "Custom destination"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {days} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {trip.travelers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--waypoint-teal)]">
                        {formatCurrency(
                          Number(trip.budget),
                          trip.currency
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:text-[var(--waypoint-teal)] transition-colors flex items-center gap-1">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
