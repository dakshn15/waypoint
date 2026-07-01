"use client";

import { useState, useTransition } from "react";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { changeUserRole, deleteUser } from "@/app/actions/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string;
  email: string;
  role: "TRAVELER" | "AGENCY" | "STAFF" | "ADMIN";
  createdAt: Date;
  phone: string | null;
}

interface UsersTableProps {
  initialUsers: User[];
  currentUserId: string;
}

export function UsersTable({ initialUsers, currentUserId }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  // Delete User Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: any) => {
    startTransition(async () => {
      const result = await changeUserRole(userId, newRole);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        toast.success(`Role updated successfully to ${newRole}`);
      } else {
        toast.error(result.error || "Failed to update role");
      }
    });
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        toast.success(`User "${deleteTarget.name}" deleted successfully`);
        setDeleteTarget(null);
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    });
  };

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/25 hover:bg-rose-500/20">
            Admin
          </Badge>
        );
      case "AGENCY":
        return (
          <Badge className="bg-[var(--waypoint-teal)]/15 text-[var(--waypoint-teal)] border border-[var(--waypoint-teal)]/25 hover:bg-[var(--waypoint-teal)]/20">
            Agency
          </Badge>
        );
      case "STAFF":
        return (
          <Badge className="bg-sky-500/15 text-sky-500 border border-sky-500/25 hover:bg-sky-500/20">
            Staff
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-zinc-300 dark:border-zinc-800">
            Traveler
          </Badge>
        );
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
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-500/5 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Filters */}
          <div className="flex w-full sm:w-auto items-center gap-2 justify-end">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "ALL")}>
              <SelectTrigger className="w-[180px] bg-zinc-500/5 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="TRAVELER">Traveler</SelectItem>
                <SelectItem value="AGENCY">Agency</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-500/5">
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
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
                      style={{ contentVisibility: "auto" }}
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
                          <DropdownMenuContent align="end" className="glass-card border border-zinc-200 dark:border-zinc-800">
                            <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, "TRAVELER")}
                              disabled={user.role === "TRAVELER" || isPending}
                            >
                              <UserCheck className="mr-2 h-4 w-4 text-zinc-500" />
                              Make Traveler
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, "AGENCY")}
                              disabled={user.role === "AGENCY" || isPending}
                            >
                              <Shield className="mr-2 h-4 w-4 text-[var(--waypoint-teal)]" />
                              Make Agency
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, "STAFF")}
                              disabled={user.role === "STAFF" || isPending}
                            >
                              <Shield className="mr-2 h-4 w-4 text-sky-500" />
                              Make Staff
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(user.id, "ADMIN")}
                              disabled={user.role === "ADMIN" || isPending}
                            >
                              <Shield className="mr-2 h-4 w-4 text-rose-500" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-500 focus:text-rose-500"
                              onClick={() => setDeleteTarget(user)}
                              disabled={user.id === currentUserId || isPending}
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
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="glass-card border-rose-500/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-500">Delete User Account</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete the account for{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{deleteTarget?.name}</strong> (
              {deleteTarget?.email})? This action will permanently remove all bookings, trips, and
              personal information associated with this user. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isPending}>
              {isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
