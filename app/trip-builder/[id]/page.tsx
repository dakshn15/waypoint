import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Sparkles,
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
  UtensilsCrossed,
  ShoppingBag,
  Palmtree,
  Landmark,
  ArrowRight,
  Lightbulb,
  PieChart,
  CalendarDays,
  Users,
  Wallet,
  Ticket,
  Route,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { GeneratedTrip } from "@/lib/ai";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  SIGHTSEEING: <Camera className="h-4 w-4" />,
  ADVENTURE: <Mountain className="h-4 w-4" />,
  DINING: <UtensilsCrossed className="h-4 w-4" />,
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
  SIGHTSEEING: "bg-primary/10 text-primary border-primary/20",
  ADVENTURE: "bg-amber-50 text-amber-600 border-amber-200",
  DINING: "bg-emerald-50 text-emerald-600 border-emerald-200",
  SHOPPING: "bg-pink-50 text-pink-600 border-pink-200",
  RELAXATION: "bg-purple-50 text-purple-600 border-purple-200",
  CULTURAL: "bg-violet-50 text-violet-600 border-violet-200",
  TRANSPORTATION: "bg-sky-50 text-sky-600 border-sky-200",
  CHECK_IN: "bg-slate-100 text-slate-600 border-slate-200",
  CHECK_OUT: "bg-slate-100 text-slate-600 border-slate-200",
};

/* ─── Local High-Res Image Mapping ─── */
const DESTINATION_LOCAL_MAP: Record<string, string> = {
  goa: "/images/packages/goa-beach.jpg",
  kerala: "/images/packages/kerala-backwaters.jpg",
  munnar: "/images/packages/kerala-backwaters.jpg",
  alleppey: "/images/packages/kerala-backwaters.jpg",
  kochi: "/images/packages/kerala-backwaters.jpg",
  rajasthan: "/images/packages/rajasthan-heritage.jpg",
  udaipur: "/images/packages/rajasthan-heritage.jpg",
  jodhpur: "/images/packages/rajasthan-heritage.jpg",
  jaisalmer: "/images/packages/rajasthan-heritage.jpg",
  manali: "/images/packages/himalayan-adventure.jpg",
  leh: "/images/packages/himalayan-adventure.jpg",
  ladakh: "/images/packages/himalayan-adventure.jpg",
  himalaya: "/images/packages/himalayan-adventure.jpg",
  kashmir: "/images/packages/kashmir-valley.jpg",
  srinagar: "/images/packages/kashmir-valley.jpg",
  gulmarg: "/images/packages/kashmir-valley.jpg",
  pahalgam: "/images/packages/kashmir-valley.jpg",
  varanasi: "/images/packages/varanasi-ganges.jpg",
  ganges: "/images/packages/varanasi-ganges.jpg",
  delhi: "/images/packages/golden-triangle.jpg",
  agra: "/images/packages/golden-triangle.jpg",
  jaipur: "/images/packages/golden-triangle.jpg",
  northeast: "/images/packages/northeast-explorer.jpg",
  shillong: "/images/packages/northeast-explorer.jpg",
};

