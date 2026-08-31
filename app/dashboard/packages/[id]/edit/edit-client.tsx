"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Plus, X, CheckCircle2, MapPin, Tag, IndianRupee, FileText } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/constants/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePackage } from "@/app/actions/packages";

const STEPS = [
  { label: "Basic Info", icon: FileText },
  { label: "Destinations", icon: MapPin },
  { label: "Itinerary", icon: Tag },
  { label: "Pricing", icon: IndianRupee },
  { label: "Review", icon: CheckCircle2 },
];

interface InitialData {
  title: string;
  description: string;
  duration: string;
  maxGroupSize: string;
  difficulty: string;
  destinations: string[];
  inclusions: string[];
  exclusions: string[];
  basePrice: string;
  currency: string;
}

interface EditPackageClientProps {
  packageId: string;
  initialData: InitialData;
}

export default function EditPackageClient({ packageId, initialData }: EditPackageClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    duration: initialData.duration,
    maxGroupSize: initialData.maxGroupSize,
    difficulty: initialData.difficulty,
    destinations: initialData.destinations,
    newDestination: "",
    inclusions: initialData.inclusions,
    newInclusion: "",
    exclusions: initialData.exclusions,
    newExclusion: "",
    basePrice: initialData.basePrice,
    currency: initialData.currency,
  });

  const addToList = (field: "destinations" | "inclusions" | "exclusions", inputField: "newDestination" | "newInclusion" | "newExclusion") => {
    const value = formData[inputField].trim();
    if (value) {
      setFormData({ ...formData, [field]: [...formData[field], value], [inputField]: "" });
    }
  };

  const removeFromList = (field: "destinations" | "inclusions" | "exclusions", index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.duration || !formData.basePrice) {
      toast.error("Please fill in the title, duration, and price.");
      return;
    }

    setLoading(true);
    try {
      await updatePackage(packageId, {
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
      toast.success("Package updated successfully!");
      router.push("/dashboard/packages");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/packages">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Edit Package</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Update the details of your travel package.</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={s.label} className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-secondary text-white shadow-sm shadow-secondary/20"
                    : isCompleted
                      ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                      : "bg-slate-100 text-slate-400 cursor-default"
                }`}
              >
                <div className={`h-5 w-5 rounded-lg flex items-center justify-center font-extrabold text-[10px] ${
                  isActive ? "bg-white/20" : isCompleted ? "bg-secondary/20" : "bg-slate-200/60"
                }`}>
                  {i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 rounded-full ${i < step ? "bg-secondary/40" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Package Title <span className="text-rose-500">*</span></Label>
                <Input id="title" placeholder="e.g., Golden Triangle Tour" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-11 rounded-xl border-slate-200 bg-white text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description <span className="text-rose-500">*</span></Label>
                <Textarea id="description" placeholder="Describe the travel experience..." rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-xl border-slate-200 bg-white text-sm resize-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Duration (days) <span className="text-rose-500">*</span></Label>
                  <Input id="duration" type="number" min={1} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="h-11 rounded-xl border-slate-200 bg-white text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize" className="text-sm font-semibold text-slate-700">Max Group Size</Label>
                  <Input id="maxGroupSize" type="number" min={1} value={formData.maxGroupSize} onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })} className="h-11 rounded-xl border-slate-200 bg-white text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Difficulty <span className="text-rose-500">*</span></Label>
                  <Select value={formData.difficulty} onValueChange={(v: string | null) => v && setFormData({ ...formData, difficulty: v })}>
                    <SelectTrigger className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 shadow-2xl rounded-xl">
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
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Destinations</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g., Jaipur, India" value={formData.newDestination} onChange={(e) => setFormData({ ...formData, newDestination: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("destinations", "newDestination"))} className="h-11 rounded-xl border-slate-200 bg-white text-sm flex-1" />
                  <Button type="button" onClick={() => addToList("destinations", "newDestination")} className="h-11 px-4 bg-secondary text-white rounded-xl hover:bg-secondary/90 cursor-pointer"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {formData.destinations.map((dest, i) => (
                  <Badge key={i} variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    <MapPin className="h-3 w-3" /> {dest}
                    <button onClick={() => removeFromList("destinations", i)} className="ml-1 cursor-pointer hover:text-rose-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </Badge>
                ))}
                {formData.destinations.length === 0 && <p className="text-sm text-slate-400">No destinations added yet.</p>}
              </div>
            </div>
          )}

          {/* Step 2: Itinerary */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 block">Inclusions</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g., Breakfast included" value={formData.newInclusion} onChange={(e) => setFormData({ ...formData, newInclusion: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("inclusions", "newInclusion"))} className="h-11 rounded-xl border-slate-200 bg-white text-sm flex-1" />
                  <Button type="button" onClick={() => addToList("inclusions", "newInclusion")} className="h-11 px-4 bg-secondary text-white rounded-xl hover:bg-secondary/90 cursor-pointer"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.inclusions.map((item, i) => (
                    <Badge key={i} className="gap-1.5 py-1.5 px-3 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> {item}
                      <button onClick={() => removeFromList("inclusions", i)} className="ml-1 cursor-pointer hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 block">Exclusions</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g., Personal expenses" value={formData.newExclusion} onChange={(e) => setFormData({ ...formData, newExclusion: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("exclusions", "newExclusion"))} className="h-11 rounded-xl border-slate-200 bg-white text-sm flex-1" />
                  <Button type="button" onClick={() => addToList("exclusions", "newExclusion")} className="h-11 px-4 bg-secondary text-white rounded-xl hover:bg-secondary/90 cursor-pointer"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.exclusions.map((item, i) => (
                    <Badge key={i} variant="outline" className="gap-1.5 py-1.5 px-3 font-medium border-slate-200 text-slate-600">
                      <X className="h-3 w-3" /> {item}
                      <button onClick={() => removeFromList("exclusions", i)} className="ml-1 cursor-pointer hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Base Price (per person) <span className="text-rose-500">*</span></Label>
                  <Input type="number" min={0} placeholder="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} className="h-11 rounded-xl border-slate-200 bg-white text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Currency <span className="text-rose-500">*</span></Label>
                  <Select value={formData.currency} onValueChange={(v: string | null) => v && setFormData({ ...formData, currency: v })}>
                    <SelectTrigger className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border border-slate-100 shadow-2xl rounded-xl">
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
              <h3 className="font-bold text-lg text-slate-900">Review Your Changes</h3>
              <div className="grid gap-3">
                {[
                  { label: "Title", value: formData.title || "—" },
                  { label: "Duration", value: formData.duration ? `${formData.duration} days` : "—" },
                  { label: "Difficulty", value: formData.difficulty || "—" },
                  { label: "Destinations", value: formData.destinations.join(", ") || "—" },
                  { label: "Price", value: formData.basePrice ? `${formData.currency} ${formData.basePrice}` : "—" },
                  { label: "Inclusions", value: formData.inclusions.length ? `${formData.inclusions.length} item${formData.inclusions.length !== 1 ? "s" : ""}` : "None" },
                  { label: "Exclusions", value: formData.exclusions.length ? `${formData.exclusions.length} item${formData.exclusions.length !== 1 ? "s" : ""}` : "None" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 w-24 shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl h-11 border-slate-200 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 text-white rounded-xl h-11 px-6 shadow-sm shadow-primary/20 cursor-pointer">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleUpdate} disabled={loading} className="bg-gradient-to-r from-secondary to-slate-600 hover:from-secondary/90 hover:to-slate-600/90 text-white rounded-xl h-11 px-6 shadow-sm shadow-secondary/20 cursor-pointer">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
