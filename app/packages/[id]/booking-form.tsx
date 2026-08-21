"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Users, CreditCard, ShieldCheck, ArrowRight, Clock, CalendarDays, Minus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/actions/bookings";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookingFormProps {
  packageId?: string;
  basePrice: number;
  currency: string;
  duration: number;
  departureDates?: Date[] | string[];
}

export default function BookingForm({ packageId, basePrice, currency, duration, departureDates = [] }: BookingFormProps) {
  const router = useRouter();
  const [travelDate, setTravelDate] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [gateway, setGateway] = useState<"razorpay" | "stripe">("razorpay");
  const [travelers, setTravelers] = useState<Array<{ name: string; age: string }>>([
    { name: "", age: "" },
  ]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddTraveler = () => {
    if (travelers.length >= 10) { toast.error("Maximum 10 travelers allowed."); return; }
    setTravelers([...travelers, { name: "", age: "" }]);
  };

  const handleRemoveTraveler = (index: number) => {
    if (travelers.length === 1) return;
    setTravelers(travelers.filter((_, i) => i !== index));
  };

  const handleTravelerChange = (index: number, field: "name" | "age", value: string) => {
    const updated = [...travelers];
    if (field === "age") {
      const num = parseInt(value);
      if (value && (num < 0 || num > 120)) return;
    }
    updated[index][field] = value;
    setTravelers(updated);
  };

  const totalAmount = basePrice * travelers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) { toast.error("Please select a travel date."); return; }
    for (let i = 0; i < travelers.length; i++) {
      if (!travelers[i].name.trim()) { toast.error(`Please enter a name for traveler #${i + 1}`); return; }
      if (!travelers[i].age.trim() || isNaN(parseInt(travelers[i].age))) { toast.error(`Please enter a valid age for traveler #${i + 1}`); return; }
    }

    setLoading(true);
    try {
      const formattedTravelers = travelers.map((t) => ({ name: t.name, age: parseInt(t.age) }));
      const booking = await createBooking({ packageId, travelDate, travelers: formattedTravelers, specialRequests, totalAmount, currency });
      const paymentResponse = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: booking.id, gateway }) });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Payment session initiation failed");

      if (gateway === "stripe") {
        if (paymentData.sessionUrl) { toast.success("Redirecting to Stripe..."); window.location.href = paymentData.sessionUrl; }
        else throw new Error("Stripe session URL not returned");
      } else if (gateway === "razorpay") {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) throw new Error("Failed to load Razorpay SDK.");
        toast.info("Opening Razorpay...");
        const options = {
          key: paymentData.key, amount: paymentData.amount, currency: paymentData.currency,
          name: "Waypoint Travel", description: `Booking #${booking.bookingNumber}`, order_id: paymentData.orderId,
          handler: async function (response: any) {
            setLoading(true);
            try {
              const verifyResponse = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gateway: "razorpay", bookingId: booking.id, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }) });
              const verifyData = await verifyResponse.json();
              if (verifyData.success) { toast.success("Payment verified!"); router.push("/dashboard/bookings?payment=success"); }
              else toast.error(verifyData.error || "Payment verification failed.");
            } catch { toast.error("Failed to verify payment."); } finally { setLoading(false); }
          },
          prefill: { name: travelers[0]?.name || "" },
          theme: { color: "#E46F44" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking. Please log in first.");
      if (err.message?.includes("logged in")) router.push("/login");
    } finally { setLoading(false); }
  };

  const availableDates = departureDates && departureDates.length > 0
    ? departureDates
    : [new Date(Date.now() + 864e5 * 10), new Date(Date.now() + 864e5 * 20), new Date(Date.now() + 864e5 * 30), new Date(Date.now() + 864e5 * 45)];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">

      {/* ═══ Price Header ═══ */}
      <div className="sm:p-6 p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Starting from</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/70">
              <Clock className="h-3 w-3" />
              {duration}D / {duration - 1}N
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold font-display tracking-tight">
              {formatCurrency(basePrice, currency)}
            </span>
            <span className="text-sm text-white/40 font-medium">/person</span>
          </div>
        </div>
      </div>


      {/* ═══ Form Body ═══ */}
      <form onSubmit={handleSubmit} className="sm:p-6 p-4 sm:space-y-6 space-y-5">

        {/* ── 1. Departure Date ── */}
        <div className="space-y-2.5">
          <label className="text-[13px] font-bold text-slate-800 block">
            Departure Date <span className="text-primary text-xs">*</span>
          </label>
          <Select value={travelDate} onValueChange={(v: string | null) => v && setTravelDate(v)}>
            <SelectTrigger className="w-full bg-[#FAFAF9] border border-slate-200 px-4 text-sm hover:border-slate-300 focus-visible:ring-2 focus-visible:!ring-primary/15 focus-visible:!border-primary/40 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
                <SelectValue placeholder="Choose your travel date" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 shadow-lg p-1.5 bg-white" alignItemWithTrigger={false} sideOffset={6}>
              {availableDates.map((dateObj, i) => {
                const d = new Date(dateObj);
                return (
                  <SelectItem
                    key={i}
                    value={d.toISOString().split("T")[0]}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:bg-primary/5 focus:text-slate-900 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      <span>{formatDate(d)}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>


        {/* ── 2. Travelers ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              Travelers <span className="text-primary text-xs">*</span>
              <span className="text-[11px] font-normal text-slate-400">({travelers.length})</span>
            </label>
            <button
              type="button"
              onClick={handleAddTraveler}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Add traveler
            </button>
          </div>

          {/* Scrollable traveler list — shows ~3, rest scroll */}
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-0.5 scrollbar-thin">
            {travelers.map((traveler, index) => (
              <div key={index} className="rounded-md border border-slate-200 bg-[#FAFAF9] p-3 space-y-2">
                {/* Row header */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Traveler {index + 1}</span>
                  {travelers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTraveler(index)}
                      className="text-[11px] font-medium text-rose-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
                {/* Fields row */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Full name"
                    value={traveler.name}
                    required
                    onChange={(e) => handleTravelerChange(index, "name", e.target.value)}
                    className="h-10 text-sm bg-white border-slate-200 rounded-lg flex-1 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/30"
                  />
                  <Input
                    placeholder="Age"
                    type="number"
                    min={1}
                    max={120}
                    value={traveler.age}
                    required
                    onChange={(e) => handleTravelerChange(index, "age", e.target.value)}
                    className="h-10 text-sm bg-white border-slate-200 rounded-lg w-20 text-center focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* ── 3. Special Requests ── */}
        <div className="space-y-2.5">
          <label className="text-[13px] font-bold text-slate-800 block">
            Special Requests <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>
          <Textarea
            id="specialRequests"
            placeholder="Dietary preferences, room configurations, accessibility needs..."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="bg-[#FAFAF9] text-sm border border-slate-200 rounded-xl resize-none focus:bg-white focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-colors"
            rows={2}
          />
        </div>


        {/* ── 4. Payment Method ── */}
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <label className="text-[13px] font-bold text-slate-800 block">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: "razorpay" as const, name: "Razorpay", desc: "UPI • Cards • NetBanking" },
              { key: "stripe" as const, name: "Stripe", desc: "International Cards" },
            ].map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGateway(g.key)}
                className={`relative p-3.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  gateway === g.key
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 bg-[#FAFAF9] hover:border-slate-300"
                }`}
              >
                {/* Radio indicator */}
                <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  gateway === g.key ? "border-primary bg-primary" : "border-slate-300"
                }`}>
                  {gateway === g.key && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className={`text-sm font-bold block ${gateway === g.key ? "text-slate-900" : "text-slate-600"}`}>
                  {g.name}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>


        {/* ── 5. Price Breakdown ── */}
        <div className="rounded-xl bg-[#FAFAF9] border border-slate-100 overflow-hidden">
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                {formatCurrency(basePrice, currency)} × {travelers.length} traveler{travelers.length !== 1 ? "s" : ""}
              </span>
              <span className="font-semibold text-slate-700">{formatCurrency(totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Trip duration</span>
              <span className="font-semibold text-slate-700">{duration} Days / {duration - 1} Nights</span>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-white px-4 py-3.5 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900">Total Amount</span>
            <span className="text-xl font-extrabold text-primary font-display">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </div>


        {/* ── 6. CTA Button ── */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Processing...
            </span>
          ) : (
            <>Confirm & Pay <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>

        {/* Trust */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Secure checkout</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <CreditCard className="h-3 w-3 text-slate-400" />
            <span>Instant confirmation</span>
          </div>
        </div>

      </form>
    </div>
  );
}
