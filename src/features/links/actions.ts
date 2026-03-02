"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { link } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createLinkSchema, updateLinkSchema } from "./schema";
import { parseInput, errors } from "@/lib/errors";

// ============================================================================
// CREATE LINK
// ============================================================================

export async function createLink(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(createLinkSchema, input);

  const existingLink = await db.query.link.findFirst({
    where: and(
      eq(link.userId, session.user.id),
      eq(link.fromType, data.fromType),
      eq(link.fromId, data.fromId),
      eq(link.toType, data.toType),
      eq(link.toId, data.toId),
      eq(link.relationship, data.relationship)
    ),
  });

  if (existingLink) {
    throw errors.alreadyExists("Link");
  }

  if (data.fromType === data.toType && data.fromId === data.toId) {
    throw errors.invalidInput("Cannot link an entity to itself");
  }

  const [newLink] = await db
    .insert(link)
    .values({
      fromType: data.fromType,
      fromId: data.fromId,
      toType: data.toType,
      toId: data.toId,
      relationship: data.relationship,
      metadata: data.metadata || {},
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${data.fromType}s/${data.fromId}`);
  revalidatePath(`/dashboard/${data.toType}s/${data.toId}`);

  return newLink;
}

// ============================================================================
// UPDATE LINK
// ============================================================================

export async function updateLink(id: string, input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(updateLinkSchema, input);

  const existingLink = await db.query.link.findFirst({
    where: and(eq(link.id, id), eq(link.userId, session.user.id)),
  });

  if (!existingLink) {
    throw errors.notFound("Link");
  }

  const [updatedLink] = await db
    .update(link)
    .set({
      relationship: data.relationship,
      metadata: data.metadata !== undefined ? data.metadata : existingLink.metadata,
    })
    .where(eq(link.id, id))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${existingLink.fromType}s/${existingLink.fromId}`);
  revalidatePath(`/dashboard/${existingLink.toType}s/${existingLink.toId}`);

  return updatedLink;
}

// ============================================================================
// DELETE LINK
// ============================================================================

export async function deleteLink(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const existingLink = await db.query.link.findFirst({
    where: and(eq(link.id, id), eq(link.userId, session.user.id)),
  });

  if (!existingLink) {
    throw errors.notFound("Link");
  }

  await db.delete(link).where(eq(link.id, id));

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${existingLink.fromType}s/${existingLink.fromId}`);
  revalidatePath(`/dashboard/${existingLink.toType}s/${existingLink.toId}`);
}
