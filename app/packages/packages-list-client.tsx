"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  Search,
  MapPin,
  Star,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  ArrowRight,
  Clock,
  ChevronDown,
} from "lucide-react";

interface Package {
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

interface PackagesListClientProps {
  initialPackages: Package[];
  userSession: any;
}

export default function PackagesListClient({ initialPackages, userSession }: PackagesListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [difficulty, setDifficulty] = useState<"ALL" | "EASY" | "MODERATE" | "CHALLENGING">("ALL");
  const [duration, setDuration] = useState<"ALL" | "SHORT" | "MEDIUM" | "LONG">("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }
    router.push(`/packages?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setDifficulty("ALL");
    setDuration("ALL");
    setMaxPrice(50000);
    router.push("/packages");
  };

  // Compute range slider fill percentage
  const rangeProgress = ((maxPrice - 5000) / (50000 - 5000)) * 100;

  // Fallback images for packages without images
  const FALLBACK_IMAGES = [
    "/images/packages/kashmir-valley.jpg",
    "/images/packages/golden-triangle.jpg",
    "/images/packages/kerala-backwaters.jpg",
    "/images/packages/goa-beach.jpg",
    "/images/packages/rajasthan-heritage.jpg",
    "/images/packages/northeast-explorer.jpg",
    "/images/packages/varanasi-ganges.jpg",
    "/images/packages/himalayan-adventure.jpg",
    "/images/packages/default-package.jpg",
  ];
  const getFallbackImage = (idx: number) => FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];

  const hasActiveFilters = searchQuery || difficulty !== "ALL" || duration !== "ALL" || maxPrice < 50000;

  const filteredPackages = initialPackages.filter((pkg) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      pkg.title.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query) ||
      pkg.destinations.some((d) => d.toLowerCase().includes(query));

    const matchesDifficulty =
      difficulty === "ALL" || pkg.difficulty.toUpperCase() === difficulty;

    let matchesDuration = true;
    if (duration === "SHORT") {
      matchesDuration = pkg.duration <= 5;
    } else if (duration === "MEDIUM") {
      matchesDuration = pkg.duration >= 6 && pkg.duration <= 8;
    } else if (duration === "LONG") {
      matchesDuration = pkg.duration >= 9;
    }

    const matchesPrice = pkg.basePrice <= maxPrice;

    return matchesSearch && matchesDifficulty && matchesDuration && matchesPrice;
  });

  const difficultyColor = (d: string) => {
    switch (d.toUpperCase()) {
      case "EASY": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "MODERATE": return "bg-amber-50 text-amber-700 border-amber-200";
      case "CHALLENGING": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9] text-slate-900 font-sans">

      {/* ═══════════════ FLOATING PILL NAVBAR ═══════════════ */}
      <SiteHeader userSession={userSession} activeRoute="/packages" />


      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative md:pt-32 sm:pt-28 pt-24 pb-12 overflow-hidden bg-gradient-to-b from-[#F5F0ED] via-[#FAF8F6] to-[#FAFAF9]">
        {/* Ambient glow */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-[0.04]" />

        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold uppercase tracking-widest text-primary md:mb-7 mb-5">
            <MapPin className="h-3.5 w-3.5" />
            <span>Curated Travel Packages</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-slate-900 font-display mb-4">
            Discover your next{" "}
            <span className="bg-gradient-to-r from-primary via-[#E8AA9B] to-secondary bg-clip-text text-transparent">
              adventure.
            </span>
          </h1>

          {/* Sub */}
          <p className="md:text-base text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto md:mb-6 mb-5">
            Hand-crafted packages from verified travel agencies across India. Filter by destination, budget, or difficulty to find your perfect trip.
          </p>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mx-auto flex items-center bg-white border border-slate-200 rounded-xl shadow-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <Search className="absolute left-3.5 sm:left-4 h-4 sm:h-5 w-4 sm:w-5 text-slate-400 pointer-events-none shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination, package..."
              className="flex-1 ps-9 sm:ps-12 pe-28 sm:h-14 h-12 text-xs sm:text-sm rounded-2xl bg-transparent border-0 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              className="absolute right-1.5 sm:right-2"
            >
              <span>Search</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Quick destination pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-5">
            <span className="text-[11px] font-semibold text-slate-400">Popular:</span>
            {["Manali", "Kerala", "Goa", "Rajasthan", "Ladakh", "Northeast"].map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => setSearchQuery(dest)}
                className="px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-[11px] font-medium text-slate-600 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════ CONTENT ═══════════════ */}
      <section className="flex-1 lg:py-16 py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ── Controls Bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-extrabold font-display text-slate-900">
                {filteredPackages.length} package{filteredPackages.length !== 1 ? "s" : ""} found
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Browse our curated selection of verified travel experiences
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-slate-500 hover:text-slate-900 h-9 gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset All
                </Button>
              )}
              {/* Mobile filter toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`lg:hidden text-xs h-9 gap-1.5 rounded-full cursor-pointer ${showFilters ? "border-primary text-primary bg-primary/5" : "border-slate-200"}`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">

            {/* ═══ FILTER SIDEBAR ═══ */}
            <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:sticky lg:top-28`}>
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">

                {/* Sidebar Header */}
                <div className="sm:px-5 sm:py-4 p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Filter className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">Filters</span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="sm:p-5 p-4 space-y-6">

                  {/* ── Price Range ── */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Budget Range
                    </label>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm font-semibold text-slate-800">
                        <span>₹5,000</span>
                        <span className="text-primary font-bold">₹{maxPrice.toLocaleString("en-IN")}</span>
                      </div>
                      <input
                        type="range"
                        min={5000}
                        max={50000}
                        step={1000}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="range-filled"
                        style={{ "--range-progress": `${rangeProgress}%` } as React.CSSProperties}
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Budget</span>
                        <span>Premium</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Difficulty ── */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Difficulty Level
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: "ALL", label: "All Levels", desc: "Show everything", icon: "◎" },
                        { key: "EASY", label: "Easy", desc: "Family friendly", icon: "🟢" },
                        { key: "MODERATE", label: "Moderate", desc: "Some fitness needed", icon: "🟡" },
                        { key: "CHALLENGING", label: "Challenging", desc: "Adventure seekers", icon: "🔴" },
                      ].map((diff) => (
                        <button
                          key={diff.key}
                          onClick={() => setDifficulty(diff.key as any)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                            difficulty === diff.key
                              ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                              : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-sm">{diff.icon}</span>
                          <div className="flex-1 flex flex-col gap-0.5">
                            <span className={`text-sm font-semibold block ${difficulty === diff.key ? "text-primary" : "text-slate-800"}`}>
                              {diff.label}
                            </span>
                            <span className="text-xs text-slate-500">{diff.desc}</span>
                          </div>
                          {difficulty === diff.key && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Duration ── */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Trip Duration
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "ALL", label: "Any", sub: "All durations" },
                        { key: "SHORT", label: "Short", sub: "1–5 days" },
                        { key: "MEDIUM", label: "Medium", sub: "6–8 days" },
                        { key: "LONG", label: "Long", sub: "9+ days" },
                      ].map((dur) => (
                        <button
                          key={dur.key}
                          onClick={() => setDuration(dur.key as any)}
                          className={`text-center px-3 py-3 rounded-xl border transition-all cursor-pointer ${
                            duration === dur.key
                              ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                              : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className={`text-sm font-bold block ${duration === dur.key ? "text-primary" : "text-slate-800"}`}>
                            {dur.label}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{dur.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </aside>

            {/* ═══ PACKAGE GRID ═══ */}
            <div>
              {filteredPackages.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredPackages.map((pkg) => (
                    <Link key={pkg.id} href={`/packages/${pkg.id}`} className="group">
                      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

                        {/* Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={pkg.image || getFallbackImage(filteredPackages.indexOf(pkg))}
                            alt={pkg.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackImage(filteredPackages.indexOf(pkg));
                            }}
                          />
                          {false && (
                            <div className="w-full h-full bg-gradient-to-br from-secondary/20 via-primary/10 to-secondary/30 flex items-center justify-center">
                              <MapPin className="h-10 w-10 text-secondary/40" />
                            </div>
                          )}
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                          {/* Floating badges on image */}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide backdrop-blur-sm ${difficultyColor(pkg.difficulty)}`}>
                              {pkg.difficulty}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <FavoriteButton
                              packageId={pkg.id}
                              initialFavorited={pkg.isFavorited}
                              className="z-10"
                            />
                          </div>

                          {/* Duration badge bottom-left */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{pkg.duration} Days</span>
                          </div>

                          {/* Rating bottom-right */}
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-slate-900">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span>{pkg.rating}</span>
                            <span className="text-slate-400 font-normal text-[10px]">({pkg.reviews})</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="sm:p-5 p-4 space-y-3">
                          <div>
                            <h3 className="capitalize font-bold text-base text-slate-900 group-hover:text-primary transition-colors line-clamp-1 font-display">
                              {pkg.title}
                            </h3>
                            <p className="text-[13px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                              {pkg.description}
                            </p>
                          </div>

                          {/* Destinations */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="line-clamp-1">{pkg.destinations.join(" → ")}</span>
                          </div>

                          {/* Price row */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div>
                              <span className="text-xl font-extrabold text-slate-900 font-display">
                                ₹{pkg.basePrice.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1">/person</span>
                            </div>
                            <span className="text-[11px] font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              View Details <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>

                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* ── Empty state ── */
                <div className="py-20 text-center space-y-4 bg-white border border-slate-200/80 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-900 font-display">No packages found</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We couldn&apos;t find any packages matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  <Button onClick={resetFilters} variant="outline" size="sm" className="mt-2 text-xs rounded-full cursor-pointer gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>


      {/* ═══════════════ FOOTER ═══════════════ */}
      <SiteFooter />
    </div>
  );
}
