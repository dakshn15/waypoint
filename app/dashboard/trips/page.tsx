import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sparkles, Users, ArrowRight, Plane, Clock, Route } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const DESTINATION_IMAGES: Record<string, string> = {
  kashmir: "/images/packages/kashmir-valley.jpg",
  srinagar: "/images/packages/kashmir-valley.jpg",
  gulmarg: "/images/packages/kashmir-valley.jpg",
  pahalgam: "/images/packages/kashmir-valley.jpg",
  delhi: "/images/packages/golden-triangle.jpg",
  agra: "/images/packages/golden-triangle.jpg",
  jaipur: "/images/packages/golden-triangle.jpg",
  kochi: "/images/packages/kerala-backwaters.jpg",
  munnar: "/images/packages/kerala-backwaters.jpg",
  alleppey: "/images/packages/kerala-backwaters.jpg",
  kerala: "/images/packages/kerala-backwaters.jpg",
  manali: "/images/packages/himalayan-adventure.jpg",
  shimla: "/images/packages/himalayan-adventure.jpg",
  leh: "/images/packages/himalayan-adventure.jpg",
  ladakh: "/images/packages/himalayan-adventure.jpg",
  goa: "/images/packages/goa-beach.jpg",
  "north goa": "/images/packages/goa-beach.jpg",
  "south goa": "/images/packages/goa-beach.jpg",
  udaipur: "/images/packages/rajasthan-heritage.jpg",
  jodhpur: "/images/packages/rajasthan-heritage.jpg",
  jaisalmer: "/images/packages/rajasthan-heritage.jpg",
  rajasthan: "/images/packages/rajasthan-heritage.jpg",
  shillong: "/images/packages/northeast-explorer.jpg",
  kaziranga: "/images/packages/northeast-explorer.jpg",
  northeast: "/images/packages/northeast-explorer.jpg",
  varanasi: "/images/packages/varanasi-ganges.jpg",
};

const FALLBACK_IMAGES = [
  "/images/packages/himalayan-adventure.jpg",
  "/images/packages/goa-beach.jpg",
  "/images/packages/golden-triangle.jpg",
  "/images/packages/kerala-backwaters.jpg",
  "/images/packages/rajasthan-heritage.jpg",
  "/images/packages/kashmir-valley.jpg",
];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planning", className: "bg-amber-500/90 text-white border-amber-400/30" },
  GENERATED: { label: "AI Generated", className: "bg-emerald-500/90 text-white border-emerald-400/30" },
  SAVED: { label: "Saved", className: "bg-violet-500/90 text-white border-violet-400/30" },
  BOOKED: { label: "Booked", className: "bg-sky-500/90 text-white border-sky-400/30" },
  COMPLETED: { label: "Completed", className: "bg-slate-700/90 text-white border-slate-600/30" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-500/90 text-white border-rose-400/30" },
};

function getTripImage(destinations: any[], index: number): string {
  const destNames = destinations.map((d) => (typeof d === "string" ? d : d.name || "").toLowerCase());
  for (const name of destNames) {
    for (const [key, img] of Object.entries(DESTINATION_IMAGES)) {
      if (name.includes(key)) return img;
    }
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">My Trips</h1>
          <p className="text-sm text-slate-500 font-medium">
            View and manage your AI-generated travel plans.
          </p>
        </div>
        <Link href="/trip-builder">
          <Button className="bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 text-white">
            <Sparkles className="h-4 w-4" /> Create New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-display">No trips yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-5">
              Create your first AI-powered trip plan and it will appear here.
            </p>
            <Link href="/trip-builder">
              <Button className="bg-gradient-to-r from-secondary to-slate-600 hover:from-secondary/90 hover:to-slate-600/90 text-white gap-2 rounded-xl shadow-md shadow-secondary/20">
                <Sparkles className="h-4 w-4" /> Create AI Trip
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, idx) => {
            const rawDest = (trip.destinations as any[]) || [];
            const destArray = rawDest.map((d) => (typeof d === "string" ? d : d.name || d));
            const isMultiCity = destArray.length > 1;
            const destStr = destArray.join(" → ");
            const days = Math.max(
              1,
              Math.ceil(
                (trip.endDate.getTime() - trip.startDate.getTime()) /
                (1000 * 60 * 60 * 24)
              )
            );
            const imageSrc = getTripImage(rawDest, idx);
            const aiData = trip.aiResponse as any;
            const summary = aiData?.summary || `Custom ${days}-day trip to ${destArray.slice(0, 2).join(", ")}${destArray.length > 2 ? " & more" : ""}.`;
            const statusConfig = STATUS_BADGES[trip.status] || { label: trip.status, className: "bg-slate-700/90 text-white" };

            return (
              <Link key={trip.id} href={`/trip-builder/${trip.id}`} className="group">
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">

                  {/* Top Image Section */}
                  <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={imageSrc}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Top Left: Trip Type Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {isMultiCity ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <Route className="h-3 w-3" />
                          Multi-City ({destArray.length} Stops)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-slate-900 backdrop-blur-md flex items-center gap-1 shadow-sm">
                          <Sparkles className="h-3 w-3 text-primary" />
                          AI Itinerary
                        </span>
                      )}
                    </div>

                    {/* Top Right: Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Bottom Left: Duration & Guests */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white text-xs font-semibold">
                      <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {days} Days
                      </span>
                      <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                        <Users className="h-3.5 w-3.5 text-sky-400" />
                        {trip.travelers} Traveler{trip.travelers > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="sm:p-5 p-4 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1 font-display">
                        {trip.title}
                      </h3>

                      {/* Destinations Route */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="line-clamp-1">{destStr || "Custom Route"}</span>
                      </div>

                      {/* Description / Summary */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {summary}
                      </p>
                    </div>

                    {/* Card Footer Row */}
                    <div className="flex flex-wrap gap-2 items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium mb-1.5">Estimated Budget</span>
                        <span className="text-lg font-extrabold text-slate-900 font-display">
                          {formatCurrency(Number(trip.budget), trip.currency)}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>View Itinerary</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>

                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
