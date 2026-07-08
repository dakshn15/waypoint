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
    if (!form.title.trim() || !form.description.trim() || !form.dueDate) {
      toast.error("Please fill in all required fields.");
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

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setActionId(taskId);
    try {
      const res = await deleteTask(taskId);
      if (res.error) throw new Error(res.error);

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete task.");
    } finally {
      setActionId(null);
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case "BOOKING":
        return <Calendar className="h-4 w-4 text-[var(--waypoint-teal)]" />;
      case "CUSTOMER":
        return <Users className="h-4 w-4 text-sky-500" />;
      case "PACKAGE":
        return <FileText className="h-4 w-4 text-[var(--waypoint-amber)]" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-500" />;
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
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-500" />
            <h3 className="text-lg font-semibold mb-1 text-zinc-900 dark:text-zinc-100">All caught up!</h3>
            <p className="text-sm text-zinc-500">No tasks in this category.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 mt-4 md:grid-cols-1 lg:grid-cols-2">
        {list.map((task) => {
          const isPending = actionId === task.id;
          const assignedUser = task.staff?.user;

          return (
            <Card
              key={task.id}
              className={`glass-card border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-xl transition-all rounded-2xl relative ${
                task.status === "COMPLETED" ? "opacity-70" : ""
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[170px]">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <div className="pt-1">
                        {isManagerOrOwner && task.staff?.userId !== currentStaffUserId ? (
                          <div className="mr-1 pt-0.5">
                            {task.status === "COMPLETED" ? (
                              <span title="Completed"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /></span>
                            ) : task.status === "IN_PROGRESS" ? (
                              <span title="In Progress"><Clock className="h-5 w-5 text-sky-500 shrink-0 animate-pulse" /></span>
                            ) : (
                              <span title="To Do"><AlertCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-700 shrink-0" /></span>
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
                            className="h-5 w-5 rounded-lg border-zinc-300 text-[var(--waypoint-teal)] focus:ring-[var(--waypoint-teal)] dark:border-zinc-800 dark:bg-zinc-950/50 cursor-pointer disabled:opacity-50"
                          />
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-bold text-base leading-snug ${
                            task.status === "COMPLETED"
                              ? "line-through text-muted-foreground"
                              : "text-zinc-950 dark:text-zinc-55"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {isManagerOrOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isPending}
                        className="h-8 w-8 text-zinc-400 hover:text-rose-500 rounded-lg shrink-0 cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold">
                        {getCategoryIcon(task.category)}
                        {task.category}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        Due: {formatDate(new Date(task.dueDate))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-extrabold tracking-wider ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        className={`text-[9px] uppercase font-extrabold tracking-wider ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : task.status === "IN_PROGRESS"
                            ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                            : "bg-zinc-500/10 text-zinc-500 border border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-zinc-100 dark:border-zinc-900/60">
                    {isManagerOrOwner ? (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-500 font-medium">Assignee:</span>
                        <Select
                          value={task.staffId || "UNASSIGNED"}
                          onValueChange={async (val) => {
                            const targetStaffId = val === "UNASSIGNED" ? null : val;
                            toast.promise(
                              reassignTask(task.id, targetStaffId),
                              {
                                loading: "Updating assignee...",
                                success: () => {
                                  setTasks((prev) =>
                                    prev.map((t) =>
                                      t.id === task.id ? { ...t, staffId: targetStaffId, staff: staffList.find(s => s.id === targetStaffId) || null } : t
                                    )
                                  );
                                  return "Assignee updated successfully!";
                                },
                                error: "Failed to update assignee."
                              }
                            );
                          }}
                        >
                          <SelectTrigger className="h-7 min-w-[120px] bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs py-0 px-2 flex items-center justify-between cursor-pointer">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-900 border rounded-lg max-h-[160px] overflow-y-auto">
                            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                            {staffList.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        <span>
                          Assigned to:{" "}
                          <strong className="text-zinc-800 dark:text-zinc-200">
                            {assignedUser ? assignedUser.name : "Unassigned"}
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
                              className="text-xs h-7 px-2.5 rounded-lg flex items-center gap-1 hover:bg-sky-500/5 hover:text-sky-600 hover:border-sky-500/20 cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-sky-600" /> Start Work
                            </Button>
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <Button
                              size="xs"
                              onClick={() => handleUpdateStatus(task.id, "COMPLETED")}
                              disabled={isPending}
                              className="text-xs h-7 px-2.5 bg-[var(--waypoint-teal)] hover:bg-[var(--waypoint-teal)]/90 text-white rounded-lg flex items-center gap-1 cursor-pointer"
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Task Assignment Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Delegate and track operational duties, package revisions, and traveler booking requests.
          </p>
        </div>

        {isManagerOrOwner && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl h-11 px-5 flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus className="h-4.5 w-4.5" /> Assign Task
          </Button>
        )}
      </div>
      {/* Staff Performance Overview for Managers */}
      {isManagerOrOwner && (
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--waypoint-teal)]" /> Staff Workload & Performance
              </h2>
              <p className="text-xs text-muted-foreground">
                Track completion progress and workload distribution across your operations team.
              </p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {staffList.map((staff) => {
              const staffTasks = tasks.filter((t) => t.staffId === staff.id);
              const completed = staffTasks.filter((t) => t.status === "COMPLETED").length;
              const pending = staffTasks.length - completed;
              const completionRate = staffTasks.length > 0 ? Math.round((completed / staffTasks.length) * 100) : 0;

              return (
                <Card key={staff.id} className="glass-card border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl shadow-xs">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[var(--waypoint-navy)]/10 text-[var(--waypoint-navy)] dark:bg-[var(--waypoint-teal)]/10 dark:text-[var(--waypoint-teal)] flex items-center justify-center font-bold text-xs uppercase">
                          {staff.user.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-150">{staff.user.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{staff.role.toLowerCase()}</span>
                        </div>
                      </div>
                      <Badge className="text-[9px] uppercase font-extrabold tracking-wider bg-zinc-500/10 text-zinc-500 border border-zinc-200/30">
                        {completionRate}% Done
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center border-y border-zinc-100 dark:border-zinc-900/60 py-2 mt-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Assigned</span>
                        <strong className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{staffTasks.length}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Pending</span>
                        <strong className="text-sm font-extrabold text-amber-500">{pending}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Completed</span>
                        <strong className="text-sm font-extrabold text-emerald-500">{completed}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--waypoint-teal)] rounded-full transition-all duration-500"
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
                <Card className="glass-card border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl shadow-xs">
                  <CardContent className="p-4 flex flex-col justify-between h-full min-h-[120px]">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-600 dark:text-zinc-400">Unallocated Tasks</h4>
                        <span className="text-[10px] text-zinc-400 font-medium">Needs assignment</span>
                      </div>
                      <Badge className="text-[9px] uppercase font-extrabold tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {unassignedPending} Open
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      There are currently <strong className="text-zinc-700 dark:text-zinc-300">{unassignedTasks.length} unassigned</strong> operational tasks.
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {/* Filters Hub */}
      <Card className="glass-card border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm">
        <CardContent className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-500">Filter by Category</Label>
            <Select value={filterCategory} onValueChange={(v) => v && setFilterCategory(v)}>
              <SelectTrigger className="w-full h-10 bg-white/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border rounded-xl">
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="BOOKING">Booking</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="PACKAGE">Package</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-500">Filter by Priority</Label>
            <Select value={filterPriority} onValueChange={(v) => v && setFilterPriority(v)}>
              <SelectTrigger className="w-full h-10 bg-white/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border rounded-xl">
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isManagerOrOwner && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-500">Filter by Staff Member</Label>
              <Select value={filterStaff} onValueChange={(v) => v && setFilterStaff(v)}>
                <SelectTrigger className="w-full h-10 bg-white/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border rounded-xl">
                  <SelectItem value="ALL">All Staff</SelectItem>
                  <SelectItem value="UNASSIGNED">Unassigned Tasks</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user.name} ({s.role.toLowerCase()})
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
        <TabsList className="bg-zinc-500/10 dark:bg-zinc-900/50 p-1 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl max-w-full overflow-x-auto flex flex-nowrap md:inline-flex shrink-0 items-center">
          <TabsTrigger value="all" className="rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 data-[active]:text-zinc-950 dark:data-[active]:text-white">
            All Tasks ({filteredTasks.length})
          </TabsTrigger>
          <TabsTrigger value="todo" className="rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 data-[active]:text-zinc-950 dark:data-[active]:text-white">
            To Do ({filteredTasks.filter((t) => t.status === "TODO").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 data-[active]:text-zinc-950 dark:data-[active]:text-white">
            In Progress ({filteredTasks.filter((t) => t.status === "IN_PROGRESS").length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 data-[active]:text-zinc-950 dark:data-[active]:text-white">
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
        <TabsContent value="completed">
          {renderTaskList(filteredTasks.filter((t) => t.status === "COMPLETED"))}
        </TabsContent>
      </Tabs>

      {/* Create Task Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Assign New Task</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Set details and allocate this task to a member of your agency staff.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title <span className="text-red-500">*</span></Label>
              <Input
                id="task-title"
                required
                placeholder="Verify details for Booking #..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-sm"
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
                className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl text-sm min-h-[80px]"
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
                  className="bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--waypoint-teal)] rounded-xl h-11 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority <span className="text-red-500">*</span></Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => v && setForm({ ...form, priority: v as Priority })}
                >
                  <SelectTrigger className="w-full h-11 bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border rounded-xl">
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
                  <SelectTrigger className="w-full h-11 bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border rounded-xl">
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="BOOKING">Booking</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="PACKAGE">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Select
                  value={form.staffId}
                  onValueChange={(v) => setForm({ ...form, staffId: v || "" })}
                >
                  <SelectTrigger className="w-full h-11 bg-white/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 text-sm">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border rounded-xl">
                    <SelectItem value="">Unassigned</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user.name} ({s.role.toLowerCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[var(--waypoint-navy)] hover:bg-[var(--waypoint-teal)] text-white font-semibold rounded-xl h-11 px-5 cursor-pointer"
              >
                {loading ? "Assigning..." : "Assign Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
