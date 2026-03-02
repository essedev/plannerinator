"use server";

import { db } from "@/db";
import { project } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createProjectSchema, updateProjectSchema } from "./schema";
import {
  validateSession,
  checkOwnership,
  revalidateEntityPaths,
  copyEntityTags,
  softDeleteEntity,
  hardDeleteEntity,
  restoreEntityFromTrash,
  archiveEntity,
  restoreArchivedEntity,
} from "@/lib/entity-helpers";
import { parseInput } from "@/lib/errors";

// ============================================================================
// CREATE PROJECT
// ============================================================================

export async function createProject(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createProjectSchema, input);

  const [newProject] = await db
    .insert(project)
    .values({
      name: data.name,
      description: data.description,
      startDate: data.startDate ? data.startDate.toISOString() : null,
      endDate: data.endDate ? data.endDate.toISOString() : null,
      icon: data.icon,
      parentProjectId: data.parentProjectId,
      metadata: data.metadata,
      userId: session.user.id,
    })
    .returning();

  revalidateEntityPaths("project");

  return newProject;
}

// ============================================================================
// UPDATE PROJECT
// ============================================================================

export async function updateProject(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateProjectSchema, input);

  await checkOwnership("project", id, session.user.id);

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.startDate) {
    updateData.startDate = data.startDate.toISOString();
  }
  if (data.endDate) {
    updateData.endDate = data.endDate.toISOString();
  }

  const [updatedProject] = await db
    .update(project)
    .set(updateData)
    .where(eq(project.id, id))
    .returning();

  revalidateEntityPaths("project", id);

  return updatedProject;
}

// ============================================================================
// DELETE PROJECT
// ============================================================================

export async function deleteProject(id: string) {
  const session = await validateSession();
  await softDeleteEntity("project", id, session.user.id);
}

export async function hardDeleteProject(id: string) {
  const session = await validateSession();
  await hardDeleteEntity("project", id, session.user.id);
}

export async function restoreFromTrashProject(id: string) {
  const session = await validateSession();
  await restoreEntityFromTrash("project", id, session.user.id);
}

export async function duplicateProject(id: string) {
  const session = await validateSession();

  const originalProject = await checkOwnership<typeof project.$inferSelect>(
    "project",
    id,
    session.user.id
  );

  const [duplicatedProject] = await db
    .insert(project)
    .values({
      userId: session.user.id,
      name: `Copy of ${originalProject.name}`,
      description: originalProject.description,
      status: originalProject.status,
      color: originalProject.color,
      icon: originalProject.icon,
      parentProjectId: null,
      startDate: null,
      endDate: null,
      metadata: originalProject.metadata,
    })
    .returning();

  await copyEntityTags("project", id, "project", duplicatedProject.id, session.user.id);

  revalidateEntityPaths("project");

  return duplicatedProject;
}

// ============================================================================
// ARCHIVE PROJECT
// ============================================================================

export async function archiveProject(id: string) {
  const session = await validateSession();
  await archiveEntity("project", id, session.user.id);
}

export async function restoreProject(id: string) {
  const session = await validateSession();
  await restoreArchivedEntity("project", id, session.user.id);
}

// ============================================================================
// COMPLETE PROJECT
// ============================================================================

export async function completeProject(id: string) {
  return updateProject(id, { status: "completed" });
}
