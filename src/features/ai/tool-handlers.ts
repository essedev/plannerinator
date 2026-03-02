/**
 * AI Tool Handlers
 *
 * These functions execute the actual operations requested by the AI.
 * They bridge between AI tool calls and existing server actions.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { createTask } from "@/features/tasks/actions";
import { createEvent } from "@/features/events/actions";
import { createNote } from "@/features/notes/actions";
import { createProject } from "@/features/projects/actions";
import { updateTask, markTaskComplete } from "@/features/tasks/actions";
import { updateEvent } from "@/features/events/actions";
import { updateNote } from "@/features/notes/actions";
import { updateProject } from "@/features/projects/actions";
import { deleteTask } from "@/features/tasks/actions";
import { deleteEvent } from "@/features/events/actions";
import { deleteNote } from "@/features/notes/actions";
import { deleteProject } from "@/features/projects/actions";
import { globalSearch } from "@/features/search/queries";
import { db } from "@/db";
import { task, event, note, project } from "@/db/schema";
import { eq, and, gte, lt, ne, sql, desc, asc, isNull } from "drizzle-orm";
import { aiLogger } from "@/lib/ai/logger";
import type {
  ToolResult,
  CreateTaskInput,
  CreateEventInput,
  CreateNoteInput,
  CreateProjectInput,
  QueryEntitiesInput,
  SearchEntitiesInput,
  UpdateTaskInput,
  UpdateEventInput,
  UpdateNoteInput,
  UpdateProjectInput,
  DeleteEntityInput,
  GetStatisticsInput,
} from "./types";

/**
 * Execute a tool call from Claude
 */
