"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Hotel,
  Car,
  Utensils,
  Camera,
  Globe,
  MoreVertical,
  Trash2,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { toggleVendorStatus, deleteVendor, updateVendor } from "@/app/actions/vendors";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import AddVendorDialog from "./add-vendor-dialog";

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
  agencyId: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  HOTEL: { icon: <Hotel className="h-4 w-4" />, color: "bg-indigo-50 text-indigo-600 border border-indigo-200/60" },
  TRANSPORT: { icon: <Car className="h-4 w-4" />, color: "bg-teal-50 text-teal-600 border border-teal-200/60" },
  RESTAURANT: { icon: <Utensils className="h-4 w-4" />, color: "bg-rose-50 text-rose-600 border border-rose-200/60" },
  ACTIVITY: { icon: <Camera className="h-4 w-4" />, color: "bg-amber-50 text-amber-600 border border-amber-200/60" },
  GUIDE: { icon: <Globe className="h-4 w-4" />, color: "bg-emerald-50 text-emerald-600 border border-emerald-200/60" },
  OTHER: { icon: <Building2 className="h-4 w-4" />, color: "bg-purple-50 text-purple-600 border border-purple-200/60" },
};

const CATEGORIES = ["HOTEL", "TRANSPORT", "RESTAURANT", "ACTIVITY", "GUIDE", "OTHER"];

export default function VendorsClient({ initialVendors, agencyId }: VendorsClientProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);

  // Optimistically add a new vendor to the top of the list
  function handleVendorAdded(vendor: Vendor) {
    setVendors((prev) => [vendor, ...prev]);
  }
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "HOTEL",
    location: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  function openEdit(vendor: Vendor) {
    setEditTarget(vendor);
    setEditForm({
      name: vendor.name,
      category: vendor.category,
      location: vendor.location || "",
      contactEmail: vendor.contactEmail || "",
      contactPhone: vendor.contactPhone || "",
      description: vendor.description || "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.name.trim()) { toast.error("Vendor name is required."); return; }
    setEditLoading(true);
    try {
      const res = await updateVendor(editTarget.id, editForm);
      if (res.error) throw new Error(res.error);
      setVendors((prev) => prev.map((v) => v.id === editTarget.id ? { ...v, ...editForm, category: editForm.category as Vendor["category"] } : v));
      toast.success("Vendor updated successfully!");
      setEditTarget(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update vendor.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggleActive(vendorId: string, currentActive: boolean) {
    setActionId(vendorId);
    try {
      const res = await toggleVendorStatus(vendorId);
      if (res.error) throw new Error(res.error);
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, active: !currentActive } : v)));
      toast.success(`Vendor has been ${!currentActive ? "enabled" : "disabled"}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update vendor status.");
    } finally {
      setActionId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deleteVendor(deleteTarget.id);
      if (res.error) throw new Error(res.error);
      setVendors((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      toast.success("Vendor deleted successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete vendor.");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  const categoryCounts = vendors.reduce(
    (acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Vendor Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage your hotel, transport, and service partners.
          </p>
        </div>
        <AddVendorDialog agencyId={agencyId} onVendorAdded={handleVendorAdded} />
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 xl:grid-cols-6">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Card
            key={key}
            className="bg-white border border-slate-200/60 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center ${config.color}`}
              >
                {config.icon}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{categoryCounts[key] || 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {key}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vendors.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No vendors yet</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              Add your hotel, transport, and service partners to streamline your travel operations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => {
            const catConfig = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG.OTHER;
            const isPending = actionId === vendor.id;

            return (
              <Card
                key={vendor.id}
                className={`glass-card group hover:shadow-2xl hover:shadow-secondary/10 transition-all hover:-translate-y-0.5 border border-slate-200/60 rounded-lg overflow-hidden ${!vendor.active ? "opacity-65" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-md flex items-center justify-center ${catConfig.color}`}>
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
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => openEdit(vendor)}>
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                            Edit Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(vendor.id, vendor.active)}
                            disabled={isPending}
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                            {vendor.active ? "Deactivate Vendor" : "Activate Vendor"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(vendor)}
                            disabled={isPending}
                            variant="destructive"
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
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(Number(vendor.rating)) ? "fill-primary text-primary" : "text-slate-200"}`} />
                      ))}
                      <span className="text-xs font-semibold text-slate-700 ml-1">{Number(vendor.rating).toFixed(1)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Vendor Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Vendor</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Update the details for this vendor partner.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor-name" className="text-sm font-semibold text-slate-700">Vendor Name <span className="text-rose-500">*</span></Label>
              <Input
                id="edit-vendor-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Category</Label>
              <Select value={editForm.category} onValueChange={(v: string | null) => v && setEditForm({ ...editForm, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-vendor-location" className="text-sm font-semibold text-slate-700">Location</Label>
              <Input id="edit-vendor-location" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="e.g., Mumbai, India" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Email</Label>
                <Input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} placeholder="vendor@email.com" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Phone</Label>
                <Input value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} placeholder="+91 ..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Brief description of services..." rows={2} className="rounded-xl border-slate-200 bg-white text-sm resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={editLoading} className="bg-gradient-to-r from-primary to-orange-400 text-white">
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete Vendor"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
