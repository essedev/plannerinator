import {
  pgTable,
  text,
  bigint,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";

// ============================================
// AUTHENTICATION TABLES (Better Auth)
// ============================================
// Generated with: npx @better-auth/cli generate
// Naming convention: snake_case for all columns (PostgreSQL best practice)

/**
 * User role enum for RBAC system
 *
 * Roles hierarchy:
 * - user: Basic authenticated user (default)
 * - admin: Full system access (can manage users and system settings)
 *
 * See docs/RBAC.md for complete permission mapping
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

/**
 * User table (managed by Better Auth)
 *
 * Core authentication table with user credentials and profile information.
 * Better Auth automatically manages authentication flows (sign up, sign in, password reset).
 *
 * Custom fields:
 * - role: RBAC role (user/admin) - managed via Better Auth additionalFields
 *
 * Relations:
 * - sessions: Active user sessions
 * - accounts: OAuth provider accounts (if using social login)
 *
 * Security notes:
 * - Passwords hashed with PBKDF2 (100k iterations) via custom implementation
 * - role field has input: false (can't be set on sign up, must be changed by admin)
 *
 * @see docs/AUTHENTICATION.md for auth system details
 * @see docs/RBAC.md for role management
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  // Storage quota for attachments
  storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" })
    .default(1073741824) // 1GB default
    .notNull(),
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).default(0).notNull(),
});

/**
 * Session table (managed by Better Auth)
 *
 * Tracks active user sessions with JWT tokens.
 * Better Auth automatically handles session expiration and renewal.
 *
 * Security features:
 * - HttpOnly cookies (XSS protection)
 * - 5-minute cookie cache for performance
 * - IP address and user agent tracking for security auditing
 *
 * Session lifecycle:
 * 1. Created on successful sign in
 * 2. Token stored in HttpOnly cookie
 * 3. Automatically cleaned up on expiration
 * 4. Cascade deleted when user is deleted
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

/**
 * Account table (managed by Better Auth)
 *
 * Stores OAuth provider accounts linked to users.
 * Supports multiple providers per user (e.g., GitHub + Google).
 *
 * Provider support:
 * - Email/password (stored in account.password field)
 * - OAuth providers (GitHub, Google, etc.) - tokens stored here
 *
 * Token management:
 * - access_token: OAuth access token
 * - refresh_token: OAuth refresh token (for token renewal)
 * - Token expiration tracked for automatic renewal
 *
 * Security:
 * - Cascade delete when user is removed
 * - Tokens encrypted at rest (database-level encryption recommended)
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Verification table (managed by Better Auth)
 *
 * Stores verification tokens for:
 * 1. Email verification (on sign up)
 * 2. Password reset requests
 *
 * Token lifecycle:
 * - Created when verification email is sent
 * - Single-use (deleted after successful verification)
 * - Expires after configured time (default: 1 hour for password reset)
 *
 * Security:
 * - Cryptographically random tokens
 * - Time-limited expiration
 * - Automatic cleanup of expired tokens
 *
 * @see src/lib/emails/auth-emails.ts for email sending
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Rate Limit table (managed by Better Auth)
 *
 * Database-backed rate limiting for edge compatibility.
 * Prevents brute force attacks and API abuse.
 *
 * Configuration (src/lib/auth.ts):
 * - window: 60 seconds
 * - max: 100 requests per window
 * - storage: "database" (works in Cloudflare Workers)
 *
 * Why database storage:
 * - Edge-compatible (no in-memory state needed)
 * - Distributed rate limiting across multiple workers
 * - Persistent across deployments
 *
 * Performance:
 * - Indexed on 'key' for fast lookups
 * - Automatic cleanup of old entries
 */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});

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

/**
 * Tasks table
 *
 * Things to do, with or without deadlines, assignable to projects, linkable to notes/events.
 *
 * Core fields: title, description, due date, duration, status, priority, subtasks
 * JSONB metadata for custom fields like recurring patterns, difficulty, time tracking
 *
 * Relations:
 * - user: Owner of the task
 * - project: Optional project assignment
 * - parent_task: For subtasks hierarchy
 * - links: Universal linking to other entities
 * - tags: Via entity_tags join table
 * - comments: Discussion threads
 */
