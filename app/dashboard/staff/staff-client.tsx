"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Trash2, ShieldAlert, Plus, Mail, ToggleLeft, UserCog, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addAgencyStaff, deleteAgencyStaff, toggleStaffStatus, updateAgencyStaff } from "@/app/actions/staff";

interface StaffMember {
  id: string;
  role: "MANAGER" | "AGENT" | "SUPPORT";
  active: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface StaffClientProps {
  initialStaff: StaffMember[];
}

export default function StaffClient({ initialStaff }: StaffClientProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT" as "MANAGER" | "AGENT" | "SUPPORT",
  });

  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "AGENT" as "MANAGER" | "AGENT" | "SUPPORT",
    password: "",
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "MANAGER":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20";
      case "AGENT":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20";
      case "SUPPORT":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  async function handleToggleActive(userId: string, currentActive: boolean) {
    setActionId(userId);
    try {
      await toggleStaffStatus(userId);
      setStaff((prev) =>
        prev.map((s) => (s.user.id === userId ? { ...s, active: !currentActive } : s))
      );
      toast.success(`Staff account has been ${!currentActive ? "enabled" : "disabled"}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update staff status.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteStaff(userId: string) {
    if (!confirm("Are you sure you want to delete this staff member? All their access will be immediately terminated.")) {
      return;
    }
    setActionId(userId);
    try {
      await deleteAgencyStaff(userId);
      setStaff((prev) => prev.filter((s) => s.user.id !== userId));
      toast.success("Staff member deleted successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff member.");
    } finally {
      setActionId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required.");
      return;
    }
    setLoading(true);
    try {
      await addAgencyStaff({
        name: formData.name,
        email: formData.email,
        password: formData.password || "password123",
        role: formData.role,
      });

      toast.success("Staff invited successfully!");
      setInviteOpen(false);
      setFormData({ name: "", email: "", password: "", role: "AGENT" });
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite staff member.");
    } finally {
      setLoading(false);
    }
  }

  const handleEditClick = (s: StaffMember) => {
    setEditStaff(s);
    setEditFormData({
      name: s.user.name || "",
      role: s.role,
      password: "",
    });
  };

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStaff) return;
    if (!editFormData.name) {
      toast.error("Name is required.");
      return;
    }
    setLoading(true);
    try {
      await updateAgencyStaff({
        userId: editStaff.user.id,
        name: editFormData.name,
        role: editFormData.role,
        password: editFormData.password || undefined,
      });

      toast.success("Staff updated successfully!");
      setEditStaff(null);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to update staff member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff roles, status, and permissions for your agency.</p>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white gap-2 font-semibold h-11 px-5 rounded-xl transition-colors cursor-pointer">
                <Plus className="h-4 w-4" /> Add Staff Member
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Invite Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="staff-name"
                  placeholder="e.g. John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="e.g. john@agency.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password">Password (Optional)</Label>
                <Input
                  id="staff-password"
                  type="password"
                  placeholder="Defaults to: password123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Staff members will use this password to log in.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-role">Role <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.role}
                  onValueChange={(v: string | null) => v && setFormData({ ...formData, role: v as any })}
                >
                  <SelectTrigger className="w-full h-11 bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border shadow-lg rounded-xl">
                    <SelectItem value="AGENT">Agent (Default)</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="SUPPORT">Support Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                  className="rounded-xl h-11 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl h-11 px-5 cursor-pointer"
                >
                  {loading ? "Inviting..." : "Create Staff Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {staff.length === 0 ? (
        <Card className="glass-card border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 bg-gradient-to-tr from-[var(--waypoint-teal)]/10 to-[var(--waypoint-navy)]/10 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-[var(--waypoint-teal)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Staff Members Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
              Staff members can log in using their credentials and help you manage trip package bookings and support requests.
            </p>
            <Button
              onClick={() => setInviteOpen(true)}
              className="bg-teal-500/10 text-[var(--waypoint-teal)] hover:bg-teal-500/20 border border-[var(--waypoint-teal)]/30 font-semibold h-11 px-6 rounded-xl cursor-pointer"
            >
              Add Your First Staff Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => {
            const isSelfAction = actionId === s.user.id;
            return (
              <Card
                key={s.id}
                className={`glass-card hover:shadow-xl transition-all hover:-translate-y-0.5 border rounded-2xl overflow-hidden ${
                  !s.active ? "opacity-65" : "border-zinc-200/60 dark:border-zinc-800/60"
                }`}
              >
                <CardContent className="p-6 relative">
                  <button
                    onClick={() => handleDeleteStaff(s.user.id)}
                    disabled={isSelfAction}
                    className="absolute top-5 right-5 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-500/5 transition-colors border border-transparent hover:border-rose-500/10 cursor-pointer"
                    title="Delete Staff Member"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                  <button
                    onClick={() => handleEditClick(s)}
                    disabled={isSelfAction}
                    className="absolute top-5 right-13 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-500/5 transition-colors border border-transparent hover:border-zinc-500/10 cursor-pointer"
                    title="Edit Staff Member"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--waypoint-navy)] to-zinc-700 flex items-center justify-center text-white font-extrabold text-lg shadow-inner">
                      {s.user.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <h3 className="font-bold text-md text-zinc-900 dark:text-zinc-50 leading-tight">{s.user.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3 inline" /> {s.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900/60">
                    <Badge variant="outline" className={`text-[10px] font-extrabold tracking-widest uppercase ${getRoleBadgeStyle(s.role)}`}>
                      {s.role}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {s.active ? "Active" : "Disabled"}
                      </span>
                      <Switch
                        checked={s.active}
                        disabled={isSelfAction}
                        onCheckedChange={() => handleToggleActive(s.user.id, s.active)}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Staff Dialog */}
      <Dialog open={!!editStaff} onOpenChange={(open) => !open && setEditStaff(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-staff-name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="edit-staff-name"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-staff-password">New Password (Optional)</Label>
              <Input
                id="edit-staff-password"
                type="password"
                placeholder="Leave empty to keep unchanged"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-staff-role">Role <span className="text-red-500">*</span></Label>
              <Select
                value={editFormData.role}
                onValueChange={(v: string | null) => v && setEditFormData({ ...editFormData, role: v as any })}
              >
                <SelectTrigger className="w-full h-11 bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border shadow-lg rounded-xl">
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="SUPPORT">Support Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStaff(null)}
                className="rounded-xl h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl h-11 px-5 cursor-pointer"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
