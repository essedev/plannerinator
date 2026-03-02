import { z } from "zod";
import { defineTool } from "../types";
import { updateTask, markTaskComplete } from "@/features/tasks/actions";
import { resolveEntityId } from "../utils";
import { taskStatusSchema, taskPrioritySchema } from "@/features/tasks/schema";

export const updateTaskTool = defineTool({
  name: "update_task",
  description:
    "Update an existing task's properties. Use when the user wants to modify a task's title, status, due date, or priority. " +
    "Can mark tasks as complete, change priorities, reschedule, etc.",
  promptDocs: {
    trigger: '"rinomina", "cambia", "modifica", "aggiorna", "sposta", "segna come"',
    notes: [
      "Passa SOLO i campi da modificare nel campo 'updates'",
      "Accetta sia UUID che titolo per identificare il task",
    ],
  },
  schema: z.object({
    taskIdentifier: z
      .string()
      .describe(
        "Task ID (UUID) or partial title to identify the task. If title, will search for matches."
      ),
    updates: z
      .object({
        title: z.string().optional().describe("New task title"),
        description: z.string().optional().describe("New description"),
        status: taskStatusSchema.optional().describe("New status. Use 'done' to mark as complete."),
        dueDate: z.string().optional().describe("New due date (ISO 8601)"),
        priority: taskPrioritySchema.optional().describe("New priority level"),
      })
      .describe("Properties to update"),
  }),
  async execute(input) {
    try {
      const resolved = await resolveEntityId(input.taskIdentifier, "task");
      if ("error" in resolved) return resolved.error;

      const taskId = resolved.id;

      // If updating status to "done", use markTaskComplete
      if (input.updates.status === "done") {
        const result = await markTaskComplete(taskId);
        return {
          success: true,
          data: {
            message: `Task "${result.title}" marked as complete`,
          },
        };
      }

      const updates: {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        dueDate?: Date;
      } = {};
      if (input.updates.title) updates.title = input.updates.title;
      if (input.updates.description) updates.description = input.updates.description;
      if (input.updates.status) updates.status = input.updates.status;
      if (input.updates.priority) updates.priority = input.updates.priority;
      if (input.updates.dueDate) updates.dueDate = new Date(input.updates.dueDate);

      const result = await updateTask(taskId, updates);

      return {
        success: true,
        data: {
          message: `Task "${result.title}" updated successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update task: ${error}`,
      };
    }
  },
});
