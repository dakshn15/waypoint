"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Compass,
  Hotel,
  Car,
  AlertCircle,
  AlertTriangle,
  Mountain,
  UtensilsCrossed,
  Camera,
  TreePine,
  ShoppingBag,
  Music,
  Landmark,
  Waves,
  Bird,
  Sun,
  Crown,
  Star,
  Plane,
  Train,
  Bus,
  CarFront,
  Lightbulb,
  Check,
  Zap,
  Ticket,
  SlidersHorizontal,
  Clock,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  INTERESTS,
  STAY_PREFERENCES,
  TRANSPORT_PREFERENCES,
  TRAVEL_STYLES,
} from "@/constants/config";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const STEPS = [
  { label: "Destination", icon: MapPin },
  { label: "Dates & Guests", icon: CalendarDays },
  { label: "Budget & Style", icon: Wallet },
  { label: "Interests", icon: Compass },
  { label: "Preferences", icon: Hotel },
  { label: "Generate", icon: Sparkles },
];

/* ─── Contextual tips per step ─── */
const STEP_CONTEXT = [
  { title: "Target Destination", tip: "Be specific — 'North Goa' or 'Munnar' yields richer itineraries than broad region names.", emoji: "🗺️" },
  { title: "Travel Window & Group", tip: "3 to 10 days work best for AI density. Set accurate guest count so transport & stay budgets scale correctly.", emoji: "📅" },
  { title: "Budget Feasibility", tip: "Total budget covers accommodations, dining, transfers, and entry tickets. We verify market feasibility in real-time.", emoji: "💰" },
  { title: "Tailored Themes", tip: "Select your favorite interests! AI will blend sightseeing, food, adventure, and relaxation into a seamless itinerary.", emoji: "🎯" },
  { title: "Stay & Transit Preference", tip: "Defines overall travel comfort. A luxury resort + flight differs from a boutique stay + train journey.", emoji: "🏨" },
  { title: "AI Synthesis Engine", tip: "Gemini 2.0 AI generates day-by-day schedules with realistic timings, hotels, and cost allocations.", emoji: "✨" },
];

/* ─── Popular Destinations with Images & Details ─── */
const POPULAR_DESTINATIONS = [
  { name: "Goa", subtitle: "Beaches & Nightlife", image: "/images/packages/goa-beach.jpg", tag: "Coastal" },
  { name: "Kerala Backwaters", subtitle: "Houseboats & Tea Hills", image: "/images/packages/kerala-backwaters.jpg", tag: "Nature" },
  { name: "Rajasthan", subtitle: "Palaces & Forts", image: "/images/packages/rajasthan-heritage.jpg", tag: "Heritage" },
  { name: "Manali", subtitle: "Snow Peaks & Valleys", image: "/images/packages/himalayan-adventure.jpg", tag: "Mountains" },
  { name: "Kashmir Valley", subtitle: "Shikaras & Snow Slopes", image: "/images/packages/kashmir-valley.jpg", tag: "Paradise" },
  { name: "Varanasi Ganges", subtitle: "Ghats & Spiritual Aarti", image: "/images/packages/varanasi-ganges.jpg", tag: "Spiritual" },
];

/* ─── Icon maps ─── */
const INTEREST_ICONS: Record<string, React.ReactNode> = {
  Adventure: <Mountain className="h-3.5 w-3.5" />, Nature: <TreePine className="h-3.5 w-3.5" />,
  Beaches: <Waves className="h-3.5 w-3.5" />, Mountains: <Mountain className="h-3.5 w-3.5" />,
  Food: <UtensilsCrossed className="h-3.5 w-3.5" />, Nightlife: <Music className="h-3.5 w-3.5" />,
  Photography: <Camera className="h-3.5 w-3.5" />, Wildlife: <Bird className="h-3.5 w-3.5" />,
  Culture: <Landmark className="h-3.5 w-3.5" />, Shopping: <ShoppingBag className="h-3.5 w-3.5" />,
  "Historical Places": <Landmark className="h-3.5 w-3.5" />,
};

