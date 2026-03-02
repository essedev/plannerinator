import { z } from "zod";
import { defineTool } from "../types";
import { globalSearch } from "@/features/search/queries";
import { aiLogger } from "@/lib/ai/logger";

const entityTypeEnum = z.enum(["task", "event", "note", "project"]);

export const searchEntitiesTool = defineTool({
  name: "search_entities",
  description:
    "Search across entities using a text query. " +
    "Use when the user provides a specific search term or wants to find items matching keywords. " +
    "Examples: 'find tasks about meeting', 'search notes containing API'. " +
    "For listing without search, use query_entities instead.",
  promptDocs: {
    trigger: '"cerca", "trova", "dove è", "ci sono task con/su/per"',
    examples: ['"trova task con \'riunione\'" → search_entities con query = "riunione"'],
  },
  schema: z.object({
    query: z
      .string()
      .describe("Search query string to match against titles, descriptions, and content"),
    entityTypes: z
      .array(entityTypeEnum)
      .optional()
      .describe("Limit search to specific entity types. If empty, searches all types."),
    filters: z
      .object({
        status: z.string().optional().describe("Filter by status (e.g., 'todo', 'done', 'active')"),
        priority: z.string().optional().describe("Filter by priority (low, medium, high, urgent)"),
        projectName: z.string().optional().describe("Filter by project name"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Filter by tags (returns items with ANY of these tags)"),
        dateRange: z
          .object({
            start: z.string().optional().describe("ISO 8601 date for range start"),
            end: z.string().optional().describe("ISO 8601 date for range end"),
          })
          .optional(),
      })
      .optional()
      .describe("Additional filters to narrow results"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of results to return (default: 10, max: 50)"),
    includeDeleted: z
      .boolean()
      .optional()
      .describe(
        "Include deleted entities in search results (default: false). Only set to true if user explicitly asks for deleted items."
      ),
    includeArchived: z
      .boolean()
      .optional()
      .describe(
        "Include archived entities in search results (default: false). Only set to true if user explicitly asks for archived items."
      ),
  }),
  async execute(input, userId, conversationId) {
    try {
      const limit = Math.min(input.limit || 10, 50);

      await aiLogger.debug("Executing search_entities", {
        userId,
        conversationId,
        query: input.query,
        entityTypes: input.entityTypes,
        limit,
      });

      const results = await globalSearch(input.query, {
        limit,
        entityTypes: input.entityTypes,
        includeDeleted: input.includeDeleted,
        includeArchived: input.includeArchived,
      });

      await aiLogger.logSearch(input.query, input.entityTypes, results, userId, conversationId);

      // Filter by entity types if specified
      let filteredResults = results;
      if (input.entityTypes && input.entityTypes.length > 0) {
        const tasks = input.entityTypes.includes("task") ? results.tasks : [];
        const events = input.entityTypes.includes("event") ? results.events : [];
        const notes = input.entityTypes.includes("note") ? results.notes : [];
        const projects = input.entityTypes.includes("project") ? results.projects : [];

        filteredResults = {
          tasks,
          events,
          notes,
          projects,
          total: tasks.length + events.length + notes.length + projects.length,
        };

        await aiLogger.debug("Applied entity type filters", {
          userId,
          conversationId,
          requestedTypes: input.entityTypes,
          beforeFilter: {
            tasks: results.tasks.length,
            events: results.events.length,
            notes: results.notes.length,
            projects: results.projects.length,
          },
          afterFilter: {
            tasks: filteredResults.tasks.length,
            events: filteredResults.events.length,
            notes: filteredResults.notes.length,
            projects: filteredResults.projects.length,
          },
        });
      }

      const total =
        filteredResults.tasks.length +
        filteredResults.events.length +
        filteredResults.notes.length +
        filteredResults.projects.length;

      return {
        success: true,
        data: {
          total,
          results: filteredResults,
        },
      };
    } catch (error) {
      await aiLogger.error("Search failed", {
        userId,
        conversationId,
        query: input.query,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: `Search failed: ${error}`,
      };
    }
  },
});