export const task = pgTable(
  "task",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Core fields
    title: text("title").notNull(),
    description: text("description"),

    // Scheduling
    dueDate: timestamp("due_date", { withTimezone: true }),
    startDate: timestamp("start_date", { withTimezone: true }),
    duration: integer("duration"), // minutes

    // Status & Priority
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium"),

    // Completion
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Organization
    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentTaskId: uuid("parent_task_id").references((): any => task.id, { onDelete: "cascade" }),

    // Ordering
    position: integer("position").default(0),

    // Custom metadata
    metadata: jsonb("metadata").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete & Archive
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

/**
 * Events table
 *
 * Time-based events, viewable in calendar or list format.
 *
 * Core fields: title, description, start/end time, location, all-day flag, calendar type
 * JSONB metadata for meeting links, attendees, recurring patterns, custom colors
 *
 * Relations:
 * - user: Owner of the event
 * - project: Optional project assignment
 * - parent_event: For sub-events hierarchy (e.g., conference → session)
 * - links: Universal linking to other entities
 * - tags: Via entity_tags join table
 * - comments: Discussion threads
 */
export const event = pgTable(
  "event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Core fields
    title: text("title").notNull(),
    description: text("description"),

    // Timing
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    allDay: boolean("all_day").default(false).notNull(),

    // Location
    location: text("location"),
    locationUrl: text("location_url"),

    // Organization
    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentEventId: uuid("parent_event_id").references((): any => event.id, { onDelete: "cascade" }),

    // Calendar
    calendarType: eventCalendarTypeEnum("calendar_type").default("personal").notNull(),

    // Custom metadata
    metadata: jsonb("metadata").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete & Archive
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

/**
 * Notes table
 *
 * Notes, documents, research, knowledge base with markdown support.
 *
 * Core fields: title, content (markdown), type (note/document/research/idea)
 * JSONB metadata for source URLs, authors, reading time, highlights, related content
 *
 * Relations:
 * - user: Owner of the note
 * - project: Optional project assignment
 * - parent_note: For nested notes
 * - links: Universal linking to other entities
 * - tags: Via entity_tags join table
 * - comments: Discussion threads
 */
export const note = pgTable(
  "note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Core fields
    title: text("title"),
    content: text("content"),

    // Type
    type: noteTypeEnum("type").default("note").notNull(),

    // Organization
    projectId: uuid("project_id").references(() => project.id, { onDelete: "set null" }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentNoteId: uuid("parent_note_id").references((): any => note.id, { onDelete: "cascade" }),

    // Favorites
    isFavorite: boolean("is_favorite").default(false).notNull(),

    // Custom metadata
    metadata: jsonb("metadata").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete & Archive
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

/**
 * Projects table
 *
 * Logical containers to organize tasks, events, and notes.
 *
 * Core fields: name, description, status, dates, color, icon
 * JSONB metadata for client info, budget, hours tracking, external links
 *
 * Relations:
 * - user: Owner of the project
 * - parent_project: For sub-projects
 * - tasks: Tasks assigned to this project
 * - events: Events assigned to this project
 * - notes: Notes assigned to this project
 * - tags: Via entity_tags join table
 * - comments: Discussion threads
 */
export const project = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Core fields
    name: text("name").notNull(),
    description: text("description"),

    // Status
    status: projectStatusEnum("status").default("active").notNull(),

    // Timeline
    startDate: date("start_date"),
    endDate: date("end_date"),

    // Visual
    color: text("color").default("#3b82f6").notNull(),
    icon: text("icon"),

    // Organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentProjectId: uuid("parent_project_id").references((): any => project.id, {
      onDelete: "set null",
    }),

    // Custom metadata
    metadata: jsonb("metadata").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete & Archive
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

/**
 * Collections table
 *
 * Custom lists with user-definable schemas (e.g., freelance services, books, clients).
 * Schema editor: Visual builder for defining custom fields per collection.
 *
 * Schema structure defines fields with types, labels, validation rules.
 * Settings for display options, sorting, filtering.
 *
 * Relations:
 * - user: Owner of the collection
 * - collection_items: Items in this collection
 */
export const collection = pgTable(
  "collection",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Core fields
    name: text("name").notNull(),
    description: text("description"),

    // Icon
    icon: text("icon"),

    // Schema definition (JSON Schema for fields)
    schema: jsonb("schema").default({ fields: [] }).notNull(),

    // Settings (display, sorting, etc.)
    settings: jsonb("settings").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_collections_user_id").on(table.userId)]
);

/**
 * Collection Items table
 *
 * Individual items in a collection, with data conforming to the collection's schema.
 * Data is stored as JSONB for maximum flexibility.
 *
 * Relations:
 * - collection: Parent collection
 * - user: Owner of the item
 * - links: Universal linking to other entities
 * - tags: Via entity_tags join table
 * - comments: Discussion threads
 */
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

    // Data based on collection schema
    data: jsonb("data").default({}).notNull(),

    // Position for manual ordering
    position: integer("position").default(0).notNull(),

    // Timestamps
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

/**
 * Links table
 *
 * Universal linking system connecting any entity to any other.
 * Enables relationships like: task → project, task → note, note → event, etc.
 *
 * Relationship types define the semantic meaning of the connection:
 * - assigned_to: Entity belongs to a container (task → project)
 * - related_to: Generic relationship
 * - documented_by: Entity has documentation (task → note)
 * - scheduled_as: Planned as event (task → event)
 * - blocks/depends_on: Task dependencies
 * - references: Note references something
 * - inspired_by: Creative connections
 *
 * Relations:
 * - user: Owner of the link
 * - from/to: Polymorphic references to any entity type
 */
export const link = pgTable(
  "link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Source entity
    fromType: entityTypeEnum("from_type").notNull(),
    fromId: uuid("from_id").notNull(),

    // Target entity
    toType: entityTypeEnum("to_type").notNull(),
    toId: uuid("to_id").notNull(),

    // Relationship type
    relationship: linkRelationshipEnum("relationship").notNull(),

    // Metadata about the relationship
    metadata: jsonb("metadata").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_links_from").on(table.fromType, table.fromId),
    index("idx_links_to").on(table.toType, table.toId),
    index("idx_links_user").on(table.userId),
  ]
);

/**
 * Tags table
 *
 * User-defined tags for flexible organization.
 * Tags have names and colors for visual categorization.
 *
 * Relations:
 * - user: Owner of the tag
 * - entity_tags: Many-to-many with entities
 */
export const tag = pgTable(
  "tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Tag info
    name: text("name").notNull(),
    color: text("color").default("#6b7280").notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_tags_user").on(table.userId)]
);

/**
 * Entity Tags table
 *
 * Join table connecting tags to any entity type (tasks, events, notes, projects, collection items).
 * Enables many-to-many relationship between tags and entities.
 *
 * Relations:
 * - user: Owner of the tag assignment
 * - tag: The tag being assigned
 * - entity: Polymorphic reference to any entity
 */
export const entityTag = pgTable(
  "entity_tag",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Entity reference
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Tag reference
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_entity_tags_entity").on(table.entityType, table.entityId),
    index("idx_entity_tags_tag").on(table.tagId),
    index("idx_entity_tags_user").on(table.userId),
  ]
);

