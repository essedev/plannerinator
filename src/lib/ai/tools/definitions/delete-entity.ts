import { z } from "zod";
import { defineTool } from "../types";
import { deleteTask } from "@/features/tasks/actions";
import { deleteEvent } from "@/features/events/actions";
import { deleteNote } from "@/features/notes/actions";
import { deleteProject } from "@/features/projects/actions";
import { resolveEntityId } from "../utils";

const entityTypeEnum = z.enum(["task", "event", "note", "project"]);

export const deleteEntityTool = defineTool({
  name: "delete_entity",
  description:
    "Delete an entity (task, event, note, or project). " +
    "IMPORTANT: Always ask for user confirmation before deleting unless they explicitly said 'delete' or 'remove'. " +
    "Deleted items are moved to trash and can be restored.",
  promptDocs: {
    trigger: '"elimina", "cancella", "rimuovi", "togli"',
    notes: ["Chiedi conferma se non esplicito", "Soft delete: sposta nel cestino (recuperabile)"],
  },
  schema: z.object({
    entityType: entityTypeEnum.describe("Type of entity to delete"),
    entityIdentifier: z
      .string()
      .describe(
        "Entity ID (UUID) or name/title to identify what to delete. Will search if not a UUID."
      ),
  }),
  async execute(input) {
    try {
      const resolved = await resolveEntityId(input.entityIdentifier, input.entityType);
      if ("error" in resolved) return resolved.error;

      const entityId = resolved.id;

      switch (input.entityType) {
        case "task":
          await deleteTask(entityId);
          break;
        case "event":
          await deleteEvent(entityId);
          break;
        case "note":
          await deleteNote(entityId);
          break;
        case "project":
          await deleteProject(entityId);
          break;
        default:
          return {
            success: false,
            error: `Unknown entity type: ${input.entityType}`,
          };
      }

      return {
        success: true,
        data: {
          message: `${input.entityType.charAt(0).toUpperCase() + input.entityType.slice(1)} deleted successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete: ${error}`,
      };
    }
  },
});
