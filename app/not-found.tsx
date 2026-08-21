import Link from "next/link";
import { Compass, ArrowRight, Search, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] font-sans">
      {/* Nav */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Compass className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-secondary">
            Way<span className="text-primary">point</span>
          </span>
        </Link>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center px-4 -mt-16">
        <div className="text-center max-w-lg">
          {/* Large 404 */}
          <div className="relative mb-6">
            <p className="text-[160px] md:text-[200px] font-extrabold leading-none tracking-tighter text-slate-100 select-none">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-primary" />
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20"
            >
              Back to Home
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-white border-2 border-slate-200 hover:border-primary/30 hover:shadow-md text-slate-700 text-sm font-bold transition-all"
            >
              <Search className="h-4 w-4" />
              Browse Packages
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs font-medium text-slate-400">
            <Link href="/trip-builder" className="hover:text-primary transition-colors">AI Trip Builder</Link>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
