"use client";

import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { getTasksForParentSelection } from "@/features/tasks/parent-actions";
import { updateTask } from "@/features/tasks/actions";
import type { ParentEntityCardConfig } from "@/components/common/ParentEntityCard";
import type { Task } from "@/db/schema";

/**
 * Type for task data used in parent selection
 */
export type TaskOption = Pick<Task, "id" | "title" | "status">;

/**
 * Configuration for ParentEntityCard when used with tasks
 *
 * Defines task-specific behavior:
 * - Fetches tasks for selection
 * - Updates task with new parent
 * - Renders task with title and status badge
 */
export const parentTaskConfig: ParentEntityCardConfig<TaskOption> = {
  entityTypeName: "Task",
  basePath: "/dashboard/tasks",
  parentIdField: "parentTaskId",

  fetchEntities: async (excludeId?: string) => {
    return (await getTasksForParentSelection(excludeId)) as TaskOption[];
  },

  updateEntity: async (entityId: string, parentId: string | null) => {
    await updateTask(entityId, { parentTaskId: parentId });
  },

  renderViewDisplay: (task) => (
    <>
      <p className="font-medium">{task.title}</p>
      <Badge variant="outline" className="mt-2 text-xs">
        {TASK_STATUS_LABELS[task.status]}
      </Badge>
    </>
  ),

  renderSelectItem: (task) => (
    <span className="flex items-center gap-2">
      <span className="flex-1 truncate">{task.title}</span>
      <span className="text-xs text-muted-foreground">({TASK_STATUS_LABELS[task.status]})</span>
    </span>
  ),
};
