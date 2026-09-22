import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plane } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { serializePrisma } from "@/lib/utils";
import TripsGridClient from "./trips-grid-client";

export default async function TripsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Please log in to view your trips.
      </div>
    );
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for client component (handles Decimal, Date, etc.)
  const serializedTrips = serializePrisma(trips);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">My Trips</h1>
          <p className="text-sm text-slate-500 font-medium">
            View and manage your AI-generated travel plans.
          </p>
        </div>
        <Link href="/trip-builder">
          <Button>
            <Sparkles className="h-4 w-4" /> Create New Trip
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-display">No trips yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mb-5">
              Create your first AI-powered trip plan and it will appear here.
            </p>
            <Link href="/trip-builder">
              <Button>
                <Sparkles className="h-4 w-4" /> Create AI Trip
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <TripsGridClient trips={serializedTrips} />
      )}
    </div>
  );
}
