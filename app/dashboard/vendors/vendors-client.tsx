"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Plus,
  Hotel,
  Car,
  Utensils,
  Camera,
  Globe,
  MoreVertical,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toggleVendorStatus, deleteVendor } from "@/app/actions/vendors";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  agencyId: string;
  name: string;
  category: "HOTEL" | "TRANSPORT" | "RESTAURANT" | "ACTIVITY" | "GUIDE" | "OTHER";
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  active: boolean;
  rating: any;
  createdAt: any;
}

interface VendorsClientProps {
  initialVendors: Vendor[];
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  HOTEL: {
    icon: <Hotel className="h-4 w-4" />,
    color: "bg-secondary/10 text-secondary border-secondary/20",
  },
  TRANSPORT: {
    icon: <Car className="h-4 w-4" />,
    color: "bg-secondary/10 text-secondary border-secondary/20",
  },
  RESTAURANT: {
    icon: <Utensils className="h-4 w-4" />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  ACTIVITY: {
    icon: <Camera className="h-4 w-4" />,
    color: "bg-[#E8AA9B]/20 text-[#C85A35] border-[#E8AA9B]/30",
  },
  GUIDE: {
    icon: <Globe className="h-4 w-4" />,
    color: "bg-secondary/10 text-secondary border-secondary/20",
  },
  OTHER: {
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
};

export default function VendorsClient({ initialVendors }: VendorsClientProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [actionId, setActionId] = useState<string | null>(null);

  async function handleToggleActive(vendorId: string, currentActive: boolean) {
    setActionId(vendorId);
    try {
      const res = await toggleVendorStatus(vendorId);
      if (res.error) throw new Error(res.error);

      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, active: !currentActive } : v))
      );
      toast.success(`Vendor has been ${!currentActive ? "enabled" : "disabled"}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update vendor status.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(vendorId: string) {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      return;
    }
    setActionId(vendorId);
    try {
      const res = await deleteVendor(vendorId);
      if (res.error) throw new Error(res.error);

      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      toast.success("Vendor deleted successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete vendor.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => {
        const catConfig = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG.OTHER;
        const isPending = actionId === vendor.id;

        return (
          <Card
            key={vendor.id}
            className={`glass-card group hover:shadow-2xl hover:shadow-secondary/10 transition-all hover:-translate-y-0.5 border border-slate-200/60 rounded-2xl overflow-hidden ${!vendor.active ? "opacity-65" : ""
              }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${catConfig.color}`}>
                  {catConfig.icon}
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={
                      vendor.active
                        ? "bg-secondary/10 text-secondary border-secondary/20 text-[10px] uppercase font-bold tracking-wider"
                        : "bg-slate-500/10 text-slate-500 border-slate-500/20 text-[10px] uppercase font-bold tracking-wider"
                    }
                  >
                    {vendor.active ? "Active" : "Inactive"}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800 cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-xl rounded-xl">
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(vendor.id, vendor.active)}
                        disabled={isPending}
                        className="flex items-center gap-2 cursor-pointer text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {vendor.active ? "Deactivate Vendor" : "Activate Vendor"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(vendor.id)}
                        disabled={isPending}
                        className="flex items-center gap-2 text-rose-600 focus:text-rose-600 cursor-pointer text-xs font-semibold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Vendor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1 group-hover:text-secondary transition-colors line-clamp-1 text-slate-900">
                {vendor.name}
              </h3>

              {vendor.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" /> {vendor.location}
                </p>
              )}

              {vendor.description && (
                <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {vendor.description}
                </p>
              )}

              <div className="flex flex-col gap-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100 font-medium">
                {vendor.contactEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {vendor.contactEmail}
                  </span>
                )}
                {vendor.contactPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {vendor.contactPhone}
                  </span>
                )}
              </div>

              {vendor.rating && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium text-slate-800">
                    {Number(vendor.rating).toFixed(1)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
