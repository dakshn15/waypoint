import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-black">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-tr from-[var(--waypoint-teal)] to-sky-400 mb-6 shadow-lg shadow-[var(--waypoint-teal)]/20">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Lost your way?</h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white rounded-full px-6">
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