/**
 * Comments table
 *
 * Discussion threads on any entity (tasks, events, notes, projects, collection items).
 * Supports nested comments for threaded discussions.
 *
 * Relations:
 * - user: Comment author
 * - entity: Polymorphic reference to any entity
 * - parent_comment: For threaded replies
 */
export const comment = pgTable(
  "comment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Entity reference
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Comment content
    content: text("content").notNull(),

    // Nested comments (replies)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentCommentId: uuid("parent_comment_id").references((): any => comment.id, {
      onDelete: "cascade",
    }),

    // Timestamps
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

/**
 * Attachments table
 *
 * File attachments for any entity (tasks, events, notes, projects, collection items, comments).
 * Files are stored in Cloudflare R2 with metadata tracked in PostgreSQL.
 *
 * Supported entities:
 * - task, event, note, project, collection_item, comment
 *
 * Storage strategy:
 * - Files stored in R2 bucket with unique keys
 * - Per-user storage quota enforced (default 1GB)
 * - Signed URLs for secure access
 *
 * Relations:
 * - user: Owner of the attachment
 * - entity: Polymorphic reference to any entity
 */
export const attachment = pgTable(
  "attachment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Entity reference (polymorphic)
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // File metadata
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(), // bytes
    mimeType: text("mime_type").notNull(),

    // R2 Storage
    storageKey: text("storage_key").notNull().unique(), // R2 object key
    storageUrl: text("storage_url"), // Public URL (if using public bucket)

    // Custom metadata (e.g., dimensions for images, duration for videos)
    metadata: jsonb("metadata").default({}).notNull(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_attachments_entity").on(table.entityType, table.entityId),
    index("idx_attachments_user").on(table.userId),
    index("idx_attachments_storage_key").on(table.storageKey),
  ]
);

