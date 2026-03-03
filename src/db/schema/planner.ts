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

import { user } from "./auth";

// ============================================
// PLANNERINATOR ENUMS
// ============================================

export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done", "cancelled"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);
export const eventCalendarTypeEnum = pgEnum("event_calendar_type", [
  "personal",
  "work",
  "family",
  "other",
]);
export const noteTypeEnum = pgEnum("note_type", [
  "note",
  "document",
  "research",
  "idea",
  "snippet",
]);
export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "on_hold",
  "completed",
  "archived",
  "cancelled",
]);
export const entityTypeEnum = pgEnum("entity_type", [
  "task",
  "event",
  "note",
  "project",
  "collection_item",
]);
export const linkRelationshipEnum = pgEnum("link_relationship", [
  "assigned_to",
  "related_to",
  "documented_by",
  "scheduled_as",
  "blocks",
  "depends_on",
  "references",
  "inspired_by",
]);
export const activityActionEnum = pgEnum("activity_action", [
  "create",
  "update",
  "delete",
  "restore",
]);
export const sharePermissionEnum = pgEnum("share_permission", ["view", "comment", "edit"]);

// ============================================
// PLANNERINATOR CORE ENTITIES
// ============================================

export const task = pgTable(
  "task",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),

    dueDate: timestamp("due_date", { withTimezone: true }),
    startDate: timestamp("start_date", { withTimezone: true }),
    duration: integer("duration"),

    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium"),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentTaskId: uuid("parent_task_id").references((): any => task.id, { onDelete: "cascade" }),

    position: integer("position").default(0),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_tasks_user_id").on(table.userId),
    index("idx_tasks_project_id").on(table.projectId),
    index("idx_tasks_status").on(table.status),
    index("idx_tasks_due_date").on(table.dueDate),
    index("idx_tasks_parent").on(table.parentTaskId),
    index("idx_tasks_archived").on(table.archivedAt),
    index("idx_tasks_deleted").on(table.deletedAt),
  ]
);

export const event = pgTable(
  "event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),

    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    allDay: boolean("all_day").default(false).notNull(),

    location: text("location"),
    locationUrl: text("location_url"),

    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentEventId: uuid("parent_event_id").references((): any => event.id, {
      onDelete: "cascade",
    }),

    calendarType: eventCalendarTypeEnum("calendar_type").default("personal").notNull(),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_events_user_id").on(table.userId),
    index("idx_events_start_time").on(table.startTime),
    index("idx_events_project_id").on(table.projectId),
    index("idx_events_parent").on(table.parentEventId),
    index("idx_events_calendar_type").on(table.calendarType),
    index("idx_events_archived").on(table.archivedAt),
    index("idx_events_deleted").on(table.deletedAt),
  ]
);

export const note = pgTable(
  "note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title"),
    content: text("content"),

    type: noteTypeEnum("type").default("note").notNull(),

    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentNoteId: uuid("parent_note_id").references((): any => note.id, { onDelete: "cascade" }),

    isFavorite: boolean("is_favorite").default(false).notNull(),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_notes_user_id").on(table.userId),
    index("idx_notes_type").on(table.type),
    index("idx_notes_project_id").on(table.projectId),
    index("idx_notes_parent").on(table.parentNoteId),
    index("idx_notes_archived").on(table.archivedAt),
    index("idx_notes_deleted").on(table.deletedAt),
  ]
);

export const project = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    status: projectStatusEnum("status").default("active").notNull(),

    startDate: date("start_date"),
    endDate: date("end_date"),

    color: text("color").default("#3b82f6").notNull(),
    icon: text("icon"),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentProjectId: uuid("parent_project_id").references((): any => project.id, {
      onDelete: "set null",
    }),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_projects_user_id").on(table.userId),
    index("idx_projects_status").on(table.status),
    index("idx_projects_parent").on(table.parentProjectId),
    index("idx_projects_archived").on(table.archivedAt),
    index("idx_projects_deleted").on(table.deletedAt),
  ]
);

// ============================================
// PLANNERINATOR COLLECTIONS
// ============================================

export const collection = pgTable(
  "collection",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    icon: text("icon"),

    schema: jsonb("schema").default({ fields: [] }).notNull(),

    settings: jsonb("settings").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_collections_user_id").on(table.userId)]
);

export const collectionItem = pgTable(
  "collection_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collection.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    data: jsonb("data").default({}).notNull(),

    position: integer("position").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_collection_items_collection").on(table.collectionId),
    index("idx_collection_items_user").on(table.userId),
  ]
);

// ============================================
// PLANNERINATOR UNIVERSAL FEATURES
// ============================================

export const link = pgTable(
  "link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    fromType: entityTypeEnum("from_type").notNull(),
    fromId: uuid("from_id").notNull(),

    toType: entityTypeEnum("to_type").notNull(),
    toId: uuid("to_id").notNull(),

    relationship: linkRelationshipEnum("relationship").notNull(),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_links_from").on(table.fromType, table.fromId),
    index("idx_links_to").on(table.toType, table.toId),
    index("idx_links_user").on(table.userId),
  ]
);

export const tag = pgTable(
  "tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    color: text("color").default("#6b7280").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_tags_user").on(table.userId)]
);

export const entityTag = pgTable(
  "entity_tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_entity_tags_entity").on(table.entityType, table.entityId),
    index("idx_entity_tags_tag").on(table.tagId),
    index("idx_entity_tags_user").on(table.userId),
  ]
);

export const comment = pgTable(
  "comment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    content: text("content").notNull(),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentCommentId: uuid("parent_comment_id").references((): any => comment.id, {
      onDelete: "cascade",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_comments_entity").on(table.entityType, table.entityId),
    index("idx_comments_user").on(table.userId),
    index("idx_comments_parent").on(table.parentCommentId),
  ]
);

export const attachment = pgTable(
  "attachment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),

    storageKey: text("storage_key").notNull().unique(),
    storageUrl: text("storage_url"),

    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_attachments_entity").on(table.entityType, table.entityId),
    index("idx_attachments_user").on(table.userId),
    index("idx_attachments_storage_key").on(table.storageKey),
  ]
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    action: activityActionEnum("action").notNull(),

    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    changes: jsonb("changes"),

    snapshot: jsonb("snapshot"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_activity_user_time").on(table.userId, table.createdAt),
    index("idx_activity_entity").on(table.entityType, table.entityId),
  ]
);

// ============================================
// PLANNER TYPE EXPORTS
// ============================================

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;

export type Note = typeof note.$inferSelect;
export type NewNote = typeof note.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type Collection = typeof collection.$inferSelect;
export type NewCollection = typeof collection.$inferInsert;
export type CollectionItem = typeof collectionItem.$inferSelect;
export type NewCollectionItem = typeof collectionItem.$inferInsert;

export type Link = typeof link.$inferSelect;
export type NewLink = typeof link.$inferInsert;

export type Tag = typeof tag.$inferSelect;
export type NewTag = typeof tag.$inferInsert;
export type EntityTag = typeof entityTag.$inferSelect;
export type NewEntityTag = typeof entityTag.$inferInsert;

export type Comment = typeof comment.$inferSelect;
export type NewComment = typeof comment.$inferInsert;

export type Attachment = typeof attachment.$inferSelect;
export type NewAttachment = typeof attachment.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;
