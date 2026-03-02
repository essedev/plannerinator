import { z } from "zod";
import { defineTool } from "../types";
import { db } from "@/db";
import { task, event, note, project } from "@/db/schema";
import { eq, and, gte, lt, desc, asc, isNull } from "drizzle-orm";
import { aiLogger } from "@/lib/ai/logger";
import { taskStatusSchema, taskPrioritySchema } from "@/features/tasks/schema";

const entityTypeEnum = z.enum(["task", "event", "note", "project"]);

export const queryEntitiesTool = defineTool({
  name: "query_entities",
  description:
    "Retrieve a list of entities directly without text search. " +
    "Use when the user asks for 'all', 'latest', 'recent', or lists of items. " +
    "Examples: 'show me my notes', 'list all tasks', 'what are my recent projects'. " +
    "This is more efficient than search_entities when no specific search term is needed.",
  promptDocs: {
    trigger: '"mostra", "lista", "ultimo/i", "recente/i", "quanti", "quali sono", "tutti i miei"',
    examples: ['"mostrami i task urgenti" → query_entities con filters.priority = "urgent"'],
    notes: [
      "Filtri: status (todo, in_progress, done, cancelled), priority (low, medium, high, urgent)",
      "Ordinamento: updatedAt (default), createdAt, dueDate, title",
    ],
  },
  schema: z.object({
    entityTypes: z.array(entityTypeEnum).describe("Types of entities to retrieve (required)"),
    filters: z
      .object({
        status: taskStatusSchema
          .optional()
          .describe("Filter by status (e.g., 'todo', 'done', 'active')"),
        priority: taskPrioritySchema
          .optional()
          .describe("Filter by priority (low, medium, high, urgent)"),
        projectName: z.string().optional().describe("Filter by project name"),
        dateRange: z
          .object({
            start: z.string().optional().describe("ISO 8601 date for range start"),
            end: z.string().optional().describe("ISO 8601 date for range end"),
          })
          .optional(),
      })
      .optional()
      .describe("Optional filters to narrow results"),
    sortBy: z
      .enum(["createdAt", "updatedAt", "dueDate", "startTime", "title"])
      .optional()
      .describe("Field to sort by (default: updatedAt)"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort order (default: desc for most recent first)"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of results per entity type (default: 10, max: 50)"),
    includeDeleted: z
      .boolean()
      .optional()
      .describe(
        "Include deleted entities in results (default: false). Only set to true if user explicitly asks for deleted items."
      ),
    includeArchived: z
      .boolean()
      .optional()
      .describe(
        "Include archived entities in results (default: false). Only set to true if user explicitly asks for archived items."
      ),
  }),
  async execute(input, userId, conversationId) {
    try {
      const limit = Math.min(input.limit || 10, 50);
      const sortOrder = input.sortOrder || "desc";

      await aiLogger.info("Executing query_entities (direct list)", {
        userId,
        conversationId,
        entityTypes: input.entityTypes,
        filters: input.filters,
        sortBy: input.sortBy,
        sortOrder,
        limit,
      });

      const results: {
        tasks: unknown[];
        events: unknown[];
        notes: unknown[];
        projects: unknown[];
      } = {
        tasks: [],
        events: [],
        notes: [],
        projects: [],
      };

      // Query tasks
      if (input.entityTypes.includes("task")) {
        const conditions = [eq(task.userId, userId)];

        if (!input.includeDeleted) conditions.push(isNull(task.deletedAt));
        if (!input.includeArchived) conditions.push(isNull(task.archivedAt));
        if (input.filters?.status) conditions.push(eq(task.status, input.filters.status));
        if (input.filters?.priority) conditions.push(eq(task.priority, input.filters.priority));
        if (input.filters?.dateRange?.start)
          conditions.push(gte(task.dueDate, new Date(input.filters.dateRange.start)));
        if (input.filters?.dateRange?.end)
          conditions.push(lt(task.dueDate, new Date(input.filters.dateRange.end)));

        const sortField =
          input.sortBy === "dueDate"
            ? task.dueDate
            : input.sortBy === "createdAt"
              ? task.createdAt
              : task.updatedAt;
        const sortFn = sortOrder === "asc" ? asc : desc;

        results.tasks = await db
          .select()
          .from(task)
          .where(and(...conditions))
          .orderBy(sortFn(sortField))
          .limit(limit);

        await aiLogger.logDbQuery(
          "SELECT",
          "task",
          {
            conditionsCount: conditions.length,
            filters: input.filters,
            sortBy: input.sortBy,
            sortOrder,
          },
          results.tasks.length,
          userId,
          conversationId
        );
      }

      // Query events
      if (input.entityTypes.includes("event")) {
        const conditions = [eq(event.userId, userId)];

        if (!input.includeDeleted) conditions.push(isNull(event.deletedAt));
        if (!input.includeArchived) conditions.push(isNull(event.archivedAt));
        if (input.filters?.dateRange?.start)
          conditions.push(gte(event.startTime, new Date(input.filters.dateRange.start)));
        if (input.filters?.dateRange?.end)
          conditions.push(lt(event.startTime, new Date(input.filters.dateRange.end)));

        const sortField =
          input.sortBy === "startTime"
            ? event.startTime
            : input.sortBy === "createdAt"
              ? event.createdAt
              : event.updatedAt;
        const sortFn = sortOrder === "asc" ? asc : desc;

        results.events = await db
          .select()
          .from(event)
          .where(and(...conditions))
          .orderBy(sortFn(sortField))
          .limit(limit);

        await aiLogger.logDbQuery(
          "SELECT",
          "event",
          { conditionsCount: conditions.length, filters: input.filters },
          results.events.length,
          userId,
          conversationId
        );
      }

      // Query notes
      if (input.entityTypes.includes("note")) {
        const conditions = [eq(note.userId, userId)];

        if (!input.includeDeleted) conditions.push(isNull(note.deletedAt));
        if (!input.includeArchived) conditions.push(isNull(note.archivedAt));

        const sortField =
          input.sortBy === "createdAt"
            ? note.createdAt
            : input.sortBy === "title"
              ? note.title
              : note.updatedAt;
        const sortFn = sortOrder === "asc" ? asc : desc;

        results.notes = await db
          .select()
          .from(note)
          .where(and(...conditions))
          .orderBy(sortFn(sortField))
          .limit(limit);

        await aiLogger.logDbQuery(
          "SELECT",
          "note",
          { conditionsCount: conditions.length },
          results.notes.length,
          userId,
          conversationId
        );
      }

      // Query projects
      if (input.entityTypes.includes("project")) {
        const conditions = [eq(project.userId, userId)];

        if (!input.includeDeleted) conditions.push(isNull(project.deletedAt));
        if (!input.includeArchived) conditions.push(isNull(project.archivedAt));

        const sortField = input.sortBy === "createdAt" ? project.createdAt : project.updatedAt;
        const sortFn = sortOrder === "asc" ? asc : desc;

        results.projects = await db
          .select()
          .from(project)
          .where(and(...conditions))
          .orderBy(sortFn(sortField))
          .limit(limit);

        await aiLogger.logDbQuery(
          "SELECT",
          "project",
          { conditionsCount: conditions.length, filters: input.filters },
          results.projects.length,
          userId,
          conversationId
        );
      }

      const total =
        results.tasks.length +
        results.events.length +
        results.notes.length +
        results.projects.length;

      await aiLogger.info("query_entities completed", {
        userId,
        conversationId,
        total,
        breakdown: {
          tasks: results.tasks.length,
          events: results.events.length,
          notes: results.notes.length,
          projects: results.projects.length,
        },
      });

      return {
        success: true,
        data: {
          total,
          results,
        },
      };
    } catch (error) {
      await aiLogger.error("query_entities failed", {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: `Query failed: ${error}`,
      };
    }
  },
});
