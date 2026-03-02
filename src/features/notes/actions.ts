"use server";

import { db } from "@/db";
import { note } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { syncAssignedToLink } from "@/features/links/helpers";
import {
  createNoteSchema,
  updateNoteSchema,
  bulkNoteOperationSchema,
  type UpdateNoteInput,
} from "./schema";
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
import { parseInput, errors } from "@/lib/errors";

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

export async function createNote(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createNoteSchema, input);

  const [createdNote] = await db
    .insert(note)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  if (data.projectId) {
    await syncAssignedToLink(session.user.id, "note", createdNote.id, data.projectId);
  }

  revalidateEntityPaths("note", undefined, data.projectId);

  return createdNote;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

export async function updateNote(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateNoteSchema, input);

  const existingNote = await checkOwnership<typeof note.$inferSelect>("note", id, session.user.id);

  const updates: UpdateNoteInput = { ...data };

  const [updatedNote] = await db.update(note).set(updates).where(eq(note.id, id)).returning();

  if ("projectId" in data) {
    await syncAssignedToLink(session.user.id, "note", id, data.projectId);
  }

  revalidateEntityPaths("note", id, existingNote.projectId);
  revalidateProjectChange("note", existingNote.projectId, data.projectId);

  return updatedNote;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

export async function deleteNote(id: string) {
  const session = await validateSession();
  await softDeleteEntity("note", id, session.user.id);
}

export async function hardDeleteNote(id: string) {
  const session = await validateSession();
  await hardDeleteEntity("note", id, session.user.id);
}

export async function restoreFromTrashNote(id: string) {
  const session = await validateSession();
  await restoreEntityFromTrash("note", id, session.user.id);
}

export async function duplicateNote(id: string) {
  const session = await validateSession();

  const originalNote = await checkOwnership<typeof note.$inferSelect>("note", id, session.user.id);

  const [duplicatedNote] = await db
    .insert(note)
    .values({
      userId: session.user.id,
      title: originalNote.title ? `Copy of ${originalNote.title}` : "Copy of note",
      content: originalNote.content,
      type: originalNote.type,
      projectId: originalNote.projectId,
      parentNoteId: null,
      isFavorite: false,
      metadata: originalNote.metadata,
    })
    .returning();

  await copyEntityTags("note", id, "note", duplicatedNote.id, session.user.id);

  if (duplicatedNote.projectId) {
    await syncAssignedToLink(session.user.id, "note", duplicatedNote.id, duplicatedNote.projectId);
  }

  revalidateEntityPaths("note", undefined, duplicatedNote.projectId);

  return duplicatedNote;
}

// ============================================================================
// ARCHIVE OPERATIONS
// ============================================================================

export async function archiveNote(id: string) {
  const session = await validateSession();
  await archiveEntity("note", id, session.user.id);
}

export async function restoreNote(id: string) {
  const session = await validateSession();
  await restoreArchivedEntity("note", id, session.user.id);
}

// ============================================================================
// FAVORITE OPERATIONS
// ============================================================================

export async function toggleNoteFavorite(id: string, isFavorite: boolean) {
  const session = await validateSession();
  await checkOwnership("note", id, session.user.id);

  const [updatedNote] = await db
    .update(note)
    .set({ isFavorite })
    .where(eq(note.id, id))
    .returning();

  revalidateEntityPaths("note", id);

  return updatedNote;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkNoteOperation(input: unknown) {
  const session = await validateSession();
  const data = parseInput(bulkNoteOperationSchema, input);

  const notes = await db.query.note.findMany({
    where: and(inArray(note.id, data.noteIds), eq(note.userId, session.user.id)),
  });

  if (notes.length !== data.noteIds.length) {
    throw errors.notFound("Some notes");
  }

  switch (data.operation) {
    case "delete":
      await db.delete(note).where(inArray(note.id, data.noteIds));
      break;

    case "favorite":
      await db.update(note).set({ isFavorite: true }).where(inArray(note.id, data.noteIds));
      break;

    case "unfavorite":
      await db.update(note).set({ isFavorite: false }).where(inArray(note.id, data.noteIds));
      break;

    case "updateType":
      if (!data.type) {
        throw errors.invalidInput("Type is required for updateType operation");
      }
      await db.update(note).set({ type: data.type }).where(inArray(note.id, data.noteIds));
      break;

    case "moveToProject":
      await db
        .update(note)
        .set({ projectId: data.projectId })
        .where(inArray(note.id, data.noteIds));
      break;

    default:
      throw errors.invalidInput("Invalid operation");
  }

  revalidateEntityPaths("note");
  const projectIds = [...new Set(notes.map((n) => n.projectId).filter(Boolean))];
  projectIds.forEach((projectId) => {
    if (projectId) revalidateEntityPaths("project", projectId);
  });

  if (data.projectId) {
    revalidateEntityPaths("project", data.projectId);
  }

  return { count: data.noteIds.length };
}
