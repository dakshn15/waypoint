import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: "BOOKING" | "CUSTOMER" | "PACKAGE" | "SYSTEM";
}

const DUMMY_TASKS: Task[] = [
  {
    id: "1",
    title: "Verify traveler details for Booking #b738s9",
    description: "Review passport details and travel preferences submitted by Rahul Sharma.",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2), // 2 days from now
    status: "TODO",
    priority: "HIGH",
    category: "BOOKING",
  },
  {
    id: "2",
    title: "Follow up with Wanderlust Travels",
    description: "Request updated itinerary details for the Himalayan Adventure Package.",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 1), // 1 day from now
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "PACKAGE",
  },
  {
    id: "3",
    title: "Assist user Priya with payment error",
    description: "User reported Razorpay gateway timeout. Check payment database records.",
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1), // Yesterday
    status: "TODO",
    priority: "MEDIUM",
    category: "CUSTOMER",
  },
  {
    id: "4",
    title: "Approve Golden Triangle Tour updates",
    description: "Agency has changed pricing and inclusions. Review before publishing changes.",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 4),
    status: "COMPLETED",
    priority: "LOW",
    category: "PACKAGE",
  },
  {
    id: "5",
    title: "Generate weekly booking summary reports",
    description: "Export the CSV report for agency bookings and commissions.",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3),
    status: "TODO",
    priority: "LOW",
    category: "SYSTEM",
  },
];

export default async function StaffTasksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== "STAFF" && (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "HIGH":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/25";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/25";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/25";
    }
  };

  const getCategoryIcon = (category: Task["category"]) => {
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

  const renderTaskList = (tasks: Task[]) => {
    if (tasks.length === 0) {
      return (
        <Card className="glass-card mt-4">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500" />
            <p className="font-medium text-zinc-900 dark:text-zinc-100">All caught up!</p>
            <p className="text-sm text-zinc-500">No tasks in this category.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        {tasks.map((task) => (
          <Card key={task.id} className="glass-card border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={task.status === "COMPLETED"}
                  readOnly
                  disabled
                  className="h-4 w-4 rounded border-zinc-300 text-[var(--waypoint-teal)] focus:ring-[var(--waypoint-teal)] dark:border-zinc-800 dark:bg-zinc-950/50 cursor-not-allowed"
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold text-sm ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : "text-zinc-950 dark:text-zinc-50"}`}>
                    {task.title}
                  </span>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    {getCategoryIcon(task.category)}
                    {task.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Due: {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Task Board</h1>
        <p className="text-muted-foreground mt-1">
          Manage bookings, vendor coordination, and travel support requests.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-zinc-500/10 dark:bg-zinc-900/50 p-1 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl">
          <TabsTrigger value="all">All Tasks ({DUMMY_TASKS.length})</TabsTrigger>
          <TabsTrigger value="todo">To Do ({DUMMY_TASKS.filter(t => t.status === "TODO").length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({DUMMY_TASKS.filter(t => t.status === "IN_PROGRESS").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({DUMMY_TASKS.filter(t => t.status === "COMPLETED").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTaskList(DUMMY_TASKS)}</TabsContent>
        <TabsContent value="todo">{renderTaskList(DUMMY_TASKS.filter((t) => t.status === "TODO"))}</TabsContent>
        <TabsContent value="in_progress">{renderTaskList(DUMMY_TASKS.filter((t) => t.status === "IN_PROGRESS"))}</TabsContent>
        <TabsContent value="completed">{renderTaskList(DUMMY_TASKS.filter((t) => t.status === "COMPLETED"))}</TabsContent>
      </Tabs>
    </div>
  );
}
