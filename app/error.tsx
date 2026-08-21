"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Compass, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          {/* Error Icon */}
          <div className="w-20 h-20 rounded-2xl bg-red-50 border-2 border-red-200/60 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-secondary mb-3">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-3 max-w-sm mx-auto">
            An unexpected error occurred while loading this page. You can try again or head back to safety.
          </p>
          {error?.digest && (
            <p className="text-[11px] text-slate-400 font-mono mb-8">
              Error ID: {error.digest}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-white border-2 border-slate-200 hover:border-primary/30 hover:shadow-md text-slate-700 text-sm font-bold transition-all"
            >
              Go Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
