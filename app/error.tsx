"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Compass, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <AlertTriangle className="h-8 w-8" />
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={() => reset()}
              size="lg"
              className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="rounded-xl font-bold border-2 border-slate-200 text-slate-700">
                Go Home
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
