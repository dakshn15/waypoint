import Link from "next/link";
import { Compass, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] font-sans">
      {/* Nav */}
      <header className="py-6 px-4 border-b border-slate-200/60 bg-white">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 text-[15px]">
              Way<span className="text-primary">point</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="font-semibold text-slate-600">
              Return Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Decorative graphic */}
          <div className="relative mb-8 inline-block">
            <span className="text-[120px] md:text-[150px] font-extrabold text-slate-200/80 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg shadow-primary/10">
                <Compass className="h-8 w-8 animate-spin-slow" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-secondary mb-3">
            Lost your waypoint?
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on the right path.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/">
              <Button size="lg" className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                Back to Home
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/packages">
              <Button size="lg" variant="outline" className="rounded-xl font-bold border-2 border-slate-200 text-slate-700">
                <Search className="h-4 w-4" />
                Browse Packages
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs font-medium text-slate-400">
            <Link href="/trip-builder" className="hover:text-primary transition-colors">
              AI Trip Builder
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
