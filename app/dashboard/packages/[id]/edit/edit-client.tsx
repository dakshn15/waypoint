"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Plus, X, CheckCircle2, MapPin, Tag, IndianRupee, FileText, Image as ImageIcon, Upload } from "lucide-react";
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

const IMAGE_PRESETS = [
  { label: "Kashmir Valley", url: "/images/packages/kashmir-valley.jpg" },
  { label: "Golden Triangle", url: "/images/packages/golden-triangle.jpg" },
  { label: "Kerala Backwaters", url: "/images/packages/kerala-backwaters.jpg" },
  { label: "Goa Beach", url: "/images/packages/goa-beach.jpg" },
  { label: "Rajasthan Heritage", url: "/images/packages/rajasthan-heritage.jpg" },
  { label: "Himalayan Trek", url: "/images/packages/himalayan-adventure.jpg" },
];

interface InitialData {
  title: string;
  description: string;
  imageUrl?: string;
  duration: string;
  maxGroupSize: string;
  difficulty: string;
  destinations: string[];
  inclusions: string[];
  exclusions: string[];
  basePrice: string;
  currency: string;
  itineraries?: Array<{ dayNumber: number; title: string; description: string }>;
}

interface EditPackageClientProps {
  packageId: string;
  initialData: InitialData;
}

