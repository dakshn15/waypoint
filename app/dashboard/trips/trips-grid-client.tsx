"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Sparkles, Users, ArrowRight, Clock, Route, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteTrip } from "@/app/actions/trips";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planning", className: "bg-amber-500/90 text-white border-amber-400/30" },
  GENERATED: { label: "AI Generated", className: "bg-emerald-500/90 text-white border-emerald-400/30" },
  SAVED: { label: "Saved", className: "bg-violet-500/90 text-white border-violet-400/30" },
  BOOKED: { label: "Booked", className: "bg-sky-500/90 text-white border-sky-400/30" },
  COMPLETED: { label: "Completed", className: "bg-slate-700/90 text-white border-slate-600/30" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-500/90 text-white border-rose-400/30" },
};

const AI_TRIP_DEFAULT_IMAGE = "/images/packages/default-package.jpg";

interface SerializedTrip {
  id: string;
  title: string;
  status: string;
  destinations: any[];
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  aiResponse: any;
}

export default function TripsGridClient({ trips }: { trips: SerializedTrip[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, tripId: string, tripTitle: string) => {
    e.preventDefault(); // Prevent navigation from the Link wrapper
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${tripTitle}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(tripId);
    try {
      const result = await deleteTrip(tripId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Trip deleted successfully.");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete trip.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => {
        const rawDest = (trip.destinations as any[]) || [];
        const destArray = rawDest.map((d) => (typeof d === "string" ? d : d.name || d));
        const isMultiCity = destArray.length > 1;
        const destStr = destArray.join(" → ");
        const days = Math.max(
          1,
          Math.ceil(
            (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
          ) + 1
        );
        const aiData = trip.aiResponse as any;
        const summary = aiData?.summary || `Custom ${days}-day trip to ${destArray.slice(0, 2).join(", ")}${destArray.length > 2 ? " & more" : ""}.`;
        const statusConfig = STATUS_BADGES[trip.status] || { label: trip.status, className: "bg-slate-700/90 text-white" };
        const canDelete = trip.status !== "BOOKED";
        const isDeleting = deletingId === trip.id;

        return (
          <Link key={trip.id} href={`/trip-builder/${trip.id}`} className="group">
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">

              {/* Top Image Section */}
              <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={AI_TRIP_DEFAULT_IMAGE}
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
                    <span className="text-lg font-bold text-slate-900 font-display">
                      {formatCurrency(Number(trip.budget), trip.currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete Button */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDelete(e, trip.id, trip.title)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Delete trip"
                      >
                        <Trash2 className={`h-4 w-4 ${isDeleting ? "animate-pulse" : ""}`} />
                      </button>
                    )}

                    <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Itinerary</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </Link>
        );
      })}
    </div>
  );
}
