"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam === "Configuration") {
        toast.error(
          "Google Login is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file."
        );
      }
    }
  }, []);

  const validateForm = () => {
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
    if (!password) {
      toast.error("Please enter your password.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      await signIn.email(
        { email: email.trim(), password },
        {
          onSuccess: () => {
            toast.success("Login successful");
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Invalid email or password");
            setLoading(false);
          },
        }
      );
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn.social({ provider: "google" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate Google sign in.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-tight text-secondary">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sign in to continue planning your dream trips.
        </p>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === "email" ? "text-primary" : "text-slate-500"}`}
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            placeholder="you@example.com"
            className="w-full h-12 px-4 rounded-xl bg-white border-2 border-slate-200/80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === "password" ? "text-primary" : "text-slate-500"}`}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              className="w-full h-12 px-4 pr-12 rounded-xl bg-white border-2 border-slate-200/80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
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
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400">
          or continue with
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Google SSO Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm font-semibold text-slate-700 cursor-pointer shadow-sm hover:shadow-md"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      {/* Switch to Register */}
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-primary hover:underline underline-offset-2"
        >
          Create one →
        </Link>
      </p>
    </div>
  );
}
