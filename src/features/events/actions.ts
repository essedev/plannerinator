"use server";

import { db } from "@/db";
import { event } from "@/db/schema";
import { eq } from "drizzle-orm";
import { syncAssignedToLink } from "@/features/links/helpers";
import { createEventSchema, updateEventSchema, type UpdateEventInput } from "./schema";
import {
  validateSession,
  checkOwnership,
  revalidateEntityPaths,
  revalidateProjectChange,
  copyEntityTags,
  softDeleteEntity,
  hardDeleteEntity,
  restoreEntityFromTrash,
  archiveEntity,
  restoreArchivedEntity,
} from "@/lib/entity-helpers";
import { parseInput } from "@/lib/errors";

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

export async function createEvent(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createEventSchema, input);

  const [createdEvent] = await db
    .insert(event)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  if (data.projectId) {
    await syncAssignedToLink(session.user.id, "event", createdEvent.id, data.projectId);
  }

  revalidateEntityPaths("event", undefined, data.projectId);

  return createdEvent;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

export async function updateEvent(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateEventSchema, input);

  const existingEvent = await checkOwnership<typeof event.$inferSelect>(
    "event",
    id,
    session.user.id
  );

  const updates: UpdateEventInput = { ...data };

  const [updatedEvent] = await db.update(event).set(updates).where(eq(event.id, id)).returning();

  if ("projectId" in data) {
    await syncAssignedToLink(session.user.id, "event", id, data.projectId);
  }

  revalidateEntityPaths("event", id, existingEvent.projectId);
  revalidateProjectChange("event", existingEvent.projectId, data.projectId);

  return updatedEvent;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

export async function deleteEvent(id: string) {
  const session = await validateSession();
  await softDeleteEntity("event", id, session.user.id);
}

export async function hardDeleteEvent(id: string) {
  const session = await validateSession();
  await hardDeleteEntity("event", id, session.user.id);
}

export async function restoreFromTrashEvent(id: string) {
  const session = await validateSession();
  await restoreEntityFromTrash("event", id, session.user.id);
}

export async function duplicateEvent(id: string) {
  const session = await validateSession();

  const originalEvent = await checkOwnership<typeof event.$inferSelect>(
    "event",
    id,
    session.user.id
  );

  const [duplicatedEvent] = await db
    .insert(event)
    .values({
      userId: session.user.id,
      title: `Copy of ${originalEvent.title}`,
      description: originalEvent.description,
      location: originalEvent.location,
      locationUrl: originalEvent.locationUrl,
      calendarType: originalEvent.calendarType,
      projectId: originalEvent.projectId,
      allDay: originalEvent.allDay,
      startTime: originalEvent.startTime,
      endTime: originalEvent.endTime,
      metadata: originalEvent.metadata,
    })
    .returning();

  await copyEntityTags("event", id, "event", duplicatedEvent.id, session.user.id);

  if (duplicatedEvent.projectId) {
    await syncAssignedToLink(
      session.user.id,
      "event",
      duplicatedEvent.id,
      duplicatedEvent.projectId
    );
  }

  revalidateEntityPaths("event", undefined, duplicatedEvent.projectId);

  return duplicatedEvent;
}

// ============================================================================
// ARCHIVE OPERATIONS
// ============================================================================

export async function archiveEvent(id: string) {
  const session = await validateSession();
  await archiveEntity("event", id, session.user.id);
}

export async function restoreEvent(id: string) {
  const session = await validateSession();
  await restoreArchivedEntity("event", id, session.user.id);
}
