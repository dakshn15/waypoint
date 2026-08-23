"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2, User, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"TRAVELER" | "AGENCY">("TRAVELER");
  const [loading, setLoading] = useState(false);

  // Password strength score (0 to 4)
  const pwStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();
  const pwLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength] || "";
  const pwColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"][pwStrength] || "";

  const validateForm = () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error(role === "TRAVELER" ? "Please enter your full name." : "Please enter your agency name.");
      return false;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      await signUp.email(
        {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        } as any,
        {
          onSuccess: async () => {
            toast.success("Account created successfully!");
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Could not create account. Please try again.");
            setLoading(false);
          },
        }
      );
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="md:mb-8 mb-5 text-center">
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tighty">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Join Waypoint to plan, book, and manage unforgettable trips.
        </p>
      </div>

      {/* Role Toggle */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {/* Traveler */}
        <button
          type="button"
          onClick={() => setRole("TRAVELER")}
          className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${role === "TRAVELER"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md"
            }`}
        >
          {role === "TRAVELER" && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${role === "TRAVELER"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
              }`}
          >
            <User className="h-4 w-4" />
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold ${role === "TRAVELER" ? "text-primary" : "text-slate-700"}`}>
              Traveler
            </p>
            <p className="text-[10px] text-slate-400">Explore & book trips</p>
          </div>
        </button>

        {/* Agency */}
        <button
          type="button"
          onClick={() => setRole("AGENCY")}
          className={`group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${role === "AGENCY"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md"
            }`}
        >
          {role === "AGENCY" && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${role === "AGENCY"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
              }`}
          >
            <Building2 className="h-4 w-4" />
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold ${role === "AGENCY" ? "text-primary" : "text-slate-700"}`}>
              Agency
            </p>
            <p className="text-[10px] text-slate-400">List & manage packages</p>
          </div>
        </button>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {role === "TRAVELER" ? "Full Name" : "Agency Name"}
          </Label>
          <Input
            id="reg-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "TRAVELER" ? "John Doe" : "Wanderlust Travels"}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Email Address
          </Label>
          <Input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Password
          </Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength Meter */}
          {password.length > 0 && (
            <div className="flex items-center gap-2.5 pt-1 animate-in fade-in duration-300">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? pwColor : "bg-slate-200"
                      }`}
                  />
                ))}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${pwStrength <= 1
                    ? "text-red-500"
                    : pwStrength === 2
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
              >
                {pwLabel}
              </span>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full mt-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to Login */}
      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-primary hover:underline underline-offset-2"
        >
          Sign in →
        </Link>
      </p>
    </div>
  );
}
