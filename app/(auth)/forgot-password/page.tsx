"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowRight, Loader2, ArrowLeft, MailCheck, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const res = await requestPasswordReset({
        email: email.trim(),
        redirectTo: resetUrl,
      });

      if (res?.error) {
        toast.error(res.error.message || "Failed to send reset email. Please try again.");
        setLoading(false);
      } else {
        setSubmitted(true);
        setLoading(false);
        toast.success("Password reset instructions sent!");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back to sign in link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
        Back to sign in
      </Link>

      {submitted ? (
        /* Success State */
        <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto text-primary">
            <MailCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-[26px] font-extrabold tracking-tight text-secondary">
              Check your inbox
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              If an account exists for <span className="font-bold text-slate-800">{email}</span>, we&apos;ve sent password reset instructions.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer"
            >
              Didn&apos;t receive email? Try again
            </button>

            <Link
              href="/login"
              className="block w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              Return to Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Form State */
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-secondary">
              Forgot password?
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              No worries! Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  focusedField === "email" ? "text-primary" : "text-slate-500"
                }`}
              >
                Email Address
              </label>
              <input
                id="forgot-email"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending instructions…
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Remembered password */}
          <p className="text-center text-sm text-slate-500 mt-8">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline underline-offset-2"
            >
              Sign in →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
