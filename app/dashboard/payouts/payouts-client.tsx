"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Wallet,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Send,
  Sliders,
  Landmark,
  ShieldAlert,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createPayoutRequestAction,
  approvePayoutAction,
  settlePayoutAction,
  cancelPayoutAction,
} from "@/app/actions/payout-actions";
import {
  updatePlatformSettingsAction,
  updateAgencyCommissionOverrideAction,
  updateAgencyBankDetailsAction,
} from "@/app/actions/settings-actions";
import { toast } from "sonner";

interface PayoutsClientProps {
  role: "ADMIN" | "AGENCY" | "STAFF" | "TRAVELER";
  payouts: any[];
  agencies?: any[];
  agency?: any;
  platformSettings: {
    commissionRate: number;
    minPayoutAmount: number;
    payoutHoldDays: number;
  };
  effectiveCommissionRate?: number;
  adminMetrics?: {
    pendingAmount: number;
    settledAmount: number;
    totalCommissionEarned: number;
    payoutCount: number;
  };
  agencyMetrics?: {
    grossVolume: number;
    netEarningsTotal: number;
    netHoldingTotal: number;
    availableGrossForPayout: number;
    availableNetForPayout: number;
    alreadyRequestedOrPaidGross: number;
    totalSettled: number;
  };
}

