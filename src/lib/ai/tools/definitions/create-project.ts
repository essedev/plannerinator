import { z } from "zod";
import { defineTool } from "../types";
import { createProject } from "@/features/projects/actions";
import { assignTagsToEntity } from "@/features/tags/actions";

export const createProjectTool = defineTool({
  name: "create_project",
  description:
    "Create a new project. Projects are containers for organizing related tasks, events, and notes. " +
    "Use when the user wants to start tracking a new initiative, goal, or area of work.",
  promptDocs: {
    trigger: '"crea progetto", "nuovo progetto", "inizia progetto"',
  },
  schema: z.object({
    name: z.string().describe("Project name (required, unique identifier)"),
    description: z.string().optional().describe("Detailed project description and goals"),
    status: z
      .enum(["planning", "active", "on_hold", "completed", "cancelled"])
      .optional()
      .describe("Current project status (default: active)"),
    color: z.string().optional().describe("Color code for visual identification (e.g., '#3B82F6')"),
    startDate: z.string().optional().describe("ISO 8601 date when project starts"),
    endDate: z.string().optional().describe("ISO 8601 target completion date"),
    tags: z.array(z.string()).optional().describe("Project tags"),
  }),
  async execute(input) {
    try {
      const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1"];
      const color = input.color || colors[Math.floor(Math.random() * colors.length)];

      const result = await createProject({
        name: input.name,
        description: input.description || null,
        status: input.status || "planning",
        color,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      });

      // Assign tags if provided
      if (input.tags && input.tags.length > 0) {
        try {
          await assignTagsToEntity({
            entityType: "project",
            entityId: result.id,
            tagIds: input.tags,
          });
        } catch {
          // Tag assignment failure is non-blocking
        }
      }

      return {
        success: true,
        data: {
          projects: [
            {
              id: result.id,
              name: result.name,
              status: result.status,
              color: result.color,
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create project: ${error}`,
      };
    }
  },
});
