/**
 * Health Feature Queries
 *
 * Read-only database queries for the health section.
 */

import { db } from "@/db";
import { supplementProtocol, supplement, bodyMetric, healthProfile, goal } from "@/db/schema";
import { eq, and, isNull, desc, asc, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { bodyMetricFilterSchema } from "./schema";

// ============================================
// PROTOCOL QUERIES
// ============================================

export async function getProtocols(userId: string) {
  const protocols = await db
    .select()
    .from(supplementProtocol)
    .where(and(eq(supplementProtocol.userId, userId), isNull(supplementProtocol.deletedAt)))
    .orderBy(asc(supplementProtocol.sortOrder), desc(supplementProtocol.createdAt));

  // Fetch supplement counts for each protocol
  const protocolIds = protocols.map((p) => p.id);
  if (protocolIds.length === 0) return [];

  const supplementCounts = await db
    .select({
      protocolId: supplement.protocolId,
      count: sql<number>`count(*)::int`,
    })
    .from(supplement)
    .where(and(isNull(supplement.deletedAt)))
    .groupBy(supplement.protocolId);

  const countsMap = new Map(supplementCounts.map((c) => [c.protocolId, c.count]));

  return protocols.map((p) => ({
    ...p,
    supplementCount: countsMap.get(p.id) ?? 0,
  }));
}

export async function getProtocolWithSupplements(id: string, userId: string) {
  const [protocol] = await db
    .select()
    .from(supplementProtocol)
    .where(
      and(
        eq(supplementProtocol.id, id),
        eq(supplementProtocol.userId, userId),
        isNull(supplementProtocol.deletedAt)
      )
    )
    .limit(1);

  if (!protocol) return null;

  const supplements = await db
    .select()
    .from(supplement)
    .where(and(eq(supplement.protocolId, id), isNull(supplement.deletedAt)))
    .orderBy(asc(supplement.timeOfDay), asc(supplement.name));

  return { ...protocol, supplements };
}

// ============================================
// BODY METRIC QUERIES
// ============================================

export async function getBodyMetrics(userId: string, filters: unknown = {}) {
  const parsed = bodyMetricFilterSchema.parse(filters);

  const conditions = [eq(bodyMetric.userId, userId), isNull(bodyMetric.deletedAt)];

  if (parsed.metricType) {
    conditions.push(eq(bodyMetric.metricType, parsed.metricType));
  }
  if (parsed.from) {
    conditions.push(gte(bodyMetric.measuredAt, parsed.from));
  }
  if (parsed.to) {
    conditions.push(lte(bodyMetric.measuredAt, parsed.to));
  }

  const metrics = await db
    .select()
    .from(bodyMetric)
    .where(and(...conditions))
    .orderBy(desc(bodyMetric.measuredAt))
    .limit(parsed.limit ?? 50)
    .offset(parsed.offset ?? 0);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bodyMetric)
    .where(and(...conditions));

  return {
    metrics,
    pagination: {
      total: countResult?.count ?? 0,
      limit: parsed.limit ?? 50,
      offset: parsed.offset ?? 0,
    },
  };
}

export async function getLatestMetricByType(userId: string, metricType: string) {
  const [metric] = await db
    .select()
    .from(bodyMetric)
    .where(
      and(
        eq(bodyMetric.userId, userId),
        eq(bodyMetric.metricType, metricType),
        isNull(bodyMetric.deletedAt)
      )
    )
    .orderBy(desc(bodyMetric.measuredAt))
    .limit(1);

  return metric ?? null;
}

// ============================================
// HEALTH PROFILE QUERIES
// ============================================

export async function getHealthProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(healthProfile)
    .where(eq(healthProfile.userId, userId))
    .limit(1);

  return profile ?? null;
}

// ============================================
// HEALTH GOAL QUERIES
// ============================================

export async function getHealthGoals(userId: string, statusFilter?: string) {
  const conditions = [
    eq(goal.userId, userId),
    eq(goal.domain, "health"),
    isNull(goal.deletedAt),
  ];

  if (statusFilter) {
    conditions.push(
      eq(goal.status, statusFilter as "active" | "paused" | "completed" | "abandoned")
    );
  }

  return db
    .select()
    .from(goal)
    .where(and(...conditions))
    .orderBy(desc(goal.createdAt));
}

export async function getHealthGoalById(id: string, userId: string) {
  const [result] = await db
    .select()
    .from(goal)
    .where(and(eq(goal.id, id), eq(goal.userId, userId), isNull(goal.deletedAt)))
    .limit(1);

  return result ?? null;
}

// ============================================
// DASHBOARD AGGREGATE QUERY
// ============================================

export async function getHealthDashboardData(userId: string) {
  const [protocols, activeSupplementsResult, latestWeight, activeGoals] = await Promise.all([
    // Active protocols with counts
    getProtocols(userId),

    // Active supplement count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(supplement)
      .innerJoin(supplementProtocol, eq(supplement.protocolId, supplementProtocol.id))
      .where(
        and(
          eq(supplement.userId, userId),
          eq(supplement.isActive, true),
          eq(supplementProtocol.isActive, true),
          isNull(supplement.deletedAt),
          isNull(supplementProtocol.deletedAt)
        )
      ),

    // Latest weight
    getLatestMetricByType(userId, "weight"),

    // Active goals
    getHealthGoals(userId, "active"),
  ]);

  const activeProtocols = protocols.filter((p) => p.isActive);

  return {
    activeProtocols,
    totalProtocols: protocols.length,
    activeSupplementsCount: activeSupplementsResult[0]?.count ?? 0,
    latestWeight,
    activeGoals,
  };
}

// ============================================
// ROUTINE QUERY
// ============================================

export async function getDailyRoutine(userId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // Get all active supplements from active protocols
  const supplements = await db
    .select({
      supplement: supplement,
      protocolName: supplementProtocol.name,
    })
    .from(supplement)
    .innerJoin(supplementProtocol, eq(supplement.protocolId, supplementProtocol.id))
    .where(
      and(
        eq(supplement.userId, userId),
        eq(supplement.isActive, true),
        eq(supplementProtocol.isActive, true),
        isNull(supplement.deletedAt),
        isNull(supplementProtocol.deletedAt)
      )
    )
    .orderBy(asc(supplement.timeOfDay), asc(supplement.name));

  // Group by time of day
  const grouped: Record<string, typeof supplements> = {
    morning: [],
    afternoon: [],
    evening: [],
    other: [],
  };

  for (const item of supplements) {
    const time = item.supplement.timeOfDay?.toLowerCase() ?? "other";
    if (time.includes("mattin") || time.includes("morning")) {
      grouped.morning.push(item);
    } else if (time.includes("pomerig") || time.includes("afternoon")) {
      grouped.afternoon.push(item);
    } else if (
      time.includes("sera") ||
      time.includes("evening") ||
      time.includes("notte") ||
      time.includes("night")
    ) {
      grouped.evening.push(item);
    } else {
      grouped.other.push(item);
    }
  }

  return grouped;
}
