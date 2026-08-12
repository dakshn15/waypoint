"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-red-100 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-slate-900">Something went wrong</h2>
        <p className="text-slate-600 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <Button
          onClick={() => reset()}
          className="bg-secondary hover:bg-secondary text-white rounded-full px-6"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
