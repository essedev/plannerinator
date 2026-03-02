# Plannerinator - Codebase Analysis

> Generated: March 2026
> Version: 0.19.0

## Project Overview

Plannerinator is a full-stack productivity app built with Next.js 16 (App Router), Drizzle ORM, Neon PostgreSQL, and Cloudflare R2 for file storage. It provides task, event, note, and project management with an AI assistant powered by Claude via OpenRouter.

---

## Architecture

### Tech Stack

| Layer     | Technology                                                   |
| --------- | ------------------------------------------------------------ |
| Framework | Next.js 16.1 (App Router, Server Components, Server Actions) |
| UI        | React 19, Radix UI, Tailwind CSS 4, Shadcn/ui                |
| Database  | Neon PostgreSQL (serverless)                                 |
| ORM       | Drizzle ORM 0.45                                             |
| Auth      | Better Auth 1.5                                              |
| Storage   | Cloudflare R2 (S3-compatible)                                |
| Email     | Resend + React Email                                         |
| Forms     | React Hook Form + Zod 4                                      |
| AI        | OpenRouter (Claude 3.5 Haiku)                                |
| Deploy    | Cloudflare Workers (OpenNext)                                |

### Directory Structure

```
src/
├── app/                     # Next.js routes & layouts
│   ├── api/auth/            # Better Auth API route
│   ├── auth/                # Auth pages (login, register, etc.)
│   └── dashboard/           # Protected routes
│       ├── tasks/           # Task pages (list, detail, create, edit)
│       ├── events/          # Event pages
│       ├── notes/           # Note pages
│       ├── projects/        # Project pages
│       ├── tags/            # Tag management
│       ├── trash/           # Soft-deleted items
│       ├── users/           # Admin user management
│       └── profile/         # User profile
│
├── components/
│   ├── ui/                  # Shadcn/ui primitives
│   ├── common/              # Shared: ConfirmDialog, etc.
│   ├── dashboard/           # Dashboard-specific widgets
│   ├── tasks/               # TaskCard, KanbanBoard, TaskForm
│   ├── events/              # EventCard, EventCalendar, EventForm
│   ├── notes/               # NoteCard, NoteForm
│   ├── projects/            # ProjectCard, ProjectForm
│   ├── comments/            # CommentSection, CommentForm
│   ├── attachments/         # AttachmentList, AttachmentUpload
│   ├── links/               # EntityLinks, LinkForm
│   ├── tags/                # TagSelector, TagBadge
│   └── layout/              # Navbar, Footer, Sidebar
│
├── features/                # Domain business logic (server actions)
│   ├── tasks/               # actions.ts, schema.ts
│   ├── events/              # actions.ts, schema.ts
│   ├── notes/               # actions.ts, schema.ts
│   ├── projects/            # actions.ts, schema.ts
│   ├── tags/                # actions.ts, schema.ts, queries.ts
│   ├── comments/            # actions.ts, schema.ts
│   ├── links/               # actions.ts, schema.ts, queries.ts, helpers.ts
│   ├── attachments/         # actions.ts, schema.ts, queries.ts
│   ├── users/               # actions.ts, schema.ts
│   ├── profile/             # actions.ts, schema.ts, EditProfileForm.tsx
│   ├── auth/                # actions.ts (empty), schema.ts
│   ├── ai/                  # actions.ts, tool-handlers.ts
│   ├── trash/               # queries.ts
│   └── search/              # queries.ts
│
├── db/
│   ├── index.ts             # DB client (HTTP + WebSocket/transaction)
│   ├── schema.ts            # All table definitions
│   └── seed/                # Dev seeding scripts
│
├── lib/
│   ├── errors.ts            # Structured error codes & AppError class
│   ├── error-handler.ts     # Client-side error display (toast)
│   ├── entity-helpers.ts    # Shared CRUD helpers (validate, check, delete)
│   ├── colors.ts            # Centralized badge color constants
│   ├── auth.ts              # Auth utilities
│   ├── dates.ts             # Date formatting
│   ├── labels.ts            # Enum label mappings
│   ├── r2-client.ts         # Cloudflare R2 S3 client
│   └── ai/                  # AI utilities (prompts, functions, logger)
│
├── hooks/
│   └── use-entity-actions.ts # Shared card action logic
│
└── types/
    └── auth.d.ts            # Auth type extensions
```

