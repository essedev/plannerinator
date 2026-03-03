import { pgTable, text, timestamp, integer, uuid, jsonb, index } from "drizzle-orm/pg-core";

import { user } from "./auth";

// ============================================
// AI ASSISTANT TABLES
// ============================================

export const aiConversation = pgTable(
  "ai_conversation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title"),

    messages: jsonb("messages")
      .$type<
        Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
          timestamp: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          toolsUsed?: Array<{ name: string; result: any }>;
        }>
      >()
      .default([])
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_ai_conversations_user").on(table.userId, table.updatedAt)]
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => aiConversation.id, {
      onDelete: "set null",
    }),

    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),

    model: text("model").notNull().default("anthropic/claude-haiku-4.5"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_usage_user").on(table.userId, table.createdAt),
    index("idx_ai_usage_conversation").on(table.conversationId),
  ]
);

export const aiLog = pgTable(
  "ai_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => aiConversation.id, {
      onDelete: "cascade",
    }),

    level: text("level").notNull(),

    message: text("message").notNull(),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_log_user").on(table.userId, table.createdAt),
    index("idx_ai_log_conversation").on(table.conversationId),
    index("idx_ai_log_level").on(table.level, table.createdAt),
  ]
);

// ============================================
// AI TYPE EXPORTS
// ============================================

export type AiConversation = typeof aiConversation.$inferSelect;
export type NewAiConversation = typeof aiConversation.$inferInsert;

export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;
