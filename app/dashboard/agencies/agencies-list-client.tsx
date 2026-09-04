"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Building2,
  Globe,
  Mail,
  Phone,
  CalendarCheck,
  Package,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  toggleAgencyVerification,
  toggleAgencyActive,
  createAgencyByAdmin,
  updateAgencyByAdmin,
  deleteAgencyByAdmin,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Agency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  verified: boolean;
  active: boolean;
  ownerName: string;
  ownerEmail: string;
  packagesCount: number;
  bookingsCount: number;
  staffCount: number;
  createdAt: string;
}

interface AgenciesListProps {
  initialAgencies: Agency[];
}

export function AgenciesList({ initialAgencies }: AgenciesListProps) {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Agency | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    description: "",
    website: "",
    phone: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
    verified: false,
    active: true,
  });

  const handleToggleVerification = async (agencyId: string) => {
    setLoading(true);
    const res = await toggleAgencyVerification(agencyId);
    setLoading(false);
    if (res.success) {
      setAgencies((prev) =>
        prev.map((a) => (a.id === agencyId ? { ...a, verified: !a.verified } : a))
      );
      const agency = agencies.find((a) => a.id === agencyId);
      toast.success(`Agency "${agency?.name}" verification status toggled.`);
    } else {
      toast.error(res.error || "Failed to toggle verification");
    }
  };

  const handleToggleActive = async (agencyId: string) => {
    setLoading(true);
    const res = await toggleAgencyActive(agencyId);
    setLoading(false);
    if (res.success) {
      setAgencies((prev) =>
        prev.map((a) => (a.id === agencyId ? { ...a, active: !a.active } : a))
      );
      const agency = agencies.find((a) => a.id === agencyId);
      toast.success(`Agency "${agency?.name}" status updated.`);
    } else {
      toast.error(res.error || "Failed to toggle status");
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.ownerName.trim() || !createForm.ownerEmail.trim()) {
      toast.error("Name, Owner Name, and Owner Email are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await createAgencyByAdmin({
        name: createForm.name,
        ownerName: createForm.ownerName,
        ownerEmail: createForm.ownerEmail,
        description: createForm.description || null,
        website: createForm.website || null,
        phone: createForm.phone || null,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Agency registered successfully!");
      setCreateOpen(false);
      setCreateForm({
        name: "",
        ownerName: "",
        ownerEmail: "",
        description: "",
        website: "",
        phone: "",
      });
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to register agency");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (agency: Agency) => {
    setEditTarget(agency);
    setEditForm({
      name: agency.name,
      description: agency.description || "",
      website: agency.website || "",
      email: agency.email || "",
      phone: agency.phone || "",
      address: agency.address || "",
      logo: agency.logo || "",
      verified: agency.verified,
      active: agency.active,
    });
  };

  const handleUpdateAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!editForm.name.trim()) {
      toast.error("Agency name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateAgencyByAdmin(editTarget.id, {
        name: editForm.name,
        description: editForm.description || null,
        website: editForm.website || null,
        email: editForm.email || null,
        phone: editForm.phone || null,
        address: editForm.address || null,
        logo: editForm.logo || null,
        verified: editForm.verified,
        active: editForm.active,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Agency details updated successfully!");
      setEditTarget(null);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to update agency");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgency = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      const res = await deleteAgencyByAdmin(deleteTarget.id);
      if (res.success) {
        setAgencies((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        toast.success(`Agency "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
      } else {
        toast.error(res.error || "Failed to delete agency");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete agency");
    } finally {
      setLoading(false);
    }
  };

  const filteredAgencies = agencies.filter((agency) => {
    const matchesSearch =
      agency.name.toLowerCase().includes(search.toLowerCase()) ||
      agency.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (agency.email && agency.email.toLowerCase().includes(search.toLowerCase()));

    const matchesVerified =
      filterVerified === "ALL" ||
      (filterVerified === "VERIFIED" && agency.verified) ||
      (filterVerified === "UNVERIFIED" && !agency.verified);

    return matchesSearch && matchesVerified;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto items-center justify-end">
            <div className="flex gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-100">
              <Button
                variant={filterVerified === "ALL" ? "default" : "ghost"}
                onClick={() => setFilterVerified("ALL")}
                size="sm"
                className={`h-7 px-2.5 text-xs rounded-md cursor-pointer ${
                  filterVerified === "ALL" ? "bg-secondary hover:bg-secondary/90 text-white" : ""
                }`}
              >
                All
              </Button>
              <Button
                variant={filterVerified === "VERIFIED" ? "default" : "ghost"}
                onClick={() => setFilterVerified("VERIFIED")}
                size="sm"
                className={`h-7 px-2.5 text-xs rounded-md cursor-pointer ${
                  filterVerified === "VERIFIED" ? "bg-secondary hover:bg-secondary/90 text-white" : ""
                }`}
              >
                Verified
              </Button>
              <Button
                variant={filterVerified === "UNVERIFIED" ? "default" : "ghost"}
                onClick={() => setFilterVerified("UNVERIFIED")}
                size="sm"
                className={`h-7 px-2.5 text-xs rounded-md cursor-pointer ${
                  filterVerified === "UNVERIFIED" ? "bg-secondary hover:bg-secondary/90 text-white" : ""
                }`}
              >
                Unverified
              </Button>
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add Agency
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid List */}
      <div className="grid gap-5 md:grid-cols-2">
        {filteredAgencies.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            No agencies found matching your filters.
          </div>
        ) : (
          filteredAgencies.map((agency) => (
            <Card
              key={agency.id}
              className={`glass-card sm:py-5 py-4 h-full flex flex-col justify-between overflow-hidden border ${agency.active ? "border-slate-200" : "border-rose-500/20"
                }`}
            >
              <CardHeader className="sm:px-5 pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {agency.logo ? (
                      <img
                        src={agency.logo}
                        alt={`${agency.name} logo`}
                        className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-[#E8AA9B] flex items-center justify-center text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl flex items-center gap-1.5 font-bold text-slate-900">
                        {agency.name}
                        {agency.verified ? (
                          <CheckCircle2 className="h-5 w-5 text-secondary fill-secondary/10" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Created on {formatDate(new Date(agency.createdAt))}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={agency.active ? "default" : "destructive"}>
                      {agency.active ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
                {agency.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                    {agency.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="sm:px-5 space-y-4 flex-1 flex flex-col justify-between">
                {/* Contacts & Metadata */}
                <div className="space-y-2 text-sm text-slate-600">
                  {agency.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{agency.email}</span>
                    </div>
                  )}
                  {agency.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                  {agency.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-secondary font-medium"
                      >
                        {agency.website}
                      </a>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner Details</p>
                    <p className="text-sm font-medium mt-0.5 text-slate-800">
                      {agency.ownerName} ({agency.ownerEmail})
                    </p>
                  </div>
                </div>

                {/* Stats Counter */}
                <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200/50 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Package className="h-3 w-3" /> Packages
                    </p>
                    <p className="text-lg font-bold mt-0.5 text-slate-900">{agency.packagesCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CalendarCheck className="h-3 w-3" /> Bookings
                    </p>
                    <p className="text-lg font-bold mt-0.5 text-slate-900">{agency.bookingsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" /> Staff
                    </p>
                    <p className="text-lg font-bold mt-0.5 text-slate-900">{agency.staffCount}</p>
                  </div>
                </div>

                {/* Control switches and actions row */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenEdit(agency)}
                      className="text-xs h-8 px-3 rounded-lg flex items-center gap-1 border-slate-200 hover:border-secondary/20 hover:bg-secondary/5 hover:text-secondary cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Agency
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setDeleteTarget(agency)}
                      className="text-xs h-8 px-3 rounded-lg flex items-center gap-1 border-slate-200 text-rose-500 hover:border-rose-500/25 hover:bg-rose-500/5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`verify-${agency.id}`} className="text-[10px] text-slate-500 font-semibold cursor-pointer">
                      Verified
                    </Label>
                    <Switch
                      id={`verify-${agency.id}`}
                      checked={agency.verified}
                      onCheckedChange={() => handleToggleVerification(agency.id)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Register Agency Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card max-w-md border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Register New Agency</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a travel agency tenant and create its administrator profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAgency} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-agency-name">Agency Name <span className="text-rose-500">*</span></Label>
              <Input
                id="create-agency-name"
                required
                placeholder="Golden Travels Ltd"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="bg-white border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-owner-name">Owner Name <span className="text-rose-500">*</span></Label>
                <Input
                  id="create-owner-name"
                  required
                  placeholder="Rahul Kumar"
                  value={createForm.ownerName}
                  onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-owner-email">Owner Email <span className="text-rose-500">*</span></Label>
                <Input
                  id="create-owner-email"
                  type="email"
                  required
                  placeholder="rahul@goldentravels.com"
                  value={createForm.ownerEmail}
                  onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-website">Website URL</Label>
                <Input
                  id="create-website"
                  placeholder="www.goldentravels.com"
                  value={createForm.website}
                  onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-phone">Phone</Label>
                <Input
                  id="create-phone"
                  placeholder="+91..."
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-desc">Description</Label>
              <Textarea
                id="create-desc"
                placeholder="Enter a brief profile description..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="bg-white border-slate-200 min-h-[80px]"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-200">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-secondary hover:bg-secondary text-white font-semibold rounded-xl px-5"
              >
                {loading ? "Registering..." : "Register Agency"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Agency Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="glass-card max-w-md border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Agency Tenant</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify agency details, brand logo, coordinates, and configuration settings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAgencySubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-agency-name">Agency Name <span className="text-rose-500">*</span></Label>
                <Input
                  id="edit-agency-name"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-logo">Logo URL</Label>
                <Input
                  id="edit-logo"
                  value={editForm.logo}
                  onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label htmlFor="edit-website">Website URL</Label>
                <Input
                  id="edit-website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="bg-white border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <Label htmlFor="edit-email">Public Email</Label>
                <Input
                  id="edit-email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-white border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5 col-span-1">
                <Label htmlFor="edit-phone">Public Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-white border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address">Office Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Agency Profile Description</Label>
              <Textarea
                id="edit-desc"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-white border-slate-200 min-h-[80px]"
              />
            </div>

            <div className="flex gap-4 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl justify-around">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-verified"
                  checked={editForm.verified}
                  onCheckedChange={(val) => setEditForm({ ...editForm, verified: val })}
                />
                <Label htmlFor="edit-verified" className="text-xs font-semibold cursor-pointer text-slate-700">
                  Verified Profile
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editForm.active}
                  onCheckedChange={(val) => setEditForm({ ...editForm, active: val })}
                />
                <Label htmlFor="edit-active" className="text-xs font-semibold cursor-pointer text-slate-700">
                  Active Operation
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)} className="border-slate-200">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-secondary hover:bg-secondary text-white font-semibold rounded-xl px-5"
              >
                {loading ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="glass-card border-rose-500/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-500">Delete Travel Agency</DialogTitle>
            <DialogDescription className="mt-2 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete the travel agency{" "}
              <strong className="text-slate-900">{deleteTarget?.name}</strong>?
              Deleting the agency will permanently remove its listings, bookings, and employee associations.
              The owner profile role will revert back to Traveler status. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading} className="border-slate-200">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgency} disabled={loading} className="cursor-pointer">
              {loading ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