const STYLE_ICONS: Record<string, React.ReactNode> = {
  BUDGET: <Wallet className="h-4 w-4" />, STANDARD: <Hotel className="h-4 w-4" />,
  PREMIUM: <Star className="h-4 w-4" />, LUXURY: <Crown className="h-4 w-4" />,
};

const STAY_PERKS: Record<string, string> = {
  Hostel: "Budget social stays & dorms",
  Hotel: "Comfort 3-4★ central rooms",
  Resort: "Scenic pools, dining & spa",
  Villa: "Private luxury & full amenities",
};

const TRANSPORT_PERKS: Record<string, string> = {
  Flight: "Fastest travel & airport transfer",
  Train: "Scenic railways & sleeper comfort",
  Bus: "Economical highway connections",
  "Self Drive": "Maximum flexibility & road trip",
};

const STAY_ICONS: Record<string, React.ReactNode> = {
  Hostel: <Hotel className="h-4 w-4" />, Hotel: <Hotel className="h-4 w-4" />,
  Resort: <Sun className="h-4 w-4" />, Villa: <Crown className="h-4 w-4" />,
};
const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  Flight: <Plane className="h-4 w-4" />, Train: <Train className="h-4 w-4" />,
  Bus: <Bus className="h-4 w-4" />, "Self Drive": <CarFront className="h-4 w-4" />,
};

/* ─── Helper Functions for Real-World Checks ─── */
function calculateDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 3;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 1;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function getRecommendedBudgetPerDay(style: string): number {
  switch (style) {
    case "BUDGET": return 1200;
    case "STANDARD": return 3000;
    case "PREMIUM": return 7500;
    case "LUXURY": return 18000;
    default: return 3000;
  }
}

function getAbsoluteMinBudget(days: number, travelers: number): number {
  return days * travelers * 600;
}

