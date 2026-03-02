"use server";

import { db } from "@/db";
import { task } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { syncAssignedToLink } from "@/features/links/helpers";
import {
  createTaskSchema,
  updateTaskSchema,
  bulkTaskOperationSchema,
  type UpdateTaskInput,
} from "./schema";
import {
  validateSession,
  checkOwnership,
  revalidateEntityPaths,
  revalidateProjectChange,
  copyEntityTags,
  softDeleteEntity,
  hardDeleteEntity,
  restoreEntityFromTrash,
  archiveEntity,
  restoreArchivedEntity,
} from "@/lib/entity-helpers";
import { parseInput, errors } from "@/lib/errors";

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

export async function createTask(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createTaskSchema, input);

  const [createdTask] = await db
    .insert(task)
    .values({
      ...data,
      userId: session.user.id,
      status: "todo",
      position: 0,
    })
    .returning();

  if (data.projectId) {
    await syncAssignedToLink(session.user.id, "task", createdTask.id, data.projectId);
  }

  revalidateEntityPaths("task", undefined, data.projectId);

  return createdTask;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

export async function updateTask(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateTaskSchema, input);

  const existingTask = await checkOwnership<typeof task.$inferSelect>("task", id, session.user.id);

  // Auto-set completedAt when status changes to 'done'
  const updateData: UpdateTaskInput & { completedAt?: Date | null } = { ...data };
  if (data.status === "done" && existingTask.status !== "done") {
    updateData.completedAt = new Date();
  } else if (data.status && data.status !== "done") {
    updateData.completedAt = null;
  }

  const [updatedTask] = await db.update(task).set(updateData).where(eq(task.id, id)).returning();

  if ("projectId" in data) {
    await syncAssignedToLink(session.user.id, "task", id, data.projectId);
  }

  revalidateEntityPaths("task", id, existingTask.projectId);
  revalidateProjectChange("task", existingTask.projectId, data.projectId);

  return updatedTask;
}

export async function markTaskComplete(id: string) {
  return updateTask(id, { status: "done" });
}

export async function markTaskIncomplete(id: string) {
  return updateTask(id, { status: "todo" });
}

export async function updateTaskStatus(
  id: string,
  status: "todo" | "in_progress" | "done" | "cancelled"
) {
  return updateTask(id, { status });
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

export async function deleteTask(id: string) {
  const session = await validateSession();
  await softDeleteEntity("task", id, session.user.id);
}

export async function hardDeleteTask(id: string) {
  const session = await validateSession();
  await hardDeleteEntity("task", id, session.user.id);
}

export async function restoreFromTrashTask(id: string) {
  const session = await validateSession();
  await restoreEntityFromTrash("task", id, session.user.id);
}

/**
 * Duplicate a task
 *
 * Creates a copy with "Copy of" prefix, same description/priority/project,
 * status reset to "todo", dates/completion cleared, tags copied.
 */
export async function duplicateTask(id: string) {
  const session = await validateSession();

  const originalTask = await checkOwnership<typeof task.$inferSelect>("task", id, session.user.id);

  const [duplicatedTask] = await db
    .insert(task)
    .values({
      userId: session.user.id,
      title: `Copy of ${originalTask.title}`,
      description: originalTask.description,
      priority: originalTask.priority,
      projectId: originalTask.projectId,
      status: "todo",
      dueDate: null,
      startDate: null,
      duration: originalTask.duration,
      completedAt: null,
      parentTaskId: null,
      position: 0,
      metadata: originalTask.metadata,
    })
    .returning();

  await copyEntityTags("task", id, "task", duplicatedTask.id, session.user.id);

  if (duplicatedTask.projectId) {
    await syncAssignedToLink(session.user.id, "task", duplicatedTask.id, duplicatedTask.projectId);
  }

  revalidateEntityPaths("task", undefined, duplicatedTask.projectId);

  return duplicatedTask;
}

// ============================================================================
// ARCHIVE OPERATIONS
// ============================================================================

export async function archiveTask(id: string) {
  const session = await validateSession();
  await archiveEntity("task", id, session.user.id);
}

export async function restoreTask(id: string) {
  const session = await validateSession();
  await restoreArchivedEntity("task", id, session.user.id);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkTaskOperation(input: unknown) {
  const session = await validateSession();
  const data = parseInput(bulkTaskOperationSchema, input);

  const existingTasks = await db
    .select()
    .from(task)
    .where(and(inArray(task.id, data.taskIds), eq(task.userId, session.user.id)));

  if (existingTasks.length !== data.taskIds.length) {
    throw errors.notFound("Some tasks");
  }

  let affectedCount = 0;

  switch (data.operation) {
    case "delete":
      await db.delete(task).where(inArray(task.id, data.taskIds));
      affectedCount = data.taskIds.length;
      break;

    case "complete":
      await db
        .update(task)
        .set({ status: "done", completedAt: new Date() })
        .where(inArray(task.id, data.taskIds));
      affectedCount = data.taskIds.length;
      break;

    case "updateStatus":
      if (!data.status) {
        throw errors.invalidInput("Status is required for updateStatus operation");
      }
      await db
        .update(task)
        .set({
          status: data.status,
          completedAt: data.status === "done" ? new Date() : null,
        })
        .where(inArray(task.id, data.taskIds));
      affectedCount = data.taskIds.length;
      break;

    case "updatePriority":
      if (!data.priority) {
        throw errors.invalidInput("Priority is required for updatePriority operation");
      }
      await db.update(task).set({ priority: data.priority }).where(inArray(task.id, data.taskIds));
      affectedCount = data.taskIds.length;
      break;

    default:
      throw errors.invalidInput(`Unsupported bulk operation: ${data.operation}`);
  }

  revalidateEntityPaths("task");
  const projectIds = new Set(existingTasks.map((t) => t.projectId).filter(Boolean));
  projectIds.forEach((projectId) => {
    if (projectId) revalidateEntityPaths("project", projectId);
  });

  return { affectedCount };
}

export async function bulkDeleteTasks(taskIds: string[]) {
  return bulkTaskOperation({ taskIds, operation: "delete" });
}

export async function bulkCompleteTasks(taskIds: string[]) {
  return bulkTaskOperation({ taskIds, operation: "complete" });
}