export default function EditPackageClient({ packageId, initialData }: EditPackageClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    imageUrl: initialData.imageUrl || "",
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
    itineraries: initialData.itineraries || [],
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
        imageUrl: formData.imageUrl,
        duration: formData.duration,
        maxGroupSize: formData.maxGroupSize || undefined,
        difficulty: formData.difficulty as any,
        destinations: formData.destinations,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        basePrice: formData.basePrice,
        currency: formData.currency,
        itineraries: formData.itineraries,
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
          <p className="text-sm text-slate-500 font-medium mt-1.5">Update the details of your travel package.</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={s.label} className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                    ? "bg-secondary text-white shadow-sm shadow-secondary/20"
                    : isCompleted
                      ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                      : "bg-slate-100 text-slate-400 cursor-default"
                  }`}
              >
                <div className={`h-5 w-5 rounded-lg flex items-center justify-center font-extrabold text-[10px] ${isActive ? "bg-white/20" : isCompleted ? "bg-secondary/20" : "bg-slate-200/60"
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

      <Card className="py-0 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="sm:p-6 p-4 space-y-5">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Package Title <span className="text-rose-500">*</span></Label>
                <Input id="title" placeholder="e.g., Golden Triangle Tour" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description <span className="text-rose-500">*</span></Label>
                <Textarea id="description" placeholder="Describe the travel experience..." rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              {/* Cover Image Upload & Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 block">Package Cover Image</Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image file size should be less than 5MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        if (result) {
                          setFormData({ ...formData, imageUrl: result });
                          toast.success("Image file uploaded successfully!");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {formData.imageUrl ? (
                  <div className="space-y-3">
                    <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
                      <img
                        src={formData.imageUrl}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/packages/default-package.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl font-semibold gap-1.5 cursor-pointer bg-white text-slate-900 hover:bg-slate-100"
                        >
                          <Upload className="h-4 w-4" /> Change Image
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setFormData({ ...formData, imageUrl: "" })}
                          className="rounded-xl font-semibold gap-1.5 cursor-pointer text-gray-300"
                        >
                          <X className="h-4 w-4" /> Remove
                        </Button>
                      </div>
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-white font-semibold flex items-center gap-1.5 border border-white/20">
                        <ImageIcon className="h-3.5 w-3.5" /> Selected Cover Image
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Switch preset image:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                              formData.imageUrl === preset.url
                                ? "bg-secondary text-white border-secondary"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700">
                          <span className="text-primary font-bold">Click to upload image file</span> or drag and drop
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP or GIF (Max 5MB)</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Or paste image URL (https://...)"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="flex-1"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Or choose a destination preset image:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                              formData.imageUrl === preset.url
                                ? "bg-secondary text-white border-secondary"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-semibold text-slate-700">Duration (days) <span className="text-rose-500">*</span></Label>
                  <Input id="duration" type="number" min={1} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize" className="text-sm font-semibold text-slate-700">Max Group Size</Label>
                  <Input id="maxGroupSize" type="number" min={1} value={formData.maxGroupSize} onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Difficulty <span className="text-rose-500">*</span></Label>
                  <Select value={formData.difficulty} onValueChange={(v: string | null) => v && setFormData({ ...formData, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Destinations</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g., Jaipur, India" value={formData.newDestination} onChange={(e) => setFormData({ ...formData, newDestination: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("destinations", "newDestination"))} className="flex-1" />
                  <Button type="button" onClick={() => addToList("destinations", "newDestination")} className="px-4 bg-secondary text-white hover:bg-secondary/90 rounded-sm"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.destinations.map((dest, i) => (
                  <Badge key={i} variant="secondary" className="gap-1.5 py-1.5 px-3 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    <MapPin className="h-3 w-3" /> {dest}
                    <button onClick={() => removeFromList("destinations", i)} className="ml-1 cursor-pointer hover:text-rose-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </Badge>
                ))}
                {formData.destinations.length === 0 && <p className="text-sm text-slate-400 italic">No destinations added yet.</p>}
              </div>
            </div>
          )}

          {/* Step 2: Itinerary */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Day-by-Day Itinerary Plan Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 block">Day-by-Day Itinerary Plan</Label>
                    <p className="text-xs text-slate-500 mt-1">Define day titles and daily activities shown on the package details page.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextDayNum = formData.itineraries.length + 1;
                      setFormData({
                        ...formData,
                        itineraries: [
                          ...formData.itineraries,
                          { dayNumber: nextDayNum, title: `Day ${nextDayNum}: Sightseeing & Local Exploration`, description: "" },
                        ],
                      });
                    }}
                    className="text-xs rounded-xl font-semibold gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Day
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.itineraries.map((it, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs font-bold">
                          Day {it.dayNumber || idx + 1}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.itineraries
                              .filter((_, i) => i !== idx)
                              .map((item, newIdx) => ({ ...item, dayNumber: newIdx + 1 }));
                            setFormData({ ...formData, itineraries: updated });
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <Input
                          placeholder={`e.g. Day ${idx + 1}: Arrival & Hotel Check-in`}
                          value={it.title}
                          onChange={(e) => {
                            const updated = [...formData.itineraries];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setFormData({ ...formData, itineraries: updated });
                          }}
                          className="bg-white text-xs font-semibold"
                        />
                        <Textarea
                          placeholder="Describe activities, meals, tours, or hotel stays for this day..."
                          rows={2}
                          value={it.description}
                          onChange={(e) => {
                            const updated = [...formData.itineraries];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setFormData({ ...formData, itineraries: updated });
                          }}
                          className="bg-white text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  {formData.itineraries.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No specific itinerary days added yet. Click &quot;Add Day&quot; above to add daily schedules.</p>
                  )}
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 block mb-2">Inclusions</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g., Breakfast included" value={formData.newInclusion} onChange={(e) => setFormData({ ...formData, newInclusion: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("inclusions", "newInclusion"))} className="flex-1" />
                    <Button type="button" onClick={() => addToList("inclusions", "newInclusion")} className="px-4 bg-secondary text-white hover:bg-secondary/90 rounded-sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.inclusions.map((item, i) => (
                      <Badge key={i} className="gap-1.5 py-1.5 px-3 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> {item}
                        <button onClick={() => removeFromList("inclusions", i)} className="ml-1 cursor-pointer hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 block mb-2">Exclusions</Label>
                  <div className="flex gap-2">
                    <Input placeholder="e.g., Personal expenses" value={formData.newExclusion} onChange={(e) => setFormData({ ...formData, newExclusion: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList("exclusions", "newExclusion"))} className="flex-1" />
                    <Button type="button" onClick={() => addToList("exclusions", "newExclusion")} className="px-4 bg-secondary text-white hover:bg-secondary/90 rounded-sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.exclusions.map((item, i) => (
                      <Badge key={i} variant="outline" className="gap-1.5 py-1.5 px-3 font-medium border-slate-200 text-slate-600">
                        <X className="h-3 w-3" /> {item}
                        <button onClick={() => removeFromList("exclusions", i)} className="ml-1 cursor-pointer hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                      </Badge>
                    ))}
                  </div>
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
                  <Input type="number" min={0} placeholder="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Currency <span className="text-rose-500">*</span></Label>
                  <Select value={formData.currency} onValueChange={(v: string | null) => v && setFormData({ ...formData, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              <h3 className="font-bold text-lg text-slate-900">Review Your Changes</h3>
              <div className="grid gap-3">
                {[
                  { label: "Title", value: formData.title || "—" },
                  { label: "Cover Image", value: formData.imageUrl ? "Custom image selected" : "Default destination image" },
                  { label: "Duration", value: formData.duration ? `${formData.duration} days` : "—" },
                  { label: "Difficulty", value: formData.difficulty || "—" },
                  { label: "Destinations", value: formData.destinations.join(", ") || "—" },
                  { label: "Itinerary Days", value: formData.itineraries.length ? `${formData.itineraries.length} day plan(s) added` : "Generated dynamically" },
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
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
