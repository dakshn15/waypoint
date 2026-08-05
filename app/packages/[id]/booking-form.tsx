"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Calendar, Users, CreditCard } from "lucide-react";
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
    if (travelers.length >= 10) {
      toast.error("Maximum 10 travelers allowed per booking.");
      return;
    }
    setTravelers([...travelers, { name: "", age: "" }]);
  };

  const handleRemoveTraveler = (index: number) => {
    if (travelers.length === 1) return;
    setTravelers(travelers.filter((_, i) => i !== index));
  };

  const handleTravelerChange = (index: number, field: "name" | "age", value: string) => {
    const updated = [...travelers];
    updated[index][field] = value;
    setTravelers(updated);
  };

  const totalAmount = basePrice * travelers.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) {
      toast.error("Please select a travel date.");
      return;
    }

    // Validate travelers
    for (let i = 0; i < travelers.length; i++) {
      if (!travelers[i].name.trim()) {
        toast.error(`Please enter a name for traveler #${i + 1}`);
        return;
      }
      if (!travelers[i].age.trim() || isNaN(parseInt(travelers[i].age))) {
        toast.error(`Please enter a valid age for traveler #${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const formattedTravelers = travelers.map((t) => ({
        name: t.name,
        age: parseInt(t.age),
      }));

      // 1. Create Booking in database
      const booking = await createBooking({
        packageId,
        travelDate,
        travelers: formattedTravelers,
        specialRequests,
        totalAmount,
        currency,
      });

      // 2. Initiate Payment Session
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          gateway,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Payment session initiation failed");
      }

      if (gateway === "stripe") {
        if (paymentData.sessionUrl) {
          toast.success("Redirecting to Stripe payment gateway...");
          window.location.href = paymentData.sessionUrl;
        } else {
          throw new Error("Stripe session URL not returned from server");
        }
      } else if (gateway === "razorpay") {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Failed to load Razorpay SDK. Please check your network connection.");
        }

        toast.info("Opening Razorpay payment portal...");

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
              // 3. Verify Payment
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
                toast.success("Payment verified successfully! Welcome aboard.");
                router.push("/dashboard/bookings?payment=success");
              } else {
                toast.error(verifyData.error || "Payment verification failed.");
              }
            } catch (err: any) {
              toast.error("Failed to verify Razorpay signature.");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: travelers[0]?.name || "",
          },
          theme: {
            color: "#0D9488",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking. Please log in first.");
      if (err.message?.includes("logged in")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card sticky top-24 border border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-4 px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
          <Calendar className="h-5 w-5 text-[#769ABC]" />
          Book Your Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Travel Date */}
          <div className="space-y-2">
            <Label htmlFor="travelDate" className="text-xs font-semibold text-slate-700">Departure Date <span className="text-red-500">*</span></Label>
            <Select value={travelDate} onValueChange={(v: string | null) => v && setTravelDate(v)}>
              <SelectTrigger className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm">
                <SelectValue placeholder="Choose a date..." />
              </SelectTrigger>
              <SelectContent>
                {(departureDates && departureDates.length > 0
                  ? departureDates
                  : [
                      new Date(Date.now() + 24 * 60 * 60 * 1000 * 10),
                      new Date(Date.now() + 24 * 60 * 60 * 1000 * 20),
                      new Date(Date.now() + 24 * 60 * 60 * 1000 * 30),
                      new Date(Date.now() + 24 * 60 * 60 * 1000 * 45),
                    ]
                ).map((dateObj, i) => {
                  const d = new Date(dateObj);
                  return (
                    <SelectItem key={i} value={d.toISOString().split("T")[0]}>
                      {formatDate(d)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Travelers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Users className="h-4 w-4 text-slate-400" />
                Traveler Details <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddTraveler}
                className="text-[#769ABC] hover:text-[#769ABC]/80 text-xs p-0 h-auto gap-1 font-semibold hover:bg-transparent"
              >
                <Plus className="h-3.5 w-3.5" /> Add Traveler
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {travelers.map((traveler, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 transition-colors">
                  <span className="text-xs font-bold text-slate-400 min-w-[1.25rem]">
                    #{index + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <Input
                        placeholder="Full Name"
                        value={traveler.name}
                        required
                        onChange={(e) => handleTravelerChange(index, "name", e.target.value)}
                        className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        placeholder="Age"
                        type="number"
                        min={1}
                        max={120}
                        value={traveler.age}
                        required
                        onChange={(e) => handleTravelerChange(index, "age", e.target.value)}
                        className="h-9 text-xs bg-white border-slate-200 rounded-lg text-center"
                      />
                    </div>
                  </div>
                  {travelers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTraveler(index)}
                      className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg shrink-0"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests" className="text-xs font-semibold text-slate-700">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              placeholder="e.g. Dietary preferences, room configurations..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="bg-white text-xs border border-slate-200 rounded-xl"
              rows={2}
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5 border-t border-slate-200 pt-4">
            <Label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CreditCard className="h-4 w-4 text-slate-400" />
              Choose Payment Gateway
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGateway("razorpay")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  gateway === "razorpay"
                    ? "border-[#769ABC] ring-2 ring-[#769ABC]/10 bg-[#769ABC]/5 text-[#769ABC] font-semibold shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-sm font-semibold">Razorpay</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Cards / UPI / NetBanking</span>
              </button>
              <button
                type="button"
                onClick={() => setGateway("stripe")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  gateway === "stripe"
                    ? "border-[#769ABC] ring-2 ring-[#769ABC]/10 bg-[#769ABC]/5 text-[#769ABC] font-semibold shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-sm font-semibold">Stripe</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Global Card Checkout</span>
              </button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="border border-dashed border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Base price (per person)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(basePrice, currency)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total travelers</span>
              <span className="font-semibold text-slate-800">x {travelers.length}</span>
            </div>
            <div className="flex justify-between font-bold text-md border-t border-slate-200 pt-2.5 mt-1">
              <span className="text-slate-900">Total Price</span>
              <span className="text-lg text-[#769ABC] font-bold">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#769ABC] to-[#1A3B5A] hover:from-[#769ABC]/95 hover:to-[#1A3B5A]/95 hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-bold py-6 rounded-xl shadow-lg gap-2 cursor-pointer border-0"
          >
            <CreditCard className="h-4 w-4" />
            {loading ? "Initializing Secure Portal..." : "Confirm & Pay Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
