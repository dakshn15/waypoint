import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  Map as MapIcon,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import AnalyticsCharts from "./analytics/charts";


import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role || "TRAVELER";
  const userName = session?.user?.name?.split(" ")[0] || "there";
  const userId = session?.user?.id;

  if (userRole === "AGENCY") {
    return <AgencyDashboard userName={userName} userId={userId!} />;
  }

  if (userRole === "ADMIN") {
    return <AdminDashboard />;
  }

  if (userRole === "STAFF") {
    redirect("/dashboard/bookings");
  }

  return <TravelerDashboard userName={userName} userId={userId!} />;
}

async function TravelerDashboard({
  userName,
  userId,
}: {
  userName: string;
  userId: string;
}) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
  });

  const [tripsCount, favoritesCount] = await Promise.all([
    prisma.trip.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
  ]);

  const bookingsCount = bookings.length;

  // Calculate monthly spending (last 6 months)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthBookings = bookings.filter((b) => {
      const bd = new Date(b.createdAt);
      return (
        bd.getMonth() === d.getMonth() &&
        bd.getFullYear() === d.getFullYear()
      );
    });
    monthlyRevenue.push({
      month: monthNames[d.getMonth()],
      revenue: monthBookings.reduce(
        (sum, b) => sum + Number(b.totalAmount),
        0
      ),
    });
  }

  // Bookings by status
  const statusMap = new globalThis.Map<string, number>();
  bookings.forEach((b) => {
    statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1);
  });
  const bookingsByStatus: { status: string; count: number }[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status: status as string, count: count as number })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back,{" "}
          <span className="text-gradient-primary">{userName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your travels.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Trips</CardTitle>
            <Sparkles className="h-4 w-4 text-[var(--waypoint-amber)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tripsCount > 0 ? "Generated plans" : "Start planning"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Bookings
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-[var(--waypoint-teal)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bookingsCount > 0 ? "Total bookings" : "No bookings"}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Saved Packages
            </CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoritesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Browse packages
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Destinations
            </CardTitle>
            <MapIcon className="h-4 w-4 text-[var(--waypoint-teal)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">∞</div>
            <p className="text-xs text-muted-foreground mt-1">To explore</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/trip-builder">
          <Card className="glass-card group cursor-pointer hover:shadow-2xl hover:shadow-[var(--waypoint-teal)]/10 transition-all hover:-translate-y-1">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[var(--waypoint-teal)] to-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">AI Trip Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Create a personalized trip with AI
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[var(--waypoint-teal)] transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/packages">
          <Card className="glass-card group cursor-pointer hover:shadow-2xl hover:shadow-[var(--waypoint-amber)]/10 transition-all hover:-translate-y-1">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[var(--waypoint-amber)] to-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Browse Packages</h3>
                <p className="text-sm text-muted-foreground">
                  Explore curated travel packages
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[var(--waypoint-amber)] transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <AnalyticsCharts
          monthlyRevenue={monthlyRevenue}
          bookingsByStatus={bookingsByStatus}
          isTraveler={true}
        />
      </div>
    </div>
  );
}

async function AgencyDashboard({
  userName,
  userId,
}: {
  userName: string;
  userId: string;
}) {
  const agency = await prisma.agency.findUnique({
    where: { ownerId: userId },
  });

  const [allBookings, packagesCount] = await Promise.all([
    agency
      ? prisma.booking.findMany({
          where: { agencyId: agency.id },
          include: { package: true, user: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    agency
      ? prisma.package.count({
          where: { agencyId: agency.id, status: "PUBLISHED" },
        })
      : Promise.resolve(0),
  ]);

  const recentBookings = allBookings.slice(0, 5);
  const totalRevenue = allBookings.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );
  const uniqueTravelers = new Set(allBookings.map((b) => b.userId)).size;

  // Monthly revenue (last 6 months)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthBookings = allBookings.filter((b) => {
      const bd = new Date(b.createdAt);
      return (
        bd.getMonth() === d.getMonth() &&
        bd.getFullYear() === d.getFullYear()
      );
    });
    monthlyRevenue.push({
      month: monthNames[d.getMonth()],
      revenue: monthBookings.reduce(
        (sum, b) => sum + Number(b.totalAmount),
        0
      ),
    });
  }

  // Bookings by status
  const statusMap = new globalThis.Map<string, number>();
  allBookings.forEach((b) => {
    statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1);
  });
  const bookingsByStatus: { status: string; count: number }[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status: status as string, count: count as number })
  );


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Agency Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {userName}. Manage your travel operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue, "INR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {allBookings.length} bookings
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Bookings
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-[var(--waypoint-teal)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent bookings
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Published Packages
            </CardTitle>
            <Package className="h-4 w-4 text-[var(--waypoint-amber)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packagesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active packages
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Travelers
            </CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTravelers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.package?.title || "Custom Trip"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(b.totalAmount), b.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bookings yet. Share your packages to start receiving
                bookings.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <AnalyticsCharts
            monthlyRevenue={monthlyRevenue}
            bookingsByStatus={bookingsByStatus}
            isTraveler={false}
          />
        </div>
      </div>
    </div>
  );
}


async function AdminDashboard() {
  const [allBookings, totalUsers, totalAgencies, totalPackages] =
    await Promise.all([
      prisma.booking.findMany({
        include: { user: true, package: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.agency.count(),
      prisma.package.count(),
    ]);

  const recentBookings = allBookings.slice(0, 5);
  const totalRevenue = allBookings.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );

  // Monthly revenue (last 6 months)
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthBookings = allBookings.filter((b) => {
      const bd = new Date(b.createdAt);
      return (
        bd.getMonth() === d.getMonth() &&
        bd.getFullYear() === d.getFullYear()
      );
    });
    monthlyRevenue.push({
      month: monthNames[d.getMonth()],
      revenue: monthBookings.reduce(
        (sum, b) => sum + Number(b.totalAmount),
        0
      ),
    });
  }

  // Bookings by status
  const statusMap = new globalThis.Map<string, number>();
  allBookings.forEach((b) => {
    statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1);
  });
  const bookingsByStatus: { status: string; count: number }[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status: status as string, count: count as number })
  );


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide analytics and management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Agencies
            </CardTitle>
            <Package className="h-4 w-4 text-[var(--waypoint-teal)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgencies}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-[var(--waypoint-amber)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBookings.length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue, "INR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recent Platform Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.package?.title || "Custom Trip"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(b.totalAmount), b.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bookings yet.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <AnalyticsCharts
            monthlyRevenue={monthlyRevenue}
            bookingsByStatus={bookingsByStatus}
            isTraveler={false}
          />
        </div>
      </div>
    </div>
  );
}

