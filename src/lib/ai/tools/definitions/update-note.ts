import { z } from "zod";
import { defineTool } from "../types";
import { updateNote } from "@/features/notes/actions";
import { resolveEntityId } from "../utils";
import { noteTypeSchema } from "@/features/notes/schema";

export const updateNoteTool = defineTool({
  name: "update_note",
  description:
    "Update an existing note's properties. Use when the user wants to modify a note's title, content, or type. " +
    "Can edit note content, change titles, update categorization, etc.",
  promptDocs: {
    trigger: '"rinomina", "cambia", "modifica", "aggiorna", "riscrivi"',
    notes: [
      "Passa SOLO i campi da modificare nel campo 'updates'",
      "Accetta sia UUID che titolo per identificare la nota",
    ],
  },
  schema: z.object({
    noteIdentifier: z
      .string()
      .describe(
        "Note ID (UUID) or partial title to identify the note. If title, will search for matches."
      ),
    updates: z
      .object({
        title: z.string().optional().describe("New note title"),
        content: z.string().optional().describe("New note content (supports Markdown)"),
        type: noteTypeSchema.optional().describe("New note type/category"),
      })
      .describe("Properties to update"),
  }),
  async execute(input) {
    try {
      const resolved = await resolveEntityId(input.noteIdentifier, "note");
      if ("error" in resolved) return resolved.error;

      const noteId = resolved.id;

      const updates: {
        title?: string;
        content?: string;
        type?: string;
      } = {};
      if (input.updates.title) updates.title = input.updates.title;
      if (input.updates.content) updates.content = input.updates.content;
      if (input.updates.type) updates.type = input.updates.type;

      const result = await updateNote(noteId, updates);

      return {
        success: true,
        data: {
          message: `Note "${result.title}" updated successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update note: ${error}`,
      };
    }
  },
});