export async function executeToolCall(
  toolName: string,
  toolInput: unknown,
  userId: string,
  conversationId?: string
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    // Log tool call
    await aiLogger.logToolCall(toolName, toolInput, userId, conversationId);

    let result: ToolResult;

    switch (toolName) {
      case "create_task":
        result = await handleCreateTasks(
          (toolInput as { tasks: CreateTaskInput[] }).tasks,
          userId,
          conversationId
        );
        break;

      case "create_event":
        result = await handleCreateEvents(
          (toolInput as { events: CreateEventInput[] }).events,
          userId,
          conversationId
        );
        break;

      case "create_note":
        result = await handleCreateNote(toolInput as CreateNoteInput, userId, conversationId);
        break;

      case "create_project":
        result = await handleCreateProject(toolInput as CreateProjectInput, userId, conversationId);
        break;

      case "query_entities":
        result = await handleQueryEntities(toolInput as QueryEntitiesInput, userId, conversationId);
        break;

      case "search_entities":
        result = await handleSearchEntities(
          toolInput as SearchEntitiesInput,
          userId,
          conversationId
        );
        break;

      case "update_task":
        result = await handleUpdateTask(toolInput as UpdateTaskInput, userId, conversationId);
        break;

      case "update_event":
        result = await handleUpdateEvent(toolInput as UpdateEventInput, userId, conversationId);
        break;

      case "update_note":
        result = await handleUpdateNote(toolInput as UpdateNoteInput, userId, conversationId);
        break;

      case "update_project":
        result = await handleUpdateProject(toolInput as UpdateProjectInput, userId, conversationId);
        break;

      case "delete_entity":
        result = await handleDeleteEntity(toolInput as DeleteEntityInput, userId, conversationId);
        break;

      case "get_statistics":
        result = await handleGetStatistics(toolInput as GetStatisticsInput, userId, conversationId);
        break;

      default:
        result = {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }

    // Log tool result
    const executionTime = Date.now() - startTime;
    await aiLogger.logToolResult(toolName, result, userId, executionTime, conversationId);

    return result;
  } catch (error) {
    await aiLogger.error(`Tool execution error (${toolName})`, {
      userId,
      conversationId,
      toolName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}

/**
 * Handle create_task tool
 */
async function handleCreateTasks(
  tasks: CreateTaskInput[],
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  const results = [];
  const errors = [];

  for (const taskData of tasks) {
    try {
      // Resolve project by name if provided
      let projectId = null;
      if (taskData.projectName) {
        const searchResults = await globalSearch(taskData.projectName, {
          entityTypes: ["project"],
          limit: 1,
        });
        const foundProject = searchResults.projects?.[0];
        if (foundProject) {
          projectId = foundProject.id;
        }
      }

      // Parse due date
      const dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;

      // Create task using existing action
      const result = await createTask({
        title: taskData.title,
        description: taskData.description || null,
        dueDate,
        duration: taskData.duration || null,
        priority: taskData.priority || "medium",
        projectId,
        status: "todo",
      });

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
}

/**
 * Handle create_event tool
 */
async function handleCreateEvents(
  events: CreateEventInput[],
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  const results = [];
  const errors = [];

  for (const eventData of events) {
    try {
      // Resolve project
      let projectId = null;
      if (eventData.projectName) {
        const searchResults = await globalSearch(eventData.projectName, {
          entityTypes: ["project"],
          limit: 1,
        });
        const foundProject = searchResults.projects?.[0];
        if (foundProject) {
          projectId = foundProject.id;
        }
      }

      // Parse dates
      const startTime = new Date(eventData.startTime);
      const endTime = eventData.endTime
        ? new Date(eventData.endTime)
        : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

      const result = await createEvent({
        title: eventData.title,
        description: eventData.description || null,
        startTime,
        endTime,
        location: eventData.location || null,
        allDay: eventData.allDay || false,
        projectId,
        calendarType: "event",
      });

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
}

/**
 * Handle create_note tool
 */
async function handleCreateNote(
  input: CreateNoteInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    // Resolve project
    let projectId = null;
    if (input.projectName) {
      const searchResults = await globalSearch(input.projectName, {
        entityTypes: ["project"],
        limit: 1,
      });
      const foundProject = searchResults.projects?.[0];
      if (foundProject) {
        projectId = foundProject.id;
      }
    }

    // Generate title from content if not provided
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
}

/**
 * Handle create_project tool
 */
async function handleCreateProject(
  input: CreateProjectInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    // Generate random color if not provided
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
}

/**
 * Handle query_entities tool (direct list without text search)
 */
async function handleQueryEntities(
  input: QueryEntitiesInput,
  userId: string,
  conversationId?: string
): Promise<ToolResult> {
  try {
    const limit = Math.min(input.limit || 10, 50);
    const sortOrder = input.sortOrder || "desc";

    await aiLogger.info("📋 Executing query_entities (direct list)", {
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

      // Filter deleted and archived by default
      if (!input.includeDeleted) {
        conditions.push(isNull(task.deletedAt));
      }
      if (!input.includeArchived) {
        conditions.push(isNull(task.archivedAt));
      }

      // Apply filters
      if (input.filters?.status) {
        conditions.push(eq(task.status, input.filters.status));
      }
      if (input.filters?.priority) {
        conditions.push(eq(task.priority, input.filters.priority));
      }
      if (input.filters?.dateRange?.start) {
        conditions.push(gte(task.dueDate, new Date(input.filters.dateRange.start)));
      }
      if (input.filters?.dateRange?.end) {
        conditions.push(lt(task.dueDate, new Date(input.filters.dateRange.end)));
      }

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

      // Filter deleted and archived by default
      if (!input.includeDeleted) {
        conditions.push(isNull(event.deletedAt));
      }
      if (!input.includeArchived) {
        conditions.push(isNull(event.archivedAt));
      }

      if (input.filters?.dateRange?.start) {
        conditions.push(gte(event.startTime, new Date(input.filters.dateRange.start)));
      }
      if (input.filters?.dateRange?.end) {
        conditions.push(lt(event.startTime, new Date(input.filters.dateRange.end)));
      }

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

      // Filter deleted and archived by default
      if (!input.includeDeleted) {
        conditions.push(isNull(note.deletedAt));
      }
      if (!input.includeArchived) {
        conditions.push(isNull(note.archivedAt));
      }

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

      // Filter deleted and archived by default
      if (!input.includeDeleted) {
        conditions.push(isNull(project.deletedAt));
      }
      if (!input.includeArchived) {
        conditions.push(isNull(project.archivedAt));
      }

      if (input.filters?.projectStatus) {
        conditions.push(eq(project.status, input.filters.projectStatus));
      }

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
      results.tasks.length + results.events.length + results.notes.length + results.projects.length;

    await aiLogger.info("✅ query_entities completed", {
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
    await aiLogger.error("❌ query_entities failed", {
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
}

/**
 * Handle search_entities tool
 */
async function handleSearchEntities(
  input: SearchEntitiesInput,
  userId: string,
  conversationId?: string
): Promise<ToolResult> {
  try {
    const limit = Math.min(input.limit || 10, 50);

    await aiLogger.debug("🔍 Executing search_entities", {
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

    // Log raw search results from globalSearch
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

      await aiLogger.debug("📊 Applied entity type filters", {
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

    // Calculate total
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
    await aiLogger.error("❌ Search failed", {
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
}

/**
 * Handle update_task tool
 */
async function handleUpdateTask(
  input: UpdateTaskInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    // Try to find task by ID or title
    let taskId = input.taskIdentifier;

    // If not a UUID, search by title
    if (!taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const searchResults = await globalSearch(input.taskIdentifier, {
        entityTypes: ["task"],
        limit: 10,
      });
      if (searchResults.tasks.length === 0) {
        return {
          success: false,
          error: `No task found matching "${input.taskIdentifier}"`,
        };
      }
      if (searchResults.tasks.length > 1) {
        return {
          success: false,
          error: `Ho trovato ${searchResults.tasks.length} task con questo nome. Quale vuoi modificare?`,
          data: {
            matches: searchResults.tasks.map((t, idx) => ({
              number: idx + 1,
              id: t.id,
              title: t.title,
              status: t.status,
              dueDate: t.dueDate,
            })),
          },
        };
      }
      taskId = searchResults.tasks[0].id;
    }

    // If updating status to "done", use markTaskComplete
    if (input.updates.status === "done") {
      const result = await markTaskComplete(taskId);
      return {
        success: true,
        data: {
          message: `Task "${result.title}" marked as complete`,
        },
      };
    }

    // Otherwise use updateTask
    const updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: Date;
    } = {};
    if (input.updates.title) updates.title = input.updates.title;
    if (input.updates.description) updates.description = input.updates.description;
    if (input.updates.status) updates.status = input.updates.status;
    if (input.updates.priority) updates.priority = input.updates.priority;
    if (input.updates.dueDate) updates.dueDate = new Date(input.updates.dueDate);

    const result = await updateTask(taskId, updates);

    return {
      success: true,
      data: {
        message: `Task "${result.title}" updated successfully`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to update task: ${error}`,
    };
  }
}

/**
 * Handle update_event tool
 */
async function handleUpdateEvent(
  input: UpdateEventInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    // Try to find event by ID or title
    let eventId = input.eventIdentifier;

    // If not a UUID, search by title
    if (!eventId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const searchResults = await globalSearch(input.eventIdentifier, {
        entityTypes: ["event"],
        limit: 10,
      });
      if (searchResults.events.length === 0) {
        return {
          success: false,
          error: `No event found matching "${input.eventIdentifier}"`,
        };
      }
      if (searchResults.events.length > 1) {
        return {
          success: false,
          error: `Ho trovato ${searchResults.events.length} eventi con questo nome. Quale vuoi modificare?`,
          data: {
            matches: searchResults.events.map((e, idx) => ({
              number: idx + 1,
              id: e.id,
              title: e.title,
              startTime: e.startTime,
            })),
          },
        };
      }
      eventId = searchResults.events[0].id;
    }

    // Build updates object
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
}

/**
 * Handle update_note tool
 */
async function handleUpdateNote(
  input: UpdateNoteInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    // Try to find note by ID or title
    let noteId = input.noteIdentifier;

    // If not a UUID, search by title
    if (!noteId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const searchResults = await globalSearch(input.noteIdentifier, {
        entityTypes: ["note"],
        limit: 10,
      });
      if (searchResults.notes.length === 0) {
        return {
          success: false,
          error: `No note found matching "${input.noteIdentifier}"`,
        };
      }
      if (searchResults.notes.length > 1) {
        return {
          success: false,
          error: `Ho trovato ${searchResults.notes.length} note con questo nome. Quale vuoi modificare?`,
          data: {
            matches: searchResults.notes.map((n, idx) => ({
              number: idx + 1,
              id: n.id,
              title: n.title || "Senza titolo",
              type: n.type,
            })),
          },
        };
      }
      noteId = searchResults.notes[0].id;
    }

    // Build updates object
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
}

/**
 * Handle update_project tool
 */
async function handleUpdateProject(
  input: UpdateProjectInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    // Try to find project by ID or name
    let projectId = input.projectIdentifier;

    // If not a UUID, search by name
    if (!projectId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const searchResults = await globalSearch(input.projectIdentifier, {
        entityTypes: ["project"],
        limit: 10,
      });
      if (searchResults.projects.length === 0) {
        return {
          success: false,
          error: `No project found matching "${input.projectIdentifier}"`,
        };
      }
      if (searchResults.projects.length > 1) {
        return {
          success: false,
          error: `Ho trovato ${searchResults.projects.length} progetti con questo nome. Quale vuoi modificare?`,
          data: {
            matches: searchResults.projects.map((p, idx) => ({
              number: idx + 1,
              id: p.id,
              title: p.title,
              status: p.status,
            })),
          },
        };
      }
      projectId = searchResults.projects[0].id;
    }

    // Build updates object
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
}

/**
 * Handle delete_entity tool
 */
async function handleDeleteEntity(
  input: DeleteEntityInput,
  _userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    const { entityType, entityIdentifier } = input;

    // Find entity ID by identifier
    let entityId = entityIdentifier;

    // If not UUID, search
    if (!entityId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const searchResults = await globalSearch(entityIdentifier, {
        entityTypes: [entityType],
        limit: 10,
      });
      const entityKey = `${entityType}s` as "tasks" | "events" | "notes" | "projects";
      const entities = searchResults[entityKey];

      if (entities.length === 0) {
        return {
          success: false,
          error: `No ${entityType} found matching "${entityIdentifier}"`,
        };
      }
      if (entities.length > 1) {
        return {
          success: false,
          error: `Ho trovato ${entities.length} ${entityType === "task" ? "task" : entityType === "event" ? "eventi" : entityType === "note" ? "note" : "progetti"} con questo nome. Quale vuoi eliminare?`,
          data: {
            matches: entities.map((entity, idx) => ({
              number: idx + 1,
              id: entity.id,
              title: entity.title,
            })),
          },
        };
      }
      entityId = entities[0].id;
    }

    // Execute delete based on entity type
    switch (entityType) {
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
          error: `Unknown entity type: ${entityType}`,
        };
    }

    return {
      success: true,
      data: {
        message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} deleted successfully`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete: ${error}`,
    };
  }
}

/**
 * Handle get_statistics tool
 */
async function handleGetStatistics(
  input: GetStatisticsInput,
  userId: string,
  _conversationId?: string
): Promise<ToolResult> {
  try {
    const { metric, projectName } = input;

    // Resolve project if specified
    let projectId = null;
    if (projectName) {
      const searchResults = await globalSearch(projectName, {
        entityTypes: ["project"],
        limit: 1,
      });
      const foundProject = searchResults.projects?.[0];
      if (foundProject) {
        projectId = foundProject.id;
      }
    }

    switch (metric) {
      case "tasks_completed_today": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const whereConditions = [
          eq(task.userId, userId),
          eq(task.status, "done"),
          gte(task.completedAt, today),
        ];
        if (projectId) whereConditions.push(eq(task.projectId, projectId));

        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(task)
          .where(and(...whereConditions));

        return {
          success: true,
          data: {
            metric: "tasks_completed_today",
            value: Number(count[0].count),
          },
        };
      }

      case "tasks_completed_this_week": {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const whereConditions = [
          eq(task.userId, userId),
          eq(task.status, "done"),
          gte(task.completedAt, weekStart),
        ];
        if (projectId) whereConditions.push(eq(task.projectId, projectId));

        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(task)
          .where(and(...whereConditions));

        return {
          success: true,
          data: {
            metric: "tasks_completed_this_week",
            value: Number(count[0].count),
          },
        };
      }

      case "overdue_tasks": {
        const now = new Date();

        const whereConditions = [
          eq(task.userId, userId),
          ne(task.status, "done"),
          lt(task.dueDate, now),
        ];
        if (projectId) whereConditions.push(eq(task.projectId, projectId));

        const overdueTasks = await db
          .select()
          .from(task)
          .where(and(...whereConditions))
          .limit(10);

        return {
          success: true,
          data: {
            metric: "overdue_tasks",
            count: overdueTasks.length,
            tasks: overdueTasks.map((t) => ({
              id: t.id,
              title: t.title,
              dueDate: t.dueDate,
              priority: t.priority,
            })),
          },
        };
      }

      case "upcoming_events": {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const whereConditions = [
          eq(event.userId, userId),
          gte(event.startTime, now),
          lt(event.startTime, weekFromNow),
        ];
        if (projectId) whereConditions.push(eq(event.projectId, projectId));

        const upcomingEvents = await db
          .select()
          .from(event)
          .where(and(...whereConditions))
          .limit(10);

        return {
          success: true,
          data: {
            metric: "upcoming_events",
            count: upcomingEvents.length,
            events: upcomingEvents.map((e) => ({
              id: e.id,
              title: e.title,
              startTime: e.startTime,
              location: e.location,
            })),
          },
        };
      }

      case "tasks_by_status": {
        const whereConditions = [eq(task.userId, userId)];
        if (projectId) whereConditions.push(eq(task.projectId, projectId));

        const tasks = await db
          .select()
          .from(task)
          .where(and(...whereConditions));

        const byStatus = tasks.reduce(
          (acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return {
          success: true,
          data: {
            metric: "tasks_by_status",
            breakdown: byStatus,
            total: tasks.length,
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unknown metric: ${metric}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to get statistics: ${error}`,
    };
  }
}