export default function TripBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(0);
  const [error, setError] = useState("");
  const [passportOpenMobile, setPassportOpenMobile] = useState(false);
  const [formData, setFormData] = useState({
    destination: "", startDate: "", endDate: "", travelers: "2",
    budget: "", travelStyle: "STANDARD", interests: [] as string[],
    stayPreference: "Hotel", transportPreference: "Flight",
  });

  const tripDays = calculateDays(formData.startDate, formData.endDate);
  const travelerCount = Math.max(1, parseInt(formData.travelers) || 1);
  const userBudgetNum = parseFloat(formData.budget) || 0;

  const absoluteMinBudget = getAbsoluteMinBudget(tripDays, travelerCount);
  const recommendedStyleRate = getRecommendedBudgetPerDay(formData.travelStyle);
  const suggestedTotalBudget = tripDays * travelerCount * recommendedStyleRate;
  const actualPerPersonPerDay = userBudgetNum > 0 ? Math.round(userBudgetNum / (tripDays * travelerCount)) : 0;

  const isUnderfundedForStyle = userBudgetNum > 0 && userBudgetNum < suggestedTotalBudget * 0.6;
  const isSeverelyUnderfunded = userBudgetNum > 0 && userBudgetNum < absoluteMinBudget;

  useEffect(() => {
    let interval: any;
    if (generating) {
      setGenStage(0);
      interval = setInterval(() => {
        setGenStage((prev) => (prev < 4 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const toggleInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter((i) => i !== interest)
        : [...formData.interests, interest],
    });
  };

  const setQuickDuration = (daysNum: number) => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + daysNum);
    setFormData({
      ...formData,
      startDate: today.toISOString().split("T")[0],
      endDate: future.toISOString().split("T")[0],
    });
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 0:
        if (!formData.destination.trim() || formData.destination.trim().length < 2) {
          toast.error("Please enter a valid destination (at least 2 characters)");
          return false;
        }
        return true;
      case 1:
        if (!formData.startDate || !formData.endDate) {
          toast.error("Please select both start and end dates");
          return false;
        }
        if (new Date(formData.endDate) <= new Date(formData.startDate)) {
          toast.error("End date must be after start date");
          return false;
        }
        if (tripDays > 30) {
          toast.error("Trip duration cannot exceed 30 days");
          return false;
        }
        if (travelerCount < 1) {
          toast.error("Number of travelers must be at least 1");
          return false;
        }
        return true;
      case 2:
        if (!formData.budget || userBudgetNum <= 0) {
          toast.error("Please enter a valid budget amount");
          return false;
        }
        if (isSeverelyUnderfunded) {
          toast.error(`Budget is too low for a ${tripDays}-day trip for ${travelerCount} traveler(s). Minimum needed is ₹${absoluteMinBudget.toLocaleString("en-IN")}.`);
          return false;
        }
        return true;
      default: return true;
    }
  };

  const handleNext = () => { if (validateStep()) setStep(step + 1); };

  const handleGenerate = async () => {
    if (isSeverelyUnderfunded) {
      toast.error("Please adjust your budget before generating your trip.");
      setStep(2);
      return;
    }

    setGenerating(true); setError("");
    try {
      const res = await fetch("/api/trips/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: formData.destination, startDate: formData.startDate, endDate: formData.endDate,
          travelers: formData.travelers, budget: formData.budget, currency: "INR",
          travelStyle: formData.travelStyle, interests: formData.interests,
          stayPreference: formData.stayPreference, transportPreference: formData.transportPreference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate trip");
      toast.success("Trip generated successfully!");
      router.push(`/trip-builder/${data.tripId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      toast.error(err.message || "Failed to generate trip");
    } finally { setGenerating(false); }
  };

  const ctx = STEP_CONTEXT[step];

  const aiStages = [
    `Analyzing ${formData.destination || "destination"} seasonality & weather...`,
    `Curating handpicked ${formData.stayPreference} stays matching ₹${userBudgetNum.toLocaleString("en-IN")}...`,
    `Optimizing ${formData.transportPreference} transfers & daily routes...`,
    `Blending ${formData.interests.slice(0, 3).join(", ") || "sightseeing"} activities into daily schedule...`,
    `Finalizing complete day-by-day itinerary & cost breakdown...`,
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F4] text-slate-900 font-sans">
      <SiteHeader />

      {/* ═══════════════ APP STUDIO WORKSPACE BAR (RESPONSIVE) ═══════════════ */}
      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left Title Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <h1 className="text-base sm:text-lg font-extrabold font-display text-slate-900 mb-1 tracking-tight">AI Trip Studio</h1>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">Gemini 2.0 Engine</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Step {step + 1} of 6 — <strong className="text-slate-900 font-bold">{STEPS[step].label}</strong></p>
              </div>
            </div>

            {/* Step Counter Badge */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
              <span>{Math.round(((step + 1) / 6) * 100)}% Complete</span>
              <span className="text-slate-500">•</span>
              <span className="text-primary font-extrabold">{step + 1}/6 Steps</span>
            </div>
          </div>

          {/* Dynamic Progress Bar Line */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${((step + 1) / 6) * 100}%` }}
            />
          </div>

          {/* Interactive Step Pills (Scrollable on small screens) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none -mx-1 px-1">
            {STEPS.map((s, i) => {
              const isCompleted = i < step;
              const isActive = i === step;

              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm scale-[1.02]"
                      : isCompleted
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "bg-slate-100/90 text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 text-primary" /> : <span className="text-[10px] opacity-70">0{i + 1}</span>}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ STUDIO WORKSPACE LAYOUT ═══════════════ */}
      <section className="flex-1 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">

          {/* ═══ LEFT PANE: LIVE TRIP PASSPORT / SPEC BOARD ═══ */}
          <div className="space-y-4 lg:sticky lg:top-28">
            
            {/* Digital Travel Passport Ticket Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden relative">

              {/* Mobile Accordion Toggle for Passport */}
              <button
                type="button"
                onClick={() => setPassportOpenMobile(!passportOpenMobile)}
                className="w-full lg:hidden p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 font-bold text-xs text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span>Live Trip Summary ({formData.destination || "Not set"})</span>
                </div>
                {passportOpenMobile ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>

              <div className={`p-5 space-y-4 ${passportOpenMobile ? "block" : "hidden lg:block"}`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-800">Trip Passport</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                    Spec #{step + 1}
                  </span>
                </div>

                {/* Destination Badge */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Destination</p>
                  <p className="text-base font-extrabold font-display text-slate-900">
                    {formData.destination || <span className="text-slate-500 italic font-normal">Select Destination...</span>}
                  </p>
                </div>

                {/* Dates & Travelers */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Window</p>
                    <p className="text-xs font-bold text-slate-800">
                      {formData.startDate && formData.endDate ? `${tripDays} Days` : <span className="text-slate-500 italic font-normal">Pending...</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Guests</p>
                    <p className="text-xs font-bold text-slate-800">{travelerCount} Person(s)</p>
                  </div>
                </div>

                {/* Budget & Style */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total Budget</p>
                    <p className="text-xs font-bold text-emerald-700">
                      {userBudgetNum > 0 ? `₹${userBudgetNum.toLocaleString("en-IN")}` : <span className="text-slate-500 italic font-normal">Pending...</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Style</p>
                    <p className="text-xs font-bold text-slate-800">{formData.travelStyle}</p>
                  </div>
                </div>

                {/* Live Estimated Allocation Breakdown Graph */}
                {userBudgetNum > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Estimated Allocation</span>
                      <span>₹{userBudgetNum.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 flex overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: "35%" }} title="Stay ~35%" />
                      <div className="bg-sky-500 h-full" style={{ width: "25%" }} title="Transit ~25%" />
                      <div className="bg-emerald-500 h-full" style={{ width: "20%" }} title="Activities ~20%" />
                      <div className="bg-amber-500 h-full" style={{ width: "20%" }} title="Dining & Misc ~20%" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1 truncate"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" /> Stay 35%</span>
                      <span className="flex items-center gap-1 truncate"><span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" /> Transit 25%</span>
                      <span className="flex items-center gap-1 truncate"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Activities 20%</span>
                      <span className="flex items-center gap-1 truncate"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Dining 20%</span>
                    </div>
                  </div>
                )}

                {/* Selected Interests Tags */}
                {formData.interests.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interests ({formData.interests.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.interests.map((int) => (
                        <span key={int} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                          {int}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Decorative Pattern */}
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{ctx.title}</span>
                </span>
                <span className="font-bold text-slate-700 shrink-0">Concierge</span>
              </div>
            </div>

            {/* Context Tip Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-600 leading-relaxed">
                💡 <strong>Tip:</strong> {ctx.tip}
              </p>
            </div>

          </div>

          {/* ═══ RIGHT PANE: FORM STUDIO WORKSPACE ═══ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="lg:p-7 sm:p-5 p-4 space-y-6">

              {/* ── Step 0: Destination ── */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold font-display text-slate-900 mb-1">Where do you want to go?</h2>
                      <p className="text-xs text-slate-500">Enter a city, region, island, or national landmark</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination-field" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Destination Name
                    </Label>
                    <Input
                      id="destination-field"
                      placeholder="e.g. Goa, Kerala Backwaters, Manali, Rajasthan, Kashmir, Bali..."
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    />
                  </div>

                  {/* Visual Destination Cards */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Or Pick a Featured Destination</Label>
                      <span className="text-[11px] text-slate-500">Click to select</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {POPULAR_DESTINATIONS.map((dest) => (
                        <button
                          key={dest.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, destination: dest.name })}
                          className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer h-28 ${
                            formData.destination === dest.name
                              ? "border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]"
                              : "border-transparent hover:border-slate-300"
                          }`}
                        >
                          <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
                            {dest.tag}
                          </span>
                          <div className="absolute bottom-2.5 left-2.5 right-2.5">
                            <p className="text-xs font-semibold text-white">{dest.name}</p>
                            <p className="text-[10px] text-white/70">{dest.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1: Dates & Guests ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold font-display text-slate-900 mb-1">Travel Window & Guests</h2>
                      <p className="text-xs text-slate-500">Select departure date, return date, and traveler count</p>
                    </div>
                  </div>

                  {/* Quick Duration Preset Pills */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Duration Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Weekend Getaway (3 Days)", days: 3 },
                        { label: "1 Week Explorer (7 Days)", days: 7 },
                        { label: "Grand Tour (10 Days)", days: 10 },
                      ].map((p) => (
                        <Button
                          key={p.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDuration(p.days)}
                          className="rounded-xl border-slate-200 bg-[#FAFAF9] hover:border-primary hover:text-primary font-semibold text-xs cursor-pointer"
                        >
                          <Clock className="h-3 w-3 mr-1 text-slate-500" />
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Departure Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Return Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        min={formData.startDate || new Date().toISOString().split("T")[0]}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                      <span className="font-medium">Calculated Duration:</span>
                      <span className="font-extrabold text-slate-900">{tripDays} Days / {Math.max(1, tripDays - 1)} Nights</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="travelers-count" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Number of Travelers</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-secondary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4.5 w-4.5 text-secondary" />
                      </div>
                      <Input
                        id="travelers-count"
                        type="number"
                        min={1}
                        value={formData.travelers}
                        onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                        className="w-20 text-center bg-[#FAFAF9] border-slate-200 [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                      <span className="text-sm text-slate-500 font-medium">person(s)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Budget & Travel Style ── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold font-display text-slate-900 mb-1">Budget & Travel Style</h2>
                      <p className="text-xs text-slate-500">Define your total budget for all travelers combined</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="budget-input" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Budget (INR)</Label>
                      {userBudgetNum > 0 && (
                        <span className="text-xs text-slate-500 font-medium">
                          ~₹{actualPerPersonPerDay.toLocaleString("en-IN")}/person/day
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-500">₹</span>
                      <Input
                        id="budget-input"
                        type="number"
                        placeholder="e.g., 40000"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="pl-9 [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                    </div>

                    {/* Quick Budget Presets */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs font-semibold text-slate-500 self-center">Quick Presets:</span>
                      {[25000, 50000, 100000, 200000].map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={userBudgetNum === amt ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData({ ...formData, budget: amt.toString() })}
                          className="rounded-lg text-xs font-bold cursor-pointer"
                        >
                          ₹{amt.toLocaleString("en-IN")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Travel Style</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TRAVEL_STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, travelStyle: style.value })}
                          className={`relative p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            formData.travelStyle === style.value ? "border-primary bg-primary/5 shadow-xs" : "border-slate-200 bg-[#FAFAF9] hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                            formData.travelStyle === style.value ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                          }`}>{STYLE_ICONS[style.value]}</div>
                          <span className={`text-sm font-bold block ${formData.travelStyle === style.value ? "text-slate-900" : "text-slate-600"}`}>{style.label}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">~₹{getRecommendedBudgetPerDay(style.value).toLocaleString("en-IN")}/day</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-World Alert Callouts */}
                  {isSeverelyUnderfunded && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5 text-rose-900 text-xs leading-relaxed">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-rose-950 mb-0.5">Budget Alert: Too Low</span>
                          Your budget of ₹{userBudgetNum.toLocaleString("en-IN")} is insufficient for a {tripDays}-day trip for {travelerCount} guest(s). Absolute minimum needed is ₹{absoluteMinBudget.toLocaleString("en-IN")}.
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setFormData({ ...formData, budget: absoluteMinBudget.toString() })}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        <Zap className="h-3 w-3 mr-1" /> Adjust to Minimum (₹{absoluteMinBudget.toLocaleString("en-IN")})
                      </Button>
                    </div>
                  )}

                  {!isSeverelyUnderfunded && isUnderfundedForStyle && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5 text-amber-900 text-xs leading-relaxed">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-amber-950 mb-0.5">Style Mismatch Warning</span>
                          You selected <strong className="uppercase">{formData.travelStyle}</strong> style, but your budget of ₹{userBudgetNum.toLocaleString("en-IN")} averages ~₹{actualPerPersonPerDay.toLocaleString("en-IN")}/person/day. Estimated budget for {formData.travelStyle} is ₹{suggestedTotalBudget.toLocaleString("en-IN")}.
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setFormData({ ...formData, budget: suggestedTotalBudget.toString() })}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Set Budget to ₹{suggestedTotalBudget.toLocaleString("en-IN")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, travelStyle: "BUDGET" })}
                          className="border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Switch Style to Budget
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Interests ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Compass className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold font-display text-slate-900 mb-1">What are your interests?</h2>
                      <p className="text-xs text-slate-500">Pick theme preferences to customize your daily activities</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          formData.interests.includes(interest) ? "border-primary bg-primary/5 text-primary shadow-xs" : "border-slate-200 bg-[#FAFAF9] text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {INTEREST_ICONS[interest] || <Compass className="h-3.5 w-3.5" />}
                        {interest}
                      </button>
                    ))}
                  </div>
                  {formData.interests.length > 0 && (
                    <p className="text-xs text-slate-500 font-medium">{formData.interests.length} interest{formData.interests.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
              )}

              {/* ── Step 4: Preferences ── */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Hotel className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Stay Preference</h2>
                        <p className="text-xs text-slate-500">Preferred lodging category</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {STAY_PREFERENCES.map((pref) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => setFormData({ ...formData, stayPreference: pref })}
                          className={`relative p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            formData.stayPreference === pref ? "border-primary bg-primary/5 shadow-xs" : "border-slate-200 bg-[#FAFAF9] hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${
                            formData.stayPreference === pref ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                          }`}>{STAY_ICONS[pref] || <Hotel className="h-4 w-4" />}</div>
                          <span className={`text-xs font-bold block ${formData.stayPreference === pref ? "text-slate-900" : "text-slate-600"}`}>{pref}</span>
                          <span className="text-[9px] text-slate-500 block mt-1 leading-tight">{STAY_PERKS[pref]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <Car className="h-4.5 w-4.5 text-secondary" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold font-display text-slate-900">Transport Preference</h2>
                        <p className="text-xs text-slate-500">Primary mode of intercity transit</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TRANSPORT_PREFERENCES.map((pref) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => setFormData({ ...formData, transportPreference: pref })}
                          className={`relative p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            formData.transportPreference === pref ? "border-primary bg-primary/5 shadow-xs" : "border-slate-200 bg-[#FAFAF9] hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${
                            formData.transportPreference === pref ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                          }`}>{TRANSPORT_ICONS[pref] || <Car className="h-4 w-4" />}</div>
                          <span className={`text-xs font-bold block ${formData.transportPreference === pref ? "text-slate-900" : "text-slate-600"}`}>{pref}</span>
                          <span className="text-[9px] text-slate-500 block mt-1 leading-tight">{TRANSPORT_PERKS[pref]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 5: Generate ── */}
              {step === 5 && (
                <div className="text-center py-8 space-y-6">
                  <div className="relative inline-flex">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Sparkles className={`h-9 w-9 text-white ${generating ? "animate-pulse" : ""}`} />
                    </div>
                    {generating && <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 animate-ping" />}
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold font-display text-slate-900 mb-2">
                      {generating ? "Synthesizing Your Trip..." : "Ready to Generate Itinerary!"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {generating ? "Gemini AI is crafting your detailed daily schedule & cost breakdown."
                        : <span className="inline-flex flex-wrap items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold"><MapPin className="h-3 w-3" /> {formData.destination}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold"><CalendarDays className="h-3 w-3" /> {tripDays} Days</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">₹{userBudgetNum.toLocaleString("en-IN")}</span>
                          </span>}
                    </p>
                  </div>

                  {/* Real-time AI Generation Status Steps */}
                  {generating && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 max-w-md mx-auto space-y-3 text-left">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">AI Concierge Progress</p>
                      <div className="space-y-2">
                        {aiStages.map((stg, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 text-xs transition-opacity duration-300">
                            {idx < genStage ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : idx === genStage ? (
                              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-200 shrink-0" />
                            )}
                            <span className={idx === genStage ? "font-bold text-slate-900" : idx < genStage ? "text-slate-600 line-through opacity-70" : "text-slate-500"}>
                              {stg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-4 py-2.5 text-sm text-left max-w-md mx-auto">
                      <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                    </div>
                  )}

                  {!generating && (
                    <Button
                      onClick={handleGenerate}
                      size="lg"
                    >
                      <Sparkles className="h-4.5 w-4.5" /> Generate Itinerary Now <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* ── Navigation Buttons ── */}
              {step < 5 && (
                <div className="flex justify-between items-center pt-6 border-t border-slate-100 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {step === 5 && !generating && (
                <div className="flex justify-start items-center pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
