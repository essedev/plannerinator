/**
 * Shared Utilities for AI Tool Handlers
 *
 * Common patterns extracted from tool handlers to avoid duplication.
 */

import { globalSearch } from "@/features/search/queries";
import { isUUID } from "@/lib/type-guards";
import type { ToolResult } from "./types";

/**
 * Resolve an entity identifier to a UUID.
 * If already a UUID, returns it directly. Otherwise searches by title/name.
 *
 * Returns either the resolved ID or a ToolResult error (for disambiguation or not found).
 */
export async function resolveEntityId(
  identifier: string,
  entityType: "task" | "event" | "note" | "project"
): Promise<{ id: string } | { error: ToolResult }> {
  if (isUUID(identifier)) {
    return { id: identifier };
  }

  const searchResults = await globalSearch(identifier, {
    entityTypes: [entityType],
    limit: 10,
  });

  const entityKey = `${entityType}s` as "tasks" | "events" | "notes" | "projects";
  const entities = searchResults[entityKey];

  if (entities.length === 0) {
    return {
      error: {
        success: false,
        error: `No ${entityType} found matching "${identifier}"`,
      },
    };
  }

  if (entities.length > 1) {
    const entityLabel =
      entityType === "task"
        ? "task"
        : entityType === "event"
          ? "eventi"
          : entityType === "note"
            ? "note"
            : "progetti";

    return {
      error: {
        success: false,
        error: `Ho trovato ${entities.length} ${entityLabel} con questo nome. Quale vuoi modificare?`,
        data: {
          matches: entities.map((e, idx) => ({
            number: idx + 1,
            id: e.id,
            title: e.title,
            ...(e.status ? { status: e.status } : {}),
            ...(e.dueDate ? { dueDate: e.dueDate } : {}),
            ...(e.startTime ? { startTime: e.startTime } : {}),
          })),
        },
      },
    };
  }

  return { id: entities[0].id };
}

/**
 * Resolve a project name to a project ID.
 * Returns null if not found (non-blocking — entity will be created without project).
 */
export async function resolveProjectByName(projectName: string): Promise<string | null> {
  const searchResults = await globalSearch(projectName, {
    entityTypes: ["project"],
    limit: 1,
  });
  return searchResults.projects?.[0]?.id ?? null;
}