/* ─── Dynamic Unsplash Image Resolver for Global Custom Places ─── */
function getHeroImage(destStr: string): string {
  const lower = destStr.toLowerCase().trim();

  // 1. Check local Ultra-HD image library
  for (const [key, path] of Object.entries(DESTINATION_LOCAL_MAP)) {
    if (lower.includes(key)) return path;
  }

  // 2. Dynamic Unsplash image generator for any custom destination globally
  const primaryWord = destStr.split(",")[0].trim();
  const sanitizedQuery = encodeURIComponent(primaryWord || "landscape");

  return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2560&q=80&q=${sanitizedQuery}`;
}

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
  const rawDestinations = (trip.destinations as any[]) || [];
  const destArray = rawDestinations
    .map((d) => (typeof d === "string" ? d : d.name || d))
    .filter(Boolean);

  const isMultiCity = destArray.length > 1;
  const destStr = destArray.join(", ");

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

  const heroImage = getHeroImage(destStr);

  const rawTitle = aiData?.title || trip.title || "";
  const isGenericTitle = !rawTitle || rawTitle.includes("STANDARD") || rawTitle.includes("LUXURY") || rawTitle.includes("BUDGET") || rawTitle.includes("PREMIUM");

  const displayTitle = !isGenericTitle
    ? rawTitle
    : isMultiCity
      ? `${destArray[0]} to ${destArray[destArray.length - 1]} Grand Tour`
      : `Enchanting ${destStr || "Destination"} Getaway`;

  const displaySummary = aiData?.summary || `A curated ${days}-day itinerary tailored for ${trip.travelers} traveler(s), covering handpicked sights, local culinary stops, and comfortable stays.`;

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F4] text-slate-900 font-sans">
      <SiteHeader userSession={session} activeRoute="/trip-builder" />

      {/* ═══════════════ CINEMATIC HERO ═══════════════ */}
      <section className="relative w-full overflow-hidden bg-slate-950">
        <div className="relative w-full h-[450px] sm:h-[500px] md:h-[600px]">
          <img
            src={heroImage}
            alt={displayTitle}
            className="w-full h-full object-cover object-center"
          />

          {/* Gradient overlays matching Package Detail page */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#09111b]/70 via-[#09111b]/40 to-[#09111b]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09111b]/60 via-transparent to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 mb:pb-20 lg:pb-24">
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" /> AI Custom Plan
                  </span>
                  {isMultiCity && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm">
                      <Route className="h-3.5 w-3.5" /> Multi-City ({destArray.length} Stops)
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white backdrop-blur-md text-black text-xs font-semibold border border-white/20">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> {days} Days
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white backdrop-blur-md text-black text-xs font-semibold border border-white/20">
                    <Users className="h-3.5 w-3.5 text-secondary" /> {trip.travelers} Guest(s)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    <Wallet className="h-3.5 w-3.5" /> {trip.travelStyle} Style
                  </span>
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display text-white tracking-tight leading-tight">
                  {displayTitle}
                </h1>

                <p className="max-w-3xl text-sm sm:text-base text-slate-200 line-clamp-3 leading-relaxed max-w-2xl">
                  {displaySummary}
                </p>

                {/* Location / Route Display */}
                {isMultiCity ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300 pt-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-white font-bold">Route:</span>
                    {destArray.map((dest, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5">
                        <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-bold border border-white/10">
                          {dest}
                        </span>
                        {i < destArray.length - 1 && <span className="text-primary font-bold">→</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pt-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span>{destStr || "Custom Destination"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT BODY ═══════════════ */}
      <section className="flex-1 lg:py-20 py-12">

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 md:space-y-10 space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/trips">
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> My Saved Trips
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/trip-builder">
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Build Another Trip
                </Button>
              </Link>
              <Link href="/packages">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold gap-1.5">
                  Explore Packages <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Overview Grid: Cost Allocation & Travel Tips */}
          <div className="grid gap-6 lg:grid-cols-3 items-start">

            {/* Cost Allocation Breakdown Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:p-6 p-4 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold font-display text-slate-900">Cost Breakdown</h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  {formatCurrency(totalCost as number, trip.currency)}
                </span>
              </div>

              {/* Visual Bar */}
              <div className="space-y-2">
                <div className="h-2.5 w-full rounded-full bg-slate-100 flex overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "35%" }} title="Stay ~35%" />
                  <div className="bg-sky-500 h-full" style={{ width: "25%" }} title="Transit ~25%" />
                  <div className="bg-emerald-500 h-full" style={{ width: "20%" }} title="Activities ~20%" />
                  <div className="bg-amber-500 h-full" style={{ width: "20%" }} title="Dining & Misc ~20%" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold pt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary shrink-0" /> Stay 35%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Transit 25%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Activities 20%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" /> Dining 20%</span>
                </div>
              </div>

              {/* Breakdown Items List */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                {[
                  { label: "Accommodation", value: costBreakdown.accommodation, icon: Hotel, color: "text-primary" },
                  { label: "Transport & Transit", value: costBreakdown.transport, icon: CarFront, color: "text-sky-600" },
                  { label: "Sightseeing & Activities", value: costBreakdown.activities, icon: Mountain, color: "text-emerald-600" },
                  { label: "Dining & Food", value: costBreakdown.food, icon: UtensilsCrossed, color: "text-amber-600" },
                  { label: "Miscellaneous", value: costBreakdown.miscellaneous, icon: Ticket, color: "text-slate-500" },
                ].map(
                  (item) =>
                    item.value > 0 && (
                      <div key={item.label} className="flex items-center justify-between font-medium">
                        <span className="flex items-center gap-2 text-slate-600">
                          <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(Number(item.value), trip.currency)}
                        </span>
                      </div>
                    )
                )}
              </div>
            </div>

            {/* Concierge Travel Tips Card */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl sm:p-6 p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold font-display text-slate-900">AI Concierge Tips</h3>
              </div>

              {aiData?.tips && aiData.tips.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {aiData.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs leading-relaxed text-slate-700">
                      <span className="text-amber-500 font-bold shrink-0">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific concierge tips for this itinerary.</p>
              )}
            </div>

          </div>

          {/* ═══════════════ DAY BY DAY ITINERARY ═══════════════ */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 mb-1.5">Day-by-Day Schedule</h2>
                <p className="text-sm text-slate-500">Comprehensive daily timeline &amp; activity breakdown</p>
              </div>
            </div>

            <div className="space-y-8">
              {trip.itineraries.map((day) => {
                const dayDate = new Date(trip.startDate);
                dayDate.setDate(dayDate.getDate() + day.dayNumber - 1);
                const dateStr = dayDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div key={day.id} className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
                    {/* Elegant Day Header Bar */}
                    <div className="bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex sm:flex-row flex-col sm:items-center items-start gap-3.5">
                        {/* Non-squished Day Badge */}
                        <div className="px-4 py-2.5 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-sm">
                          Day {day.dayNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold font-display text-base sm:text-lg text-slate-900">{day.title}</h3>
                            <span className="px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-bold">
                              {dateStr}
                            </span>
                          </div>
                          {day.description && (
                            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">{day.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-7 space-y-5">
                      {/* Intercity Transport Banner */}
                      {day.transport && (
                        <div className="flex sm:flex-row flex-col sm:items-center items-start gap-3.5 bg-sky-50/80 border border-sky-200/80 rounded-xl p-4 text-xs text-sky-950">
                          <div className="w-9 h-9 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
                            {TRANSPORT_ICONS[day.transport.type] || <CarFront className="h-4.5 w-4.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm text-sky-950">
                              {day.transport.from} <ArrowRight className="h-3.5 w-3.5 inline mx-1.5 text-sky-500" /> {day.transport.to}
                            </span>
                            <p className="text-xs text-sky-700 mt-1.5 font-medium">
                              {day.transport.type} • {day.transport.cost ? formatCurrency(Number(day.transport.cost), trip.currency) : "Included in Package"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Timeline Activities */}
                      <div className="relative">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200/80 hidden sm:block" />

                        <div className="space-y-4 relative">
                          {day.activities.map((activity) => (
                            <div key={activity.id} className="flex gap-4 items-start relative">
                              {/* Icon Circle on Timeline */}
                              <div className={`sm:w-10 sm:h-10 w-8 h-8 rounded-md border flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-2xs ${ACTIVITY_COLORS[activity.type] || "bg-white text-slate-600 border-slate-200"}`}>
                                {ACTIVITY_ICONS[activity.type] || <Clock className="h-4 w-4" />}
                              </div>

                              {/* Activity Details Card */}
                              <div className="flex-1 bg-[#FAFAF9] border border-slate-200/90 rounded-xl p-4 space-y-2 shadow-2xs hover:shadow-xs transition-shadow">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {activity.time && (
                                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                                        {activity.time}
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${ACTIVITY_COLORS[activity.type] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                      {activity.type}
                                    </span>
                                  </div>
                                  {activity.cost && Number(activity.cost) > 0 && (
                                    <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                                      {formatCurrency(Number(activity.cost), trip.currency)}
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-bold text-sm sm:text-base text-slate-900 pt-0.5">{activity.title}</h4>
                                {activity.description && (
                                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{activity.description}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 pt-1.5 text-xs text-slate-500 font-medium border-t border-slate-200/60 mt-2">
                                  {activity.location && (
                                    <span className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {activity.location}
                                    </span>
                                  )}
                                  {activity.duration && (
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {activity.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hotel Accommodation Card */}
                      {day.hotel && (
                        <div className="flex items-center gap-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 mt-2">
                          <div className="w-9 h-9 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                            <Hotel className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm text-amber-950 block">{day.hotel.name}</span>
                            <p className="text-xs text-amber-800 mt-1.5 font-medium">
                              {day.hotel.address} {day.hotel.rating && `• ⭐ ${day.hotel.rating}`} {day.hotel.pricePerNight && `• ${formatCurrency(Number(day.hotel.pricePerNight), trip.currency)}/night`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl md:p-8 sm:p-6 p-4 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900">Want to customize or create another trip?</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Our Gemini 2.0 AI Concierge can craft unlimited custom travel plans matching your exact budget and style.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/trip-builder">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
                  <Sparkles className="h-4 w-4" /> Build Another AI Trip
                </Button>
              </Link>
              <Link href="/packages">
                <Button variant="outline" size="lg" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold gap-2">
                  Browse Verified Packages <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

        </div>

      </section>

      <SiteFooter />
    </div>
  );
}
