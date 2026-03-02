import { z } from "zod";
import { defineTool } from "../types";
import { createNote } from "@/features/notes/actions";
import { assignTagsToEntity } from "@/features/tags/actions";
import { resolveProjectByName } from "../utils";
import { noteTypeSchema } from "@/features/notes/schema";

export const createNoteTool = defineTool({
  name: "create_note",
  description:
    "Create a note or document. Use when the user wants to save text, ideas, documentation, code snippets, or research. " +
    "Notes can be categorized by type and assigned to projects.",
  promptDocs: {
    trigger: '"crea nota", "salva", "scrivi", "annota", "appunta"',
    notes: ["Genera titolo automaticamente dal contenuto se non fornito"],
  },
  schema: z.object({
    title: z
      .string()
      .optional()
      .describe("Note title (optional, will auto-generate from content if not provided)"),
    content: z
      .string()
      .describe("The actual note content (required). Supports Markdown formatting."),
    type: noteTypeSchema.optional().describe("Type/category of note (default: note)"),
    projectName: z.string().optional().describe("Project to assign this note to"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
  }),
  async execute(input) {
    try {
      const projectId = input.projectName ? await resolveProjectByName(input.projectName) : null;

      const title =
        input.title ||
        input.content.split("\n")[0].substring(0, 100).replace(/^#\s*/, "") ||
        "Untitled Note";

      const result = await createNote({
        title,
        content: input.content,
        type: input.type || "note",
        projectId,
      });

      // Assign tags if provided
      if (input.tags && input.tags.length > 0) {
        try {
          await assignTagsToEntity({
            entityType: "note",
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
          notes: [
            {
              id: result.id,
              title: result.title,
              type: result.type,
            },
          ],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create note: ${error}`,
      };
    }
  },
});
