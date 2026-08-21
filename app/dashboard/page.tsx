import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CalendarCheck,
  Map as MapIcon,
  Heart,
  Sparkles,
  Users,
  Package,
  DollarSign,
  ArrowRight,
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import AnalyticsCharts from "./analytics/charts";
import { Badge } from "@/components/ui/badge";

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
    return <StaffDashboard userId={userId!} userName={userName} />;
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
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary font-display">
          Welcome back,{" "}
          <span className="text-primary">{userName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s what&apos;s happening with your travels.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">AI Trips</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{tripsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tripsCount > 0 ? "Generated plans" : "Start planning"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Active Bookings
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{bookingsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bookingsCount > 0 ? "Total bookings" : "No bookings"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Saved Packages
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Heart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{favoritesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Browse packages
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Destinations
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <MapIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">50+</div>
            <p className="text-xs text-muted-foreground mt-1">To explore</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/trip-builder">
          <Card className="glass-card group cursor-pointer border border-slate-200/80 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-secondary">AI Trip Builder</h3>
                <p className="text-xs text-slate-500">
                  Create a custom itinerary in under 30 seconds
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/packages">
          <Card className="glass-card group cursor-pointer border border-slate-200/80 hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5 transition-all hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-xl bg-secondary text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-secondary/20">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-secondary">Browse Packages</h3>
                <p className="text-xs text-slate-500">
                  Explore curated travel packages from verified agencies
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-secondary transition-colors" />
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
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary font-display">
          Agency Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Welcome back, {userName}. Manage your travel operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Total Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">
              {formatCurrency(totalRevenue, "INR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {allBookings.length} bookings
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Active Bookings
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{allBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recent bookings
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Published Packages
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{packagesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active packages
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Total Travelers
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{uniqueTravelers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-1 border border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-secondary">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{b.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.package?.title || "Custom Trip"}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-primary">
                      {formatCurrency(Number(b.totalAmount), b.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bookings yet. Share your packages to start receiving bookings.
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
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary font-display">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform-wide analytics and management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">Total Users</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Active Agencies
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{totalAgencies}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Total Bookings
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">{allBookings.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Platform Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-secondary">
              {formatCurrency(totalRevenue, "INR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-1 border border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-secondary">Recent Platform Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{b.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.package?.title || "Custom Trip"}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-primary">
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

async function StaffDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const staff = await prisma.agencyStaff.findUnique({
    where: { userId },
    include: { agency: true },
  });

  if (!staff) {
    return (
      <div className="p-6 text-center text-red-500">
        Staff profile not found. Please contact your agency administrator.
      </div>
    );
  }

  // Get tasks counts
  const [totalTasks, todoTasks, inProgressTasks, completedTasks] = await Promise.all([
    prisma.task.count({ where: { staffId: staff.id } }),
    prisma.task.count({ where: { staffId: staff.id, status: "TODO" } }),
    prisma.task.count({ where: { staffId: staff.id, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { staffId: staff.id, status: "COMPLETED" } }),
  ]);

  const pendingTasks = todoTasks + inProgressTasks;

  // Get agency bookings count
  const agencyBookingsCount = await prisma.booking.count({
    where: { agencyId: staff.agencyId },
  });

  // Fetch top 3 active tasks assigned to staff (Todo / In Progress)
  const activeTasks = await prisma.task.findMany({
    where: { staffId: staff.id, status: { not: "COMPLETED" } },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
    ],
    take: 3,
  });

  // Fetch recent agency bookings
  const recentBookings = await prisma.booking.findMany({
    where: { agencyId: staff.agencyId },
    include: { user: true, package: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "MEDIUM":
        return "bg-primary/10 text-primary border border-primary/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "PROCESSING":
        return "bg-primary/10 text-primary border-primary/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default:
        return "bg-slate-100 text-slate-500 border border-slate-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Greeting Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary font-display">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          {staff.role} &bull; {staff.agency.name} Operations Control
        </p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border border-slate-200/80 rounded-2xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Tasks</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-secondary">{totalTasks}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <ListTodo className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 rounded-2xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Work</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-primary">{pendingTasks}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 rounded-2xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-secondary">{completedTasks}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-slate-200/80 rounded-2xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agency Bookings</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-secondary">{agencyBookingsCount}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main split dashboard view */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Active Tasks */}
        <Card className="glass-card border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary">
                <ListTodo className="h-5 w-5 text-secondary" /> Your Active Tasks
              </CardTitle>
              <CardDescription className="text-xs">Operational tasks assigned to you.</CardDescription>
            </div>
            <Link
              href="/dashboard/tasks"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1 shrink-0"
            >
              Task Board <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            {activeTasks.length > 0 ? (
              <div className="space-y-4">
                {activeTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-sm text-slate-900 line-clamp-1">{t.title}</span>
                      <Badge variant="outline" className={`text-[8px] px-1.5 uppercase font-bold shrink-0 ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>{t.category}</span>
                      <span>Due: {formatDate(new Date(t.dueDate))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-secondary mb-2.5" />
                <p className="font-bold text-sm text-slate-900">All caught up!</p>
                <p className="text-xs text-slate-500">No active tasks assigned.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Recent Agency Bookings */}
        <Card className="glass-card border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-secondary">
                <CalendarCheck className="h-5 w-5 text-secondary" /> Recent Bookings
              </CardTitle>
              <CardDescription className="text-xs">Latest customer bookings in your agency.</CardDescription>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1 shrink-0"
            >
              View Bookings <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((b) => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-bold text-sm text-slate-800 block">
                        {b.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {b.package?.title || "Custom Trip"}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Amt: {formatCurrency(Number(b.totalAmount), b.currency)}
                      </span>
                    </div>

                    <Badge className={`text-[9px] px-1.5 uppercase font-bold tracking-wider shrink-0 ${getBookingStatusColor(b.status)}`}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-2.5" />
                <p className="font-bold text-sm text-slate-900">No bookings yet</p>
                <p className="text-xs text-slate-500">Wait for client requests.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
