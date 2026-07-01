"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Filter, SlidersHorizontal, RefreshCw } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";

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
}

export default function PackagesListClient({ initialPackages }: PackagesListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [difficulty, setDifficulty] = useState<"ALL" | "EASY" | "MODERATE" | "CHALLENGING">("ALL");
  const [duration, setDuration] = useState<"ALL" | "SHORT" | "MEDIUM" | "LONG">("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [showFilters, setShowFilters] = useState(true);

  // Sync searchQuery state when search param in URL changes
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

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setDifficulty("ALL");
    setDuration("ALL");
    setMaxPrice(50000);
  };

  // Perform dynamic client-side filtering
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

  return (
    <div className="min-h-screen bg-zinc-50/30 dark:bg-zinc-950/20">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-[var(--waypoint-navy)] to-zinc-900 py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Explore Travel Packages
          </h1>
          <p className="text-zinc-300 text-md md:text-lg mb-8">
            Hand-crafted packages from verified travel agencies across India.
          </p>
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by destination, package name..."
              className="pl-12 pr-28 h-14 text-md rounded-full bg-white/10 border-white/20 text-white placeholder:text-zinc-400 backdrop-blur-xl focus-visible:ring-[var(--waypoint-teal)]"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full bg-[var(--waypoint-teal)] hover:bg-[var(--waypoint-teal)]/90 text-white px-5 text-sm cursor-pointer"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {filteredPackages.length} package{filteredPackages.length !== 1 ? "s" : ""} available
            </h2>
            <p className="text-xs text-muted-foreground">
              Showing filtered results from our curated catalog
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(searchQuery || difficulty !== "ALL" || duration !== "ALL" || maxPrice < 50000) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground h-9 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`text-xs h-9 gap-1.5 ${showFilters ? "border-[var(--waypoint-teal)] text-[var(--waypoint-teal)] bg-teal-500/5" : ""}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4 items-start">
          {/* Filters Sidebar / Dropdown Panel */}
          <div
            className={`space-y-6 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 lg:sticky lg:top-24 ${
              showFilters ? "block lg:col-span-1" : "hidden"
            }`}
          >
            <div>
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-[var(--waypoint-teal)]" /> Filter Options
              </h3>
              <div className="space-y-6">
                {/* Price Filter */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Max Base Price</span>
                    <span className="text-[var(--waypoint-teal)] font-semibold">
                      ₹{maxPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={50000}
                    step={1000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--waypoint-teal)]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>₹5,000</span>
                    <span>₹50,000+</span>
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold block">Difficulty</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["ALL", "EASY", "MODERATE", "CHALLENGING"].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff as any)}
                        className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                          difficulty === diff
                            ? "bg-[var(--waypoint-teal)] text-white border-[var(--waypoint-teal)]"
                            : "bg-zinc-50 dark:bg-zinc-900 text-muted-foreground border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold block">Tour Duration</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: "ALL", label: "Any Days" },
                      { key: "SHORT", label: "Short (1-5 Days)" },
                      { key: "MEDIUM", label: "Medium (6-8 Days)" },
                      { key: "LONG", label: "Long (9+ Days)" },
                    ].map((dur) => (
                      <button
                        key={dur.key}
                        onClick={() => setDuration(dur.key as any)}
                        className={`text-[10px] p-2 rounded-lg border text-center transition-all ${
                          duration === dur.key
                            ? "bg-[var(--waypoint-navy)] text-white border-[var(--waypoint-navy)]"
                            : "bg-zinc-50 dark:bg-zinc-900 text-muted-foreground border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100"
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Grid (Main area) */}
          <div className={`${showFilters ? "lg:col-span-3" : "lg:col-span-4"} grid gap-6 md:grid-cols-2 xl:grid-cols-3`}>
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => (
                <Link key={pkg.id} href={`/packages/${pkg.id}`}>
                  <Card className="glass-card group overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-[var(--waypoint-teal)]/5 transition-all duration-350 hover:-translate-y-1">
                    {/* Visual Card Banner */}
                    <div className="h-44 bg-gradient-to-br from-[var(--waypoint-teal)]/20 to-[var(--waypoint-navy)]/30 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <MapPin className="h-8 w-8 text-[var(--waypoint-teal)] group-hover:scale-110 transition-transform duration-350" />
                      <FavoriteButton
                        packageId={pkg.id}
                        initialFavorited={pkg.isFavorited}
                        className="absolute top-3 right-3 z-10"
                      />
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] py-0 px-2 uppercase font-medium tracking-wider">
                          {pkg.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                          {pkg.duration} Days
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-bold text-md text-zinc-900 dark:text-zinc-50 group-hover:text-[var(--waypoint-teal)] transition-colors line-clamp-1">
                          {pkg.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-[var(--waypoint-teal)] shrink-0" />
                        <span className="line-clamp-1">{pkg.destinations.join(" → ")}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-900">
                        <div>
                          <span className="text-lg font-bold text-foreground">₹{pkg.basePrice.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-muted-foreground">/person</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Star className="h-3.5 w-3.5 fill-[var(--waypoint-amber)] text-[var(--waypoint-amber)]" />
                          <span>{pkg.rating}</span>
                          <span className="text-muted-foreground font-normal">({pkg.reviews})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 text-center space-y-3 bg-white dark:bg-zinc-900/20 border rounded-2xl">
                <SlidersHorizontal className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
                <h3 className="font-semibold text-lg">No Packages Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  We couldn't find any packages matching your query or filter criteria. Try resetting your settings.
                </p>
                <Button onClick={resetFilters} variant="outline" size="sm" className="mt-2 text-xs">
                  Reset Filter Selection
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
