import { z } from "zod";
import { defineTool } from "../types";
import { createTask } from "@/features/tasks/actions";
import { assignTagsToEntity } from "@/features/tags/actions";
import { resolveProjectByName } from "../utils";
import { taskPrioritySchema } from "@/features/tasks/schema";

const taskItemSchema = z.object({
  title: z.string().describe("Task title (required, max 200 chars)"),
  description: z.string().optional().describe("Detailed task description (optional)"),
  dueDate: z
    .string()
    .optional()
    .describe(
      "ISO 8601 date-time string for when the task is due (e.g., '2025-01-15T14:00:00Z'). " +
        "Convert natural language dates like 'tomorrow', 'next week' to specific dates."
    ),
  duration: z.number().optional().describe("Estimated duration in minutes (optional)"),
  priority: taskPrioritySchema.optional().describe("Task priority level (default: medium)"),
  projectName: z
    .string()
    .optional()
    .describe(
      "Name of the project to assign this task to. Will search for matching project. " +
        "If not found, task will be created without a project."
    ),
  tags: z.array(z.string()).optional().describe("Array of tag names to attach to this task"),
});

export const createTaskTool = defineTool({
  name: "create_task",
  description:
    "Create one or multiple tasks. Use this when the user wants to add tasks to their todo list. " +
    "Tasks can have titles, descriptions, due dates, priorities, and be assigned to projects.",
  promptDocs: {
    trigger: '"crea", "aggiungi", "nuovo/a", "inserisci", "metti"',
    examples: ['Supporta creazione batch: "crea 3 task: A, B, C"'],
    notes: ["Risolve automaticamente projectName → projectId"],
  },
  schema: z.object({
    tasks: z.array(taskItemSchema).describe("Array of tasks to create"),
  }),
  async execute(input) {
    const results = [];
    const errors = [];

    for (const taskData of input.tasks) {
      try {
        const projectId = taskData.projectName
          ? await resolveProjectByName(taskData.projectName)
          : null;

        const dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;

        const result = await createTask({
          title: taskData.title,
          description: taskData.description || null,
          dueDate,
          duration: taskData.duration || null,
          priority: taskData.priority || "medium",
          projectId,
          status: "todo",
        });

        // Assign tags if provided
        if (taskData.tags && taskData.tags.length > 0) {
          try {
            await assignTagsToEntity({
              entityType: "task",
              entityId: result.id,
              tagIds: taskData.tags,
            });
          } catch {
            // Tag assignment failure is non-blocking
          }
        }

        results.push({
          id: result.id,
          title: result.title,
          dueDate: result.dueDate,
          priority: result.priority,
          project: taskData.projectName || null,
        });
      } catch (error) {
        errors.push(`Error creating task "${taskData.title}": ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      data: {
        created: results.length,
        tasks: results,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  },
});
