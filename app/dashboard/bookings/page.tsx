import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import BookingsListClient from "./bookings-list-client";
import { serializePrisma } from "@/lib/utils";

export default async function BookingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Unauthorized. Please log in.
      </div>
    );
  }

  const role = session.user.role;
  let bookings: any[] = [];

  if (role === "TRAVELER") {
    bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        package: true,
        agency: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "AGENCY") {
    const agency = await prisma.agency.findUnique({
      where: { ownerId: session.user.id },
    });
    if (agency) {
      bookings = await prisma.booking.findMany({
        where: { agencyId: agency.id },
        include: {
          package: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } else if (role === "STAFF") {
    const staff = await prisma.agencyStaff.findUnique({
      where: { userId: session.user.id },
    });
    if (staff) {
      bookings = await prisma.booking.findMany({
        where: { agencyId: staff.agencyId },
        include: {
          package: true,
          user: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } else if (role === "ADMIN") {
    bookings = await prisma.booking.findMany({
      include: {
        package: true,
        user: true,
        agency: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          {role === "AGENCY" || role === "STAFF"
            ? "Manage travel packages bookings received from clients."
            : "Manage your bookings and travel reservations."}
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {role === "AGENCY" || role === "STAFF"
                ? "You will see booking requests here once travelers start purchasing your packages."
                : "Your bookings will appear here once you book a package or confirm an AI-generated trip."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <BookingsListClient initialBookings={serializePrisma(bookings)} role={role || "TRAVELER"} />
      )}
    </div>
  );
}


