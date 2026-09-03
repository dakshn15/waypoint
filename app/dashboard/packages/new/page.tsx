"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Plus, X, CheckCircle2, MapPin, Tag, IndianRupee, FileText, Image as ImageIcon, Upload, CalendarDays } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/constants/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPackage } from "@/app/actions/packages";

interface ItineraryActivity {
  time: string;
  duration: string;
  type: string;
  title: string;
  description: string;
  location: string;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  hotelName?: string;
  activities: ItineraryActivity[];
}

function autoFillDayActivities(dayNum: number, dest: string = "Destination"): ItineraryActivity[] {
  if (dayNum === 1) {
    return [
      { time: "10:00 AM", duration: "1.5 hrs", type: "TRANSPORTATION", title: `Arrival at ${dest}`, description: `Meet driver and transfer to accommodation.`, location: `${dest} Transit Hub` },
      { time: "12:00 PM", duration: "1 hr", type: "CHECK_IN", title: "Hotel Check-in & Rest", description: "Unpack and refresh at hotel.", location: `${dest} Resort` },
      { time: "02:00 PM", duration: "1.5 hrs", type: "DINING", title: "Welcome Regional Lunch", description: "Savor local dishes at a traditional restaurant.", location: `${dest} Market District` },
      { time: "04:30 PM", duration: "2 hrs", type: "SIGHTSEEING", title: "Historic Old Town Walk", description: "Stroll through iconic streets and landmarks.", location: `${dest} Heritage Zone` },
    ];
  } else if (dayNum % 2 === 0) {
    return [
      { time: "09:00 AM", duration: "3 hrs", type: "ADVENTURE", title: "Outdoor Excursion & Trail Trek", description: "Guided nature walk & panoramic viewpoint tour.", location: `${dest} Activity Point` },
      { time: "01:00 PM", duration: "1 hr", type: "DINING", title: "Traditional Lunch Feast", description: "Enjoy authentic regional cuisine.", location: `${dest} Local Diner` },
      { time: "03:00 PM", duration: "2.5 hrs", type: "CULTURAL", title: "Cultural Center & Heritage Museum", description: "Learn about regional history and traditional crafts.", location: `${dest} Cultural Hub` },
    ];
  } else {
    return [
      { time: "09:30 AM", duration: "2.5 hrs", type: "SIGHTSEEING", title: "Famous Landmarks & Monument Tour", description: "Visit top rated architecture and scenic views.", location: `${dest} Sightseeing Zone` },
      { time: "01:00 PM", duration: "1.5 hrs", type: "SHOPPING", title: "Local Handicrafts Bazaar", description: "Explore markets for spices, souvenirs, and gifts.", location: `${dest} Central Bazaar` },
      { time: "04:00 PM", duration: "2 hrs", type: "DINING", title: "Sunset View Dining Experience", description: "Relax with evening refreshments and local specialties.", location: `${dest} Hilltop Cafe` },
    ];
  }
}

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

