import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Star, Filter } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { FavoriteButton } from "@/components/favorite-button";
import PackagesListClient from "./packages-list-client";

import { prisma } from "@/lib/db";

// Demo data for the public package browsing page
const DEMO_PACKAGES = [
  {
    id: "1",
    title: "Golden Triangle Tour",
    description: "Explore Delhi, Agra, and Jaipur — India's most iconic destinations.",
    destinations: ["Delhi", "Agra", "Jaipur"],
    duration: 7,
    basePrice: 24999,
    currency: "INR",
    rating: 4.8,
    reviews: 124,
    difficulty: "EASY",
    image: null,
  },
  {
    id: "2",
    title: "Kerala Backwaters Bliss",
    description: "Cruise through serene backwaters, explore tea gardens, and relax on pristine beaches.",
    destinations: ["Kochi", "Munnar", "Alleppey"],
    duration: 5,
    basePrice: 18999,
    currency: "INR",
    rating: 4.9,
    reviews: 89,
    difficulty: "EASY",
    image: null,
  },
  {
    id: "3",
    title: "Himalayan Adventure",
    description: "Trek through breathtaking mountain trails and experience Himalayan culture.",
    destinations: ["Manali", "Leh", "Nubra Valley"],
    duration: 10,
    basePrice: 35999,
    currency: "INR",
    rating: 4.7,
    reviews: 67,
    difficulty: "CHALLENGING",
    image: null,
  },
  {
    id: "4",
    title: "Goa Beach Paradise",
    description: "Sun, sand, and seafood — the ultimate Goa beach vacation experience.",
    destinations: ["North Goa", "South Goa"],
    duration: 4,
    basePrice: 12999,
    currency: "INR",
    rating: 4.6,
    reviews: 210,
    difficulty: "EASY",
    image: null,
  },
  {
    id: "5",
    title: "Rajasthan Royal Heritage",
    description: "Step back in time to explore majestic forts, palaces, and desert landscapes.",
    destinations: ["Udaipur", "Jodhpur", "Jaisalmer"],
    duration: 8,
    basePrice: 29999,
    currency: "INR",
    rating: 4.8,
    reviews: 93,
    difficulty: "MODERATE",
    image: null,
  },
  {
    id: "6",
    title: "Northeast Explorer",
    description: "Discover the untouched beauty of India's northeast — lush valleys and tribal culture.",
    destinations: ["Shillong", "Cherrapunji", "Kaziranga"],
    duration: 6,
    basePrice: 22999,
    currency: "INR",
    rating: 4.9,
    reviews: 42,
    difficulty: "MODERATE",
    image: null,
  },
];

export default async function PackagesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const favoritedIds = session
    ? (
        await prisma.favorite.findMany({
          where: { userId: session.user.id },
          select: { packageId: true },
        })
      ).map((f) => f.packageId)
    : [];

  const dbPackages = await prisma.package.findMany({
    where: { status: "PUBLISHED" },
    include: {
      agency: true,
      reviews: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const dbMappedPackages = dbPackages.map((pkg) => {
    const destinationsArray = Array.isArray(pkg.destinations)
      ? (pkg.destinations as any[]).map((d) => d.name || d)
      : [];
    
    const avgRating = pkg.reviews.length > 0
      ? pkg.reviews.reduce((sum, r) => sum + r.rating, 0) / pkg.reviews.length
      : 4.8;
    
    return {
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      destinations: destinationsArray,
      duration: pkg.duration,
      basePrice: Number(pkg.basePrice),
      currency: pkg.currency,
      rating: parseFloat(avgRating.toFixed(1)),
      reviews: pkg.reviews.length > 0 ? pkg.reviews.length : 12,
      difficulty: pkg.difficulty || "EASY",
      image: pkg.images[0] || null,
    };
  });

  const rawPackages = dbMappedPackages.length > 0 ? [...dbMappedPackages, ...DEMO_PACKAGES] : DEMO_PACKAGES;
  const allPackages = rawPackages.map((pkg) => ({
    ...pkg,
    isFavorited: favoritedIds.includes(pkg.id),
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--waypoint-teal)] to-[var(--waypoint-navy)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Waypoint</span>
          </Link>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <Link href="/dashboard">
                <Button className="bg-[var(--waypoint-teal)] hover:bg-[var(--waypoint-teal)]/90 text-white rounded-full px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-[var(--waypoint-navy)] text-white hover:bg-[var(--waypoint-teal)] rounded-full px-6">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <PackagesListClient initialPackages={allPackages} />
    </div>
  );
}