/* ── Stat Card Component matching project design ── */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  highlight = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow",
        highlight
          ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-900"
          : "bg-white border-slate-200/60"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider truncate",
              highlight ? "text-slate-300" : "text-slate-400"
            )}
          >
            {title}
          </p>
          <p className={cn("text-lg font-bold truncate", highlight ? "text-white" : "text-slate-900")}>
            {value}
          </p>
          <p className={cn("text-[11px] truncate", highlight ? "text-emerald-400 font-medium" : "text-slate-500")}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PayoutsClient({
  role,
  payouts,
  agencies = [],
  agency,
  platformSettings,
  effectiveCommissionRate = 0.1,
  adminMetrics,
  agencyMetrics,
}: PayoutsClientProps) {
  const router = useRouter();

  // Modal states
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Active selections
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [currentAgency, setCurrentAgency] = useState<any>(agency);

  // Form states
  const [payoutGrossAmount, setPayoutGrossAmount] = useState<number>(
    agencyMetrics ? Math.round((agencyMetrics.availableGrossForPayout || 0) * 100) / 100 : 0
  );

  useEffect(() => {
    if (agencyMetrics?.availableGrossForPayout !== undefined) {
      setPayoutGrossAmount(Math.round(agencyMetrics.availableGrossForPayout * 100) / 100);
    }
  }, [agencyMetrics?.availableGrossForPayout]);
  const [utrNumber, setUtrNumber] = useState("");
  const [settleNotes, setSettleNotes] = useState("");

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bankAccountName:
      agency?.bankAccountName || (agency?.name ? `${agency.name} Pvt Ltd` : "Wanderlust Travels Pvt Ltd"),
    bankAccountNumber: agency?.bankAccountNumber || "50100987654321",
    bankIfscCode: agency?.bankIfscCode || "HDFC0001234",
    bankName: agency?.bankName || "HDFC Bank",
    upiId:
      agency?.upiId || (agency?.slug ? `${agency.slug}@hdfcbank` : "wanderlust-travels@hdfcbank"),
  });

  // Admin Settings Form State
  const [globalSettingsForm, setGlobalSettingsForm] = useState({
    commissionRate: (platformSettings.commissionRate * 100).toString(),
    minPayoutAmount: platformSettings.minPayoutAmount.toString(),
    payoutHoldDays: platformSettings.payoutHoldDays.toString(),
  });

  // Commission override form
  const [overrideRate, setOverrideRate] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Handlers
  const handleRequestPayout = async () => {
    const hasBank = currentAgency?.bankAccountNumber || bankForm.bankAccountNumber;
    const hasUpi = currentAgency?.upiId || bankForm.upiId;

    if (!hasBank && !hasUpi) {
      toast.error("Please configure your bank details or UPI ID first.");
      setBankModalOpen(true);
      return;
    }

    if (payoutGrossAmount < platformSettings.minPayoutAmount) {
      toast.error(
        `Minimum payout request is ${formatCurrency(platformSettings.minPayoutAmount, "INR")}`
      );
      return;
    }

    try {
      setLoading(true);
      await createPayoutRequestAction({ grossAmount: payoutGrossAmount });
      toast.success("Payout request submitted successfully!");
      setRequestModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payout request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    try {
      setLoading(true);
      await approvePayoutAction(payoutId);
      toast.success("Payout request approved!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve payout");
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedPayout) return;
    if (!utrNumber.trim()) {
      toast.error("Please enter a valid Bank UTR / Transaction Reference Number");
      return;
    }

    try {
      setLoading(true);
      await settlePayoutAction(selectedPayout.id, utrNumber, settleNotes);
      toast.success("Payout marked as SETTLED with UTR!");
      setSettleModalOpen(false);
      setSelectedPayout(null);
      setUtrNumber("");
      setSettleNotes("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to settle payout");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (payoutId: string) => {
    try {
      setLoading(true);
      await cancelPayoutAction(payoutId, "Cancelled by Admin");
      toast.success("Payout request cancelled.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel payout");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    const targetAgencyId = currentAgency?.id || agency?.id;
    if (!targetAgencyId) return;
    try {
      setLoading(true);
      await updateAgencyBankDetailsAction(targetAgencyId, bankForm);
      setCurrentAgency((prev: any) => ({
        ...prev,
        ...bankForm,
      }));
      toast.success("Bank & Payment details saved!");
      setBankModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update bank details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    try {
      setLoading(true);
      const rate = parseFloat(globalSettingsForm.commissionRate) / 100;
      const minAmt = parseFloat(globalSettingsForm.minPayoutAmount);
      const hold = parseInt(globalSettingsForm.payoutHoldDays, 10);

      if (isNaN(rate) || rate < 0 || rate > 1) {
        toast.error("Commission rate must be between 0% and 100%");
        return;
      }

      await updatePlatformSettingsAction({
        commissionRate: rate,
        minPayoutAmount: minAmt,
        payoutHoldDays: hold,
      });

      toast.success("Platform settings updated successfully!");
      setSettingsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommissionOverride = async () => {
    if (!selectedAgency) return;
    try {
      setLoading(true);
      const rate = overrideRate.trim() === "" ? null : parseFloat(overrideRate) / 100;
      await updateAgencyCommissionOverrideAction(selectedAgency.id, rate);
      toast.success(`Commission override for ${selectedAgency.name} updated!`);
      setCommissionModalOpen(false);
      setSelectedAgency(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to set custom commission rate");
    } finally {
      setLoading(false);
    }
  };

  // Filter payouts
  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      (p.agency?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionRef || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fillTestBankDetails = () => {
    setBankForm({
      bankAccountName: agency?.name ? `${agency.name} Pvt Ltd` : "Waypoint Test Agency Pvt Ltd",
      bankName: "HDFC Bank",
      bankIfscCode: "HDFC0001234",
      bankAccountNumber: "50100987654321",
      upiId: agency?.slug ? `${agency.slug}@hdfcbank` : "waypointtest@hdfcbank",
    });
    toast.info("Populated test banking details.");
  };

  const fillTestUtr = () => {
    const randomRef = `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setUtrNumber(randomRef);
    setSettleNotes("Processed via HDFC Corporate Netbanking (Test Mode)");
    toast.info(`Generated test UTR reference: ${randomRef}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Wallet className="h-7 w-7 text-primary" />
            {role === "ADMIN" ? "Platform Agency Payouts" : "Agency Earnings & Payouts"}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {role === "ADMIN"
              ? "Manage agency settlement balances, approve payouts, and configure global platform commission rates."
              : "Track gross sales, platform commission deductions, and request direct bank settlements."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role === "ADMIN" && (
            <Button
              variant="outline"
              onClick={() => setSettingsModalOpen(true)}
              className="gap-2 border-slate-200 shadow-xs cursor-pointer hover:bg-slate-50"
            >
              <Sliders className="h-4 w-4 text-slate-600" />
              Platform Settings
            </Button>
          )}

          {role === "AGENCY" && (
            <>
              <Button
                variant="outline"
                onClick={() => setBankModalOpen(true)}
                className="gap-2 border-slate-200 shadow-xs cursor-pointer hover:bg-slate-50"
              >
                <Landmark className="h-4 w-4 text-emerald-600" />
                Bank Details
              </Button>
              <Button
                onClick={() => {
                  setPayoutGrossAmount(
                    agencyMetrics ? Math.round((agencyMetrics.availableGrossForPayout || 0) * 100) / 100 : 0
                  );
                  setRequestModalOpen(true);
                }}
                className="gap-2 bg-primary text-white shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Request Payout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      {role === "ADMIN" && adminMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Settlement"
            value={formatCurrency(adminMetrics.pendingAmount, "INR")}
            subtitle="Awaiting approval or UTR settlement"
            icon={Clock}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Total Settled"
            value={formatCurrency(adminMetrics.settledAmount, "INR")}
            subtitle="Disbursed to agencies with UTR"
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Platform Revenue"
            value={formatCurrency(adminMetrics.totalCommissionEarned, "INR")}
            subtitle={`Default rate: ${(platformSettings.commissionRate * 100).toFixed(0)}%`}
            icon={DollarSign}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            title="Payout Hold Period"
            value={`${platformSettings.payoutHoldDays} Days`}
            subtitle={`Min amount: ₹${platformSettings.minPayoutAmount}`}
            icon={ShieldAlert}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
          />
        </div>
      )}

      {role === "AGENCY" && agencyMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Gross Booking Sales"
            value={formatCurrency(agencyMetrics.grossVolume, "INR")}
            subtitle="Collected via platform checkout"
            icon={Banknote}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Net Earnings"
            value={formatCurrency(agencyMetrics.netEarningsTotal, "INR")}
            subtitle={`After ${(effectiveCommissionRate * 100).toFixed(0)}% platform fee`}
            icon={DollarSign}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            title="Available for Payout"
            value={formatCurrency(agencyMetrics.availableNetForPayout || 0, "INR")}
            subtitle={`Ready for transfer (Gross: ${formatCurrency(agencyMetrics.availableGrossForPayout || 0, "INR")})`}
            icon={Wallet}
            iconBg="bg-white/10"
            iconColor="text-emerald-400"
            highlight={true}
          />
          <StatCard
            title="Total Settled"
            value={formatCurrency(agencyMetrics.totalSettled, "INR")}
            subtitle="Received in bank account"
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>
      )}

      {/* Admin Agencies Commission Override Section */}
      {role === "ADMIN" && agencies.length > 0 && (
        <Card className="border border-slate-200/60 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-primary" />
                  Agencies & Custom Commission Rates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set custom commission overrides per agency. If unconfigured, default rate (
                  {(platformSettings.commissionRate * 100).toFixed(0)}%) applies.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agencies.map((ag) => (
                <div
                  key={ag.id}
                  className="p-3.5 rounded-lg border border-slate-200/60 bg-slate-50/60 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
                      {ag.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Commission:{" "}
                      <span className="font-semibold text-primary">
                        {ag.commissionRate !== null && ag.commissionRate !== undefined
                          ? `${(Number(ag.commissionRate) * 100).toFixed(0)}% (Custom)`
                          : `${(platformSettings.commissionRate * 100).toFixed(0)}% (Default)`}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgency(ag);
                      setOverrideRate(
                        ag.commissionRate !== null && ag.commissionRate !== undefined
                          ? (Number(ag.commissionRate) * 100).toString()
                          : ""
                      );
                      setCommissionModalOpen(true);
                    }}
                    className="text-xs h-8 px-2.5 cursor-pointer border-slate-200"
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History & Requests Table */}
      <div className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payout Transactions & Ledger</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete log of settlement requests, status changes, and bank UTR numbers.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search UTR or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SETTLED">Settled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredPayouts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No payout transactions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {role === "AGENCY"
                ? "You haven't submitted any payout requests yet. Once your bookings complete the hold period, click Request Payout above."
                : "No payout requests match the selected filters."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200/60">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Transaction ID & Date
                </TableHead>
                {role === "ADMIN" && (
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Agency
                  </TableHead>
                )}
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Gross Sales
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Platform Fee
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Net Payout
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Bank Reference / UTR
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredPayouts.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-700">
                    <p className="text-xs font-semibold text-slate-900 font-sans">
                      #{p.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(p.createdAt)}</p>
                  </TableCell>

                  {role === "ADMIN" && (
                    <TableCell className="font-medium text-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {p.agency?.name?.charAt(0) || "A"}
                        </div>
                        <span>{p.agency?.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="font-medium text-slate-700 text-xs">
                    {formatCurrency(Number(p.grossAmount), p.currency)}
                  </TableCell>

                  <TableCell className="font-medium text-slate-500 text-xs">
                    {formatCurrency(Number(p.commissionAmount), p.currency)}{" "}
                    <span className="text-[10px] text-slate-400">
                      ({(Number(p.commissionRate) * 100).toFixed(0)}%)
                    </span>
                  </TableCell>

                  <TableCell className="font-bold text-slate-900 text-sm">
                    {formatCurrency(Number(p.netAmount), p.currency)}
                  </TableCell>

                  <TableCell>
                    {p.status === "PENDING" && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 py-0.5 text-[10px] font-bold">
                        <Clock className="h-3 w-3" /> PENDING
                      </Badge>
                    )}
                    {p.status === "APPROVED" && (
                      <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 gap-1.5 py-0.5 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> APPROVED
                      </Badge>
                    )}
                    {p.status === "SETTLED" && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 py-0.5 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> SETTLED
                      </Badge>
                    )}
                    {p.status === "CANCELLED" && (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 gap-1.5 py-0.5 text-[10px] font-bold">
                        <XCircle className="h-3 w-3" /> CANCELLED
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-slate-600 font-mono text-xs">
                    {p.transactionRef ? (
                      <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md font-semibold">
                        {p.transactionRef}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Pending Bank UTR</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    {role === "ADMIN" && (
                      <>
                        {p.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loading}
                              onClick={() => handleApprove(p.id)}
                              className="text-xs h-7 px-2.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loading}
                              onClick={() => handleCancel(p.id)}
                              className="text-xs h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {p.status === "APPROVED" && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={loading}
                            onClick={() => {
                              setSelectedPayout(p);
                              setSettleModalOpen(true);
                            }}
                            className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            Mark Settled (UTR)
                          </Button>
                        )}
                      </>
                    )}

                    {role === "AGENCY" && p.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleCancel(p.id)}
                        className="text-xs h-7 px-2.5 border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        Cancel Request
                      </Button>
                    )}

                    {p.status === "SETTLED" && (
                      <span className="text-xs text-emerald-600 font-medium">Completed</span>
                    )}
                    {p.status === "CANCELLED" && (
                      <span className="text-xs text-slate-400">Voided</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* REQUEST PAYOUT MODAL (Agency) */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="glass-card border border-slate-200/60 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Request Bank Settlement
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Transfer funds from platform collection to your registered agency bank account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Net Bank Transfer Ready:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(agencyMetrics?.availableNetForPayout || 0, "INR")}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gross Sales Eligible:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(agencyMetrics?.availableGrossForPayout || 0, "INR")}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee Rate:</span>
                <span className="font-semibold text-primary">
                  {(effectiveCommissionRate * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Minimum Withdrawal:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(platformSettings.minPayoutAmount, "INR")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Gross Sales Amount to Disburse (INR)</Label>
                {agencyMetrics?.availableGrossForPayout && (
                  <button
                    type="button"
                    onClick={() =>
                      setPayoutGrossAmount(
                        Math.round((agencyMetrics.availableGrossForPayout || 0) * 100) / 100
                      )
                    }
                    className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    Withdraw Max
                  </button>
                )}
              </div>
              <Input
                type="number"
                step="0.01"
                value={payoutGrossAmount ? (Math.round(payoutGrossAmount * 100) / 100).toString() : ""}
                onChange={(e) => setPayoutGrossAmount(Math.round(Number(e.target.value) * 100) / 100)}
                min={platformSettings.minPayoutAmount}
                max={agencyMetrics?.availableGrossForPayout}
                className="text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-500">
                Net payout after {(effectiveCommissionRate * 100).toFixed(0)}% platform fee will be:{" "}
                <strong className="text-slate-900">
                  {formatCurrency(payoutGrossAmount * (1 - effectiveCommissionRate), "INR")}
                </strong>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRequestModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRequestPayout} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARK SETTLED UTR MODAL (Admin) */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent className="glass-card border border-slate-200/60 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Settle Agency Payout
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter the bank UTR / NEFT reference number after transferring funds to the agency.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-xs space-y-1">
                <p className="font-semibold text-emerald-950">
                  Agency: {selectedPayout.agency?.name}
                </p>
                <p className="text-emerald-800 font-bold text-sm">
                  Amount to transfer: {formatCurrency(Number(selectedPayout.netAmount), selectedPayout.currency)}
                </p>
                <p className="text-slate-600 font-mono text-[11px] mt-1">
                  Bank: {selectedPayout.agency?.bankName || "N/A"} | Account: {selectedPayout.agency?.bankAccountNumber || "N/A"} | IFSC: {selectedPayout.agency?.bankIfscCode || "N/A"} | UPI: {selectedPayout.agency?.upiId || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Bank UTR / Transaction Reference *</Label>
                  <button
                    type="button"
                    onClick={fillTestUtr}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Generate Test UTR
                  </button>
                </div>
                <Input
                  placeholder="e.g. CMS18274910283 or UTR9283719"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="font-mono text-sm uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Settlement Notes (Optional)</Label>
                <Input
                  placeholder="e.g. Processed via HDFC Corporate Netbanking"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSettleModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSettle}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AGENCY BANK DETAILS MODAL */}
      <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
        <DialogContent className="glass-card border border-slate-200/60 max-w-lg">
          <DialogHeader className="flex-col items-start gap-3">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-600" /> Agency Bank & Payment Details
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Provide your official business account details for receiving direct payouts.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillTestBankDetails}
              className="text-xs text-primary border-primary/20 hover:bg-primary/5 shrink-0"
            >
              Fill Test Details
            </Button>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">Account Holder Name</Label>
              <Input
                placeholder="e.g. Horizon Travels Pvt Ltd"
                value={bankForm.bankAccountName}
                onChange={(e) => setBankForm({ ...bankForm, bankAccountName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Bank Name</Label>
              <Input
                placeholder="e.g. HDFC Bank / ICICI Bank"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">IFSC Code</Label>
              <Input
                placeholder="e.g. HDFC0001234"
                value={bankForm.bankIfscCode}
                onChange={(e) => setBankForm({ ...bankForm, bankIfscCode: e.target.value.toUpperCase() })}
                className="text-xs uppercase font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">Account Number</Label>
              <Input
                placeholder="e.g. 50100293847192"
                value={bankForm.bankAccountNumber}
                onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">UPI ID / VPA (Optional)</Label>
              <Input
                placeholder="e.g. horizontravels@hdfcbank"
                value={bankForm.upiId}
                onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBankModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveBankDetails} disabled={loading}>
              Save Bank Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PLATFORM GLOBAL SETTINGS MODAL (Admin) */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="glass-card border border-slate-200/60 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" /> Platform Commission & Payout Rules
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure global defaults for platform commission, payout hold period, and minimum transfer amount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Default Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="10"
                value={globalSettingsForm.commissionRate}
                onChange={(e) =>
                  setGlobalSettingsForm({ ...globalSettingsForm, commissionRate: e.target.value })
                }
                className="text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-400">Percentage deducted from gross booking payments.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Minimum Payout Amount (₹)</Label>
              <Input
                type="number"
                placeholder="1000"
                value={globalSettingsForm.minPayoutAmount}
                onChange={(e) =>
                  setGlobalSettingsForm({ ...globalSettingsForm, minPayoutAmount: e.target.value })
                }
                className="text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Payout Hold Period (Days)</Label>
              <Input
                type="number"
                placeholder="7"
                value={globalSettingsForm.payoutHoldDays}
                onChange={(e) =>
                  setGlobalSettingsForm({ ...globalSettingsForm, payoutHoldDays: e.target.value })
                }
                className="text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-400">
                Number of days booking funds remain in hold state before becoming eligible for payout.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSettingsModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveGlobalSettings} disabled={loading}>
              Save Platform Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AGENCY CUSTOM OVERRIDE MODAL (Admin) */}
      <Dialog open={commissionModalOpen} onOpenChange={setCommissionModalOpen}>
        <DialogContent className="glass-card border border-slate-200/60 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Set Custom Commission for {selectedAgency?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Override the platform default commission rate for this specific agency.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Custom Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="Leave blank to reset to default platform rate"
                value={overrideRate}
                onChange={(e) => setOverrideRate(e.target.value)}
                className="text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-500">
                Default rate is: {(platformSettings.commissionRate * 100).toFixed(0)}%. Enter a number (e.g. 8 for 8%) or leave empty to clear custom rate.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCommissionModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveCommissionOverride} disabled={loading}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