/**
 * Activity Log table
 *
 * Tracks all changes for timeline and audit trail.
 * Future: Enable undo functionality with snapshots.
 *
 * Action types:
 * - create: New entity created
 * - update: Entity modified (changes field contains JSON diff)
 * - delete: Entity deleted (snapshot for restore)
 * - restore: Previously deleted entity restored
 *
 * Relations:
 * - user: User who performed the action
 * - entity: Polymorphic reference to any entity
 */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Action info
    action: activityActionEnum("action").notNull(),

    // Entity reference
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Changes (JSON diff for updates)
    changes: jsonb("changes"),

    // Snapshot (full state for undo)
    snapshot: jsonb("snapshot"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_activity_user_time").on(table.userId, table.createdAt),
    index("idx_activity_entity").on(table.entityType, table.entityId),
  ]
);

// ============================================
// AI ASSISTANT TABLES
// ============================================

/**
 * AI Conversations table
 *
 * Stores chat conversations with the AI assistant.
 * Each conversation maintains message history for context.
 *
 * Features:
 * - Persistent conversation history
 * - Auto-generated titles from first message
 * - Messages stored as JSONB array
 *
 * Message format:
 * {
 *   id: string,
 *   role: "user" | "assistant",
 *   content: string,
 *   timestamp: string,
 *   toolsUsed?: Array<{ name: string, result: any }>
 * }
 *
 * Relations:
 * - user: Owner of the conversation
 * - aiUsage: Token usage records for this conversation
 */
export const aiConversation = pgTable(
  "ai_conversation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Auto-generated from first message or user-provided
    title: text("title"),

    // Array of message objects
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

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_ai_conversations_user").on(table.userId, table.updatedAt)]
);

/**
 * AI Usage table
 *
 * Tracks token usage for AI interactions.
 * Used for analytics and rate limiting.
 *
 * Relations:
 * - user: User who initiated the request
 * - conversation: Associated conversation (optional)
 */
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

    // Token counts
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),

    // Model identifier
    model: text("model").notNull().default("anthropic/claude-haiku-4.5"),

    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_usage_user").on(table.userId, table.createdAt),
    index("idx_ai_usage_conversation").on(table.conversationId),
  ]
);

/**
 * AI Log table
 *
 * Comprehensive logging for AI assistant operations.
 * Tracks tool calls, database queries, errors, and debugging information.
 *
 * Log levels:
 * - DEBUG: Detailed debugging information (DB queries, API calls)
 * - INFO: General informational messages (tool calls, search results)
 * - WARNING: Warning messages (failed operations, missing data)
 * - ERROR: Error messages (exceptions, failures)
 *
 * Usage:
 * - Development: Always enabled for debugging
 * - Production: Optional, can be enabled via AI_DB_LOGGING_ENABLED env var
 *
 * Relations:
 * - user: User who triggered the operation
 * - conversation: Associated conversation (if applicable)
 */
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

    // Log level
    level: text("level").notNull(), // DEBUG | INFO | WARNING | ERROR

    // Log message
    message: text("message").notNull(),

    // Additional context (tool inputs, query results, etc.)
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Timestamp
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_log_user").on(table.userId, table.createdAt),
    index("idx_ai_log_conversation").on(table.conversationId),
    index("idx_ai_log_level").on(table.level, table.createdAt),
  ]
);

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

export const healthGoalStatusEnum = pgEnum("health_goal_status", [
  "active",
  "paused",
  "completed",
  "abandoned",
]);

// ============================================
// HEALTH / SALUTE TABLES
// ============================================

/**
 * Supplement Protocols table
 *
 * A protocol groups related supplements (e.g., "Morning Stack", "Winter Protocol").
 * Protocols can be toggled active/inactive and have optional date ranges.
 */
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

/**
 * Supplements table
 *
 * Individual supplements within a protocol.
 * Tracks name, brand, dosage, frequency, and time of day.
 */
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
    timeOfDay: text("time_of_day"), // "morning", "afternoon", "evening", or custom
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

