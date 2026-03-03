import { pgTable, text, timestamp, pgEnum, uuid, jsonb, date, index } from "drizzle-orm/pg-core";

import { user } from "./auth";

// ============================================
// CROSS-DOMAIN ENUMS
// ============================================

// Postgres enum name kept as "health_goal_status" to avoid enum rename migration.
// TypeScript variable renamed to `goalStatusEnum` for clarity.
export const goalStatusEnum = pgEnum("health_goal_status", [
  "active",
  "paused",
  "completed",
  "abandoned",
]);

// ============================================
// CROSS-DOMAIN TABLES
// ============================================

/**
 * Unified Goal table
 *
 * Tracks goals across all domains (health, finance, personal).
 * Replaces the former `health_goal` table with a `domain` discriminator.
 *
 * Domain-specific data lives in `metadata` JSONB:
 * - health: { metricType: "weight", autoTrack: true }
 * - finance: { monthlyContribution: 500, linkedAccountId: "..." }
 * - personal: { linkedProjectId: "..." }
 */
export const goal = pgTable(
  "goal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    domain: text("domain").notNull().default("health"),

    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    targetValue: text("target_value"),
    targetUnit: text("target_unit"),
    currentValue: text("current_value"),
    status: goalStatusEnum("status").default("active").notNull(),
    startDate: date("start_date"),
    targetDate: date("target_date"),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_goal_user").on(table.userId),
    index("idx_goal_domain").on(table.domain),
    index("idx_goal_status").on(table.status),
    index("idx_goal_deleted").on(table.deletedAt),
  ]
);

// ============================================
// CROSS-DOMAIN TYPE EXPORTS
// ============================================

export type Goal = typeof goal.$inferSelect;
export type NewGoal = typeof goal.$inferInsert;
