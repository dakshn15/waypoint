"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MoreHorizontal,
  Shield,
  Trash2,
  Mail,
  Phone,
  UserCheck,
  Filter,
  Plus,
  Edit2,
  Building,
} from "lucide-react";
import { deleteUser, createUserByAdmin, updateUserByAdmin } from "@/app/actions/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN";
  createdAt: string;
  phone: string | null;
  agencyStaff?: {
    agencyId: string;
    role: "MANAGER" | "AGENT" | "SUPPORT";
  } | null;
}

interface AgencyItem {
  id: string;
  name: string;
}

interface UsersTableProps {
  initialUsers: User[];
  agencies: AgencyItem[];
  currentUserId: string;
}

export function UsersTable({ initialUsers, agencies, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Form States
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "TRAVELER" as User["role"],
    agencyId: "",
    staffRole: "AGENT" as "MANAGER" | "AGENT" | "SUPPORT",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "TRAVELER" as User["role"],
    agencyId: "",
    staffRole: "AGENT" as "MANAGER" | "AGENT" | "SUPPORT",
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenEdit = (user: User) => {
    setEditTarget(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      agencyId: user.agencyStaff?.agencyId || "",
      staffRole: user.agencyStaff?.role || "AGENT",
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      toast.error("Name and Email are required.");
      return;
    }

    if (createForm.role === "STAFF" && !createForm.agencyId) {
      toast.error("An agency must be assigned for staff accounts.");
      return;
    }

    setLoading(true);
    try {
      const res = await createUserByAdmin({
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        phone: createForm.phone || undefined,
        agencyId: createForm.role === "STAFF" ? createForm.agencyId : null,
        staffRole: createForm.role === "STAFF" ? createForm.staffRole : null,
      });

      if (res.error) throw new Error(res.error);

      toast.success("User account registered successfully!");
      setCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        role: "TRAVELER",
        agencyId: "",
        staffRole: "AGENT",
      });
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error("Name and Email are required.");
      return;
    }

    if (editForm.role === "STAFF" && !editForm.agencyId) {
      toast.error("An agency must be assigned for staff accounts.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserByAdmin(editTarget.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone || null,
        agencyId: editForm.role === "STAFF" ? editForm.agencyId : null,
        staffRole: editForm.role === "STAFF" ? editForm.staffRole : null,
      });

      if (res.error) throw new Error(res.error);

      toast.success("User profile updated successfully!");
      setEditTarget(null);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      const result = await deleteUser(deleteTarget.id);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        toast.success(`User "${deleteTarget.name}" deleted successfully`);
        setDeleteTarget(null);
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/25">Admin</Badge>;
      case "AGENCY":
        return <Badge className="bg-[var(--waypoint-teal)]/15 text-[var(--waypoint-teal)] border border-[var(--waypoint-teal)]/25">Agency</Badge>;
      case "STAFF":
        return <Badge className="bg-sky-500/15 text-sky-500 border border-sky-500/25">Staff</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-zinc-300 dark:border-zinc-800">Traveler</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-500/5 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Action and Filter */}
          <div className="flex w-full sm:w-auto items-center gap-3 justify-end">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "ALL")}>
              <SelectTrigger className="w-[150px] bg-zinc-500/5 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border">
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="TRAVELER">Traveler</SelectItem>
                <SelectItem value="AGENCY">Agency</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl flex items-center gap-1.5 h-9 px-4 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-500/5">
                <TableHead className="w-[230px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-500/5 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--waypoint-teal)] to-sky-400 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {formatDate(new Date(user.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border border-zinc-200 dark:border-zinc-800 p-1">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)} className="cursor-pointer">
                              <Edit2 className="mr-2 h-4 w-4 text-sky-500" />
                              Edit User Details
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-rose-500 focus:text-rose-500 cursor-pointer"
                            onClick={() => setDeleteTarget(user)}
                            disabled={user.id === currentUserId}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Register New User</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a new Traveler, Agency Owner, Staff member, or Administrator account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Name <span className="text-rose-500">*</span></Label>
              <Input
                id="create-name"
                required
                placeholder="John Doe"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email <span className="text-rose-500">*</span></Label>
              <Input
                id="create-email"
                type="email"
                required
                placeholder="john@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-phone">Phone</Label>
                <Input
                  id="create-phone"
                  placeholder="+91..."
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-role">System Role <span className="text-rose-500">*</span></Label>
                <Select
                  value={createForm.role}
                  onValueChange={(val: any) => setCreateForm({ ...createForm, role: val })}
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border">
                    <SelectItem value="TRAVELER">Traveler</SelectItem>
                    <SelectItem value="AGENCY">Agency Owner</SelectItem>
                    <SelectItem value="STAFF">Agency Staff</SelectItem>
                    <SelectItem value="ADMIN">System Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* STAFF Assignments */}
            {createForm.role === "STAFF" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-500/5 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="space-y-1.5">
                  <Label htmlFor="create-agency">Target Agency <span className="text-rose-500">*</span></Label>
                  <Select
                    value={createForm.agencyId}
                    onValueChange={(val) => setCreateForm({ ...createForm, agencyId: val || "" })}
                  >
                    <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-900/40 border-zinc-250 dark:border-zinc-800 text-xs">
                      <SelectValue placeholder="Select Agency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border">
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-staff-role">Staff Authority <span className="text-rose-500">*</span></Label>
                  <Select
                    value={createForm.staffRole}
                    onValueChange={(val: any) => setCreateForm({ ...createForm, staffRole: val })}
                  >
                    <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-900/40 border-zinc-250 dark:border-zinc-800 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border">
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="SUPPORT">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl px-5"
              >
                {loading ? "Registering..." : "Register User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="glass-card max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User Profile</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify account info, change role, or update agency allocation details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name <span className="text-rose-500">*</span></Label>
              <Input
                id="edit-name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email <span className="text-rose-500">*</span></Label>
              <Input
                id="edit-email"
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-role">System Role <span className="text-rose-500">*</span></Label>
                <Select
                  value={editForm.role}
                  onValueChange={(val: any) => setEditForm({ ...editForm, role: val })}
                  disabled={editTarget?.id === currentUserId}
                >
                  <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border">
                    <SelectItem value="TRAVELER">Traveler</SelectItem>
                    <SelectItem value="AGENCY">Agency Owner</SelectItem>
                    <SelectItem value="STAFF">Agency Staff</SelectItem>
                    <SelectItem value="ADMIN">System Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* STAFF Assignments */}
            {editForm.role === "STAFF" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-500/5 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-agency">Target Agency <span className="text-rose-500">*</span></Label>
                  <Select
                    value={editForm.agencyId}
                    onValueChange={(val) => setEditForm({ ...editForm, agencyId: val || "" })}
                  >
                    <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800 text-xs">
                      <SelectValue placeholder="Select Agency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border">
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-staff-role">Staff Authority <span className="text-rose-500">*</span></Label>
                  <Select
                    value={editForm.staffRole}
                    onValueChange={(val: any) => setEditForm({ ...editForm, staffRole: val })}
                  >
                    <SelectTrigger className="w-full bg-white/50 dark:bg-zinc-900/40 border-zinc-250 dark:border-zinc-800 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border">
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="SUPPORT">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl px-5"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="glass-card border-rose-500/20 max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-500">Delete User Account</DialogTitle>
            <DialogDescription className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete the account for{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</strong> (
              {deleteTarget?.email})? This action will permanently remove all bookings, trips, and
              personal information associated with this user. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={loading} className="cursor-pointer">
              {loading ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