### Data Model

Four core entities (task, event, note, project) share a common pattern:

- `userId` ownership
- Soft delete via `deletedAt`
- Archive via `archivedAt`
- Metadata JSON field
- Polymorphic relations: tags (`entityTag`), comments, links, attachments

Cross-cutting tables:

- `entityTag` — many-to-many entity ↔ tag
- `comment` — polymorphic comments on any entity
- `link` — bidirectional entity linking with relationship types
- `attachment` — file attachments stored in R2

---

## Patterns & Conventions

### Server Actions

All mutations go through Next.js Server Actions in `src/features/*/actions.ts`:

1. Validate session
2. Parse input with Zod via `parseInput()`
3. Perform DB operation
4. Revalidate Next.js cache
5. Return data directly (or throw `AppError`)

### Error Handling

Structured error system (`src/lib/errors.ts`):

- `ErrorCode` constants mapped to HTTP status codes
- `AppError` class with code, message, details
- `errors.*` factory functions for common scenarios
- `parseInput()` wrapper for Zod validation
- Client-side `handleActionError()` for toast display

### Entity Helpers

`src/lib/entity-helpers.ts` provides shared operations:

- `validateSession()` — throws `errors.unauthorized()`
- `checkOwnership()` — throws `errors.notFound()`
- `softDeleteEntity()` / `hardDeleteEntity()` / `restoreEntityFromTrash()`
- `archiveEntity()` / `restoreArchivedEntity()`
- `copyEntityTags()` — for duplication
- `revalidateEntityPaths()` — cache invalidation

### Database Transactions

Dual-driver setup in `src/db/index.ts`:

- HTTP driver (`neon()`) for regular queries (fast, stateless)
- WebSocket driver (`Pool`) for transactions via `withTransaction()`
- Used in `hardDeleteEntity()` for atomic multi-table deletes

### UI Color System

Centralized in `src/lib/colors.ts`:

- `TASK_PRIORITY_COLORS` — low, medium, high, urgent
- `TASK_STATUS_COLORS` — todo, in_progress, done, cancelled
- `EVENT_CALENDAR_TYPE_COLORS` — personal, work, family, other
- `PROJECT_STATUS_COLORS` — active, on_hold, completed, archived, cancelled
- `NOTE_TYPE_COLORS` — note, document, research, idea, snippet
- `COMMON_COLORS` — archived, favorite, allDay badges

### Card Components

Entity cards (TaskCard, EventCard, NoteCard, ProjectCard) use:

- `useEntityActions()` hook for delete/archive/restore/duplicate logic
- `EntityCardMenu` for standardized dropdown menus
- `handleActionError()` for error display

---

## Comparison with Yellow-Allocation

| Aspect          | Plannerinator                      | Yellow-Allocation     |
| --------------- | ---------------------------------- | --------------------- |
| Error handling  | `AppError` + `ErrorCode`           | Same pattern (origin) |
| Transactions    | `withTransaction()` via WS Pool    | Same pattern (origin) |
| Response format | Return data directly / throw       | Same                  |
| Validation      | `parseInput()` wrapper             | Same                  |
| Auth            | Better Auth (session)              | Better Auth (session) |
| DB              | Neon HTTP + WS                     | Neon HTTP + WS        |
| Entity helpers  | Centralized in `entity-helpers.ts` | Similar pattern       |

---

## Refactoring Completato (Marzo 2026)

### Error Handling Unificato

