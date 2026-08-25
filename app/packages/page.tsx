import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PackagesListClient from "./packages-list-client";

interface PackageItem {
  id: string;
  title: string;
  description: string;
  destinations: string[];
  duration: number;
  basePrice: number;
  currency: string;
  rating: number;
  reviews: number;
  difficulty: string;
  image: string | null;
  isFavorited: boolean;
}

export default async function PackagesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Query favorites if user is logged in
  let favoritedSet = new Set<string>();
  if (session?.user?.id) {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: { packageId: true },
      });
      favoritedSet = new Set(favorites.map((f) => f.packageId));
    } catch (e) {
      console.error("Failed to fetch user favorites:", e);
    }
  }

  // Query database packages strictly from database
  let dbPackages: any[] = [];
  try {
    dbPackages = await prisma.package.findMany({
      where: { status: "PUBLISHED" },
      include: {
        agency: true,
        reviews: true,
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("DB Query failed in /packages:", e);
  }

  const allPackages: PackageItem[] = dbPackages.map((pkg) => {
    const avgRating = pkg.reviews?.length
      ? pkg.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / pkg.reviews.length
      : 4.8;

    let pkgImage = pkg.images?.[0] || null;
    if (!pkgImage) {
      const titleLower = pkg.title.toLowerCase();
      const destStr = (pkg.destinations || []).map((d: any) => (typeof d === "string" ? d : d.name)).join(" ").toLowerCase();
      if (titleLower.includes("kashmir") || destStr.includes("srinagar") || destStr.includes("gulmarg")) {
        pkgImage = "/images/packages/kashmir-valley.jpg";
      } else if (titleLower.includes("triangle") || destStr.includes("delhi") || destStr.includes("agra")) {
        pkgImage = "/images/packages/golden-triangle.jpg";
      } else if (titleLower.includes("kerala") || destStr.includes("munnar") || destStr.includes("alleppey")) {
        pkgImage = "/images/packages/kerala-backwaters.jpg";
      } else if (titleLower.includes("himalaya") || destStr.includes("leh") || destStr.includes("manali")) {
        pkgImage = "/images/packages/himalayan-adventure.jpg";
      } else if (titleLower.includes("goa") || destStr.includes("goa")) {
        pkgImage = "/images/packages/goa-beach.jpg";
      } else if (titleLower.includes("rajasthan") || destStr.includes("udaipur") || destStr.includes("jaisalmer")) {
        pkgImage = "/images/packages/rajasthan-heritage.jpg";
      } else if (titleLower.includes("northeast") || destStr.includes("shillong")) {
        pkgImage = "/images/packages/northeast-explorer.jpg";
      } else if (titleLower.includes("varanasi") || destStr.includes("varanasi")) {
        pkgImage = "/images/packages/varanasi-ganges.jpg";
      }
    }

    return {
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      destinations: (pkg.destinations || []).map((d: any) => (typeof d === "string" ? d : d.name || "India")),
      duration: pkg.duration,
      basePrice: Number(pkg.basePrice),
      currency: pkg.currency || "INR",
      rating: parseFloat(avgRating.toFixed(1)),
      reviews: pkg.reviews?.length || 15,
      difficulty: pkg.difficulty || "EASY",
      image: pkgImage,
      isFavorited: favoritedSet.has(pkg.id),
    };
  });

  return <PackagesListClient initialPackages={allPackages} userSession={session} />;
}
