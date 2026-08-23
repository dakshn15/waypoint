"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        setToken(tokenParam);
      }
    }
  }, []);

  // Password strength score
  const pwStrength = (() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();
  const pwLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength] || "";
  const pwColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"][pwStrength] || "";

  const validateForm = () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      await resetPassword({
        newPassword,
        token,
      }, {
        onSuccess: () => {
          setSuccess(true);
          setLoading(false);
          toast.success("Password reset successfully!");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to reset password. Token may be expired.");
          setLoading(false);
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {success ? (
        /* Success State */
        <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight">
              Password Reset Complete
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
          </div>

          <Link href="/login" className="block w-full mt-4">
            <Button size="lg" className="w-full font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
              Sign in to your account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        /* Form State */
        <div>
          {/* Header */}
          <div className="md:mb-8 mb-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight">
              Set new password
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              {/* Password strength meter */}
              {newPassword.length > 0 && (
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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
                  Resetting password…
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Login */}
          <p className="text-center text-sm text-slate-500 lg:mt-8 mt-5">
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
