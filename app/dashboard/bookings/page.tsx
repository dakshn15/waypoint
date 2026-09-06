import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import BookingsListClient from "./bookings-list-client";
import { serializePrisma } from "@/lib/utils";
import { getCommissionRate } from "@/lib/commission";
import { getUserAgencyAccess } from "@/lib/permissions";

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
  const userAccess = await getUserAgencyAccess(session.user.id, role);
  let bookings: any[] = [];
  let agencyName = "";

  if (role === "TRAVELER") {
    bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        package: true,
        agency: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, gateway: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "AGENCY") {
    const agency = await prisma.agency.findUnique({
      where: { ownerId: session.user.id },
    });
    if (agency) {
      agencyName = agency.name;
      bookings = await prisma.booking.findMany({
        where: { agencyId: agency.id },
        include: {
          package: true,
          user: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, gateway: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } else if (role === "STAFF") {
    const staff = await prisma.agencyStaff.findUnique({
      where: { userId: session.user.id },
      include: { agency: true },
    });
    if (staff) {
      agencyName = staff.agency.name;
      bookings = await prisma.booking.findMany({
        where: { agencyId: staff.agencyId },
        include: {
          package: true,
          user: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, gateway: true, createdAt: true },
          },
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
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, gateway: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Compute revenue stats server-side
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.totalAmount || 0),
    0
  );
  const confirmedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PROCESSING" || b.status === "COMPLETED"
  );
  const confirmedRevenue = confirmedBookings.reduce(
    (sum, b) => sum + Number(b.totalAmount || 0),
    0
  );
  const pendingRevenue = bookings
    .filter((b) => b.status === "PENDING")
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const avgBookingValue =
    bookings.length > 0 ? totalRevenue / bookings.length : 0;

  const currency = bookings.length > 0 ? bookings[0].currency : "INR";

  const COMMISSION_RATE = await getCommissionRate(userAccess?.agencyId);

  const stats = {
    totalRevenue,
    confirmedRevenue,
    pendingRevenue,
    completedCount,
    avgBookingValue,
    totalBookings: bookings.length,
    currency,
    commissionRate: COMMISSION_RATE,
    platformEarnings: totalRevenue * COMMISSION_RATE,
    agencyEarnings: totalRevenue * (1 - COMMISSION_RATE),
  };

  // For admin: get agencies list for filtering
  let agencies: { id: string; name: string }[] = [];
  if (role === "ADMIN") {
    agencies = await prisma.agency.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // Serialize bookings with payment status
  const serializedBookings = bookings.map((b) => ({
    ...b,
    paymentStatus: b.payments?.[0]?.status || "UNPAID",
    paymentGateway: b.payments?.[0]?.gateway || null,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Bookings
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          {role === "AGENCY" || role === "STAFF"
            ? `Manage bookings for ${agencyName || "your agency"}.`
            : role === "ADMIN"
              ? "Platform-wide booking management and analytics."
              : "Manage your bookings and travel reservations."}
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <CalendarCheck className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No bookings yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              {role === "AGENCY" || role === "STAFF"
                ? "You will see booking requests here once travelers start purchasing your packages."
                : "Your bookings will appear here once you book a package or confirm an AI-generated trip."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <BookingsListClient
          initialBookings={serializePrisma(serializedBookings)}
          role={role || "TRAVELER"}
          stats={serializePrisma(stats)}
          agencies={agencies}
        />
      )}
    </div>
  );
}
