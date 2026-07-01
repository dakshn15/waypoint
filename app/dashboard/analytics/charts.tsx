"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#0EA5E9", // teal
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#10B981", // emerald
  "#EF4444", // red
  "#6366F1", // indigo
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

interface AnalyticsChartsProps {
  monthlyRevenue: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  isTraveler: boolean;
}

export default function AnalyticsCharts({
  monthlyRevenue,
  bookingsByStatus,
  isTraveler,
}: AnalyticsChartsProps) {
  const hasRevenue = monthlyRevenue.some((m) => m.revenue > 0);
  const hasBookings = bookingsByStatus.length > 0;

  if (!hasRevenue && !hasBookings) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {isTraveler
              ? "Book a travel package or generate an AI trip to see your analytics here."
              : "Charts will populate once you start receiving bookings."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Revenue Bar Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--waypoint-teal)]" />
            {isTraveler ? "Monthly Spending" : "Monthly Revenue"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) =>
                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 13,
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    isTraveler ? "Spent" : "Revenue",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" />
                    <stop offset="100%" stopColor="#0B1426" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No revenue data for the last 6 months
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings by Status Pie Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-[var(--waypoint-amber)]" />
            Bookings by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasBookings ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={bookingsByStatus.map((b) => ({
                    ...b,
                    name: STATUS_LABELS[b.status] || b.status,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, value }: any) => `${name}: ${value}`}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                >
                  {bookingsByStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => (
                    <span style={{ color: "hsl(var(--foreground))" }}>
                      {value}
                    </span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: 13,
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No booking data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
