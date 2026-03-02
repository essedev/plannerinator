"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { comment } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createCommentSchema, updateCommentSchema } from "./schema";
import { parseInput, errors } from "@/lib/errors";

// ============================================================================
// CREATE COMMENT
// ============================================================================

export async function createComment(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(createCommentSchema, input);

  if (data.parentCommentId) {
    const parentComment = await db.query.comment.findFirst({
      where: eq(comment.id, data.parentCommentId),
    });

    if (!parentComment) {
      throw errors.notFound("Parent comment");
    }

    if (parentComment.entityType !== data.entityType || parentComment.entityId !== data.entityId) {
      throw errors.invalidInput("Parent comment belongs to a different entity");
    }
  }

  const [newComment] = await db
    .insert(comment)
    .values({
      content: data.content,
      entityType: data.entityType,
      entityId: data.entityId,
      parentCommentId: data.parentCommentId,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${data.entityType}s/${data.entityId}`);

  return newComment;
}

// ============================================================================
// UPDATE COMMENT
// ============================================================================

export async function updateComment(id: string, input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(updateCommentSchema, input);

  const existingComment = await db.query.comment.findFirst({
    where: and(eq(comment.id, id), eq(comment.userId, session.user.id)),
  });

  if (!existingComment) {
    throw errors.notFound("Comment");
  }

  const [updatedComment] = await db
    .update(comment)
    .set({
      content: data.content,
    })
    .where(eq(comment.id, id))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${existingComment.entityType}s/${existingComment.entityId}`);

  return updatedComment;
}

// ============================================================================
// DELETE COMMENT
// ============================================================================

export async function deleteComment(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const existingComment = await db.query.comment.findFirst({
    where: and(eq(comment.id, id), eq(comment.userId, session.user.id)),
  });

  if (!existingComment) {
    throw errors.notFound("Comment");
  }

  await db.delete(comment).where(eq(comment.id, id));

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${existingComment.entityType}s/${existingComment.entityId}`);
}
