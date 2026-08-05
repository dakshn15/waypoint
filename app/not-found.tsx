import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-tr from-[#769ABC] to-[#1A3B5A] mb-6 shadow-lg shadow-[#769ABC]/20">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold mb-2 text-slate-900">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-slate-900">Lost your way?</h2>
        <p className="text-slate-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button className="bg-[#1A3B5A] hover:bg-[#769ABC] text-white rounded-full px-6">
              Go Home
            </Button>
          </Link>
          <Link href="/packages">
            <Button variant="outline" className="rounded-full px-6">
              Browse Packages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
