"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, Eye, RefreshCw, Pencil, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { deletePackage, togglePackageStatus } from "@/app/actions/packages";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Package {
  id: string;
  title: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  basePrice: number;
  currency: string;
  duration: number;
  destinations: any;
  createdAt: any;
}

interface AgencyPackagesListClientProps {
  initialPackages: Package[];
}

export default function AgencyPackagesListClient({ initialPackages }: AgencyPackagesListClientProps) {
  const [packages, setPackages] = useState(initialPackages);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  async function handleToggleStatus(packageId: string) {
    setLoadingId(packageId);
    try {
      const updated = await togglePackageStatus(packageId);
      setPackages((prev) =>
        prev.map((p) => (p.id === packageId ? { ...p, status: updated.status } : p))
      );
      toast.success(`Package status updated to ${updated.status.toLowerCase()}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update package status.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(pkg: Package) {
    setDeleteTarget(pkg);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deletePackage(deleteTarget.id);
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Package deleted successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete package.");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => {
          const isPending = loadingId === pkg.id;
          const destinations = Array.isArray(pkg.destinations)
            ? pkg.destinations.map((d: any) => d.name || d).join(", ")
            : "";

          return (
            <Card key={pkg.id} className="glass-card group hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-200 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    className={
                      pkg.status === "PUBLISHED"
                        ? "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15 text-[10px] uppercase font-bold tracking-wider"
                        : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 text-[10px] uppercase font-bold tracking-wider"
                    }
                  >
                    {pkg.status}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-100 shadow-2xl shadow-slate-200/60 rounded-2xl p-1.5">
                      <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                        <DropdownMenuItem className="flex items-center gap-2.5 cursor-pointer rounded-xl text-sm px-3 py-2 hover:bg-slate-50 transition-colors">
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          Edit Package
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/packages/${pkg.id}`} target="_blank">
                        <DropdownMenuItem className="flex items-center gap-2.5 cursor-pointer rounded-xl text-sm px-3 py-2 hover:bg-slate-50 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                          View on Public Site
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(pkg.id)}
                        disabled={isPending}
                        className="flex items-center gap-2.5 cursor-pointer rounded-xl text-sm px-3 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                        {pkg.status === "PUBLISHED" ? "Switch to Draft" : "Publish Package"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-100 my-1" />
                      <DropdownMenuItem
                        onClick={() => handleDelete(pkg)}
                        disabled={isPending}
                        className="flex items-center gap-2.5 text-rose-600 focus:text-rose-600 cursor-pointer rounded-xl text-sm px-3 py-2 hover:bg-rose-50 transition-colors font-semibold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Package
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-bold text-lg mb-0.5 text-slate-900 line-clamp-1">{pkg.title}</h3>
                {destinations && (
                  <p className="text-xs text-slate-400 font-medium mb-1 line-clamp-1">{destinations}</p>
                )}
                <p className="text-xs text-muted-foreground mb-4 font-medium">{pkg.duration} days tour</p>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-md font-bold text-slate-900">
                    {formatCurrency(pkg.basePrice, pkg.currency)}
                  </span>
                  <Link href={`/packages/${pkg.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-secondary hover:text-secondary hover:bg-secondary/5 cursor-pointer font-semibold rounded-lg">
                      <Eye className="h-3.5 w-3.5" /> View Detail
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Package"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and will remove all associated data.`}
        confirmLabel="Yes, Delete Package"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </>
  );
}
