import { z } from "zod";
import { defineTool } from "../types";
import { createEvent } from "@/features/events/actions";
import { assignTagsToEntity } from "@/features/tags/actions";
import { resolveProjectByName } from "../utils";

const eventItemSchema = z.object({
  title: z.string().describe("Event title (required, max 200 chars)"),
  description: z.string().optional().describe("Event description with details"),
  startTime: z
    .string()
    .describe(
      "ISO 8601 date-time string for event start (required). " +
        "Convert 'tomorrow at 3pm' to '2025-01-15T15:00:00Z'."
    ),
  endTime: z
    .string()
    .optional()
    .describe(
      "ISO 8601 date-time string for event end. If not provided, will use startTime + 1 hour."
    ),
  location: z
    .string()
    .optional()
    .describe("Physical or virtual location (e.g., 'Room 201', 'https://zoom.us/j/123')"),
  allDay: z.boolean().optional().describe("Whether this is an all-day event (default: false)"),
  projectName: z
    .string()
    .optional()
    .describe("Name of project to assign this event to. Will search for matching project."),
  tags: z.array(z.string()).optional().describe("Array of tag names"),
});

export const createEventTool = defineTool({
  name: "create_event",
  description:
    "Create one or multiple calendar events. Use this when the user wants to schedule meetings, appointments, or events. " +
    "Events must have a start time and can optionally have an end time, location, and be assigned to projects.",
  promptDocs: {
    trigger: '"crea", "aggiungi", "nuovo/a", "inserisci", "metti", "programma", "pianifica"',
    examples: ['Supporta creazione batch: "programma 2 eventi: A, B"'],
    notes: ["Risolve automaticamente projectName → projectId"],
  },
  schema: z.object({
    events: z.array(eventItemSchema).describe("Array of events to create"),
  }),
  async execute(input) {
    const results = [];
    const errors = [];

    for (const eventData of input.events) {
      try {
        const projectId = eventData.projectName
          ? await resolveProjectByName(eventData.projectName)
          : null;

        const startTime = new Date(eventData.startTime);
        const endTime = eventData.endTime
          ? new Date(eventData.endTime)
          : new Date(startTime.getTime() + 60 * 60 * 1000);

        const result = await createEvent({
          title: eventData.title,
          description: eventData.description || null,
          startTime,
          endTime,
          location: eventData.location || null,
          allDay: eventData.allDay || false,
          projectId,
          calendarType: "personal",
        });

        // Assign tags if provided
        if (eventData.tags && eventData.tags.length > 0) {
          try {
            await assignTagsToEntity({
              entityType: "event",
              entityId: result.id,
              tagIds: eventData.tags,
            });
          } catch {
            // Tag assignment failure is non-blocking
          }
        }

        results.push({
          id: result.id,
          title: result.title,
          startTime: result.startTime,
          endTime: result.endTime,
        });
      } catch (error) {
        errors.push(`Error creating event "${eventData.title}": ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      data: {
        created: results.length,
        events: results,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  },
});
