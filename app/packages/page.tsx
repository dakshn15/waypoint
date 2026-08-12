import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PackagesListClient from "./packages-list-client";

// Demo data for the public package browsing page
const DEMO_PACKAGES = [
  {
    id: "1",
    title: "Golden Triangle Tour",
    description: "Explore Delhi, Agra, and Jaipur — India's most iconic destinations with guided heritage walks and Mughal architecture.",
    destinations: ["Delhi", "Agra", "Jaipur"],
    duration: 7,
    basePrice: 24999,
    currency: "INR",
    rating: 4.8,
    reviews: 124,
    difficulty: "EASY",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Kerala Backwaters Bliss",
    description: "Cruise through serene backwaters, explore tea gardens in Munnar, and relax on pristine beaches of Kerala.",
    destinations: ["Kochi", "Munnar", "Alleppey"],
    duration: 5,
    basePrice: 18999,
    currency: "INR",
    rating: 4.9,
    reviews: 89,
    difficulty: "EASY",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Himalayan Adventure",
    description: "Trek through breathtaking mountain trails, cross high-altitude passes, and experience authentic Himalayan culture.",
    destinations: ["Manali", "Leh", "Nubra Valley"],
    duration: 10,
    basePrice: 35999,
    currency: "INR",
    rating: 4.7,
    reviews: 67,
    difficulty: "CHALLENGING",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Goa Beach Paradise",
    description: "Sun, sand, and seafood — the ultimate Goa beach vacation with water sports, nightlife, and Old Goa heritage.",
    destinations: ["North Goa", "South Goa"],
    duration: 4,
    basePrice: 12999,
    currency: "INR",
    rating: 4.6,
    reviews: 210,
    difficulty: "EASY",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Rajasthan Royal Heritage",
    description: "Step back in time to explore majestic forts, lake palaces, and golden desert landscapes of Rajasthan.",
    destinations: ["Udaipur", "Jodhpur", "Jaisalmer"],
    duration: 8,
    basePrice: 29999,
    currency: "INR",
    rating: 4.8,
    reviews: 93,
    difficulty: "MODERATE",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "Northeast Explorer",
    description: "Discover the untouched beauty of India's northeast — lush valleys, living root bridges, and tribal culture.",
    destinations: ["Shillong", "Cherrapunji", "Kaziranga"],
    duration: 6,
    basePrice: 22999,
    currency: "INR",
    rating: 4.9,
    reviews: 42,
    difficulty: "MODERATE",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=800&auto=format&fit=crop",
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

  return <PackagesListClient initialPackages={allPackages} userSession={session} />;
}
