import { z } from "zod";
import { defineTool } from "../types";
import { updateProject } from "@/features/projects/actions";
import { resolveEntityId } from "../utils";

export const updateProjectTool = defineTool({
  name: "update_project",
  description:
    "Update an existing project's properties. Use when the user wants to modify a project's name, status, dates, or description. " +
    "Can change project status, update timelines, rename projects, etc.",
  promptDocs: {
    trigger: '"rinomina", "cambia", "modifica", "aggiorna"',
    notes: [
      "Passa SOLO i campi da modificare nel campo 'updates'",
      "Accetta sia UUID che nome per identificare il progetto",
    ],
  },
  schema: z.object({
    projectIdentifier: z
      .string()
      .describe(
        "Project ID (UUID) or project name to identify the project. If name, will search for matches."
      ),
    updates: z
      .object({
        name: z.string().optional().describe("New project name"),
        description: z.string().optional().describe("New project description"),
        status: z
          .enum(["planning", "active", "on_hold", "completed", "cancelled"])
          .optional()
          .describe("New project status"),
        color: z.string().optional().describe("New color code (e.g., '#3B82F6')"),
        startDate: z.string().optional().describe("New start date (ISO 8601)"),
        endDate: z.string().optional().describe("New end date (ISO 8601)"),
      })
      .describe("Properties to update"),
  }),
  async execute(input) {
    try {
      const resolved = await resolveEntityId(input.projectIdentifier, "project");
      if ("error" in resolved) return resolved.error;

      const projectId = resolved.id;

      const updates: {
        name?: string;
        description?: string;
        status?: string;
        color?: string;
        startDate?: Date;
        endDate?: Date;
      } = {};
      if (input.updates.name) updates.name = input.updates.name;
      if (input.updates.description) updates.description = input.updates.description;
      if (input.updates.status) updates.status = input.updates.status;
      if (input.updates.color) updates.color = input.updates.color;
      if (input.updates.startDate) updates.startDate = new Date(input.updates.startDate);
      if (input.updates.endDate) updates.endDate = new Date(input.updates.endDate);

      const result = await updateProject(projectId, updates);

      return {
        success: true,
        data: {
          message: `Project "${result.name}" updated successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update project: ${error}`,
      };
    }
  },
});
