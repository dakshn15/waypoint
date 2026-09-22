"use client";

import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon, CheckCircle2, XCircle, ShieldAlert,
  PlayCircle, CheckSquare2, RotateCcw, ChevronLeft, ChevronRight,
  DollarSign, Clock, TrendingUp, CreditCard, Building2, Filter,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { cancelBooking, updateBookingStatus } from "@/app/actions/bookings";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 10;

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"] as const;
type StatusTab = typeof STATUS_TABS[number];

interface BookingStats {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  completedCount: number;
  avgBookingValue: number;
  totalBookings: number;
  currency: string;
  commissionRate: number;
  platformEarnings: number;
  agencyEarnings: number;
}

interface BookingsListClientProps {
  initialBookings: any[];
  role: string;
  stats: BookingStats;
  agencies?: { id: string; name: string }[];
}

/* ─── Stat Card ──────────────────────── */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Payment Badge ──────────────────────── */

function PaymentBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    PENDING: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    PROCESSING: { label: "Processing", className: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    FAILED: { label: "Failed", className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
    UNPAID: { label: "Unpaid", className: "bg-slate-100 text-slate-500 border-slate-200" },
  };
  const c = config[status] || config.UNPAID;
  return (
    <Badge variant="outline" className={cn("text-[9px] font-bold tracking-wider", c.className)}>
      {c.label}
    </Badge>
  );
}

/* ─── Main Component ──────────────────────── */

