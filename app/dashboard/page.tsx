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
  TrendingUp,
  Globe,
  Plane,
  Star,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import AnalyticsCharts from "./analytics/charts";
import { getCommissionRate } from "@/lib/commission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─── Shared helpers ──────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}) {
  return (
    <Card className="sm:py-5 py-4 group relative overflow-hidden bg-white border border-slate-200/60 rounded-lg shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="sm:px-5 px-4 xl:flex items-center justify-between gap-1">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider xl:pe-0 pe-3">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
        <div className={`xl:static absolute top-3 right-3 xl:h-11 xl:w-11 xl:rounded-md ${iconBg} flex-shrink-0 flex items-center justify-center xl:shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function PageHeader({
  title,
  subtitle,
  badge,
  badgeColor,
}: {
  title: React.ReactNode;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {badge && (
          <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${badgeColor || "bg-primary/10 text-primary border-primary/20"}`}>
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  gradient,
  iconShadow,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  gradient: string;
  iconShadow: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full sm:py-5 py-4 group cursor-pointer bg-white border border-slate-200/60 rounded-lg hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
        <CardContent className="flex items-center sm:gap-4 gap-3 sm:px-5 px-4">
          <div className={`sm:h-12 sm:w-12 h-10 w-10 rounded-lg ${gradient} text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md ${iconShadow}`}>
            <Icon className="sm:h-6 sm:w-6 h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold sm:text-lg text-base text-slate-900 leading-tight mb-1.5">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyBookingsList({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
        <CalendarCheck className="h-7 w-7 text-slate-300" />
      </div>
      <p className="font-semibold text-base text-slate-700">No bookings yet</p>
      <p className="text-sm text-slate-400 mt-1 max-w-[200px]">{message}</p>
    </div>
  );
}

function TopPackagesBox({ packages }: { packages: { title: string; bookings: number; revenue: number; currency: string }[] }) {
  return (
    <Card className="sm:py-5 py-4 bg-white border border-slate-200/60 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Top Packages
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 flex-1">
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-400">No package data yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {packages.map((pkg, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-secondary/10 text-secondary" : "bg-slate-100 text-slate-500"
                  }`}>{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{pkg.title}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{pkg.bookings} booking{pkg.bookings !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-xs font-bold text-slate-700 shrink-0">{formatCurrency(pkg.revenue, pkg.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



function BookingRow({
  name,
  detail,
  amount,
  currency,
  status,
}: {
  name: string;
  detail: string;
  amount: number;
  currency: string;
  status: string;
}) {
  const statusColor =
    status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
      status === "PROCESSING" ? "bg-primary/10 text-primary border-primary/20" :
        status === "CANCELLED" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
          "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 group hover:bg-slate-50 transition-colors">
      <div className="min-w-0 space-y-1">
        <span className="font-semibold text-sm text-slate-800 block truncate">{name}</span>
        <span className="text-xs text-slate-400 block truncate">{detail}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-slate-700">{formatCurrency(amount, currency)}</span>
        <Badge className={`text-[8px] px-1.5 uppercase font-bold tracking-wider ${statusColor}`}>
          {status}
        </Badge>
      </div>
    </div>
  );
}

/* ─── Main Router ──────────────────────── */

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
    return <AdminDashboard userName={userName} />;
  }

  if (userRole === "STAFF") {
    return <StaffDashboard userId={userId!} userName={userName} />;
  }

  return <TravelerDashboard userName={userName} userId={userId!} />;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TRAVELER DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
    <div className="space-y-5">
      {/* Hero Greeting */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 p-5 sm:p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(228,111,68,0.15),transparent_60%)]" />
        <div className="absolute top-4 right-4 opacity-10">
          <Plane className="h-24 w-24 -rotate-12" />
        </div>
        <div className="relative z-[1]">
          <p className="text-white/60 text-sm font-medium mb-1">{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-md">
            Here&apos;s what&apos;s happening with your travels. Explore new destinations, check your bookings, or plan your next adventure.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="AI Trips"
          value={tripsCount}
          subtitle={tripsCount > 0 ? "Generated plans" : "Start planning"}
          icon={Sparkles}
          gradient="bg-gradient-to-r from-primary to-orange-400"
          iconBg="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active Bookings"
          value={bookingsCount}
          subtitle={bookingsCount > 0 ? "Total bookings" : "No bookings"}
          icon={CalendarCheck}
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconBg="bg-secondary/10 text-secondary"
        />
        <StatCard
          title="Saved Packages"
          value={favoritesCount}
          subtitle="Browse packages"
          icon={Heart}
          gradient="bg-gradient-to-r from-rose-500 to-pink-500"
          iconBg="bg-rose-500/10 text-rose-500"
        />
        <StatCard
          title="Destinations"
          value="50+"
          subtitle="To explore"
          icon={Globe}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          iconBg="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <ActionCard
          href="/trip-builder"
          icon={Sparkles}
          title="AI Trip Builder"
          subtitle="Create a custom itinerary in under 30 seconds"
          gradient="bg-gradient-to-r from-primary to-orange-400"
          iconShadow="shadow-primary/20"
        />
        <ActionCard
          href="/packages"
          icon={Package}
          title="Browse Packages"
          subtitle="Explore curated travel packages from verified agencies"
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconShadow="shadow-secondary/20"
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts
        monthlyRevenue={monthlyRevenue}
        bookingsByStatus={bookingsByStatus}
        isTraveler={true}
      />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AGENCY DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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

  const [allBookings, packagesCount, agencyPackages] = await Promise.all([
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
    agency
      ? prisma.package.findMany({
        where: { agencyId: agency.id },
        select: { id: true, title: true, currency: true },
      })
      : Promise.resolve([]),
  ]);

  const recentBookings = allBookings.slice(0, 8);
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

  // Top packages by booking count
  const packageBookingMap = new globalThis.Map<string, { bookings: number; revenue: number }>();
  allBookings.forEach((b) => {
    if (b.packageId) {
      const existing = packageBookingMap.get(b.packageId) || { bookings: 0, revenue: 0 };
      packageBookingMap.set(b.packageId, {
        bookings: existing.bookings + 1,
        revenue: existing.revenue + Number(b.totalAmount),
      });
    }
  });
  const topPackages = agencyPackages
    .map((pkg) => ({
      title: pkg.title,
      bookings: packageBookingMap.get(pkg.id)?.bookings || 0,
      revenue: packageBookingMap.get(pkg.id)?.revenue || 0,
      currency: pkg.currency,
    }))
    .filter((p) => p.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 4);



  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 p-5 sm:p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(228,111,68,0.15),transparent_60%)]" />
        <div className="absolute top-4 right-4 opacity-10">
          <TrendingUp className="h-24 w-24" />
        </div>
        <div className="relative z-[1]">
          <p className="text-white/60 text-sm font-medium mb-1">{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Agency Dashboard
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-md">
            Welcome back, {userName}. Manage your travel operations, monitor bookings, and grow your business.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue, "INR")}
          subtitle={`From ${allBookings.length} bookings`}
          icon={DollarSign}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          iconBg="xl:bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Active Bookings"
          value={allBookings.length}
          subtitle="Recent bookings"
          icon={CalendarCheck}
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconBg="xl:bg-secondary/10 text-secondary"
        />
        <StatCard
          title="Published Packages"
          value={packagesCount}
          subtitle="Active packages"
          icon={Package}
          gradient="bg-gradient-to-r from-primary to-orange-400"
          iconBg="xl:bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Travelers"
          value={uniqueTravelers}
          subtitle="Unique customers"
          icon={Users}
          gradient="bg-gradient-to-r from-violet-500 to-indigo-500"
          iconBg="xl:bg-violet-500/10 text-violet-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <ActionCard
          href="/dashboard/packages/new"
          icon={Package}
          title="Create New Package"
          subtitle="Build and publish a new travel package"
          gradient="bg-gradient-to-r from-primary to-orange-400"
          iconShadow="shadow-primary/20"
        />
        <ActionCard
          href="/dashboard/bookings"
          icon={CalendarCheck}
          title="View All Bookings"
          subtitle="Monitor and manage customer reservations"
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconShadow="shadow-secondary/20"
        />
      </div>

      {/* Row A: Charts side by side */}
      <AnalyticsCharts
        monthlyRevenue={monthlyRevenue}
        bookingsByStatus={bookingsByStatus}
        isTraveler={false}
      />

      {/* Row B: Recent Bookings + Top Packages */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        {/* Scrollable Recent Bookings */}
        <Card className="sm:py-5 py-4 bg-white border border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-secondary" />
                Recent Bookings
              </CardTitle>
              <Link href="/dashboard/bookings" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-5">
            {recentBookings.length > 0 ? (
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {recentBookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    name={b.user.name || "Unknown"}
                    detail={b.package?.title || "Custom Trip"}
                    amount={Number(b.totalAmount)}
                    currency={b.currency}
                    status={b.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyBookingsList message="Share your packages to start receiving bookings." />
            )}
          </CardContent>
        </Card>

        {/* Top Packages */}
        <TopPackagesBox packages={topPackages} />
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ADMIN DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function AdminDashboard({ userName }: { userName: string }) {
  const COMMISSION_RATE = await getCommissionRate();

  const [allBookings, totalUsers, totalAgencies, totalPackages, verifiedAgencies, activePackages] =
    await Promise.all([
      prisma.booking.findMany({
        include: { user: true, package: true, agency: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.agency.count(),
      prisma.package.count(),
      prisma.agency.count({ where: { verified: true } }),
      prisma.package.count({ where: { status: "PUBLISHED" } }),
    ]);

  const recentBookings = allBookings.slice(0, 5);
  const totalRevenue = allBookings.reduce(
    (sum, b) => sum + Number(b.totalAmount),
    0
  );
  const platformCommission = totalRevenue * COMMISSION_RATE;
  const completedBookings = allBookings.filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED");
  const conversionRate = allBookings.length > 0
    ? Math.round((completedBookings.length / allBookings.length) * 100)
    : 0;

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

  // Top performing agencies
  const agencyMap = new globalThis.Map<string, { name: string; bookings: number; revenue: number }>();
  allBookings.forEach((b) => {
    if (b.agency) {
      const existing = agencyMap.get(b.agency.id) || { name: b.agency.name, bookings: 0, revenue: 0 };
      existing.bookings += 1;
      existing.revenue += Number(b.totalAmount);
      agencyMap.set(b.agency.id, existing);
    }
  });
  const topAgencies = Array.from(agencyMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute top-4 right-4 opacity-10">
          <Star className="h-24 w-24" />
        </div>
        <div className="relative z-[1]">
          <p className="text-white/60 text-sm font-medium mb-1">{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Admin Dashboard
          </h1>
          <p className="text-white/50 text-sm mt-3 max-w-md">
            Welcome back, {userName}. Platform-wide analytics, revenue tracking, and system controls at your fingertips.
          </p>
          {totalRevenue > 0 && (
            <div className="mt-4 flex items-center gap-4 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 font-semibold">
                Commission Rate: {(COMMISSION_RATE * 100)}%
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 font-semibold">
                Platform Earned: {formatCurrency(platformCommission, "INR")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtitle="Platform users"
          icon={Users}
          gradient="bg-gradient-to-r from-violet-500 to-indigo-500"
          iconBg="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          title="Active Agencies"
          value={`${verifiedAgencies}/${totalAgencies}`}
          subtitle={`${verifiedAgencies} verified`}
          icon={Package}
          gradient="bg-gradient-to-r from-primary to-orange-400"
          iconBg="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Bookings"
          value={allBookings.length}
          subtitle={`${conversionRate}% conversion`}
          icon={CalendarCheck}
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconBg="bg-secondary/10 text-secondary"
        />
        <StatCard
          title="Platform Revenue"
          value={formatCurrency(totalRevenue, "INR")}
          subtitle={`${activePackages} active packages`}
          icon={DollarSign}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          iconBg="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <ActionCard
          href="/dashboard/users"
          icon={Users}
          title="User Management"
          subtitle="Manage user accounts, roles, and permissions"
          gradient="bg-gradient-to-r from-violet-500 to-indigo-500"
          iconShadow="shadow-violet-500/20"
        />
        <ActionCard
          href="/dashboard/agencies"
          icon={Package}
          title="Agency Management"
          subtitle="Verify and manage travel agency profiles"
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconShadow="shadow-secondary/20"
        />
      </div>

      {/* Row A: Charts side by side */}
      <AnalyticsCharts
        monthlyRevenue={monthlyRevenue}
        bookingsByStatus={bookingsByStatus}
        isTraveler={false}
      />

      {/* Row B: Recent Bookings + Top Agencies */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        {/* Scrollable Recent Bookings */}
        <Card className="sm:py-5 py-4 bg-white border border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-violet-500" />
                Recent Bookings
              </CardTitle>
              <Link href="/dashboard/bookings" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 !pt-0">
            {recentBookings.length > 0 ? (
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {recentBookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    name={b.user.name || "Unknown"}
                    detail={b.package?.title || "Custom Trip"}
                    amount={Number(b.totalAmount)}
                    currency={b.currency}
                    status={b.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyBookingsList message="No bookings on the platform yet." />
            )}
          </CardContent>
        </Card>

        {/* Top Performing Agencies */}
        <Card className="sm:py-5 py-4 bg-white border border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                Top Agencies
              </CardTitle>
              <Link href="/dashboard/agencies" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 flex-1">
            {topAgencies.length > 0 ? (
              <div className="space-y-2.5">
                {topAgencies.map((agency, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-secondary/10 text-secondary" : "bg-slate-100 text-slate-500"
                    }`}>{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{agency.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{agency.bookings} booking{agency.bookings !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0">{formatCurrency(agency.revenue, "INR")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No agency data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STAFF DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="font-bold text-lg text-slate-900">Staff Profile Not Found</h3>
        <p className="text-sm text-slate-500 mt-1.5">Please contact your agency administrator.</p>
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
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "MEDIUM":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-5 sm:p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute top-4 right-4 opacity-10">
          <ListTodo className="h-24 w-24" />
        </div>
        <div className="relative z-[1]">
          <p className="text-white/60 text-sm font-medium mb-1">{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-white/70 text-sm mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/60 shrink-0" />
            <span className="font-medium">{staff.role} — {staff.agency.name}</span>
          </p>
          {totalTasks > 0 && (
            <div className="mt-4 max-w-xs">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                <span>Task Completion</span>
                <span className="font-bold text-white">{completionRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Tasks"
          value={totalTasks}
          subtitle="Total tasks"
          icon={ListTodo}
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconBg="bg-secondary/10 text-secondary"
        />
        <StatCard
          title="Pending Work"
          value={pendingTasks}
          subtitle="Needs attention"
          icon={Clock}
          gradient="bg-gradient-to-r from-primary to-orange-400"
          iconBg="bg-primary/10 text-primary"
        />
        <StatCard
          title="Completed"
          value={completedTasks}
          subtitle="Tasks done"
          icon={CheckCircle2}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          iconBg="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Agency Bookings"
          value={agencyBookingsCount}
          subtitle="Total bookings"
          icon={CalendarCheck}
          gradient="bg-gradient-to-r from-violet-500 to-indigo-500"
          iconBg="bg-violet-500/10 text-violet-600"
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-5 md:grid-cols-2">
        <ActionCard
          href="/dashboard/tasks"
          icon={ListTodo}
          title="View Task Board"
          subtitle="Manage your assigned tasks, update progress, and mark completions"
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          iconShadow="shadow-emerald-500/20"
        />
        <ActionCard
          href="/dashboard/bookings"
          icon={CalendarCheck}
          title="View All Bookings"
          subtitle="Monitor client reservations and update booking statuses"
          gradient="bg-gradient-to-r from-secondary to-slate-600"
          iconShadow="shadow-secondary/20"
        />
      </div>

      {/* Tasks + Bookings */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Active Tasks */}
        <Card className="sm:py-5 py-4 bg-white border border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-secondary" />
                  Active Tasks
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">Tasks assigned to you</CardDescription>
              </div>
              <Link
                href="/dashboard/tasks"
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Task Board <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="sm:px-5 px-4 flex-1">
            {activeTasks.length > 0 ? (
              <div className="space-y-3">
                {activeTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50/80 border border-slate-100 rounded-lg space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <span className="font-semibold text-sm text-slate-800 line-clamp-1 min-w-0 flex-1">{t.title}</span>
                      <Badge variant="outline" className={`text-[8px] px-1.5 uppercase font-bold shrink-0 rounded-md ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{t.category}</span>
                      <span>Due: {formatDate(new Date(t.dueDate))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="font-semibold text-base text-slate-700">All caught up!</p>
                <p className="text-sm text-slate-400 mt-1">No active tasks assigned.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="sm:py-5 py-4 bg-white border border-slate-200/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-secondary" />
                  Recent Bookings
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">Latest customer bookings</CardDescription>
              </div>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="sm:px-5 px-4 flex-1">
            {recentBookings.length > 0 ? (
              <div className="space-y-2">
                {recentBookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    name={b.user.name || "Unknown"}
                    detail={b.package?.title || "Custom Trip"}
                    amount={Number(b.totalAmount)}
                    currency={b.currency}
                    status={b.status}
                  />
                ))}
              </div>
            ) : (
              <EmptyBookingsList message="Wait for client requests." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
