"use server";

import { db } from "@/db";
import { supplementProtocol, supplement, bodyMetric, healthProfile, goal } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { validateSession } from "@/lib/entity-helpers";
import { parseInput, errors } from "@/lib/errors";
import {
  createProtocolSchema,
  updateProtocolSchema,
  createSupplementSchema,
  updateSupplementSchema,
  logBodyMetricSchema,
  upsertHealthProfileSchema,
  createHealthGoalSchema,
  updateHealthGoalSchema,
} from "./schema";

// ============================================
// SUPPLEMENT PROTOCOL ACTIONS
// ============================================

export async function createProtocol(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createProtocolSchema, input);

  const [created] = await db
    .insert(supplementProtocol)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/salute");
  revalidatePath("/salute/integratori");
  return created;
}

export async function updateProtocol(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateProtocolSchema, input);

  const [existing] = await db
    .select()
    .from(supplementProtocol)
    .where(and(eq(supplementProtocol.id, id), eq(supplementProtocol.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Protocol");

  const [updated] = await db
    .update(supplementProtocol)
    .set(data)
    .where(eq(supplementProtocol.id, id))
    .returning();

  revalidatePath("/salute");
  revalidatePath("/salute/integratori");
  revalidatePath(`/salute/integratori/${id}`);
  return updated;
}

export async function deleteProtocol(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(supplementProtocol)
    .where(and(eq(supplementProtocol.id, id), eq(supplementProtocol.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Protocol");

  await db
    .update(supplementProtocol)
    .set({ deletedAt: new Date() })
    .where(eq(supplementProtocol.id, id));

  revalidatePath("/salute");
  revalidatePath("/salute/integratori");
}

// ============================================
// SUPPLEMENT ACTIONS
// ============================================

export async function createSupplement(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createSupplementSchema, input);

  // Verify protocol ownership
  const [protocol] = await db
    .select()
    .from(supplementProtocol)
    .where(
      and(
        eq(supplementProtocol.id, data.protocolId),
        eq(supplementProtocol.userId, session.user.id)
      )
    )
    .limit(1);

  if (!protocol) throw errors.notFound("Protocol");

  const [created] = await db
    .insert(supplement)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/salute");
  revalidatePath("/salute/integratori");
  revalidatePath(`/salute/integratori/${data.protocolId}`);
  revalidatePath("/salute/routine");
  return created;
}

export async function updateSupplement(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateSupplementSchema, input);

  const [existing] = await db
    .select()
    .from(supplement)
    .where(and(eq(supplement.id, id), eq(supplement.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Supplement");

  const [updated] = await db.update(supplement).set(data).where(eq(supplement.id, id)).returning();

  revalidatePath("/salute");
  revalidatePath("/salute/integratori");
  revalidatePath(`/salute/integratori/${existing.protocolId}`);
  revalidatePath("/salute/routine");
  return updated;
}

export async function deleteSupplement(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(supplement)
    .where(and(eq(supplement.id, id), eq(supplement.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Supplement");

  await db.update(supplement).set({ deletedAt: new Date() }).where(eq(supplement.id, id));

  revalidatePath("/salute");
  revalidatePath("/salute/integratori");
  revalidatePath(`/salute/integratori/${existing.protocolId}`);
  revalidatePath("/salute/routine");
}

// ============================================
// BODY METRIC ACTIONS
// ============================================

export async function logBodyMetric(input: unknown) {
  const session = await validateSession();
  const data = parseInput(logBodyMetricSchema, input);

  const [created] = await db
    .insert(bodyMetric)
    .values({
      ...data,
      measuredAt: data.measuredAt ?? new Date(),
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/salute");
  revalidatePath("/salute/corpo");
  return created;
}

export async function deleteBodyMetric(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(bodyMetric)
    .where(and(eq(bodyMetric.id, id), eq(bodyMetric.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Body metric");

  await db.update(bodyMetric).set({ deletedAt: new Date() }).where(eq(bodyMetric.id, id));

  revalidatePath("/salute");
  revalidatePath("/salute/corpo");
}

// ============================================
// HEALTH PROFILE ACTIONS
// ============================================

export async function upsertHealthProfile(input: unknown) {
  const session = await validateSession();
  const data = parseInput(upsertHealthProfileSchema, input);

  const [existing] = await db
    .select()
    .from(healthProfile)
    .where(eq(healthProfile.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(healthProfile)
      .set(data)
      .where(eq(healthProfile.userId, session.user.id))
      .returning();

    revalidatePath("/salute");
    return updated;
  }

  const [created] = await db
    .insert(healthProfile)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/salute");
  return created;
}

// ============================================
// HEALTH GOAL ACTIONS
// ============================================

export async function createHealthGoal(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createHealthGoalSchema, input);

  // Extract metricType into metadata JSONB
  const { metricType, ...goalData } = data;
  const metadata = metricType ? { metricType } : {};

  const [created] = await db
    .insert(goal)
    .values({
      ...goalData,
      domain: "health",
      metadata,
      userId: session.user.id,
    })
    .returning();

  revalidatePath("/salute");
  revalidatePath("/salute/obiettivi");
  return created;
}

export async function updateHealthGoal(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateHealthGoalSchema, input);

  const [existing] = await db
    .select()
    .from(goal)
    .where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Goal");

  // Handle metricType → metadata migration
  const { metricType, ...updateData } = data;
  const updatePayload: Record<string, unknown> = { ...updateData };
  if (metricType !== undefined) {
    const existingMeta = (existing.metadata as Record<string, unknown>) ?? {};
    updatePayload.metadata = { ...existingMeta, metricType };
  }

  const [updated] = await db.update(goal).set(updatePayload).where(eq(goal.id, id)).returning();

  revalidatePath("/salute");
  revalidatePath("/salute/obiettivi");
  revalidatePath(`/salute/obiettivi/${id}`);
  return updated;
}

export async function deleteHealthGoal(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(goal)
    .where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
    .limit(1);

  if (!existing) throw errors.notFound("Goal");

  await db.update(goal).set({ deletedAt: new Date() }).where(eq(goal.id, id));

  revalidatePath("/salute");
  revalidatePath("/salute/obiettivi");
}
