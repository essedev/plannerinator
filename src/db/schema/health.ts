import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";

// NOTE: goalStatusEnum and goal table are in common.ts

import { user } from "./auth";

// ============================================
// HEALTH / SALUTE ENUMS
// ============================================

export const supplementFrequencyEnum = pgEnum("supplement_frequency", [
  "daily",
  "twice_daily",
  "weekly",
  "as_needed",
  "custom",
]);

// healthGoalStatusEnum moved to common.ts as goalStatusEnum

// ============================================
// HEALTH / SALUTE TABLES
// ============================================

export const supplementProtocol = pgTable(
  "supplement_protocol",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_supplement_protocol_user").on(table.userId),
    index("idx_supplement_protocol_active").on(table.isActive),
    index("idx_supplement_protocol_deleted").on(table.deletedAt),
  ]
);

export const supplement = pgTable(
  "supplement",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    protocolId: uuid("protocol_id")
      .notNull()
      .references(() => supplementProtocol.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    brand: text("brand"),
    dosage: text("dosage"),
    frequency: supplementFrequencyEnum("frequency").default("daily").notNull(),
    timeOfDay: text("time_of_day"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_supplement_user").on(table.userId),
    index("idx_supplement_protocol").on(table.protocolId),
    index("idx_supplement_active").on(table.isActive),
    index("idx_supplement_deleted").on(table.deletedAt),
  ]
);

export const bodyMetric = pgTable(
  "body_metric",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    metricType: text("metric_type").notNull(),
    value: text("value").notNull(),
    unit: text("unit"),
    measuredAt: timestamp("measured_at", { withTimezone: true }).defaultNow().notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_body_metric_user").on(table.userId),
    index("idx_body_metric_type").on(table.metricType),
    index("idx_body_metric_measured_at").on(table.measuredAt),
    index("idx_body_metric_deleted").on(table.deletedAt),
  ]
);

export const healthProfile = pgTable(
  "health_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    dateOfBirth: date("date_of_birth"),
    bloodType: text("blood_type"),
    height: text("height"),
    allergies: jsonb("allergies").default([]),
    conditions: jsonb("conditions").default([]),
    sleepTarget: text("sleep_target"),
    exerciseRoutine: text("exercise_routine"),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_health_profile_user").on(table.userId)]
);

// healthGoal table moved to common.ts as unified `goal` table

// ============================================
// HEALTH TYPE EXPORTS
// ============================================

export type SupplementProtocol = typeof supplementProtocol.$inferSelect;
export type NewSupplementProtocol = typeof supplementProtocol.$inferInsert;
export type Supplement = typeof supplement.$inferSelect;
export type NewSupplement = typeof supplement.$inferInsert;
export type BodyMetric = typeof bodyMetric.$inferSelect;
export type NewBodyMetric = typeof bodyMetric.$inferInsert;
export type HealthProfile = typeof healthProfile.$inferSelect;
export type NewHealthProfile = typeof healthProfile.$inferInsert;
// HealthGoal type moved to common.ts as Goal
