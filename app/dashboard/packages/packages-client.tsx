"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, Eye, RefreshCw } from "lucide-react";
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

  async function handleDelete(packageId: string) {
    if (!confirm("Are you sure you want to delete this package? This action cannot be undone.")) {
      return;
    }
    setLoadingId(packageId);
    try {
      await deletePackage(packageId);
      setPackages((prev) => prev.filter((p) => p.id !== packageId));
      toast.success("Package deleted successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete package.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => {
        const isPending = loadingId === pkg.id;
        return (
          <Card key={pkg.id} className="glass-card group hover:shadow-xl transition-all hover:-translate-y-1 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Badge
                  className={
                    pkg.status === "PUBLISHED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 text-[10px] uppercase font-bold tracking-wider"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 text-[10px] uppercase font-bold tracking-wider"
                  }
                >
                  {pkg.status}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250 cursor-pointer">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-900 border shadow-xl rounded-xl">
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(pkg.id)}
                      disabled={isPending}
                      className="flex items-center gap-2 cursor-pointer text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {pkg.status === "PUBLISHED" ? "Switch to Draft" : "Publish Package"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(pkg.id)}
                      disabled={isPending}
                      className="flex items-center gap-2 text-rose-600 focus:text-rose-600 cursor-pointer text-xs font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Package
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-50 line-clamp-1">{pkg.title}</h3>
              <p className="text-xs text-muted-foreground mb-4 font-medium">{pkg.duration} days tour</p>
              
              <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-900/60">
                <span className="text-md font-bold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(pkg.basePrice, pkg.currency)}
                </span>
                <Link href={`/packages/${pkg.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-[var(--waypoint-teal)] hover:text-[var(--waypoint-teal)] hover:bg-teal-500/5 cursor-pointer font-semibold rounded-lg">
                    <Eye className="h-3.5 w-3.5" /> View Detail
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