/**
 * Body Metrics table
 *
 * Tracks body measurements over time (weight, body fat, blood pressure, etc.).
 * Uses text for metricType and value to support diverse measurement types.
 */
export const bodyMetric = pgTable(
  "body_metric",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    metricType: text("metric_type").notNull(), // "weight", "body_fat", "blood_pressure", etc.
    value: text("value").notNull(), // stored as text for flexibility (e.g., "120/80")
    unit: text("unit"), // "kg", "%", "mmHg", etc.
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

/**
 * Health Profile table
 *
 * Singleton per user — stores static health information.
 * Uses unique constraint on userId to enforce one-per-user.
 */
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
    height: text("height"), // in cm, stored as text
    allergies: jsonb("allergies").default([]),
    conditions: jsonb("conditions").default([]),
    sleepTarget: text("sleep_target"), // e.g., "8h"
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

/**
 * Health Goals table
 *
 * Track health-related goals with progress and deadlines.
 * Supports various categories (weight, fitness, nutrition, etc.).
 */
export const healthGoal = pgTable(
  "health_goal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),
    category: text("category"), // "weight", "fitness", "nutrition", "sleep", etc.
    targetValue: text("target_value"),
    targetUnit: text("target_unit"),
    currentValue: text("current_value"),
    metricType: text("metric_type"), // links to bodyMetric.metricType for auto-tracking
    status: healthGoalStatusEnum("status").default("active").notNull(),
    startDate: date("start_date"),
    targetDate: date("target_date"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_health_goal_user").on(table.userId),
    index("idx_health_goal_status").on(table.status),
    index("idx_health_goal_deleted").on(table.deletedAt),
  ]
);

// ============================================
// FUTURE TABLES
// ============================================

/**
 * Shares table (Future - Phase 4: Collaboration)
 *
 * Entity sharing with other users.
 * Will be implemented in Phase 4 of the roadmap.
 *
 * Planned features:
 * - Share entities with specific users
 * - Permission levels (view, comment, edit)
 * - Expiration dates for temporary shares
 * - Email invites for non-users
 */

// ============================================
// TYPE EXPORTS
// ============================================
// Drizzle-inferred types for type-safe queries and mutations

/**
 * Authentication types
 */
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

/**
 * Task types
 */
export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

/**
 * Event types
 */
export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;

/**
 * Note types
 */
export type Note = typeof note.$inferSelect;
export type NewNote = typeof note.$inferInsert;

/**
 * Project types
 */
export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

/**
 * Collection types
 */
export type Collection = typeof collection.$inferSelect;
export type NewCollection = typeof collection.$inferInsert;
export type CollectionItem = typeof collectionItem.$inferSelect;
export type NewCollectionItem = typeof collectionItem.$inferInsert;

/**
 * Link types
 */
export type Link = typeof link.$inferSelect;
export type NewLink = typeof link.$inferInsert;

/**
 * Tag types
 */
export type Tag = typeof tag.$inferSelect;
export type NewTag = typeof tag.$inferInsert;
export type EntityTag = typeof entityTag.$inferSelect;
export type NewEntityTag = typeof entityTag.$inferInsert;

/**
 * Comment types
 */
export type Comment = typeof comment.$inferSelect;
export type NewComment = typeof comment.$inferInsert;

/**
 * Attachment types
 */
export type Attachment = typeof attachment.$inferSelect;
export type NewAttachment = typeof attachment.$inferInsert;

/**
 * Activity Log types
 */
export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

/**
 * AI Conversation types
 */
export type AiConversation = typeof aiConversation.$inferSelect;
export type NewAiConversation = typeof aiConversation.$inferInsert;

/**
 * AI Usage types
 */
export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;

/**
 * Health / Salute types
 */
export type SupplementProtocol = typeof supplementProtocol.$inferSelect;
export type NewSupplementProtocol = typeof supplementProtocol.$inferInsert;
export type Supplement = typeof supplement.$inferSelect;
export type NewSupplement = typeof supplement.$inferInsert;
export type BodyMetric = typeof bodyMetric.$inferSelect;
export type NewBodyMetric = typeof bodyMetric.$inferInsert;
export type HealthProfile = typeof healthProfile.$inferSelect;
export type NewHealthProfile = typeof healthProfile.$inferInsert;
export type HealthGoal = typeof healthGoal.$inferSelect;
export type NewHealthGoal = typeof healthGoal.$inferInsert;