export default function NewPackagePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
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
    itineraries: [] as ItineraryDay[],
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
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/packages">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Create Package</h1>
          <p className="text-sm text-slate-500 font-medium mt-1.5">Fill in the details for your new travel package.</p>
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
                className={`flex items-center gap-2 sm:px-3 px-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${isActive
                  ? "bg-secondary text-white shadow-sm shadow-secondary/20 cursor-default"
                  : isCompleted
                    ? "bg-secondary/10 text-secondary hover:bg-secondary/20 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-default"
                  }`}
              >
                <div className={`h-5 w-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${isActive ? "bg-white/20" : isCompleted ? "bg-secondary/20" : "bg-slate-200/60"
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

      <Card className="py-0 bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">
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
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
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
                          className="rounded-xl font-semibold gap-1.5 cursor-pointer"
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
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${formData.imageUrl === preset.url
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
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${formData.imageUrl === preset.url
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
                  <Badge key={i} className="gap-1.5 py-1.5 px-3 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    <MapPin className="h-3 w-3" /> {dest}
                    <button onClick={() => removeFromList("destinations", i)} className="ml-1 cursor-pointer hover:text-rose-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </Badge>
                ))}
                {formData.destinations.length === 0 && <p className="text-sm text-slate-400 italic">No destinations added yet. Add one above.</p>}
              </div>
            </div>
          )}

          {/* Step 2: Structured Itinerary */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Day-by-Day Itinerary Plan Builder */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center items-start justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 block">Day-by-Day Itinerary & Activity Timeline</Label>
                    <p className="text-xs text-slate-500 mt-0.5">Build day titles, times, activity types, and locations displayed on the tour details page.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextDayNum = formData.itineraries.length + 1;
                      const mainDest = formData.destinations[0] || "Destination";
                      setFormData({
                        ...formData,
                        itineraries: [
                          ...formData.itineraries,
                          {
                            dayNumber: nextDayNum,
                            title: `Day ${nextDayNum}: Sightseeing & Local Exploration`,
                            description: "",
                            hotelName: `${mainDest} Resort & Spa`,
                            activities: autoFillDayActivities(nextDayNum, mainDest),
                          },
                        ],
                      });
                    }}
                    className="text-xs rounded-xl font-semibold gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Day
                  </Button>
                </div>

                <div className="space-y-5">
                  {formData.itineraries.map((it, idx) => (
                    <div key={idx} className="p-4 sm:p-5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
                      {/* Day Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-secondary text-white border-0 text-xs font-bold px-2.5 py-1">
                            Day {it.dayNumber || idx + 1}
                          </Badge>
                          <span className="text-xs text-slate-400 font-medium">({it.activities.length} activity item{it.activities.length !== 1 ? "s" : ""})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = [...formData.itineraries];
                              const mainDest = formData.destinations[0] || "Destination";
                              updated[idx].activities = autoFillDayActivities(it.dayNumber || idx + 1, mainDest);
                              setFormData({ ...formData, itineraries: updated });
                              toast.success(`Auto-filled activities for Day ${it.dayNumber || idx + 1}`);
                            }}
                            className="text-[11px] h-7 px-2.5 rounded-lg text-secondary hover:bg-secondary/10 font-semibold cursor-pointer"
                          >
                            ✨ Auto-Fill Timeline
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.itineraries
                                .filter((_, i) => i !== idx)
                                .map((item, newIdx) => ({ ...item, dayNumber: newIdx + 1 }));
                              setFormData({ ...formData, itineraries: updated });
                            }}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-1 rounded-md transition-colors cursor-pointer"
                            title="Remove Day"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Hotel Fields */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600">Day Title</Label>
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
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-600">Accommodation / Hotel Stay (Optional)</Label>
                          <Input
                            placeholder="e.g. Grand Resort & Spa"
                            value={it.hotelName || ""}
                            onChange={(e) => {
                              const updated = [...formData.itineraries];
                              updated[idx] = { ...updated[idx], hotelName: e.target.value };
                              setFormData({ ...formData, itineraries: updated });
                            }}
                            className="bg-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Activities Timeline Section */}
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Activities Timeline</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = [...formData.itineraries];
                              updated[idx].activities.push({
                                time: "10:00 AM",
                                duration: "1.5 hrs",
                                type: "SIGHTSEEING",
                                title: "Sightseeing Activity",
                                description: "",
                                location: "Local Attraction",
                              });
                              setFormData({ ...formData, itineraries: updated });
                            }}
                            className="text-[11px] h-7 px-2 rounded-lg font-semibold cursor-pointer border-slate-200"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Activity
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {it.activities.map((act, actIdx) => (
                            <div key={actIdx} className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2.5">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Time</Label>
                                  <Input
                                    placeholder="10:00 AM"
                                    value={act.time || ""}
                                    onChange={(e) => {
                                      const updated = [...formData.itineraries];
                                      updated[idx].activities[actIdx].time = e.target.value;
                                      setFormData({ ...formData, itineraries: updated });
                                    }}
                                    className="h-8 text-xs bg-slate-50/50"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Duration</Label>
                                  <Input
                                    placeholder="1.5 hrs"
                                    value={act.duration || ""}
                                    onChange={(e) => {
                                      const updated = [...formData.itineraries];
                                      updated[idx].activities[actIdx].duration = e.target.value;
                                      setFormData({ ...formData, itineraries: updated });
                                    }}
                                    className="h-8 text-xs bg-slate-50/50"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Type</Label>
                                  <Select
                                    value={act.type || "SIGHTSEEING"}
                                    onValueChange={(v: string | null) => {
                                      if (v) {
                                        const updated = [...formData.itineraries];
                                        updated[idx].activities[actIdx].type = v;
                                        setFormData({ ...formData, itineraries: updated });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-slate-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="SIGHTSEEING">📷 Sightseeing</SelectItem>
                                      <SelectItem value="ADVENTURE">🏔️ Adventure</SelectItem>
                                      <SelectItem value="DINING">🍽️ Dining</SelectItem>
                                      <SelectItem value="CULTURAL">🎭 Cultural</SelectItem>
                                      <SelectItem value="SHOPPING">🛍️ Shopping</SelectItem>
                                      <SelectItem value="TRANSPORTATION">🚌 Transport</SelectItem>
                                      <SelectItem value="CHECK_IN">☕ Check In</SelectItem>
                                      <SelectItem value="CHECK_OUT">☕ Check Out</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Activity Title</Label>
                                  <Input
                                    placeholder="e.g. Guided Monument Tour"
                                    value={act.title}
                                    onChange={(e) => {
                                      const updated = [...formData.itineraries];
                                      updated[idx].activities[actIdx].title = e.target.value;
                                      setFormData({ ...formData, itineraries: updated });
                                    }}
                                    className="h-8 text-xs font-semibold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Location</Label>
                                  <Input
                                    placeholder="e.g. Manali Historical Zone"
                                    value={act.location || ""}
                                    onChange={(e) => {
                                      const updated = [...formData.itineraries];
                                      updated[idx].activities[actIdx].location = e.target.value;
                                      setFormData({ ...formData, itineraries: updated });
                                    }}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 items-start pt-1">
                                <Input
                                  placeholder="Short description of this activity..."
                                  value={act.description || ""}
                                  onChange={(e) => {
                                    const updated = [...formData.itineraries];
                                    updated[idx].activities[actIdx].description = e.target.value;
                                    setFormData({ ...formData, itineraries: updated });
                                  }}
                                  className="h-8 text-xs flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.itineraries];
                                    updated[idx].activities = updated[idx].activities.filter((_, aI) => aI !== actIdx);
                                    setFormData({ ...formData, itineraries: updated });
                                  }}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 p-1.5 rounded-md transition-colors cursor-pointer mt-0.5"
                                  title="Remove Activity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {it.activities.length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-2">No activities added for this day. Click &quot;✨ Auto-Fill Timeline&quot; above to auto-generate activities.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.itineraries.length === 0 && (
                    <div className="sm:p-6 p-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                      <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-base font-semibold text-slate-900 mb-1.5">No itinerary days created yet.</p>
                      <p className="text-xs text-slate-400 mt-0.5 mb-3">Click &quot;+ Add Day&quot; above to build custom day-by-day activity timelines.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const mainDest = formData.destinations[0] || "Destination";
                          setFormData({
                            ...formData,
                            itineraries: [
                              { dayNumber: 1, title: `Day 1: Arrival & Welcome`, description: "", hotelName: `${mainDest} Resort`, activities: autoFillDayActivities(1, mainDest) },
                              { dayNumber: 2, title: `Day 2: Full Day Exploration`, description: "", hotelName: `${mainDest} Resort`, activities: autoFillDayActivities(2, mainDest) },
                            ],
                          });
                        }}
                        className="text-xs rounded-xl font-semibold gap-1 cursor-pointer"
                      >
                        ✨ Add Sample 2-Day Itinerary Timeline
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 block">Inclusions</Label>
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
              <h3 className="font-bold text-lg text-slate-900">Review Your Package</h3>
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
                  <div key={row.label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-100">
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
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create Package"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
