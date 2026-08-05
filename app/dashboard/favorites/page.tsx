import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Clock, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground mt-1">
          Your saved travel packages and destinations.
        </p>
      </div>

      {favorites.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites saved</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Browse packages and save the ones you love.
            </p>
            <Link href="/packages">
              <Button className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white">
                Browse Packages
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const pkg = fav.package;
            const destinations = Array.isArray(pkg.destinations)
              ? (pkg.destinations as any[]).map((d) => d.name || d)
              : [];
            const avgRating =
              pkg.reviews.length > 0
                ? pkg.reviews.reduce((sum, r) => sum + r.rating, 0) /
                  pkg.reviews.length
                : 4.5;

            return (
              <Link key={fav.id} href={`/packages/${pkg.id}`}>
                <Card className="glass-card group cursor-pointer hover:shadow-2xl hover:shadow-[var(--waypoint-teal)]/10 transition-all hover:-translate-y-1 h-full">
                  <div className="h-40 bg-gradient-to-br from-[var(--waypoint-teal)]/20 to-[var(--waypoint-navy)]/30 flex items-center justify-center relative">
                    <MapPin className="h-8 w-8 text-[var(--waypoint-teal)] group-hover:scale-110 transition-transform" />
                    <div className="absolute top-3 right-3">
                      <Heart className="h-5 w-5 fill-[#E46F44] text-[#E46F44]" />
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {pkg.difficulty || "EASY"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {pkg.duration} days
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-[var(--waypoint-teal)] transition-colors">
                      {pkg.title}
                    </h3>
                    {destinations.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {destinations.join(" → ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {formatCurrency(Number(pkg.basePrice), pkg.currency)}
                      </span>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-[var(--waypoint-amber)] text-[var(--waypoint-amber)]" />
                        <span className="font-medium">
                          {avgRating.toFixed(1)}
                        </span>
                      </div>
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
