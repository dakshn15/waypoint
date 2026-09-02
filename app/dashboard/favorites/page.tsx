import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Clock, Star, Package, ArrowRight } from "lucide-react";
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
  "/images/packages/kashmir-valley.jpg",
  "/images/packages/golden-triangle.jpg",
  "/images/packages/kerala-backwaters.jpg",
  "/images/packages/himalayan-adventure.jpg",
  "/images/packages/goa-beach.jpg",
  "/images/packages/rajasthan-heritage.jpg",
];

function getPackageImage(pkg: any, index: number): string {
  if (Array.isArray(pkg.images) && pkg.images.length > 0 && pkg.images[0]) {
    return pkg.images[0];
  }
  const dests = Array.isArray(pkg.destinations)
    ? pkg.destinations.map((d: any) => (typeof d === "string" ? d : d.name || "").toLowerCase())
    : [];
  for (const name of dests) {
    for (const [key, img] of Object.entries(DESTINATION_IMAGES)) {
      if (name.includes(key)) return img;
    }
  }
  const title = (pkg.title || "").toLowerCase();
  for (const [key, img] of Object.entries(DESTINATION_IMAGES)) {
    if (title.includes(key)) return img;
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-emerald-500/90 text-white border-emerald-400/30",
  MODERATE: "bg-amber-500/90 text-white border-amber-400/30",
  CHALLENGING: "bg-rose-500/90 text-white border-rose-400/30",
};

export default async function FavoritesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Please log in to view your favorites.
      </div>
    );
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      package: {
        include: {
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">Favorites</h1>
        <p className="text-sm text-slate-500 font-medium">
          Your saved travel packages and destinations.
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-display">No favorites saved</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-5">
              Browse packages and save the ones you love.
            </p>
            <Link href="/packages">
              <Button className="bg-gradient-to-r from-secondary to-slate-600 hover:from-secondary/90 hover:to-slate-600/90 text-white rounded-xl shadow-md shadow-secondary/20 gap-2">
                <Package className="h-4 w-4" />
                Browse Packages
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav, idx) => {
            const pkg = fav.package;
            const destinations = Array.isArray(pkg.destinations)
              ? (pkg.destinations as any[]).map((d) => d.name || d)
              : [];
            const avgRating =
              pkg.reviews.length > 0
                ? pkg.reviews.reduce((sum, r) => sum + r.rating, 0) /
                pkg.reviews.length
                : 4.8;
            const reviewCount = pkg.reviews.length || 12;
            const imageSrc = getPackageImage(pkg, idx);
            const difficultyBadge = DIFFICULTY_COLORS[pkg.difficulty || "EASY"] || "bg-slate-700/90 text-white";

            return (
              <Link key={fav.id} href={`/packages/${pkg.id}`} className="group">
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">

                  {/* Top Image Section */}
                  <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={imageSrc}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Top Left: Difficulty Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm uppercase tracking-wide ${difficultyBadge}`}>
                        {pkg.difficulty || "EASY"}
                      </span>
                    </div>

                    {/* Top Right: Favorite Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md">
                        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                      </div>
                    </div>

                    {/* Bottom Left: Duration */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold">
                      <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {pkg.duration} Days
                      </span>
                    </div>

                    {/* Bottom Right: Rating */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span>{avgRating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal text-[10px]">({reviewCount})</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="sm:p-5 p-4 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1 font-display capitalize">
                        {pkg.title}
                      </h3>

                      {/* Description */}
                      {pkg.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}

                      {/* Destinations Route */}
                      {destinations.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="line-clamp-1">{destinations.join(" → ")}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Row */}
                    <div className="flex flex-wrap gap-2 items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium mb-0.5">Package Price</span>
                        <span className="text-lg font-bold text-slate-900 font-display">
                          {formatCurrency(Number(pkg.basePrice), pkg.currency)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">/person</span>
                      </div>

                      <div className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>View Details</span>
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
