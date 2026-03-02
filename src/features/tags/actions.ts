"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tag, entityTag } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  createTagSchema,
  updateTagSchema,
  assignTagSchema,
  removeTagSchema,
  mergeTagsSchema,
  bulkDeleteTagsSchema,
} from "./schema";
import { parseInput, errors } from "@/lib/errors";

// ============================================================================
// CREATE TAG
// ============================================================================

export async function createTag(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(createTagSchema, input);

  const existingTag = await db.query.tag.findFirst({
    where: and(eq(tag.userId, session.user.id), eq(tag.name, data.name)),
  });

  if (existingTag) {
    throw errors.alreadyExists("Tag");
  }

  const [newTag] = await db
    .insert(tag)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard");

  return newTag;
}

// ============================================================================
// UPDATE TAG
// ============================================================================

export async function updateTag(id: string, input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(updateTagSchema, input);

  const existingTag = await db.query.tag.findFirst({
    where: and(eq(tag.id, id), eq(tag.userId, session.user.id)),
  });

  if (!existingTag) {
    throw errors.notFound("Tag");
  }

  if (data.name && data.name !== existingTag.name) {
    const nameConflict = await db.query.tag.findFirst({
      where: and(eq(tag.userId, session.user.id), eq(tag.name, data.name)),
    });

    if (nameConflict) {
      throw errors.alreadyExists("Tag");
    }
  }

  const [updatedTag] = await db.update(tag).set(data).where(eq(tag.id, id)).returning();

  revalidatePath("/dashboard");

  return updatedTag;
}

// ============================================================================
// DELETE TAG
// ============================================================================

export async function deleteTag(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const existingTag = await db.query.tag.findFirst({
    where: and(eq(tag.id, id), eq(tag.userId, session.user.id)),
  });

  if (!existingTag) {
    throw errors.notFound("Tag");
  }

  await db.delete(tag).where(eq(tag.id, id));

  revalidatePath("/dashboard");
}

// ============================================================================
// ASSIGN TAGS TO ENTITY
// ============================================================================

export async function assignTagsToEntity(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(assignTagSchema, input);

  const tags = await db.query.tag.findMany({
    where: and(inArray(tag.id, data.tagIds), eq(tag.userId, session.user.id)),
  });

  if (tags.length !== data.tagIds.length) {
    throw errors.notFound("Some tags");
  }

  const existingAssignments = await db.query.entityTag.findMany({
    where: and(
      eq(entityTag.userId, session.user.id),
      eq(entityTag.entityType, data.entityType),
      eq(entityTag.entityId, data.entityId),
      inArray(entityTag.tagId, data.tagIds)
    ),
  });

  const existingTagIds = new Set(existingAssignments.map((a) => a.tagId));
  const newTagIds = data.tagIds.filter((tagId) => !existingTagIds.has(tagId));

  if (newTagIds.length > 0) {
    await db.insert(entityTag).values(
      newTagIds.map((tagId) => ({
        userId: session.user.id,
        entityType: data.entityType,
        entityId: data.entityId,
        tagId,
      }))
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${data.entityType}s/${data.entityId}`);

  return { assignedCount: newTagIds.length };
}

// ============================================================================
// REMOVE TAGS FROM ENTITY
// ============================================================================

export async function removeTagsFromEntity(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(removeTagSchema, input);

  await db
    .delete(entityTag)
    .where(
      and(
        eq(entityTag.userId, session.user.id),
        eq(entityTag.entityType, data.entityType),
        eq(entityTag.entityId, data.entityId),
        inArray(entityTag.tagId, data.tagIds)
      )
    );

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${data.entityType}s/${data.entityId}`);
}

// ============================================================================
// MERGE TAGS
// ============================================================================

export async function mergeTags(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(mergeTagsSchema, input);

  const allTagIds = [...data.sourceTagIds, data.targetTagId];
  const tags = await db.query.tag.findMany({
    where: and(inArray(tag.id, allTagIds), eq(tag.userId, session.user.id)),
  });

  if (tags.length !== allTagIds.length) {
    throw errors.notFound("Some tags");
  }

  if (data.sourceTagIds.includes(data.targetTagId)) {
    throw errors.invalidInput("Target tag cannot be one of the source tags");
  }

  const sourceAssignments = await db.query.entityTag.findMany({
    where: and(eq(entityTag.userId, session.user.id), inArray(entityTag.tagId, data.sourceTagIds)),
  });

  const existingTargetAssignments = await db.query.entityTag.findMany({
    where: and(eq(entityTag.userId, session.user.id), eq(entityTag.tagId, data.targetTagId)),
  });

  const existingTargetKeys = new Set(
    existingTargetAssignments.map((a) => `${a.entityType}:${a.entityId}`)
  );

  const assignmentsToCreate = sourceAssignments
    .filter((a) => !existingTargetKeys.has(`${a.entityType}:${a.entityId}`))
    .map((a) => ({
      userId: session.user.id,
      entityType: a.entityType,
      entityId: a.entityId,
      tagId: data.targetTagId,
    }));

  if (assignmentsToCreate.length > 0) {
    await db.insert(entityTag).values(assignmentsToCreate);
  }

  await db.delete(tag).where(inArray(tag.id, data.sourceTagIds));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tags");

  return {
    mergedCount: data.sourceTagIds.length,
    reassignedCount: assignmentsToCreate.length,
  };
}

// ============================================================================
// BULK DELETE TAGS
// ============================================================================

export async function bulkDeleteTags(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(bulkDeleteTagsSchema, input);

  const tags = await db.query.tag.findMany({
    where: and(inArray(tag.id, data.tagIds), eq(tag.userId, session.user.id)),
  });

  if (tags.length !== data.tagIds.length) {
    throw errors.notFound("Some tags");
  }

  await db.delete(tag).where(inArray(tag.id, data.tagIds));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tags");

  return { deletedCount: data.tagIds.length };
}
