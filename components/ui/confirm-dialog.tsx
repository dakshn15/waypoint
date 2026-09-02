"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const Icon =
    variant === "destructive"
      ? Trash2
      : variant === "warning"
        ? AlertTriangle
        : ShieldAlert;

  const iconColor =
    variant === "destructive"
      ? "text-rose-500"
      : variant === "warning"
        ? "text-amber-500"
        : "text-slate-500";

  const iconBg =
    variant === "destructive"
      ? "bg-rose-500/10"
      : variant === "warning"
        ? "bg-amber-500/10"
        : "bg-slate-100";

  const confirmStyle =
    variant === "destructive"
      ? "bg-rose-500 hover:bg-rose-600 text-white"
      : variant === "warning"
        ? "bg-amber-500 hover:bg-amber-600 text-white"
        : "bg-secondary hover:bg-secondary/90 text-white";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent className="max-w-sm bg-white border border-slate-200 shadow-lg">
        <DialogHeader className="space-y-3">
          <div className={`h-12 w-12 rounded-lg ${iconBg} flex items-center justify-center mx-auto`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-slate-500 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            className={`flex-1 ${confirmStyle}`}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
