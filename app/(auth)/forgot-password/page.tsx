"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowRight, Loader2, ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

      {submitted ? (
        /* Success State */
        <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto text-primary">
            <MailCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">
              Check your inbox
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              If an account exists for <span className="font-bold text-slate-800">{email}</span>, we&apos;ve sent password reset instructions.
            </p>
          </div>

          <div className="pt-2 space-y-4">
            <Button
              type="button"
              onClick={() => setSubmitted(false)}
              variant="secondary"
              size="lg"
              className="w-full rounded-xl font-bold cursor-pointer"
            >
              Didn&apos;t receive email? Try again
            </Button>

            <Link href="/login" className="block w-full">
              <Button size="lg" className="w-full font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                Return to Sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Form State */
        <div>
          {/* Header */}
          <div className="md:mb-8 mb-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">
              Forgot password?
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              No worries! Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </Label>
              <Input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full mt-2"
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
            </Button>
          </form>

          {/* Remembered password */}
          <p className="text-center text-sm text-slate-500 md:mt-8 mt-5">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
