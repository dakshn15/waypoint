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
  images?: string[];
  createdAt: any;
}

interface AgencyPackagesListClientProps {
  initialPackages: Package[];
}

function getPackageCoverImage(pkg: { title: string; destinations?: any; images?: string[] }): string {
  if (Array.isArray(pkg.images) && pkg.images[0] && pkg.images[0].trim()) {
    return pkg.images[0].trim();
  }
  const titleLower = (pkg.title || "").toLowerCase();
  const destStr = Array.isArray(pkg.destinations)
    ? pkg.destinations.map((d: any) => (typeof d === "string" ? d : d.name || "")).join(" ").toLowerCase()
    : typeof pkg.destinations === "string" ? pkg.destinations.toLowerCase() : "";

  const text = `${titleLower} ${destStr}`;

  if (text.includes("kashmir") || text.includes("srinagar") || text.includes("gulmarg") || text.includes("pahalgam")) {
    return "/images/packages/kashmir-valley.jpg";
  }
  if (text.includes("triangle") || text.includes("delhi") || text.includes("agra")) {
    return "/images/packages/golden-triangle.jpg";
  }
  if (text.includes("kerala") || text.includes("munnar") || text.includes("alleppey") || text.includes("kochi")) {
    return "/images/packages/kerala-backwaters.jpg";
  }
  if (text.includes("himalaya") || text.includes("leh") || text.includes("manali") || text.includes("ladakh")) {
    return "/images/packages/himalayan-adventure.jpg";
  }
  if (text.includes("goa")) {
    return "/images/packages/goa-beach.jpg";
  }
  if (text.includes("rajasthan") || text.includes("udaipur") || text.includes("jodhpur") || text.includes("jaisalmer") || text.includes("jaipur")) {
    return "/images/packages/rajasthan-heritage.jpg";
  }
  if (text.includes("northeast") || text.includes("shillong") || text.includes("kaziranga") || text.includes("cherrapunji")) {
    return "/images/packages/northeast-explorer.jpg";
  }
  if (text.includes("varanasi") || text.includes("ganges")) {
    return "/images/packages/varanasi-ganges.jpg";
  }
  return "/images/packages/kashmir-valley.jpg";
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => {
          const isPending = loadingId === pkg.id;
          const destinations = Array.isArray(pkg.destinations)
            ? pkg.destinations.map((d: any) => d.name || d).join(", ")
            : "";
          const coverImage = getPackageCoverImage(pkg);

          return (
            <Card key={pkg.id} className="py-0 glass-card group hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-200/80 rounded-lg overflow-hidden flex flex-col bg-white">
              {/* Cover Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src={coverImage}
                  alt={pkg.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/packages/default-package.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Status Badge on top-left of image */}
                <div className="absolute top-3 left-3">
                  <Badge
                    className={
                      pkg.status === "PUBLISHED"
                        ? "bg-secondary/90 backdrop-blur-md text-white border-0 text-[10px] uppercase font-bold tracking-wider shadow-sm"
                        : "bg-slate-900/80 backdrop-blur-md text-white border-0 text-[10px] uppercase font-bold tracking-wider shadow-sm"
                    }
                  >
                    {pkg.status}
                  </Badge>
                </div>

                {/* Actions Dropdown top-right */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 !text-black bg-white backdrop-blur-md hover:bg-white/80 cursor-pointer rounded-full border">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-52">
                      <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                        <DropdownMenuItem>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Package
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/packages/${pkg.id}`} target="_blank">
                        <DropdownMenuItem>
                          <ExternalLink className="h-3.5 w-3.5" />
                          View on Public Site
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(pkg.id)}
                        disabled={isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {pkg.status === "PUBLISHED" ? "Switch to Draft" : "Publish Package"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(pkg)}
                        disabled={isPending}
                        variant="destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Package
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="sm:p-5 p-4 !pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors font-display">
                    {pkg.title}
                  </h3>
                  {destinations && (
                    <p className="text-sm text-slate-500 font-medium">
                      {destinations}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 font-medium">
                    {pkg.duration} days tour
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-lg font-bold text-slate-900 font-display">
                    {formatCurrency(pkg.basePrice, pkg.currency)}
                  </span>
                  <Link href={`/packages/${pkg.id}`}>
                    <Button variant="ghost" size="sm" className="py-2 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/5 cursor-pointer font-semibold rounded-md">
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