export default function BookingsListClient({ initialBookings, role, stats, agencies = [] }: BookingsListClientProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [agencyFilter, setAgencyFilter] = useState<string>("ALL");

  const isAgencyOrStaffOrAdmin = ["AGENCY", "STAFF", "ADMIN"].includes(role);
  const isAdmin = role === "ADMIN";

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-secondary/10 text-secondary border border-secondary/20";
      case "COMPLETED": return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "PENDING": return "bg-primary/10 text-primary border border-primary/20";
      case "PROCESSING": return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "CANCELLED": return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      case "REFUNDED": return "bg-slate-100 text-slate-600 border border-slate-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Filter by tab + agency
  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    if (activeTab !== "ALL") {
      filtered = filtered.filter((b: any) => b.status === activeTab);
    }
    if (isAdmin && agencyFilter !== "ALL") {
      filtered = filtered.filter((b: any) => b.agencyId === agencyFilter);
    }
    return filtered;
  }, [bookings, activeTab, agencyFilter, isAdmin]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [activeTab, agencyFilter]);

  // Filtered stats (recalculated when agency filter is applied)
  const filteredStats = useMemo(() => {
    if (!isAdmin || agencyFilter === "ALL") return stats;
    const agencyBookings = bookings.filter((b: any) => b.agencyId === agencyFilter);
    const total = agencyBookings.reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0);
    const confirmed = agencyBookings.filter((b: any) => ["CONFIRMED", "PROCESSING", "COMPLETED"].includes(b.status));
    const pending = agencyBookings.filter((b: any) => b.status === "PENDING");
    return {
      ...stats,
      totalRevenue: total,
      confirmedRevenue: confirmed.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0),
      pendingRevenue: pending.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0),
      completedCount: agencyBookings.filter((b: any) => b.status === "COMPLETED").length,
      avgBookingValue: agencyBookings.length > 0 ? total / agencyBookings.length : 0,
      totalBookings: agencyBookings.length,
      platformEarnings: total * stats.commissionRate,
      agencyEarnings: total * (1 - stats.commissionRate),
    };
  }, [bookings, agencyFilter, isAdmin, stats]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function executeAction(bookingId: string, action: string) {
    setLoading(true);
    try {
      let updated: any;
      if (action === "CANCEL") {
        updated = await cancelBooking(bookingId);
      } else {
        updated = await updateBookingStatus(bookingId, action as any);
      }
      setBookings((prev: any[]) => prev.map((b: any) => (b.id === bookingId ? { ...b, status: updated.status } : b)));
      toast.success(`Booking ${action === "CANCEL" ? "cancelled" : `status updated to ${action.toLowerCase()}`}.`);
      setSelectedBooking(null);
      setDialogMode(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking.");
    } finally {
      setLoading(false);
    }
  }

  function openDialog(booking: any, mode: string) {
    setSelectedBooking(booking);
    setDialogMode(mode);
  }

  // Razorpay SDK loader
  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  // Retry payment for PENDING + UNPAID bookings
  async function handleRetryPayment(booking: any) {
    setLoading(true);
    try {
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, gateway: "razorpay" }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Payment session initiation failed");

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Failed to load Razorpay SDK.");

      toast.info("Opening Razorpay secure checkout...");

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Waypoint Travel",
        description: `Booking #${booking.bookingNumber || booking.id.substring(0, 8)}`,
        order_id: paymentData.orderId,
        handler: async function (response: any) {
          setLoading(true);
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                gateway: "razorpay",
                bookingId: booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              toast.success("Payment verified! Booking confirmed.");
              // Update local state to reflect payment
              setBookings((prev: any[]) =>
                prev.map((b: any) =>
                  b.id === booking.id
                    ? { ...b, status: "CONFIRMED", paymentStatus: "COMPLETED" }
                    : b
                )
              );
            } else {
              toast.error(verifyData.error || "Payment verification failed.");
            }
          } catch {
            toast.error("Failed to verify payment.");
          } finally {
            setLoading(false);
          }
        },
        theme: { color: "#E46F44" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment.");
      setLoading(false);
    }
  }

  // Tab counts
  const tabCounts = useMemo(() => {
    const source = isAdmin && agencyFilter !== "ALL"
      ? bookings.filter((b: any) => b.agencyId === agencyFilter)
      : bookings;
    const map: Record<string, number> = { ALL: source.length };
    source.forEach((b: any) => { map[b.status] = (map[b.status] || 0) + 1; });
    return map;
  }, [bookings, agencyFilter, isAdmin]);

  // Icon action buttons for agency/staff
  function AgencyActions({ booking }: { booking: any }) {
    const status = booking.status;
    const isTerminal = ["COMPLETED", "CANCELLED", "REFUNDED"].includes(status);
    if (isTerminal) return <span className="text-xs text-slate-400 italic">No actions</span>;

    return (
      <div className="flex items-center gap-1">
        {status === "PENDING" && (
          <>
            <button
              title="Confirm Booking"
              onClick={() => openDialog(booking, "CONFIRMED")}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button
              title="Reject Booking"
              onClick={() => openDialog(booking, "REJECT")}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}
        {status === "CONFIRMED" && (
          <button
            title="Mark as Processing"
            onClick={() => openDialog(booking, "PROCESSING")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" />
          </button>
        )}
        {["CONFIRMED", "PROCESSING"].includes(status) && (
          <button
            title="Mark as Completed"
            onClick={() => openDialog(booking, "COMPLETED")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <CheckSquare2 className="h-4 w-4" />
          </button>
        )}
        {["CONFIRMED", "PROCESSING"].includes(status) && (
          <button
            title="Mark as Pending"
            onClick={() => openDialog(booking, "PENDING")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        {!["CANCELLED", "COMPLETED", "REFUNDED"].includes(status) && (
          <button
            title="Cancel Booking"
            onClick={() => openDialog(booking, "CANCEL")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  function TravelerActions({ booking }: { booking: any }) {
    const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
    const canPay = booking.status === "PENDING" && (!booking.paymentStatus || booking.paymentStatus === "UNPAID" || booking.paymentStatus === "FAILED");

    if (!canCancel && !canPay) return <span className="text-xs text-slate-400 italic">No actions</span>;
    return (
      <div className="flex items-center gap-1">
        {canPay && (
          <button
            title="Complete Payment"
            onClick={() => handleRetryPayment(booking)}
            disabled={loading}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pay Now</span>
          </button>
        )}
        {canCancel && (
          <button
            title="Cancel Booking"
            onClick={() => openDialog(booking, "CANCEL")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  const dialogConfig: Record<string, { title: string; desc: string; icon: any; confirmLabel: string; confirmStyle: string }> = {
    CANCEL: {
      title: "Cancel Booking",
      desc: "Are you sure you want to cancel this booking? This action will notify the traveler.",
      icon: ShieldAlert, confirmLabel: "Cancel Booking", confirmStyle: "bg-rose-500 hover:bg-rose-600 text-white",
    },
    REJECT: {
      title: "Reject Booking",
      desc: "Rejecting will cancel this request and notify the traveler. This action is permanent.",
      icon: XCircle, confirmLabel: "Reject Booking", confirmStyle: "bg-rose-500 hover:bg-rose-600 text-white",
    },
    CONFIRMED: {
      title: "Confirm Booking",
      desc: "Confirming notifies the traveler their booking has been verified and scheduled.",
      icon: CheckCircle2, confirmLabel: "Yes, Confirm", confirmStyle: "bg-secondary hover:bg-secondary/90 text-white",
    },
    PROCESSING: {
      title: "Mark as Processing",
      desc: "Set this booking to Processing to indicate the tour is actively in preparation.",
      icon: PlayCircle, confirmLabel: "Mark Processing", confirmStyle: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    COMPLETED: {
      title: "Mark as Completed",
      desc: "Confirm that this tour package has been fully delivered to the traveler.",
      icon: CheckSquare2, confirmLabel: "Mark Completed", confirmStyle: "bg-emerald-500 hover:bg-emerald-600 text-white",
    },
    PENDING: {
      title: "Revert to Pending",
      desc: "Move this booking back to Pending status for further review.",
      icon: RotateCcw, confirmLabel: "Set to Pending", confirmStyle: "bg-primary hover:bg-primary/90 text-white",
    },
  };

  const dlg = dialogMode ? dialogConfig[dialogMode] : null;
  const cur = filteredStats.currency || "INR";

  return (
    <>
      {/* Revenue Summary Cards — visible to Agency/Staff/Admin */}
      {isAgencyOrStaffOrAdmin && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(filteredStats.totalRevenue, cur)}
            subtitle={`From ${filteredStats.totalBookings} bookings`}
            icon={DollarSign}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Confirmed Revenue"
            value={formatCurrency(filteredStats.confirmedRevenue, cur)}
            subtitle="Verified payments"
            icon={CheckCircle2}
            iconBg="bg-secondary/10"
            iconColor="text-secondary"
          />
          <StatCard
            title="Pending Revenue"
            value={formatCurrency(filteredStats.pendingRevenue, cur)}
            subtitle="Awaiting confirmation"
            icon={Clock}
            iconBg="bg-primary/10"
            iconColor="text-primary"
          />
          {isAdmin ? (
            <StatCard
              title="Platform Commission"
              value={formatCurrency(filteredStats.platformEarnings, cur)}
              subtitle={`${(filteredStats.commissionRate * 100).toFixed(0)}% rate`}
              icon={TrendingUp}
              iconBg="bg-violet-500/10"
              iconColor="text-violet-600"
            />
          ) : (
            <StatCard
              title="Avg. Booking"
              value={formatCurrency(filteredStats.avgBookingValue, cur)}
              subtitle={`${filteredStats.completedCount} completed`}
              icon={TrendingUp}
              iconBg="bg-violet-500/10"
              iconColor="text-violet-600"
            />
          )}
        </div>
      )}

      {/* Agency Earnings Info — visible to Agency/Staff */}
      {(role === "AGENCY" || role === "STAFF") && filteredStats.totalRevenue > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200/60 rounded-lg">
          <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800 font-medium">
            Your earnings: <span className="font-bold">{formatCurrency(filteredStats.agencyEarnings, cur)}</span> after {(filteredStats.commissionRate * 100).toFixed(0)}% platform commission ({formatCurrency(filteredStats.platformEarnings, cur)})
          </p>
        </div>
      )}

      {/* Admin: Agency Filter */}
      {isAdmin && agencies.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Agency:
          </div>
          <Select value={agencyFilter} onValueChange={(v: string | null) => v && setAgencyFilter(v)}>
            <SelectTrigger className="w-[220px] h-9 text-sm bg-white border-slate-200 cursor-pointer">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="All Agencies" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg" alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="cursor-pointer text-sm">All Agencies</SelectItem>
              {agencies.map((a) => (
                <SelectItem key={a.id} value={a.id} className="cursor-pointer text-sm">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {agencyFilter !== "ALL" && (
            <button
              onClick={() => setAgencyFilter("ALL")}
              className="text-xs text-primary hover:text-primary/80 font-semibold cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
              activeTab === tab
                ? "bg-secondary text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span className={cn(
              "h-4 min-w-[16px] px-1 rounded-md flex items-center justify-center text-[10px] font-bold",
              activeTab === tab ? "bg-white/20" : "bg-slate-200 text-slate-600"
            )}>
              {tabCounts[tab] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50">
              <TableHead className="w-[100px] text-xs font-bold text-slate-500 uppercase tracking-wider">Booking ID</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Package / Trip</TableHead>
              {isAdmin && (
                <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agency</TableHead>
              )}
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAgencyOrStaffOrAdmin ? "Traveler" : "Agency"}</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Travel Date</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-16 text-slate-400 text-sm">
                  No bookings found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBookings.map((booking: any) => (
                <TableRow key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-slate-600">
                    {(booking.bookingNumber || booking.id).substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                      {booking.package ? booking.package.title : "Custom AI Trip Plan"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {booking.travelers?.length || 0} traveler{(booking.travelers?.length || 0) !== 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-[120px]">{booking.agency?.name || "—"}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-slate-600">
                    {isAgencyOrStaffOrAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{booking.user?.name || "Traveler"}</span>
                      </div>
                    ) : (
                      <span>{booking.agency ? booking.agency.name : "Waypoint Direct"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(booking.travelDate)}</TableCell>
                  <TableCell className="font-bold text-sm text-slate-900">
                    {formatCurrency(Number(booking.totalAmount), booking.currency)}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={booking.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wider", getStatusStyle(booking.status))}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {isAgencyOrStaffOrAdmin ? (
                        <AgencyActions booking={booking} />
                      ) : (
                        <TravelerActions booking={booking} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400 font-medium">
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredBookings.length)}–{Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length} bookings
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-md border-slate-200 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 w-8 p-0 rounded-md text-xs font-bold cursor-pointer",
                    currentPage === page
                      ? "bg-secondary text-white border-secondary hover:bg-secondary/90"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-md border-slate-200 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Action Confirmation Dialog */}
      {selectedBooking && dlg && (
        <Dialog open={true} onOpenChange={() => { if (!loading) { setSelectedBooking(null); setDialogMode(null); } }}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-lg">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <dlg.icon className="h-5 w-5" />
                {dlg.title}
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-sm">{dlg.desc}</DialogDescription>
            </DialogHeader>

            {dialogMode === "CANCEL" && (
              <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-1.5 text-xs text-orange-800">
                <h4 className="font-semibold text-orange-900 text-sm">Cancellation & Refund Policy</h4>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li><strong>Free Cancellation:</strong> Full refund within 48 hours of booking.</li>
                  <li><strong>Standard Fee:</strong> 15% fee after 48 hours but before 7 days of departure.</li>
                  <li><strong>Late Cancellation:</strong> No refund within 7 days of departure.</li>
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
              <Button variant="outline" disabled={loading} onClick={() => { setSelectedBooking(null); setDialogMode(null); }} className="cursor-pointer">
                Go Back
              </Button>
              <Button
                disabled={loading}
                className={cn("cursor-pointer", dlg.confirmStyle)}
                onClick={() => {
                  const action = dialogMode === "REJECT" ? "CANCEL" : dialogMode!;
                  executeAction(selectedBooking.id, action);
                }}
              >
                {loading ? "Processing..." : dlg.confirmLabel}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
