import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, IndianRupee, CircleAlert, TrendingUp, Building2, Percent } from "lucide-react";

import { getCommissionRate } from "@/lib/commission";

const statusClass: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  REFUNDED: "bg-violet-50 text-violet-700 border-violet-200",
};

export default async function PlatformPaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const COMMISSION_RATE = await getCommissionRate();

  const [payments, completed, completedInr, failed] = await Promise.all([
    prisma.payment.findMany({
      include: { booking: { include: { user: { select: { name: true, email: true } }, agency: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: "COMPLETED", currency: "INR" }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);

  const completedVolume = Number(completedInr._sum.amount || 0);
  const platformEarnings = completedVolume * COMMISSION_RATE;
  const agencyPayouts = completedVolume * (1 - COMMISSION_RATE);

  // Per-agency breakdown
  const agencyMap = new globalThis.Map<string, { name: string; total: number; count: number }>();
  payments
    .filter((p) => p.status === "COMPLETED" && p.booking.agency)
    .forEach((p) => {
      const agencyId = p.booking.agency!.id;
      const existing = agencyMap.get(agencyId) || { name: p.booking.agency!.name, total: 0, count: 0 };
      existing.total += Number(p.amount);
      existing.count += 1;
      agencyMap.set(agencyId, existing);
    });
  const topAgencies = Array.from(agencyMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Platform Payments</h1>
        <p className="text-sm text-slate-500 font-medium">Platform-wide payment activity, commission tracking, and agency earnings breakdown.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 shrink-0"><IndianRupee className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Completed</p>
                <p className="text-lg font-bold text-slate-900">{completed._count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0"><CreditCard className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total Volume</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(completedVolume, "INR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 shrink-0"><Percent className="h-4 w-4 text-violet-600" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Commission ({(COMMISSION_RATE * 100)}%)</p>
                <p className="text-lg font-bold text-violet-700">{formatCurrency(platformEarnings, "INR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10 shrink-0"><Building2 className="h-4 w-4 text-secondary" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Agency Payouts</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(agencyPayouts, "INR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 shrink-0"><CircleAlert className="h-4 w-4 text-rose-600" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Failed</p>
                <p className="text-lg font-bold text-slate-900">{failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 shrink-0"><TrendingUp className="h-4 w-4 text-amber-600" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Success Rate</p>
                <p className="text-lg font-bold text-slate-900">{payments.length > 0 ? Math.round((completed._count / payments.length) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agency Earnings Breakdown */}
      {topAgencies.length > 0 && (
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-secondary" />
                Agency Earnings Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Completed payments by agency (top {topAgencies.length})</p>
            </div>
            <div className="divide-y divide-slate-100">
              {topAgencies.map((agency, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-primary/10 text-primary" : i === 1 ? "bg-secondary/10 text-secondary" : "bg-slate-100 text-slate-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{agency.name}</p>
                      <p className="text-[11px] text-slate-400">{agency.count} payment{agency.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(agency.total * (1 - COMMISSION_RATE), "INR")}</p>
                    <p className="text-[10px] text-slate-400">
                      Commission: {formatCurrency(agency.total * COMMISSION_RATE, "INR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Traveler / Agency</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Commission</th>
                <th className="px-5 py-3 font-semibold">Gateway</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-slate-700">{payment.booking.bookingNumber}</p>
                    <p className="text-xs text-slate-400 truncate max-w-32">{payment.providerPaymentId || payment.gatewayId || "Awaiting provider"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{payment.booking.user.name}</p>
                    <p className="text-xs text-slate-400">{payment.booking.agency?.name || "Custom trip"}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(Number(payment.amount), payment.currency)}</td>
                  <td className="px-5 py-4 text-slate-600 text-xs">
                    {payment.status === "COMPLETED" ? (
                      <span className="font-semibold text-violet-600">{formatCurrency(Number(payment.amount) * COMMISSION_RATE, payment.currency)}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600">{payment.gateway}</td>
                  <td className="px-5 py-4"><Badge variant="outline" className={statusClass[payment.status] || ""}>{payment.status}</Badge></td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{payment.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">No payment activity recorded yet.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
