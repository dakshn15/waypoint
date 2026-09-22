"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
            toast.success("Login successful! Redirecting...");
            // Immediate full navigation to clear session and render dashboard cleanly
            window.location.href = "/dashboard";
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
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate Google sign in.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="md:mb-8 mb-5 text-center">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Sign in to continue planning your dream trips.
        </p>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Email Address
          </Label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            disabled={loading || googleLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPw ? "text" : "password"}
              required
              disabled={loading || googleLoading}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || googleLoading}
          size="lg"
          className="w-full"
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
        </Button>
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
      <Button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        variant="outline"
        size="lg"
        className="w-full font-semibold text-slate-700 rounded-xl border-2 border-slate-200/80 bg-white hover:bg-slate-50 shadow-sm hover:shadow-md cursor-pointer"
      >
        {googleLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to Google…
          </>
        ) : (
          <>
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
          </>
        )}
      </Button>

      {/* Switch to Register */}
      <p className="text-center text-sm text-slate-500 md:mt-8 mt-5">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-primary hover:underline underline-offset-2"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
