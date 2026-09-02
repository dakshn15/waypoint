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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF9] font-sans">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-secondary mb-3">
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
        <div className="flex items-center gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              Go Home
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
