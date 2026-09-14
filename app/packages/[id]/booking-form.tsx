"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Users,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Clock,
  CalendarDays,
  User,
  Mail,
  Phone,
  Utensils,
  CheckCircle2,
  Lock,
  CalendarCheck,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/actions/bookings";
import { formatCurrency, formatDate, formatLocalDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DepartureBatch {
  date: string;
  dateString: string;
  remainingSlots: number;
  totalSlots: number;
  bookedCount: number;
  isSoldOut: boolean;
}

interface BookingFormProps {
  packageId?: string;
  basePrice: number;
  currency: string;
  duration: number;
  departureDates?: Date[] | string[];
  departureBatches?: DepartureBatch[];
  maxGroupSize?: number;
  agencyVerified?: boolean;
}

export default function BookingForm({
  packageId,
  basePrice,
  currency,
  duration,
  departureDates = [],
  departureBatches = [],
  maxGroupSize = 15,
  agencyVerified = true,
}: BookingFormProps) {
  const router = useRouter();

  const hasBatches = Boolean(departureBatches && departureBatches.length > 0);

  // Date selection states
  const [dateMode, setDateMode] = useState<"scheduled" | "custom">(
    hasBatches ? "scheduled" : "custom"
  );
  const [travelDate, setTravelDate] = useState("");
  const [customDate, setCustomDate] = useState("");

  // Lead contact
  const [leadContact, setLeadContact] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Dietary preference
  const [dietary, setDietary] = useState("No preference");
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  // Travelers
  const [travelers, setTravelers] = useState<
    Array<{ name: string; age: string; gender: "Male" | "Female" | "Other" }>
  >([{ name: "", age: "", gender: "Male" }]);

  // Calculate today's date strictly in the user's local timezone (YYYY-MM-DD)
  // This prevents UTC offset bugs (e.g. UTC+5:30 IST rolling backward into yesterday via toISOString)
  const todayIso = useMemo(() => formatLocalDate(new Date()), []);
  const today = useMemo(() => new Date(todayIso + "T00:00:00"), [todayIso]);

  const batches = useMemo(() => {
    if (!departureBatches || departureBatches.length === 0) return [];
    return departureBatches.filter((b) => {
      const bLocalDate = formatLocalDate(b.date);
      return bLocalDate >= todayIso;
    });
  }, [departureBatches, todayIso]);

  const selectedBatch = useMemo(() => {
    if (dateMode !== "scheduled" || !travelDate) return null;
    return batches.find((b) => b.dateString === travelDate) || null;
  }, [dateMode, travelDate, batches]);

  const isSoldOut = Boolean(selectedBatch && selectedBatch.isSoldOut);
  const isOverCapacity = Boolean(
    dateMode === "scheduled" &&
    selectedBatch &&
    travelers.length > selectedBatch.remainingSlots
  );

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddTraveler = () => {
    if (dateMode === "scheduled" && selectedBatch) {
      if (travelers.length >= selectedBatch.remainingSlots) {
        toast.error(
          selectedBatch.remainingSlots === 0
            ? "This batch is sold out. Please select another date."
            : `Only ${selectedBatch.remainingSlots} slot(s) available for this batch.`
        );
        return;
      }
    }
    const hardLimit = maxGroupSize || 15;
    if (travelers.length >= hardLimit) {
      toast.error(`Maximum ${hardLimit} travelers allowed for this tour.`);
      return;
    }
    setTravelers([...travelers, { name: "", age: "", gender: "Male" }]);
  };

  const handleRemoveTraveler = (index: number) => {
    if (travelers.length === 1) return;
    setTravelers(travelers.filter((_, i) => i !== index));
  };

  const handleTravelerChange = (
    index: number,
    field: "name" | "age" | "gender",
    value: string
  ) => {
    const updated = [...travelers];
    if (field === "age") {
      const num = parseInt(value);
      if (value && (num < 0 || num > 120)) return;
    }
    (updated[index] as any)[field] = value;
    // Sync lead traveler name with contact if editing first traveler
    if (index === 0 && field === "name" && !leadContact.name) {
      setLeadContact((prev) => ({ ...prev, name: value }));
    }
    setTravelers(updated);
  };

  const totalAmount = basePrice * travelers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate date
    const finalDate = dateMode === "scheduled" ? travelDate : customDate;
    if (!finalDate) {
      toast.error(
        dateMode === "scheduled"
          ? "Please select a scheduled departure date."
          : "Please pick your preferred travel departure date."
      );
      return;
    }

    const selectedLocalDate = formatLocalDate(finalDate);
    if (selectedLocalDate < todayIso) {
      toast.error("Cannot book a departure date in the past. Please select an upcoming date.");
      return;
    }

    if (dateMode === "scheduled" && selectedBatch) {
      if (selectedBatch.isSoldOut || selectedBatch.remainingSlots <= 0) {
        toast.error("The selected departure batch is sold out. Please select another date.");
        return;
      }
      if (travelers.length > selectedBatch.remainingSlots) {
        toast.error(
          `Only ${selectedBatch.remainingSlots} slot(s) remaining for this departure batch. You have ${travelers.length} traveler(s).`
        );
        return;
      }
    }

    // 2. Validate lead contact
    if (!leadContact.email.trim() || !leadContact.email.includes("@")) {
      toast.error("Please provide a valid contact email for your booking voucher.");
      return;
    }
    if (!leadContact.phone.trim() || leadContact.phone.trim().length < 8) {
      toast.error("Please enter a valid phone number for tour coordination.");
      return;
    }

    // 3. Validate travelers
    for (let i = 0; i < travelers.length; i++) {
      if (!travelers[i].name.trim()) {
        toast.error(`Please enter full name for traveler #${i + 1}`);
        return;
      }
      if (!travelers[i].age.trim() || isNaN(parseInt(travelers[i].age))) {
        toast.error(`Please enter a valid age for traveler #${i + 1}`);
        return;
      }
    }

    if (!termsAgreed) {
      toast.error("Please agree to the booking policies and cancellation terms.");
      return;
    }

    setLoading(true);
    try {
      const formattedTravelers = travelers.map((t, idx) => ({
        name: t.name.trim(),
        age: parseInt(t.age),
        gender: t.gender,
        email: idx === 0 ? leadContact.email.trim() : undefined,
        phone: idx === 0 ? leadContact.phone.trim() : undefined,
      }));

      // Combine dietary preference into special requests if selected
      const combinedRequests = [
        dietary !== "No preference" ? `Dietary: ${dietary}` : null,
        leadContact.phone ? `Contact Phone: ${leadContact.phone.trim()}` : null,
        specialRequests.trim() ? specialRequests.trim() : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const booking = await createBooking({
        packageId,
        travelDate: finalDate,
        travelers: formattedTravelers,
        specialRequests: combinedRequests || undefined,
        totalAmount,
        currency,
      });

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, gateway: "razorpay" }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Payment session initiation failed");
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Failed to load Razorpay SDK.");

      toast.info("Opening Razorpay secure checkout...");

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Waypoint Travel",
        description: `Booking #${booking.bookingNumber}`,
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
              router.push("/dashboard/bookings?payment=success");
            } else {
              toast.error(verifyData.error || "Payment verification failed.");
            }
          } catch {
            toast.error("Failed to verify payment.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: leadContact.name || travelers[0]?.name || "",
          email: leadContact.email || "",
          contact: leadContact.phone || "",
        },
        theme: { color: "#E46F44" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking. Please log in first.");
      if (err.message?.includes("logged in")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* ═══ Price Header ═══ */}
      <div className="sm:p-6 p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Starting from
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-white/80">
              <Clock className="h-3 w-3" />
              {duration}D / {Math.max(1, duration - 1)}N
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-display tracking-tight">
              {formatCurrency(basePrice, currency)}
            </span>
            <span className="text-sm text-white/50 font-medium">/person</span>
          </div>
          <p className="text-[11px] text-white/60 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Verified agency package · Taxes &amp; GST included
          </p>
        </div>
      </div>

      {/* ═══ Form Body ═══ */}
      <form onSubmit={handleSubmit} className="sm:p-6 p-4 sm:space-y-6 space-y-5">
        {/* ── 1. Departure Date ── */}
        <div className="space-y-2.5">
          {hasBatches ? (
            <>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" /> Departure Date
                  <span className="text-primary text-xs">*</span>
                </label>

                {/* Mode Switcher */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setDateMode("scheduled")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      dateMode === "scheduled"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Fixed Batches
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode("custom")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      dateMode === "custom"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Private Tour
                  </button>
                </div>
              </div>

              {dateMode === "scheduled" ? (
                <div className="space-y-2.5">
                  <Select
                    value={travelDate}
                    onValueChange={(v: string | null) => v && setTravelDate(v)}
                  >
                    <SelectTrigger className="w-full bg-[#FAFAF9] border border-slate-200 px-4 text-sm hover:border-slate-300 focus-visible:ring-2 focus-visible:!ring-primary/15 focus-visible:!border-primary/40 transition-all cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <CalendarCheck className="h-4 w-4 text-slate-400 shrink-0" />
                        <SelectValue placeholder="Choose a scheduled batch departure" />
                      </div>
                    </SelectTrigger>
                    <SelectContent
                      className="rounded-xl border border-slate-200 shadow-lg p-1.5 bg-white max-h-64"
                      alignItemWithTrigger={false}
                      sideOffset={6}
                    >
                      {batches.map((batch, i) => (
                        <SelectItem
                          key={i}
                          value={batch.dateString}
                          disabled={batch.isSoldOut}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-primary/5 focus:text-slate-900 cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                              <span className="font-semibold text-slate-900">
                                {formatDate(batch.date)}
                              </span>
                            </div>
                            {batch.isSoldOut ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                                🔴 Sold Out
                              </span>
                            ) : batch.remainingSlots <= 5 ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                                🟠 Only {batch.remainingSlots} left!
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                🟢 {batch.remainingSlots} slots left
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selected Batch Capacity Card */}
                  {selectedBatch && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        selectedBatch.isSoldOut
                          ? "bg-rose-50/80 border-rose-200 text-rose-800"
                          : selectedBatch.remainingSlots <= 5
                          ? "bg-amber-50/80 border-amber-200 text-amber-800"
                          : "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Group Batch: {selectedBatch.totalSlots} max travelers
                        </span>
                        <span>
                          {selectedBatch.isSoldOut
                            ? "Sold Out (0 slots left)"
                            : `${selectedBatch.remainingSlots} slot${
                                selectedBatch.remainingSlots === 1 ? "" : "s"
                              } left`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            selectedBatch.isSoldOut
                              ? "bg-rose-500"
                              : selectedBatch.remainingSlots <= 5
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (selectedBatch.bookedCount /
                                  selectedBatch.totalSlots) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] opacity-80">
                        {selectedBatch.bookedCount} traveler
                        {selectedBatch.bookedCount === 1 ? "" : "s"} already booked for this batch.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="date"
                    min={todayIso}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-[#FAFAF9] border border-slate-200 px-4 text-sm rounded-lg font-medium"
                  />
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11.5px] text-indigo-900 leading-relaxed flex items-start gap-2">
                    <Compass className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-indigo-950 font-semibold">
                        Private Tour Departure (Custom Date)
                      </strong>
                      <span>
                        Can&apos;t make the scheduled group batches? Choose any travel date. The agency will organize dedicated private transport, local tour guide, and hotel check-in exclusively for your traveling party.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" /> Departure Date
                  <span className="text-primary text-xs">*</span>
                </label>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  Flexible / Private Tour
                </span>
              </div>

              <div className="space-y-2">
                <Input
                  type="date"
                  min={todayIso}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-[#FAFAF9] border border-slate-200 px-4 text-sm rounded-lg font-medium"
                />
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11.5px] text-blue-900 leading-relaxed flex items-start gap-2">
                  <Compass className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-blue-950 font-semibold">
                      On-Demand Tour Departure
                    </strong>
                    <span>
                      This package operates on-demand exclusively for your group. Choose your desired start date, and the agency will reserve dedicated transport and accommodations.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 2. Primary Lead Contact (For Voucher & Tickets) ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" /> Lead Contact Details
              <span className="text-primary text-xs">*</span>
            </label>
            <span className="text-[10px] text-slate-400">Voucher recipient</span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              <Input
                type="email"
                placeholder="Email for tickets *"
                required
                value={leadContact.email}
                onChange={(e) =>
                  setLeadContact({ ...leadContact, email: e.target.value })
                }
                className="h-10 text-xs sm:text-sm pl-9 bg-[#FAFAF9] border-slate-200 rounded-lg"
              />
            </div>
            <div className="relative">
              <Phone className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              <Input
                type="tel"
                placeholder="Phone (e.g. +91 98765 43210) *"
                required
                value={leadContact.phone}
                onChange={(e) =>
                  setLeadContact({ ...leadContact, phone: e.target.value })
                }
                className="h-10 text-xs sm:text-sm pl-9 bg-[#FAFAF9] border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ── 3. Travelers List (Name, Age, Gender) ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Travelers
                <span className="text-primary text-xs">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                ({travelers.length})
              </span>
              {dateMode === "scheduled" && selectedBatch && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedBatch.isSoldOut
                      ? "text-rose-700 bg-rose-50 border-rose-200"
                      : selectedBatch.remainingSlots <= 5
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200"
                  }`}
                >
                  {selectedBatch.isSoldOut
                    ? "Batch Full"
                    : `${selectedBatch.remainingSlots} slot${
                        selectedBatch.remainingSlots === 1 ? "" : "s"
                      } remaining`}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddTraveler}
              disabled={
                Boolean(
                  (dateMode === "scheduled" &&
                    selectedBatch &&
                    travelers.length >= selectedBatch.remainingSlots) ||
                    travelers.length >= (maxGroupSize || 15)
                )
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 text-[11px] font-bold text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Add traveler
            </button>
          </div>

          {/* Over Capacity Warning Alert */}
          {isOverCapacity && selectedBatch && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                Batch Capacity Limit Exceeded
              </div>
              <p className="leading-relaxed">
                You have {travelers.length} travelers in this booking, but this departure date only has{" "}
                <strong>{selectedBatch.remainingSlots} slot(s) left</strong>. Please remove{" "}
                {travelers.length - selectedBatch.remainingSlots} traveler(s) or pick another departure date.
              </p>
            </div>
          )}

          {/* Traveler Cards List */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
            {travelers.map((traveler, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-[#FAFAF9] p-3.5 space-y-2.5"
              >
                {/* Traveler Card Header */}
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px]">
                      {index + 1}
                    </span>
                    {index === 0 ? "Lead Traveler" : `Traveler #${index + 1}`}
                  </span>
                  {travelers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTraveler(index)}
                      className="text-[11px] font-medium text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>

                {/* Form row: Full Name, Age, Gender */}
                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder="Full Name (as on ID) *"
                      value={traveler.name}
                      required
                      onChange={(e) =>
                        handleTravelerChange(index, "name", e.target.value)
                      }
                      className="h-9 text-xs sm:text-sm bg-white border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      placeholder="Age *"
                      type="number"
                      min={1}
                      max={120}
                      value={traveler.age}
                      required
                      onChange={(e) =>
                        handleTravelerChange(index, "age", e.target.value)
                      }
                      className="h-9 text-xs sm:text-sm bg-white border-slate-200 rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <Select
                      value={traveler.gender}
                      onValueChange={(val: string | null) =>
                        val && handleTravelerChange(index, "gender", val)
                      }
                    >
                      <SelectTrigger className="h-9 py-0 w-full bg-white border-slate-200 rounded-lg text-xs sm:text-sm hover:border-slate-300 focus-visible:ring-1 focus-visible:ring-primary/20 cursor-pointer">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent
                        className="rounded-xl border border-slate-200 shadow-lg p-1 bg-white"
                        alignItemWithTrigger={false}
                        sideOffset={4}
                      >
                        <SelectItem
                          value="Male"
                          className="rounded-lg text-xs sm:text-sm cursor-pointer"
                        >
                          Male
                        </SelectItem>
                        <SelectItem
                          value="Female"
                          className="rounded-lg text-xs sm:text-sm cursor-pointer"
                        >
                          Female
                        </SelectItem>
                        <SelectItem
                          value="Other"
                          className="rounded-lg text-xs sm:text-sm cursor-pointer"
                        >
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Dietary & Travel Preferences ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-primary" /> Meal &amp; Dietary
              Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-semibold">
              {[
                "No preference",
                "Vegetarian",
                "Non-Veg",
                "Jain Food",
              ].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDietary(opt)}
                  className={`py-1.5 px-2 rounded-sm border text-center transition-all cursor-pointer ${
                    dietary === opt
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-[#FAFAF9] border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-700 block">
              Special Requests or Pickup Info{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Textarea
              id="specialRequests"
              placeholder="e.g. Flight arrival timing, wheelchair access, bed preference..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="bg-[#FAFAF9] text-xs sm:text-sm border border-slate-200 rounded-xl resize-none focus:bg-white transition-colors"
              rows={2}
            />
          </div>
        </div>

        {/* ── 5. Payment Gateway ── */}
        <div className="border-t border-slate-100 pt-4">
          <div className="relative p-3.5 rounded-xl border-2 border-primary bg-primary/5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900">
                  Razorpay Secure Checkout
                </span>
                <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  Active
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                UPI • Google Pay • PhonePe • Credit/Debit Cards • NetBanking
              </span>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        </div>

        {/* ── 6. Price Breakdown & Order Summary ── */}
        <div className="rounded-xl bg-[#FAFAF9] border border-slate-200/80 overflow-hidden">
          <div className="p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>
                Base Tour Fare ({formatCurrency(basePrice, currency)} ×{" "}
                {travelers.length})
              </span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST &amp; Tourism Levies (5%)</span>
              <span className="font-semibold text-emerald-600">
                Included in Fare
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tour Duration</span>
              <span className="font-semibold text-slate-800">
                {duration} Days / {Math.max(1, duration - 1)} Nights
              </span>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 flex justify-between items-center">
            <div>
              <span className="text-sm font-bold text-slate-900 block leading-tight">
                Total Payable
              </span>
              <span className="text-[10px] text-slate-400">All inclusive</span>
            </div>
            <span className="text-2xl font-bold text-primary font-display">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </div>

        {/* ── 7. Terms Agreement & Cancellation Policy ── */}
        <div className="space-y-3 pt-1">
          <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/60 p-2.5 text-[11px] text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Free cancellation:</strong> 100% refund up to 7 days before
              departure. Easy one-click cancellation from traveler dashboard.
            </span>
          </div>

          <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
            />
            <span>
              I agree to the{" "}
              <span className="text-primary underline">Booking Policies</span>,{" "}
              <span className="text-primary underline">Terms of Service</span>, and
              confirm travelers meet fitness prerequisites.
            </span>
          </label>
        </div>

        {/* ── 8. Agency Verification Alert if pending ── */}
        {!agencyVerified && (
          <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Agency Verification In Progress</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              This agency&apos;s business credentials are currently under verification review by Waypoint Admins. Bookings will open immediately once verification is approved.
            </p>
          </div>
        )}

        {/* ── 9. CTA Button ── */}
        <Button
          type="submit"
          disabled={loading || !agencyVerified || isSoldOut || isOverCapacity}
          className="w-full"
        >
          {!agencyVerified ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Clock className="h-4 w-4" />
              Verification Pending — Bookings Paused
            </span>
          ) : isSoldOut ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              Departure Sold Out — Pick Another Date
            </span>
          ) : isOverCapacity ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              Batch Slots Exceeded ({selectedBatch?.remainingSlots} remaining)
            </span>
          ) : loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Initiating Secure Payment...
            </span>
          ) : (
            <>
              Confirm Booking &amp; Pay {formatCurrency(totalAmount, currency)}{" "}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <span>256-bit SSL Encrypted</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1">
            <span>{agencyVerified ? "Verified Agency" : "Verification Pending"}</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1">
            <span>Instant Confirmation</span>
          </div>
        </div>
      </form>
    </div>
  );
}
