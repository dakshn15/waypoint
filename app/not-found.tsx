"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  Search,
  Home,
  Sparkles,
  LifeBuoy,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/packages?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/packages");
    }
  };

  const handleQuickSearch = (destination: string) => {
    router.push(`/packages?search=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#FAFAF9] text-slate-900 font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-primary/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary/[0.05] rounded-full blur-3xl pointer-events-none" />

      {/* Subtle dotted expedition grid with soft radial mask */}
      <div
        className="absolute inset-0 opacity-35 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #94A3B8 0.8px, transparent 0.8px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse at center, black 45%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 45%, transparent 80%)",
        }}
      />

      {/* Centered Content Container (No enclosing card frame) */}
      <div className="w-full max-w-2xl mx-auto text-center relative z-10 space-y-6">
        {/* Telemetry Status Badge */}
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-bold tracking-wider uppercase shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Coordinates Not Found • Error 404
          </div>
        </div>

        {/* 404 Visual Navigational Instrument */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 select-none mb-5">
          <span className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-slate-900 font-heading">
            4
          </span>

          {/* Compass Radar Instrument */}
          <div className="relative group cursor-pointer flex items-center justify-center">
            {/* Subtle radar beacon pulse */}
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping opacity-30 pointer-events-none" />

            {/* Instrument Bezel with Cardinal Points */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border border-primary/25 bg-gradient-to-b from-primary/10 to-primary/5 p-1.5 flex items-center justify-center relative shadow-inner">
              <span className="absolute top-1 text-[8px] font-mono font-bold text-primary/70 select-none">
                N
              </span>
              <span className="absolute bottom-1 text-[8px] font-mono font-bold text-primary/70 select-none">
                S
              </span>
              <span className="absolute left-1.5 text-[8px] font-mono font-bold text-primary/70 select-none">
                W
              </span>
              <span className="absolute right-1.5 text-[8px] font-mono font-bold text-primary/70 select-none">
                E
              </span>

              {/* Inner Rotating Compass Core */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-white border border-primary/20 shadow-md shadow-primary/15 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                <Compass className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </div>

          <span className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-slate-900 font-heading">
            4
          </span>
        </div>

        {/* Heading & Context Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            You&apos;ve Wandered Off The Map
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            The page or travel route you are looking for doesn&apos;t exist, has
            been moved, or is temporarily unavailable. Let&apos;s get you back on
            course.
          </p>
        </div>

        {/* Destination Search Recovery Bar */}
        <div className="max-w-md mx-auto w-full pt-1">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden"
          >
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations (e.g., Bali, Manali, Goa)..."
              className="pl-10 pr-24 border-0 focus-visible:ring-0 focus-visible:border-0 rounded-none bg-transparent text-slate-900 placeholder:text-slate-400"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 font-bold text-xs bg-primary hover:bg-primary/90 text-white h-8 px-3 rounded-md cursor-pointer shadow-xs transition-all"
            >
              Search
            </Button>
          </form>

          {/* Popular Destination Quick-Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 text-xs text-slate-500">
            <span className="text-[11px] font-semibold text-slate-400">
              Popular:
            </span>
            {["Bali", "Manali", "Kerala", "Goa", "Dubai"].map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => handleQuickSearch(dest)}
                className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-600 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer shadow-2xs"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button
              size="lg"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
          <Link href="/packages">
            <Button
              size="lg"
              variant="outline"
            >
              <Compass className="h-4 w-4" />
              Browse Packages
            </Button>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Secondary Navigation / Quick Help Links */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-slate-500">
          <Link
            href="/trip-builder"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-semibold group"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            AI Trip Builder
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
            My Bookings
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors group"
          >
            <LifeBuoy className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
            Support Center
          </Link>
        </div>
      </div>
    </div>
  );
}
