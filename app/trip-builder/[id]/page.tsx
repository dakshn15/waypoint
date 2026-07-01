import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Sparkles,
  IndianRupee,
  ArrowLeft,
  Hotel,
  Plane,
  Train,
  Bus,
  CarFront,
  Ship,
  Footprints,
  Camera,
  Mountain,
  Utensils,
  ShoppingBag,
  Palmtree,
  Landmark,
  ArrowRight,
  Lightbulb,
  PieChart,
  CalendarDays,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { GeneratedTrip } from "@/lib/ai";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  SIGHTSEEING: <Camera className="h-4 w-4" />,
  ADVENTURE: <Mountain className="h-4 w-4" />,
  DINING: <Utensils className="h-4 w-4" />,
  SHOPPING: <ShoppingBag className="h-4 w-4" />,
  RELAXATION: <Palmtree className="h-4 w-4" />,
  CULTURAL: <Landmark className="h-4 w-4" />,
  TRANSPORTATION: <CarFront className="h-4 w-4" />,
  CHECK_IN: <Hotel className="h-4 w-4" />,
  CHECK_OUT: <Hotel className="h-4 w-4" />,
};

const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  FLIGHT: <Plane className="h-4 w-4" />,
  TRAIN: <Train className="h-4 w-4" />,
  BUS: <Bus className="h-4 w-4" />,
  CAR: <CarFront className="h-4 w-4" />,
  FERRY: <Ship className="h-4 w-4" />,
  WALK: <Footprints className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  SIGHTSEEING: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  ADVENTURE: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DINING: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  SHOPPING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  RELAXATION: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  CULTURAL: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  TRANSPORTATION: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  CHECK_IN: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CHECK_OUT: "bg-red-500/10 text-red-600 border-red-500/20",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GeneratedTripPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      itineraries: {
        include: {
          activities: true,
          hotel: true,
          transport: true,
        },
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const aiData = trip.aiResponse as unknown as GeneratedTrip | null;
  const costBreakdown = (trip.costBreakdown as any) || {};
  const destinations = (trip.destinations as any[]) || [];
  const destStr = destinations.map((d) => d.name || d).join(", ");

  const days = Math.max(
    1,
    Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const totalCost =
    aiData?.totalEstimatedCost ||
    Object.values(costBreakdown).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0
    );

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/30">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/dashboard/trips"
            className="flex items-center gap-2 text-sm font-medium hover:text-[var(--waypoint-teal)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> My Trips
          </Link>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-[var(--waypoint-teal)] to-sky-400 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" /> AI Generated
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[var(--waypoint-navy)] via-zinc-900 to-zinc-950 text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge
              variant="outline"
              className="text-zinc-300 border-zinc-700 px-3 py-1"
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1 text-[var(--waypoint-teal)]" />
              {days} Days
            </Badge>
            <Badge
              variant="outline"
              className="text-zinc-300 border-zinc-700 px-3 py-1"
            >
              <Users className="h-3.5 w-3.5 mr-1 text-[var(--waypoint-teal)]" />
              {trip.travelers} Travelers
            </Badge>
            <Badge
              variant="outline"
              className="text-zinc-300 border-zinc-700 px-3 py-1"
            >
              <Wallet className="h-3.5 w-3.5 mr-1 text-[var(--waypoint-teal)]" />
              {trip.travelStyle}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {trip.title}
          </h1>

          {aiData?.summary && (
            <p className="text-zinc-300 text-lg max-w-3xl leading-relaxed">
              {aiData.summary}
            </p>
          )}

          <div className="flex items-center gap-2 mt-6 text-zinc-400 text-sm">
            <MapPin className="h-4 w-4 text-[var(--waypoint-teal)]" />
            {destStr}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-10">
        {/* Cost Overview */}
        <div className="grid gap-4 md:grid-cols-5 mb-10">
          <Card className="glass-card md:col-span-2 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-[var(--waypoint-teal)]" />
                <h3 className="font-bold text-lg">Cost Breakdown</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Accommodation",
                    value: costBreakdown.accommodation,
                    color: "bg-sky-500",
                  },
                  {
                    label: "Transport",
                    value: costBreakdown.transport,
                    color: "bg-violet-500",
                  },
                  {
                    label: "Activities",
                    value: costBreakdown.activities,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Food",
                    value: costBreakdown.food,
                    color: "bg-rose-500",
                  },
                  {
                    label: "Miscellaneous",
                    value: costBreakdown.miscellaneous,
                    color: "bg-zinc-500",
                  },
                ].map(
                  (item) =>
                    item.value > 0 && (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                          />
                          <span className="text-muted-foreground">
                            {item.label}
                          </span>
                        </div>
                        <span className="font-semibold text-sm">
                          {formatCurrency(item.value, trip.currency)}
                        </span>
                      </div>
                    )
                )}
                <div className="border-t pt-3 flex items-center justify-between font-bold">
                  <span>Total Estimated</span>
                  <span className="text-[var(--waypoint-teal)] text-lg">
                    {formatCurrency(totalCost as number, trip.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          {aiData?.tips && aiData.tips.length > 0 && (
            <Card className="glass-card md:col-span-3 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-[var(--waypoint-amber)]" />
                  <h3 className="font-bold text-lg">Travel Tips</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {aiData.tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-2 text-sm text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border"
                    >
                      <span className="text-[var(--waypoint-amber)] font-bold shrink-0">
                        💡
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Day-by-Day Itinerary */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-[var(--waypoint-teal)]" />
          Day-by-Day Itinerary
        </h2>
        <div className="space-y-6">
          {trip.itineraries.map((day) => {
            const dayDate = new Date(trip.startDate);
            dayDate.setDate(dayDate.getDate() + day.dayNumber - 1);
            const dateStr = dayDate.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Card
                key={day.id}
                className="glass-card overflow-hidden group"
              >
                {/* Day header */}
                <div className="bg-gradient-to-r from-[var(--waypoint-navy)]/5 to-transparent dark:from-[var(--waypoint-teal)]/5 p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--waypoint-teal)] to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {day.dayNumber}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-lg">{day.title}</h3>
                          <Badge variant="outline" className="text-[10px] font-mono border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {dateStr}
                          </Badge>
                        </div>
                        {day.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {day.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  {/* Transport Banner */}
                  {day.transport && (
                    <div className="flex items-center gap-3 bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600">
                        {TRANSPORT_ICONS[day.transport.type] || (
                          <CarFront className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold">
                          {day.transport.from}{" "}
                          <ArrowRight className="h-3 w-3 inline mx-1 text-muted-foreground" />{" "}
                          {day.transport.to}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {day.transport.type} •{" "}
                          {day.transport.cost
                            ? formatCurrency(
                                Number(day.transport.cost),
                                trip.currency
                              )
                            : "Included"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activities Timeline */}
                  <div className="relative">
                    {day.activities.map((activity, aIdx) => (
                      <div key={activity.id} className="flex gap-4 pb-4 last:pb-0">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${
                              ACTIVITY_COLORS[activity.type] ||
                              "bg-zinc-100 text-zinc-500 border-zinc-200"
                            }`}
                          >
                            {ACTIVITY_ICONS[activity.type] || (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          {aIdx < day.activities.length - 1 && (
                            <div className="w-px flex-1 bg-border mt-1 min-h-[1rem]" />
                          )}
                        </div>
                        {/* Activity card */}
                        <div className="flex-1 pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                {activity.time && (
                                  <span className="text-xs font-mono font-semibold text-[var(--waypoint-teal)]">
                                    {activity.time}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${
                                    ACTIVITY_COLORS[activity.type] || ""
                                  }`}
                                >
                                  {activity.type}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-sm">
                                {activity.title}
                              </h4>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {activity.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                {activity.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {activity.location}
                                  </span>
                                )}
                                {activity.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.duration}
                                  </span>
                                )}
                              </div>
                            </div>
                            {activity.cost && Number(activity.cost) > 0 && (
                              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap ml-3">
                                {formatCurrency(
                                  Number(activity.cost),
                                  trip.currency
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hotel Info */}
                  {day.hotel && (
                    <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mt-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Hotel className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold">
                          {day.hotel.name}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {day.hotel.address} •{" "}
                          {day.hotel.rating && `⭐ ${day.hotel.rating}`}
                          {day.hotel.pricePerNight &&
                            ` • ${formatCurrency(
                              Number(day.hotel.pricePerNight),
                              trip.currency
                            )}/night`}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/trip-builder">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 gap-2"
              >
                <Sparkles className="h-4 w-4" /> Generate Another Trip
              </Button>
            </Link>
            <Link href="/packages">
              <Button
                size="lg"
                className="rounded-full px-6 bg-gradient-to-r from-[var(--waypoint-teal)] to-sky-500 text-white gap-2"
              >
                Browse Packages <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