- Creato `src/lib/errors.ts` con `AppError`, `ErrorCode`, `parseInput()`, factory `errors.*`
- Creato `src/lib/error-handler.ts` con `handleActionError()` per toast client-side
- Rimosso `handleEntityError()` da `entity-helpers.ts`
- Rifattorizzati tutti i file `features/*/actions.ts` (tasks, events, notes, projects, tags, comments, links, attachments, users, profile): le action restituiscono l'entità direttamente o lanciano `AppError`, eliminando il pattern `{ success, entity }`
- Aggiornati tutti i consumer frontend (form, card, tag components, AI tool-handlers) al nuovo formato

### Transazioni DB

- Aggiunto driver WebSocket (`Pool`) a `src/db/index.ts` con `withTransaction()`
- `hardDeleteEntity()` ora esegue le operazioni multi-tabella in transazione atomica

### Deduplicazione UI

- Creato `src/lib/colors.ts` con tutte le costanti colore centralizzate: badge (bg+text), border-left, text-only, solid bg, hex, e default tag color
- Creato `src/hooks/use-entity-actions.ts` con logica condivisa per delete/archive/restore/duplicate
- Creato `src/components/common/EntityCardMenu.tsx` per dropdown menu standardizzato
- Rifattorizzati TaskCard, EventCard, NoteCard, ProjectCard per usare hook e componenti condivisi
- Rimosse costanti colore inline da KanbanCard, UpcomingDeadlines, TodayView, EventCalendar, e 4 tag components

### Pulizia Generale

- Rimosso parametro `_operation` inutilizzato da `validateSession()`
- Rimossa proprietà `extractEntities` da `ParentEntityCardConfig` e relativi config files
- Semplificati i `parent-actions.ts` per restituire array direttamente

---

## Future Improvements

### HTML Sanitization (Security)

**Risk**: Markdown content and comments are rendered without sanitization, creating potential XSS vectors.

**Current state**:

- `rehype-sanitize` is already in `package.json` but may not be applied in all markdown rendering contexts
- Comment content is rendered as raw text (less risk) but should be verified
- User-provided metadata JSON is stored without schema validation

**Recommended approach**:

- Verify `rehype-sanitize` is used in all `react-markdown` instances
- Add DOMPurify for any `dangerouslySetInnerHTML` usage
- Validate metadata JSON against a schema before storage

### Rate Limiting per Action

**Current state**: Rate limiting exists only at the auth level (100 requests/60 seconds via Better Auth).

**Risk**: Individual server actions (especially AI chat, file upload, bulk operations) have no per-action rate limiting.

**Recommended approach**:

- Add a lightweight rate limiter using Cloudflare KV or in-memory store
- Priority actions to rate limit: `sendAiMessage`, `generateUploadUrl`, `bulkTaskOperation`
- Consider using Next.js middleware for route-level limiting

### Accessibility

**Issues identified**:

- Icon-only buttons (`MoreVertical` trigger) lack `aria-label`
- Form error messages lack `aria-describedby` linking
- Focus management not handled in custom modals (ConfirmDialog uses Radix, which handles this)
- Color contrast not verified for user-defined project colors on badges
- Kanban drag-and-drop lacks keyboard accessibility announcements

**Recommended approach**:

- Audit all `<Button variant="ghost" size="icon">` for `aria-label`
- Add `aria-describedby` to form fields with error states
- Test with screen reader (VoiceOver on macOS)
- Add WCAG AA contrast checking for user-defined colors

### Security Hardening

**Issues identified**:

- Email change in profile update does not require re-verification
- No audit log for admin actions (role changes, user deletions)
- Metadata JSON fields accept arbitrary content (no schema validation)
- Hard delete does not anonymize associated comments/links (leaves orphan references)
- Parent comment validation does not verify the commenter owns the parent entity

**Recommended approach**:

- Require email re-verification on change (send confirmation link)
- Add `auditLog` table for admin actions
- Define metadata JSON schemas per entity type
- Add cascade cleanup or anonymization for hard deletes
- Verify entity ownership when creating threaded comments
