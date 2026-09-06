"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUserAgencyAccess } from "@/lib/permissions";
import { TaskStatus, Priority, TaskCategory } from "@prisma/client";
import { taskStatusSchema } from "@/lib/validation";

interface CreateTaskInput {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: TaskCategory;
  staffId?: string | null;
}

export async function createTask(input: CreateTaskInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access) {
      return { error: "Unauthorized agency access." };
    }

    // Only Owner or MANAGER can create/assign tasks
    if (!access.isOwner && access.staffRole !== "MANAGER") {
      return { error: "Permission denied. Only managers or owners can assign tasks." };
    }

    if (!input.title.trim()) {
      return { error: "Task title is required." };
    }

    if (!input.staffId) {
      return { error: "Please select an assignee for this task." };
    }

    const assignee = await prisma.agencyStaff.findFirst({
      where: { id: input.staffId, agencyId: access.agencyId, active: true },
      select: { id: true },
    });
    if (!assignee) {
      return { error: "The selected staff member does not belong to this agency." };
    }

    const task = await prisma.task.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        dueDate: new Date(input.dueDate),
        priority: input.priority,
        category: input.category,
        agencyId: access.agencyId,
        staffId: input.staffId || null,
      },
    });

    revalidatePath("/dashboard/tasks");
    return { success: true, taskId: task.id };
  } catch (error: any) {
    console.error("[CREATE_TASK_ERROR]", error);
    return { error: error.message || "Failed to create task" };
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access) {
      return { error: "Unauthorized agency access." };
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { staff: true },
    });

    if (!task || task.agencyId !== access.agencyId) {
      return { error: "Task not found." };
    }

    // If staff is NOT manager, they must only edit tasks assigned to them
    if (!access.isOwner && access.staffRole !== "MANAGER") {
      if (!task.staff || task.staff.userId !== session.user.id) {
        return { error: "Permission denied. You can only update tasks assigned to you." };
      }
    }

    const nextStatus = taskStatusSchema.parse(status);
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: nextStatus },
    });

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
    return { success: true, status: updated.status };
  } catch (error: any) {
    console.error("[UPDATE_TASK_STATUS_ERROR]", error);
    return { error: error.message || "Failed to update task status" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access) {
      return { error: "Unauthorized agency access." };
    }

    // Only Owner or MANAGER can delete tasks
    if (!access.isOwner && access.staffRole !== "MANAGER") {
      return { error: "Permission denied. Only managers or owners can delete tasks." };
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.agencyId !== access.agencyId) {
      return { error: "Task not found." };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath("/dashboard/tasks");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_TASK_ERROR]", error);
    return { error: error.message || "Failed to delete task" };
  }
}

export async function reassignTask(taskId: string, staffId: string | null) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access) {
      return { error: "Unauthorized agency access." };
    }

    // Only Owner or MANAGER can reassign tasks
    if (!access.isOwner && access.staffRole !== "MANAGER") {
      return { error: "Permission denied. Only managers or owners can reassign tasks." };
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.agencyId !== access.agencyId) {
      return { error: "Task not found." };
    }

    if (staffId) {
      const assignee = await prisma.agencyStaff.findFirst({
        where: { id: staffId, agencyId: access.agencyId, active: true },
        select: { id: true },
      });
      if (!assignee) {
        return { error: "The selected staff member does not belong to this agency." };
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { staffId: staffId || null },
    });

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
    return { success: true, staffId: updated.staffId };
  } catch (error: any) {
    console.error("[REASSIGN_TASK_ERROR]", error);
    return { error: error.message || "Failed to reassign task" };
  }
}
