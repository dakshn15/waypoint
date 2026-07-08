import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserAgencyAccess } from "@/lib/permissions";
import { serializePrisma } from "@/lib/utils";
import TasksClient from "./tasks-client";

export default async function StaffTasksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role || "TRAVELER";

  if (role !== "AGENCY" && role !== "STAFF" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Resolve agency/staff details
  const access = await getUserAgencyAccess(session.user.id, session.user.role);
  if (!access) {
    // Falls back to empty or basic view if admin or no agency access
    return (
      <div className="p-6 text-center text-muted-foreground">
        No active agency associated with this account.
      </div>
    );
  }

  // Determine tasks queries based on permissions
  let tasks: any[] = [];
  let staffList: any[] = [];

  // 1. If user is the Agency Owner or a MANAGER staff, they can see all tasks and assign tasks
  const hasFullTaskAccess = access.isOwner || access.staffRole === "MANAGER";

  if (hasFullTaskAccess) {
    tasks = await prisma.task.findMany({
      where: { agencyId: access.agencyId },
      include: {
        staff: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    staffList = await prisma.agencyStaff.findMany({
      where: { agencyId: access.agencyId, active: true },
      include: { user: true },
    });
  } else {
    // 2. If user is an AGENT or SUPPORT staff, they only see tasks assigned to them specifically, or unassigned tasks
    const staff = await prisma.agencyStaff.findUnique({
      where: { userId: session.user.id },
    });

    if (staff) {
      tasks = await prisma.task.findMany({
        where: {
          agencyId: access.agencyId,
          OR: [
            { staffId: staff.id },
            { staffId: null }, // Unassigned tasks can be picked up
          ],
        },
        include: {
          staff: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return (
    <TasksClient
      initialTasks={serializePrisma(tasks)}
      staffList={serializePrisma(staffList)}
      userRole={role}
      staffRole={access.staffRole}
      currentStaffUserId={session.user.id}
    />
  );
}
