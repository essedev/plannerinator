import { z } from "zod";
import { defineTool } from "../types";
import { updateEvent } from "@/features/events/actions";
import { resolveEntityId } from "../utils";

export const updateEventTool = defineTool({
  name: "update_event",
  description:
    "Update an existing event's properties. Use when the user wants to modify an event's title, time, location, or description. " +
    "Can reschedule events, change locations, update details, etc.",
  promptDocs: {
    trigger: '"rinomina", "cambia", "modifica", "aggiorna", "sposta", "riprogramma"',
    notes: [
      "Passa SOLO i campi da modificare nel campo 'updates'",
      "Accetta sia UUID che titolo per identificare l'evento",
    ],
  },
  schema: z.object({
    eventIdentifier: z
      .string()
      .describe(
        "Event ID (UUID) or partial title to identify the event. If title, will search for matches."
      ),
    updates: z
      .object({
        title: z.string().optional().describe("New event title"),
        description: z.string().optional().describe("New description"),
        startTime: z.string().optional().describe("New start time (ISO 8601)"),
        endTime: z.string().optional().describe("New end time (ISO 8601)"),
        location: z.string().optional().describe("New location"),
        allDay: z.boolean().optional().describe("Whether this is an all-day event"),
      })
      .describe("Properties to update"),
  }),
  async execute(input) {
    try {
      const resolved = await resolveEntityId(input.eventIdentifier, "event");
      if ("error" in resolved) return resolved.error;

      const eventId = resolved.id;

      const updates: {
        title?: string;
        description?: string;
        startTime?: Date;
        endTime?: Date;
        location?: string;
        allDay?: boolean;
      } = {};
      if (input.updates.title) updates.title = input.updates.title;
      if (input.updates.description) updates.description = input.updates.description;
      if (input.updates.startTime) updates.startTime = new Date(input.updates.startTime);
      if (input.updates.endTime) updates.endTime = new Date(input.updates.endTime);
      if (input.updates.location) updates.location = input.updates.location;
      if (input.updates.allDay !== undefined) updates.allDay = input.updates.allDay;

      const result = await updateEvent(eventId, updates);

      return {
        success: true,
        data: {
          message: `Event "${result.title}" updated successfully`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update event: ${error}`,
      };
    }
  },
});
