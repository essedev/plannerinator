"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { attachment, user } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createAttachmentSchema,
  updateAttachmentSchema,
  bulkDeleteAttachmentsSchema,
  type CreateAttachmentInput,
  type UpdateAttachmentInput,
} from "./schema";
import { getUserStorageQuota } from "./queries";
import { r2 } from "@/lib/r2-client";
import { parseInput, errors } from "@/lib/errors";

// ============================================================================
// UPLOAD OPERATIONS
// ============================================================================

export async function generateUploadUrl(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(createAttachmentSchema, input);

  const quota = await getUserStorageQuota();
  if (quota.availableBytes < data.fileSize) {
    throw errors.invalidInput(
      `Storage quota exceeded. You have ${(quota.availableBytes / 1024 / 1024).toFixed(2)}MB available, but need ${(data.fileSize / 1024 / 1024).toFixed(2)}MB`
    );
  }

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storageKey = `${session.user.id}/${data.entityType}/${data.entityId}/${timestamp}-${randomString}-${sanitizedFileName}`;

  const uploadUrl = await r2.getUploadUrl({
    Key: storageKey,
    ContentType: data.mimeType,
  });

  return { uploadUrl, storageKey };
}

export async function confirmAttachmentUpload(
  input: CreateAttachmentInput & { storageKey: string }
) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(createAttachmentSchema, input);

  if (!input.storageKey.startsWith(session.user.id)) {
    throw errors.forbidden("Invalid storage key");
  }

  const [createdAttachment] = await db
    .insert(attachment)
    .values({
      userId: session.user.id,
      entityType: data.entityType,
      entityId: data.entityId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      storageKey: input.storageKey,
      storageUrl: null,
      metadata: data.metadata || {},
    })
    .returning();

  await db
    .update(user)
    .set({
      storageUsedBytes: sql`${user.storageUsedBytes} + ${data.fileSize}`,
    })
    .where(eq(user.id, session.user.id));

  revalidatePath(`/dashboard/${data.entityType}s`);
  revalidatePath(`/dashboard/${data.entityType}s/${data.entityId}`);

  return createdAttachment;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

export async function deleteAttachment(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const existingAttachment = await db.query.attachment.findFirst({
    where: and(eq(attachment.id, id), eq(attachment.userId, session.user.id)),
  });

  if (!existingAttachment) {
    throw errors.notFound("Attachment");
  }

  try {
    await r2.deleteObject({ Key: existingAttachment.storageKey });
  } catch (r2Error) {
    console.error("Error deleting from R2:", r2Error);
  }

  await db.delete(attachment).where(eq(attachment.id, id));

  await db
    .update(user)
    .set({
      storageUsedBytes: sql`GREATEST(0, ${user.storageUsedBytes} - ${existingAttachment.fileSize})`,
    })
    .where(eq(user.id, session.user.id));

  revalidatePath(`/dashboard/${existingAttachment.entityType}s`);
  revalidatePath(`/dashboard/${existingAttachment.entityType}s/${existingAttachment.entityId}`);
}

export async function bulkDeleteAttachments(input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(bulkDeleteAttachmentsSchema, input);

  const attachments = await db.query.attachment.findMany({
    where: and(inArray(attachment.id, data.attachmentIds), eq(attachment.userId, session.user.id)),
  });

  if (attachments.length !== data.attachmentIds.length) {
    throw errors.notFound("Some attachments");
  }

  const deletePromises = attachments.map((att) =>
    r2.deleteObject({ Key: att.storageKey }).catch((error) => {
      console.error(`Error deleting ${att.storageKey} from R2:`, error);
    })
  );
  await Promise.all(deletePromises);

  await db.delete(attachment).where(inArray(attachment.id, data.attachmentIds));

  const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);

  await db
    .update(user)
    .set({
      storageUsedBytes: sql`GREATEST(0, ${user.storageUsedBytes} - ${totalSize})`,
    })
    .where(eq(user.id, session.user.id));

  const entityTypes = new Set(attachments.map((att) => att.entityType));
  entityTypes.forEach((entityType) => {
    revalidatePath(`/dashboard/${entityType}s`);
  });

  return { count: attachments.length };
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

export async function updateAttachment(id: string, input: unknown) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(updateAttachmentSchema, input);

  const existingAttachment = await db.query.attachment.findFirst({
    where: and(eq(attachment.id, id), eq(attachment.userId, session.user.id)),
  });

  if (!existingAttachment) {
    throw errors.notFound("Attachment");
  }

  const updates: UpdateAttachmentInput = { ...data };
  const [updatedAttachment] = await db
    .update(attachment)
    .set(updates)
    .where(eq(attachment.id, id))
    .returning();

  revalidatePath(`/dashboard/${existingAttachment.entityType}s`);
  revalidatePath(`/dashboard/${existingAttachment.entityType}s/${existingAttachment.entityId}`);

  return updatedAttachment;
}

// ============================================================================
// DOWNLOAD OPERATIONS
// ============================================================================

export async function getAttachmentDownloadUrl(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const existingAttachment = await db.query.attachment.findFirst({
    where: and(eq(attachment.id, id), eq(attachment.userId, session.user.id)),
  });

  if (!existingAttachment) {
    throw errors.notFound("Attachment");
  }

  const downloadUrl = await r2.getDownloadUrl({
    Key: existingAttachment.storageKey,
    ResponseContentDisposition: `attachment; filename="${existingAttachment.fileName}"`,
  });

  return { downloadUrl };
}

export async function getAttachmentImageData(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw errors.unauthorized();
  }

  const existingAttachment = await db.query.attachment.findFirst({
    where: and(eq(attachment.id, id), eq(attachment.userId, session.user.id)),
  });

  if (!existingAttachment) {
    throw errors.notFound("Attachment");
  }

  const downloadUrl = await r2.getDownloadUrl({
    Key: existingAttachment.storageKey,
  });

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw errors.internal("Failed to fetch image");
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${existingAttachment.mimeType};base64,${base64}`;

  return { dataUrl };
}
