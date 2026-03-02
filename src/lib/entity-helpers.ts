/**
 * Entity Helpers
 *
 * Shared utility functions for entity CRUD operations.
 * These helpers reduce code duplication across task, event, note, and project actions.
 */

import { getSession } from "@/lib/auth";
import { db, withTransaction } from "@/db";
import {
  task,
  event,
  note,
  project,
  entityTag,
  comment,
  link,
  attachment,
  user,
} from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AppSession } from "@/types/auth";
import { r2 } from "@/lib/r2-client";
import { errors } from "@/lib/errors";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type EntityType = "task" | "event" | "note" | "project";

interface EntityWithProject {
  id: string;
  projectId?: string | null;
  userId: string;
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validate user session
 *
 * @returns User session
 * @throws AppError UNAUTHORIZED if user is not authenticated
 */
export async function validateSession(): Promise<AppSession> {
  const session = await getSession();

  if (!session?.user) {
    throw errors.unauthorized();
  }

  return session;
}

// ============================================================================
// OWNERSHIP VERIFICATION
// ============================================================================

/**
 * Check if user owns the specified entity
 *
 * @param entityType - Type of entity (task, event, note, project)
 * @param entityId - Entity UUID
 * @param userId - User UUID
 * @returns Entity if found and owned by user
 * @throws AppError NOT_FOUND if entity not found or user doesn't own it
 */
export async function checkOwnership<T extends EntityWithProject>(
  entityType: EntityType,
  entityId: string,
  userId: string
): Promise<T> {
  let existingEntity;

  switch (entityType) {
    case "task":
      existingEntity = await db.query.task.findFirst({
        where: and(eq(task.id, entityId), eq(task.userId, userId)),
      });
      break;
    case "event":
      existingEntity = await db.query.event.findFirst({
        where: and(eq(event.id, entityId), eq(event.userId, userId)),
      });
      break;
    case "note":
      existingEntity = await db.query.note.findFirst({
        where: and(eq(note.id, entityId), eq(note.userId, userId)),
      });
      break;
    case "project":
      existingEntity = await db.query.project.findFirst({
        where: and(eq(project.id, entityId), eq(project.userId, userId)),
      });
      break;
  }

  if (!existingEntity) {
    throw errors.notFound(capitalize(entityType));
  }

  return existingEntity as unknown as T;
}

// ============================================================================
// CACHE REVALIDATION
// ============================================================================

/**
 * Revalidate relevant paths after entity mutation
 */
export function revalidateEntityPaths(
  entityType: EntityType,
  entityId?: string,
  projectId?: string | null,
  includeTrash = false
): void {
  revalidatePath(`/dashboard/${entityType}s`);

  if (entityId) {
    revalidatePath(`/dashboard/${entityType}s/${entityId}`);
  }

  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`);
  }

  if (includeTrash) {
    revalidatePath("/dashboard/trash");
  }
}

/**
 * Revalidate paths when project assignment changes
 */
export function revalidateProjectChange(
  entityType: EntityType,
  oldProjectId?: string | null,
  newProjectId?: string | null
): void {
  if (oldProjectId) {
    revalidatePath(`/dashboard/projects/${oldProjectId}`);
  }
  if (newProjectId && newProjectId !== oldProjectId) {
    revalidatePath(`/dashboard/projects/${newProjectId}`);
  }
}

// ============================================================================
// TAG OPERATIONS
// ============================================================================

/**
 * Copy tags from one entity to another
 */
export async function copyEntityTags(
  sourceEntityType: EntityType,
  sourceEntityId: string,
  targetEntityType: EntityType,
  targetEntityId: string,
  userId: string
): Promise<void> {
  const sourceTags = await db
    .select()
    .from(entityTag)
    .where(and(eq(entityTag.entityType, sourceEntityType), eq(entityTag.entityId, sourceEntityId)));

  if (sourceTags.length > 0) {
    await db.insert(entityTag).values(
      sourceTags.map((tag) => ({
        userId,
        entityType: targetEntityType,
        entityId: targetEntityId,
        tagId: tag.tagId,
      }))
    );
  }
}

// ============================================================================
// SOFT DELETE OPERATIONS
// ============================================================================

/**
 * Soft delete an entity (set deletedAt timestamp)
 */
export async function softDeleteEntity(
  entityType: EntityType,
  entityId: string,
  userId: string,
  includeTrash = true
): Promise<void> {
  const entity = await checkOwnership(entityType, entityId, userId);

  switch (entityType) {
    case "task":
      await db.update(task).set({ deletedAt: new Date() }).where(eq(task.id, entityId));
      break;
    case "event":
      await db.update(event).set({ deletedAt: new Date() }).where(eq(event.id, entityId));
      break;
    case "note":
      await db.update(note).set({ deletedAt: new Date() }).where(eq(note.id, entityId));
      break;
    case "project":
      await db.update(project).set({ deletedAt: new Date() }).where(eq(project.id, entityId));
      break;
  }

  revalidateEntityPaths(entityType, entityId, entity.projectId, includeTrash);
}

/**
 * Hard delete an entity (permanent removal)
 *
 * Uses a database transaction to ensure atomic cleanup of all related data:
 * - Attachments (R2 files deleted outside transaction, DB records inside)
 * - Comments
 * - Tags
 * - Links (bidirectional)
 * - Main entity
 */
export async function hardDeleteEntity(
  entityType: EntityType,
  entityId: string,
  userId: string
): Promise<void> {
  await checkOwnership(entityType, entityId, userId);

  // Delete R2 files outside the transaction (external service)
  const attachments = await db
    .select()
    .from(attachment)
    .where(and(eq(attachment.entityType, entityType), eq(attachment.entityId, entityId)));

  if (attachments.length > 0) {
    const r2DeletePromises = attachments.map((att) =>
      r2.deleteObject({ Key: att.storageKey }).catch((error) => {
        console.error(`Error deleting ${att.storageKey} from R2:`, error);
      })
    );
    await Promise.all(r2DeletePromises);
  }

  const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);

  // Database operations in a transaction
  await withTransaction(async (tx) => {
    // 1. Delete attachment records
    if (attachments.length > 0) {
      await tx
        .delete(attachment)
        .where(and(eq(attachment.entityType, entityType), eq(attachment.entityId, entityId)));

      await tx
        .update(user)
        .set({
          storageUsedBytes: sql`GREATEST(0, ${user.storageUsedBytes} - ${totalSize})`,
        })
        .where(eq(user.id, userId));
    }

    // 2. Delete comments
    await tx
      .delete(comment)
      .where(and(eq(comment.entityType, entityType), eq(comment.entityId, entityId)));

    // 3. Delete entity tags
    await tx
      .delete(entityTag)
      .where(and(eq(entityTag.entityType, entityType), eq(entityTag.entityId, entityId)));

    // 4. Delete links (bidirectional)
    await tx
      .delete(link)
      .where(
        or(
          and(eq(link.fromType, entityType), eq(link.fromId, entityId)),
          and(eq(link.toType, entityType), eq(link.toId, entityId))
        )
      );

    // 5. Delete main entity
    switch (entityType) {
      case "task":
        await tx.delete(task).where(eq(task.id, entityId));
        break;
      case "event":
        await tx.delete(event).where(eq(event.id, entityId));
        break;
      case "note":
        await tx.delete(note).where(eq(note.id, entityId));
        break;
      case "project":
        await tx.delete(project).where(eq(project.id, entityId));
        break;
    }
  });

  revalidateEntityPaths(entityType, undefined, undefined, true);
}

/**
 * Restore entity from trash (clear deletedAt)
 */
export async function restoreEntityFromTrash(
  entityType: EntityType,
  entityId: string,
  userId: string
): Promise<void> {
  const entity = await checkOwnership(entityType, entityId, userId);

  switch (entityType) {
    case "task":
      await db.update(task).set({ deletedAt: null }).where(eq(task.id, entityId));
      break;
    case "event":
      await db.update(event).set({ deletedAt: null }).where(eq(event.id, entityId));
      break;
    case "note":
      await db.update(note).set({ deletedAt: null }).where(eq(note.id, entityId));
      break;
    case "project":
      await db.update(project).set({ deletedAt: null }).where(eq(project.id, entityId));
      break;
  }

  revalidateEntityPaths(entityType, entityId, entity.projectId, true);
}

// ============================================================================
// ARCHIVE OPERATIONS
// ============================================================================

/**
 * Archive an entity (set archivedAt timestamp)
 */
export async function archiveEntity(
  entityType: EntityType,
  entityId: string,
  userId: string
): Promise<void> {
  const entity = await checkOwnership(entityType, entityId, userId);

  switch (entityType) {
    case "task":
      await db.update(task).set({ archivedAt: new Date() }).where(eq(task.id, entityId));
      break;
    case "event":
      await db.update(event).set({ archivedAt: new Date() }).where(eq(event.id, entityId));
      break;
    case "note":
      await db.update(note).set({ archivedAt: new Date() }).where(eq(note.id, entityId));
      break;
    case "project":
      await db.update(project).set({ archivedAt: new Date() }).where(eq(project.id, entityId));
      break;
  }

  revalidateEntityPaths(entityType, entityId, entity.projectId);
}

/**
 * Restore archived entity (clear archivedAt)
 */
export async function restoreArchivedEntity(
  entityType: EntityType,
  entityId: string,
  userId: string
): Promise<void> {
  const entity = await checkOwnership(entityType, entityId, userId);

  switch (entityType) {
    case "task":
      await db.update(task).set({ archivedAt: null }).where(eq(task.id, entityId));
      break;
    case "event":
      await db.update(event).set({ archivedAt: null }).where(eq(event.id, entityId));
      break;
    case "note":
      await db.update(note).set({ archivedAt: null }).where(eq(note.id, entityId));
      break;
    case "project":
      await db.update(project).set({ archivedAt: null }).where(eq(project.id, entityId));
      break;
  }

  revalidateEntityPaths(entityType, entityId, entity.projectId);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
