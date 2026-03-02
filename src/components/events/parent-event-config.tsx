"use client";

import { formatFullDate } from "@/lib/dates";
import { getEventsForParentSelection } from "@/features/events/parent-actions";
import { updateEvent } from "@/features/events/actions";
import type { ParentEntityCardConfig } from "@/components/common/ParentEntityCard";
import type { Event } from "@/db/schema";

/**
 * Type for event data used in parent selection
 */
export type EventOption = Pick<Event, "id" | "title" | "startTime">;

/**
 * Configuration for ParentEntityCard when used with events
 *
 * Defines event-specific behavior:
 * - Fetches events for selection
 * - Updates event with new parent
 * - Renders event with title and start time
 */
export const parentEventConfig: ParentEntityCardConfig<EventOption> = {
  entityTypeName: "Event",
  basePath: "/dashboard/events",
  parentIdField: "parentEventId",

  fetchEntities: async (excludeId?: string) => {
    return (await getEventsForParentSelection(excludeId)) as EventOption[];
  },

  updateEntity: async (entityId: string, parentId: string | null) => {
    await updateEvent(entityId, { parentEventId: parentId });
  },

  renderViewDisplay: (event) => (
    <>
      <p className="font-medium">{event.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{formatFullDate(event.startTime)}</p>
    </>
  ),

  renderSelectItem: (event) => <span className="flex-1 truncate">{event.title}</span>,
};
