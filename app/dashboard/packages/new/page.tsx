"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/constants/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createPackage } from "@/app/actions/packages";

const STEPS = ["Basic Info", "Destinations", "Itinerary", "Pricing", "Review"];

export default function NewPackagePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    maxGroupSize: "",
    difficulty: "EASY",
    destinations: [] as string[],
    newDestination: "",
    inclusions: [] as string[],
    newInclusion: "",
    exclusions: [] as string[],
    newExclusion: "",
    basePrice: "",
    currency: "INR",
  });

  const addToList = (field: "destinations" | "inclusions" | "exclusions", inputField: "newDestination" | "newInclusion" | "newExclusion") => {
    const value = formData[inputField].trim();
    if (value) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value],
        [inputField]: "",
      });
    }
  };

  const removeFromList = (field: "destinations" | "inclusions" | "exclusions", index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.duration || !formData.basePrice) {
      toast.error("Please fill in the title, duration, and price.");
      return;
    }

    setLoading(true);
    try {
      await createPackage({
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        maxGroupSize: formData.maxGroupSize || undefined,
        difficulty: formData.difficulty as any,
        destinations: formData.destinations,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        basePrice: formData.basePrice,
        currency: formData.currency,
      });
      toast.success("Package created successfully!");
      router.push("/dashboard/packages");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/packages">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Package</h1>
          <p className="text-muted-foreground mt-1">Fill in the details for your new travel package.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-all ${
              i <= step ? "bg-[var(--waypoint-teal)] text-white" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-[var(--waypoint-teal)]" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 space-y-6">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Package Title <span className="text-red-500">*</span></Label>
                <Input id="title" placeholder="e.g., Golden Triangle Tour" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea id="description" placeholder="Describe the travel experience..." rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days) <span className="text-red-500">*</span></Label>
                  <Input id="duration" type="number" min={1} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize">Max Group Size</Label>
                  <Input id="maxGroupSize" type="number" min={1} value={formData.maxGroupSize} onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty <span className="text-red-500">*</span></Label>
                  <Select value={formData.difficulty} onValueChange={(v: string | null) => v && setFormData({ ...formData, difficulty: v })}>
                    <SelectTrigger className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="CHALLENGING">Challenging</SelectItem>
                      <SelectItem value="EXTREME">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Destinations */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Add a destination (e.g., Jaipur, India)" value={formData.newDestination} onChange={(e) => setFormData({ ...formData, newDestination: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("destinations", "newDestination"))} />
                <Button type="button" onClick={() => addToList("destinations", "newDestination")}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.destinations.map((dest, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3">
                    {dest}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromList("destinations", i)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Itinerary */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Itinerary builder — Day-by-day plan creation will be implemented with drag-and-drop functionality.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Inclusions</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g., Breakfast included" value={formData.newInclusion} onChange={(e) => setFormData({ ...formData, newInclusion: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("inclusions", "newInclusion"))} />
                    <Button type="button" onClick={() => addToList("inclusions", "newInclusion")}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">{formData.inclusions.map((item, i) => (<Badge key={i} variant="secondary" className="gap-1"><span>✓</span>{item}<X className="h-3 w-3 cursor-pointer" onClick={() => removeFromList("inclusions", i)} /></Badge>))}</div>
                </div>
                <div className="space-y-2">
                  <Label>Exclusions</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g., Personal expenses" value={formData.newExclusion} onChange={(e) => setFormData({ ...formData, newExclusion: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("exclusions", "newExclusion"))} />
                    <Button type="button" onClick={() => addToList("exclusions", "newExclusion")}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">{formData.exclusions.map((item, i) => (<Badge key={i} variant="outline" className="gap-1"><span>✗</span>{item}<X className="h-3 w-3 cursor-pointer" onClick={() => removeFromList("exclusions", i)} /></Badge>))}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Base Price (per person) <span className="text-red-500">*</span></Label>
                  <Input type="number" min={0} placeholder="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Currency <span className="text-red-500">*</span></Label>
                  <Select value={formData.currency} onValueChange={(v: string | null) => v && setFormData({ ...formData, currency: v })}>
                    <SelectTrigger className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Your Package</h3>
              <div className="grid gap-3 text-sm">
                <div><span className="text-muted-foreground">Title:</span> <strong>{formData.title || "—"}</strong></div>
                <div><span className="text-muted-foreground">Duration:</span> <strong>{formData.duration || "—"} days</strong></div>
                <div><span className="text-muted-foreground">Destinations:</span> <strong>{formData.destinations.join(", ") || "—"}</strong></div>
                <div><span className="text-muted-foreground">Price:</span> <strong>{formData.basePrice ? `${formData.currency} ${formData.basePrice}` : "—"}</strong></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={loading} className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white">
                {loading ? "Creating..." : "Create Package"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
