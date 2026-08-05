"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Compass,
  Hotel,
  Car,
  AlertCircle,
} from "lucide-react";
import {
  INTERESTS,
  STAY_PREFERENCES,
  TRANSPORT_PREFERENCES,
  TRAVEL_STYLES,
} from "@/constants/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STEPS = [
  "Destination",
  "Dates",
  "Budget",
  "Interests",
  "Preferences",
  "Generate",
];

export default function TripBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: "2",
    budget: "",
    travelStyle: "STANDARD",
    interests: [] as string[],
    stayPreference: "Hotel",
    transportPreference: "Flight",
  });

  const toggleInterest = (interest: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter((i) => i !== interest)
        : [...formData.interests, interest],
    });
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 0:
        if (!formData.destination.trim()) {
          toast.error("Please enter a destination");
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
        return true;
      case 2:
        if (!formData.budget || parseFloat(formData.budget) <= 0) {
          toast.error("Please enter a valid budget");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          travelers: formData.travelers,
          budget: formData.budget,
          currency: "INR",
          travelStyle: formData.travelStyle,
          interests: formData.interests,
          stayPreference: formData.stayPreference,
          transportPreference: formData.transportPreference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate trip");
      }

      toast.success("Trip generated successfully!");
      router.push(`/trip-builder/${data.tripId}`);
    } catch (err: any) {
      console.error("Trip generation error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      toast.error(err.message || "Failed to generate trip");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--waypoint-teal)] to-[var(--waypoint-navy)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Waypoint</span>
          </Link>
          <Badge className="bg-gradient-to-r from-[var(--waypoint-amber)] to-orange-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
          </Badge>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-[var(--waypoint-teal)] to-sky-400 mb-4 shadow-lg shadow-[var(--waypoint-teal)]/20">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            AI Trip Builder
          </h1>
          <p className="text-muted-foreground">
            Tell us about your dream trip and we&apos;ll craft the perfect
            itinerary.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i <= step
                  ? "bg-[var(--waypoint-teal)] w-12"
                  : "bg-muted w-8"
              }`}
            />
          ))}
        </div>

        <Card className="glass-card">
          <CardContent className="p-8 space-y-6">
            {/* Step 0: Destination */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-[var(--waypoint-teal)]" />
                  <h2 className="text-xl font-semibold">
                    Where do you want to go?
                  </h2>
                </div>
                <Input
                  placeholder="e.g., Goa, Kerala, Rajasthan, Bali..."
                  className="h-14 text-lg"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                />
              </div>
            )}

            {/* Step 1: Dates */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-[var(--waypoint-teal)]" />
                  <h2 className="text-xl font-semibold">
                    When are you traveling?
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      min={formData.startDate || new Date().toISOString().split("T")[0]}
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Number of Travelers</Label>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      className="w-24"
                      value={formData.travelers}
                      onChange={(e) =>
                        setFormData({ ...formData, travelers: e.target.value })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      travelers
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Budget */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="h-5 w-5 text-[var(--waypoint-teal)]" />
                  <h2 className="text-xl font-semibold">
                    What&apos;s your budget?
                  </h2>
                </div>
                <div className="space-y-2">
                  <Label>Total Budget (INR)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    className="h-14 text-lg"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Travel Style</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TRAVEL_STYLES.map((style) => (
                      <button
                        key={style.value}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          formData.travelStyle === style.value
                            ? "border-[var(--waypoint-teal)] bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)] shadow-sm"
                            : "border-border hover:border-[var(--waypoint-teal)]/50"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            travelStyle: style.value,
                          })
                        }
                      >
                        <span className="text-sm font-medium">
                          {style.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Compass className="h-5 w-5 text-[var(--waypoint-teal)]" />
                  <h2 className="text-xl font-semibold">
                    What are your interests?
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.interests.includes(interest)
                          ? "border-[var(--waypoint-teal)] bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)]"
                          : "border-border hover:border-[var(--waypoint-teal)]/50 text-muted-foreground"
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Preferences */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Hotel className="h-5 w-5 text-[var(--waypoint-teal)]" />
                    <h2 className="text-xl font-semibold">Stay Preference</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STAY_PREFERENCES.map((pref) => (
                      <button
                        key={pref}
                        className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                          formData.stayPreference === pref
                            ? "border-[var(--waypoint-teal)] bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)]"
                            : "border-border hover:border-[var(--waypoint-teal)]/50"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, stayPreference: pref })
                        }
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Car className="h-5 w-5 text-[var(--waypoint-teal)]" />
                    <h2 className="text-xl font-semibold">
                      Transport Preference
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TRANSPORT_PREFERENCES.map((pref) => (
                      <button
                        key={pref}
                        className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                          formData.transportPreference === pref
                            ? "border-[var(--waypoint-teal)] bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)]"
                            : "border-border hover:border-[var(--waypoint-teal)]/50"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            transportPreference: pref,
                          })
                        }
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Generate */}
            {step === 5 && (
              <div className="text-center py-8 space-y-6">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-tr from-[var(--waypoint-teal)] to-sky-400 shadow-xl shadow-[var(--waypoint-teal)]/20">
                  <Sparkles
                    className={`h-10 w-10 text-white ${
                      generating ? "animate-pulse" : ""
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {generating
                      ? "Crafting your perfect trip..."
                      : "Ready to generate!"}
                  </h2>
                  <p className="text-muted-foreground">
                    {generating
                      ? "Our AI is building a detailed day-by-day itinerary just for you."
                      : `${formData.destination} • ${formData.travelers} travelers • ₹${Number(formData.budget).toLocaleString("en-IN")} budget`}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {!generating && (
                  <Button
                    size="lg"
                    className="rounded-full px-8 h-14 text-lg bg-gradient-to-r from-[var(--waypoint-teal)] to-sky-500 text-white hover:opacity-90"
                    onClick={handleGenerate}
                  >
                    <Sparkles className="h-5 w-5 mr-2" /> Generate My Trip
                  </Button>
                )}
                {generating && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[var(--waypoint-teal)] animate-bounce [animation-delay:0ms]" />
                      <div className="h-2 w-2 rounded-full bg-[var(--waypoint-teal)] animate-bounce [animation-delay:150ms]" />
                      <div className="h-2 w-2 rounded-full bg-[var(--waypoint-teal)] animate-bounce [animation-delay:300ms]" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This usually takes 10-20 seconds...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            {step < 5 && (
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white"
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
            {step === 5 && !generating && (
              <div className="flex justify-start pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
