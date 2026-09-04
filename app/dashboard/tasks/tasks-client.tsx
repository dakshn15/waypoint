"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Play,
  Check,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { createTask, updateTaskStatus, deleteTask, reassignTask } from "@/app/actions/tasks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TaskStatus, Priority, TaskCategory } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface StaffUser {
  id: string;
  name: string;
  email: string;
}

interface StaffMember {
  id: string;
  userId: string;
  agencyId: string;
  role: "MANAGER" | "AGENT" | "SUPPORT";
  active: boolean;
  user: StaffUser;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: Priority;
  category: TaskCategory;
  agencyId: string;
  staffId: string | null;
  staff: StaffMember | null;
  createdAt: string;
}

interface TasksClientProps {
  initialTasks: Task[];
  staffList: StaffMember[];
  userRole: string;
  staffRole: "MANAGER" | "AGENT" | "SUPPORT" | null;
  currentStaffUserId: string;
}

export default function TasksClient({
  initialTasks,
  staffList,
  userRole,
  staffRole,
  currentStaffUserId,
}: TasksClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStaff, setFilterStaff] = useState<string>("ALL");

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM" as Priority,
    category: "SYSTEM" as TaskCategory,
    staffId: "" as string,
  });

  const isManagerOrOwner = userRole === "AGENCY" || staffRole === "MANAGER";

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.dueDate || !form.staffId) {
      toast.error("Please fill in all required fields (including Assignee).");
      return;
    }

    setLoading(true);
    try {
      const res = await createTask({
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        priority: form.priority,
        category: form.category,
        staffId: form.staffId || null,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Task assigned successfully!");
      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        category: "SYSTEM",
        staffId: "",
      });
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(taskId: string, newStatus: TaskStatus) {
    setActionId(taskId);
    try {
      const res = await updateTaskStatus(taskId, newStatus);
      if (res.error) throw new Error(res.error);

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      toast.success(`Task status updated to ${newStatus.replace("_", " ")}.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDeleteTask(task: Task) {
    setDeleteTarget(task);
  }

  async function confirmDeleteTask() {
    if (!deleteTarget) return;
    const taskId = deleteTarget.id;
    setActionId(taskId);
    try {
      const res = await deleteTask(taskId);
      if (res.error) throw new Error(res.error);

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully.");
      router.refresh();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete task.");
    } finally {
      setActionId(null);
    }
  }

  const getPriorityBorder = (priority: Priority) => {
    switch (priority) {
      case "HIGH": return "border-l-4 border-l-rose-500";
      case "MEDIUM": return "border-l-4 border-l-primary";
      default: return "border-l-4 border-l-slate-300";
    }
  };

  const isOverdue = (task: Task) => {
    if (task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  };

  const isDueSoon = (task: Task) => {
    if (task.status === "COMPLETED") return false;
    const diff = new Date(task.dueDate).getTime() - Date.now();
    return diff > 0 && diff < 48 * 60 * 60 * 1000; // within 48h
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "MEDIUM":
        return "bg-primary/10 text-primary border border-primary/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case "BOOKING":
        return <Calendar className="h-4 w-4 text-secondary" />;
      case "CUSTOMER":
        return <Users className="h-4 w-4 text-secondary" />;
      case "PACKAGE":
        return <FileText className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    if (filterStaff !== "ALL") {
      if (filterStaff === "UNASSIGNED" && t.staffId !== null) return false;
      if (filterStaff !== "UNASSIGNED" && t.staffId !== filterStaff) return false;
    }
    return true;
  });

  const renderTaskList = (list: Task[]) => {
    if (list.length === 0) {
      return (
        <Card className="glass-card mt-4">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
            <CheckCircle2 className="h-12 w-12 mb-3 text-secondary" />
            <h3 className="text-lg font-semibold mb-1 text-slate-900">All caught up!</h3>
            <p className="text-sm text-slate-500">No tasks in this category.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-5 mt-4 md:grid-cols-2">
        {list.map((task) => {
          const isPending = actionId === task.id;
          const assignedUser = task.staff?.user;

          const taskOverdue = isOverdue(task);

          return (
            <Card
              key={task.id}
              className={`py-0 glass-card border ${taskOverdue ? "border-rose-300 bg-rose-50/20" : "border-slate-200"} hover:shadow-xl transition-all rounded-lg relative overflow-hidden ${task.status === "COMPLETED" ? "opacity-70" : ""} ${getPriorityBorder(task.priority)}`}
            >
              <CardContent className="sm:p-5 p-4 flex flex-col justify-between h-full min-h-[170px]">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <div className="pt-1">
                        {isManagerOrOwner && task.staff?.userId !== currentStaffUserId ? (
                          <div className="mr-1 pt-0.5">
                            {task.status === "COMPLETED" ? (
                              <span title="Completed"><CheckCircle2 className="h-5 w-5 text-secondary shrink-0" /></span>
                            ) : task.status === "IN_PROGRESS" ? (
                              <span title="In Progress"><Clock className="h-5 w-5 text-primary shrink-0 animate-pulse" /></span>
                            ) : (
                              <span title="To Do"><AlertCircle className="h-5 w-5 text-slate-400 shrink-0" /></span>
                            )}
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={task.status === "COMPLETED"}
                            onChange={() =>
                              handleUpdateStatus(
                                task.id,
                                task.status === "COMPLETED" ? "TODO" : "COMPLETED"
                              )
                            }
                            disabled={isPending || (userRole === "STAFF" && !isManagerOrOwner && task.staff?.userId !== currentStaffUserId)}
                            className="h-5 w-5 rounded-lg border-slate-300 text-secondary focus:ring-secondary cursor-pointer disabled:opacity-50"
                          />
                        )}
                      </div>
                      <div>
                        <h3
                          className={`text-base leading-snug ${task.status === "COMPLETED"
                            ? "font-medium text-slate-400 line-through"
                            : "font-bold text-slate-900"
                            }`}
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {isManagerOrOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task)}
                        disabled={isPending}
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg shrink-0 cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold">
                        {getCategoryIcon(task.category)}
                        {task.category}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className={`h-3.5 w-3.5 ${isOverdue(task) ? "text-rose-500" : isDueSoon(task) ? "text-amber-500" : "text-slate-400"}`} />
                        <span className={isOverdue(task) ? "text-rose-500 font-semibold" : isDueSoon(task) ? "text-amber-500 font-semibold" : ""}>
                          {isOverdue(task) ? "Overdue: " : isDueSoon(task) ? "Due soon: " : "Due: "}{formatDate(new Date(task.dueDate))}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOverdue(task) && (
                        <Badge className="text-[9px] uppercase font-bold tracking-wider bg-rose-500 text-white border-none shrink-0 animate-pulse">
                          Overdue
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold tracking-wider ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        className={`text-[9px] uppercase font-bold tracking-wider ${task.status === "COMPLETED"
                          ? "bg-secondary/10 text-secondary border-secondary/20"
                          : task.status === "IN_PROGRESS"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-slate-500/10 text-slate-500 border border-slate-200"
                          }`}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-slate-100">
                    {isManagerOrOwner ? (
                      <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-500 font-medium shrink-0">Assignee:</span>
                        {(() => {
                          const matchedStaff = staffList.find(s => s.id === task.staffId || s.userId === task.staffId || s.user?.id === task.staffId);
                          const displayStaff = matchedStaff || task.staff;
                          const currentAssigneeVal = matchedStaff ? matchedStaff.id : (task.staffId ? task.staffId : "UNASSIGNED");
                          const displayStaffName = displayStaff?.user?.name || displayStaff?.user?.email;
                          const isCurrentUser = displayStaff?.userId === currentStaffUserId;

                          return (
                            <Select
                              value={currentAssigneeVal}
                              onValueChange={async (val) => {
                                const targetStaffId = val === "UNASSIGNED" ? null : val;
                                toast.promise(
                                  reassignTask(task.id, targetStaffId),
                                  {
                                    loading: "Updating assignee...",
                                    success: () => {
                                      const foundStaff = staffList.find(s => s.id === targetStaffId);
                                      setTasks((prev) =>
                                        prev.map((t) =>
                                          t.id === task.id ? { ...t, staffId: targetStaffId, staff: foundStaff || null } : t
                                        )
                                      );
                                      return "Assignee updated successfully!";
                                    },
                                    error: "Failed to update assignee."
                                  }
                                );
                              }}
                            >
                              <SelectTrigger className="h-8 max-w-[140px] sm:max-w-[160px] min-w-0 bg-white border border-slate-200 rounded-lg text-xs py-0 px-2 flex items-center justify-between cursor-pointer font-medium">
                                <SelectValue placeholder="Unassigned">
                                  {currentAssigneeVal === "UNASSIGNED"
                                    ? "Unassigned"
                                    : displayStaffName
                                      ? `${displayStaffName}${isCurrentUser ? " (You)" : ""}`
                                      : "Assigned"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                {staffList.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.user.name || s.user.email}{s.userId === currentStaffUserId ? " (You)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium min-w-0 max-w-full">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Assigned to:{" "}
                          <strong className="text-slate-800">
                            {assignedUser ? (assignedUser.name || assignedUser.email) : "Unassigned"}
                          </strong>
                        </span>
                      </div>
                    )}

                    {/* Staff Work Status Triggers (Visible if assigned to current user) */}
                    {task.status !== "COMPLETED" &&
                      task.staff?.userId === currentStaffUserId && (
                        <div className="flex gap-2">
                          {task.status === "TODO" && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleUpdateStatus(task.id, "IN_PROGRESS")}
                              disabled={isPending}
                            >
                              <Play className="h-3 w-3 fill-primary" /> Start Work
                            </Button>
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <Button
                              size="xs"
                              onClick={() => handleUpdateStatus(task.id, "COMPLETED")}
                              disabled={isPending}
                            >
                              <Check className="h-3.5 w-3.5" /> Mark Done
                            </Button>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="max-w-sm">
          <h1 className="sm:text-3xl text-2xl font-bold tracking-tight text-slate-900">
            Task Assignment Board
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Delegate and track operational duties, package revisions, and traveler booking requests.
          </p>
        </div>

        {isManagerOrOwner && (
          <Button
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4.5 w-4.5" /> Assign Task
          </Button>
        )}
      </div>
      {/* Staff Performance Overview for Managers */}
      {isManagerOrOwner && (
        <div className="mt-4 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((staff) => {
            const staffTasks = tasks.filter((t) => t.staffId === staff.id);
            const completed = staffTasks.filter((t) => t.status === "COMPLETED").length;
            const pending = staffTasks.length - completed;
            const completionRate = staffTasks.length > 0 ? Math.round((completed / staffTasks.length) * 100) : 0;

            return (
              <Card key={staff.id} className="py-0 glass-card border border-slate-200 rounded-lg shadow-xs">
                <CardContent className="sm:p-5 p-4 space-y-3 flex flex-col">
                  <div className="flex flex-wrap justify-between items-start gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs uppercase">
                        {staff.user.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {staff.user.name}
                          {staff.userId === currentStaffUserId && (
                            <span className="ml-1 text-xs text-primary font-normal">(You)</span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{staff.role.toLowerCase()}</span>
                      </div>
                    </div>
                    <Badge className="text-[9px] uppercase font-bold tracking-wider bg-slate-500/10 text-slate-500 border border-slate-200/30">
                      {completionRate}% Done
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center border-y border-slate-100 py-2 mt-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Assigned</span>
                      <strong className="text-sm font-bold text-slate-800">{staffTasks.length}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Pending</span>
                      <strong className="text-sm font-bold text-primary">{pending}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">Completed</span>
                      <strong className="text-sm font-bold text-secondary">{completed}</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Unassigned Work Card */}
          {(() => {
            const unassignedTasks = tasks.filter((t) => t.staffId === null);
            const unassignedPending = unassignedTasks.filter((t) => t.status !== "COMPLETED").length;
            return (
              <Card className="py-0 glass-card border border-dashed border-slate-300 rounded-lg shadow-xs">
                <CardContent className="sm:p-5 p-4 flex flex-col justify-between h-full min-h-[120px]">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-600">Unallocated Tasks</h4>
                      <span className="text-[11px] text-slate-400 font-medium">Needs assignment</span>
                    </div>
                    <Badge className="text-[9px] uppercase font-bold tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {unassignedPending} Open
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 mt-2">
                    There are currently <strong className="text-slate-700">{unassignedTasks.length} unassigned</strong> operational tasks.
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Filters Hub */}
      <Card className="py-0 glass-card border border-slate-200/80 rounded-lg shadow-sm">
        <CardContent className="sm:p-5 p-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600">Filter by Category</Label>
            <Select value={filterCategory} onValueChange={(v) => v && setFilterCategory(v)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="BOOKING">Booking</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="PACKAGE">Package</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600">Filter by Priority</Label>
            <Select value={filterPriority} onValueChange={(v) => v && setFilterPriority(v)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isManagerOrOwner && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Filter by Staff Member</Label>
              <Select value={filterStaff} onValueChange={(v) => v && setFilterStaff(v)}>
                <SelectTrigger className="h-10">
                  <SelectValue>
                    {filterStaff === "ALL"
                      ? "All Staff"
                      : filterStaff === "UNASSIGNED"
                      ? "Unassigned Tasks"
                      : (() => {
                          const matched = staffList.find((s) => s.id === filterStaff);
                          return matched
                            ? `${matched.user.name} (${matched.role.toLowerCase()})${matched.userId === currentStaffUserId ? " (You)" : ""}`
                            : undefined;
                        })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Staff</SelectItem>
                  <SelectItem value="UNASSIGNED">Unassigned Tasks</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user.name} ({s.role.toLowerCase()}){s.userId === currentStaffUserId ? " (You)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Status Tabs */}
      <Tabs defaultValue="all" className="w-full mt-2">
        <TabsList className="bg-slate-500/10 p-1 border border-slate-200 rounded-lg max-w-full overflow-x-auto flex flex-nowrap md:inline-flex shrink-0 items-center">
          <TabsTrigger value="all" className="rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer text-slate-500 hover:text-slate-800 data-[active]:text-slate-950">
            All Tasks ({filteredTasks.length})
          </TabsTrigger>
          <TabsTrigger value="todo" className="rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer text-slate-500 hover:text-slate-800 data-[active]:text-slate-950">
            To Do ({filteredTasks.filter((t) => t.status === "TODO").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer text-slate-500 hover:text-slate-800 data-[active]:text-slate-950">
            In Progress ({filteredTasks.filter((t) => t.status === "IN_PROGRESS").length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer text-rose-600 hover:text-rose-700 data-[active]:bg-white data-[active]:text-rose-600 data-[active]:shadow-xs">
            Overdue ({filteredTasks.filter((t) => isOverdue(t)).length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer text-slate-500 hover:text-slate-800 data-[active]:text-slate-950">
            Completed ({filteredTasks.filter((t) => t.status === "COMPLETED").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTaskList(filteredTasks)}</TabsContent>
        <TabsContent value="todo">
          {renderTaskList(filteredTasks.filter((t) => t.status === "TODO"))}
        </TabsContent>
        <TabsContent value="in_progress">
          {renderTaskList(filteredTasks.filter((t) => t.status === "IN_PROGRESS"))}
        </TabsContent>
        <TabsContent value="overdue">
          {renderTaskList(filteredTasks.filter((t) => isOverdue(t)))}
        </TabsContent>
        <TabsContent value="completed">
          {renderTaskList(filteredTasks.filter((t) => t.status === "COMPLETED"))}
        </TabsContent>
      </Tabs>

      {/* Create Task Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Assign New Task</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Set details and allocate this task to a member of your agency staff.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title <span className="text-red-500">*</span></Label>
              <Input
                id="task-title"
                required
                placeholder="Verify details for Booking #..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-desc">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="task-desc"
                required
                placeholder="Describe the operations, steps, or requests..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-dueDate">Due Date <span className="text-red-500">*</span></Label>
                <Input
                  id="task-dueDate"
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority <span className="text-red-500">*</span></Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => v && setForm({ ...form, priority: v as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-category">Category <span className="text-red-500">*</span></Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => v && setForm({ ...form, category: v as TaskCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="BOOKING">Booking</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="PACKAGE">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee <span className="text-red-500">*</span></Label>
                <Select
                  value={form.staffId}
                  onValueChange={(v) => setForm({ ...form, staffId: v || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Assignee...">
                      {(() => {
                        const matched = staffList.find((s) => s.id === form.staffId);
                        if (!matched) return undefined;
                        return `${matched.user.name} (${matched.role.toLowerCase()})${matched.userId === currentStaffUserId ? " (You)" : ""}`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user.name} ({s.role.toLowerCase()}){s.userId === currentStaffUserId ? " (You)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? "Assigning..." : "Assign Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete Task"
        variant="destructive"
        loading={!!actionId}
        onConfirm={confirmDeleteTask}
      />
    </div>
  );
}
