# Changelog

All notable changes to Plannerinator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.23.0] - 2026-03-02

### Changed

- Complete design system overhaul — new brand color palette with orange primary (`#fe5a1d`), hex values replacing oklch throughout light and dark themes
- Brutalist UI style: removed all border-radius and box-shadows globally for sharp, flat aesthetic
- Replaced Geist Mono with Space Mono as the monospace/UI font — applied to headings, buttons, labels, nav, badges, and table headers
- Secondary button variant now uses blue (`#0070bb`) with white text for better visual hierarchy
- `ConditionalLayout` now correctly detects all hub routes (`/dashboard`, `/salute`, `/finanza`) instead of only `/dashboard`
- Updated prose code block styles from `hsl()` to direct CSS variable references

## [0.22.0] - 2026-03-02

### Added

- Hub system with section switcher — app now supports multiple sections (Planner, Salute, Finanza) via `HubSwitcher` dropdown in sidebar
- `src/lib/hub.ts` with `HubId`, `HubConfig`, `hubConfigs`, and `getActiveHub(pathname)` for URL-based section detection
- Route group `src/app/(hub)/` sharing layout, sidebar, breadcrumbs, and AI drawer across all hubs
- **Salute (Health) section** — complete pilot implementation:
  - 5 new database tables: `supplement_protocol`, `supplement`, `body_metric`, `health_profile`, `health_goal` with 2 new enums
  - Feature module `src/features/health/` with 11 server actions, queries with pagination/aggregations, and helper functions (BMI, trends, progress)
  - 8 pages: dashboard with stats, supplement protocols with toggle, body metrics with BMI, daily routine view, health goals with progress tracking
  - 6 client components: `ProtocolToggle`, `AddSupplementForm`, `SupplementRow`, `DeleteProtocolButton`, `LogMetricForm`, `GoalActions`
- 4 new AI tools: `manage_supplement_protocol`, `log_body_metric`, `manage_health_goal`, `query_health_status` (16 total)
- Health context in AI system prompt — active protocols, supplements, weight, and goals displayed bilingually (IT/EN)
- Finanza placeholder page at `/finanza`
- Breadcrumb support for Salute and Finanza sections
- `Switch` UI component (shadcn/ui) for protocol toggle
- `HUB_MIGRATION.md` — reference document for the full migration plan from life-terminal

### Changed

- Sidebar refactored from hardcoded nav items to dynamic navigation driven by `hubConfigs` per active section
- Dashboard pages moved from `src/app/dashboard/` to `src/app/(hub)/dashboard/` (URLs unchanged)
- AI identity prompt updated to include health and supplement monitoring role

### Dependencies

- Added `radix-ui` v1.4.3

## [0.21.0] - 2026-03-02

### Added

- Tool registry pattern (`src/lib/ai/tools/`) with self-contained tool definitions replacing 4 disconnected files
- `defineTool()` helper and `AiToolDefinition<T>` type for type-safe tool creation with Zod schemas as single source of truth
- Shared `resolveEntityId()` and `resolveProjectByName()` utilities eliminating duplicated resolution logic across handlers
- Runtime input validation via Zod `safeParse()` for all AI tool calls (previously unvalidated `as` casts)
- Tag processing in all create tools — `tags` field was declared in schemas but never wired to `assignTagsToEntity()`
- Three missing `get_statistics` metrics: `tasks_completed_this_month`, `project_progress`, `tasks_by_priority`
- Data-driven prompt tools section that auto-generates documentation from each tool's `promptDocs` field

### Fixed

- `create_event` calendar type bug — was hardcoded to invalid `"event"`, now correctly uses `"personal"`
- `overdue_tasks` and `upcoming_events` statistics now exclude soft-deleted entities

### Changed

- AI tool JSON schemas generated automatically from Zod via `z.toJSONSchema()` instead of hand-written 636-line JSON
- Tool dispatch uses O(1) Map lookup with validated input instead of switch/cast pattern
- Prompt tools section is now data-driven from registry — no manual maintenance when adding tools

### Removed

- `src/lib/ai/functions.ts` (636 lines of manual JSON schema definitions)
- `src/features/ai/types.ts` (222 lines of hand-written TypeScript types)
- `src/features/ai/tool-handlers.ts` (1266 lines of switch/cast dispatch)

## [0.20.0] - 2026-03-02

### Added

- Structured error system with typed `AppError` class and factory functions (`errors.unauthorized()`, `errors.notFound()`, etc.) mapping to HTTP status codes
- Client-side error handler (`handleActionError`) displaying structured toast notifications with human-readable titles
- Centralized color constants (`src/lib/colors.ts`) for all entity badges, borders, and status indicators
- Shared `EntityCardMenu` dropdown component replacing duplicated menu code across all entity cards
- `useEntityActions` hook centralizing common card action handlers (delete, duplicate, archive, restore)
- Database transaction support via `withTransaction()` for atomic multi-table operations

### Changed

- Hard delete operations now run inside a database transaction, preventing orphaned data on partial failures
- Server actions return entities directly instead of `{ success: true, entity }` wrapper objects
- All input validation uses `parseInput()` wrapper converting Zod errors into typed `AppError`
- Entity cards (Task, Note, Project, Event) refactored to use shared `EntityCardMenu` and `useEntityActions`
- AI tool handlers updated to match simplified action return shapes
- Tag components and utilities updated for direct-return action pattern
- Updated Next.js to 16.1.6, React to 19.2.4, better-auth to 1.5.0, Tailwind CSS to 4.2.1, and 20+ other dependencies

### Removed

- `handleEntityError` function replaced by structured error propagation to UI layer
- `checkBulkOwnership` stub function (was never implemented)
- Inline color constant objects from all entity card and dashboard components (replaced by centralized module)

## [0.19.0] - 2026-01-16

### Added

**Developer Workflow Commands**

- New `/ship` command - unified workflow combining `/check` + `/changelog` + `/release` for complete releases
- New `/check` command - code quality validation (format, lint, build) with proper error fixing guidelines
- New `/archive-changelog` command - move old changelog versions to archive files when exceeding 1000 lines
- `COMMANDS.md` documentation explaining all available slash commands

**Changelog Management**

- Changelog archive system - older versions (v0.1.0 - v0.10.0) moved to `changelogs/CHANGELOG-2025-archive.md`
- Archive section at bottom of CHANGELOG.md linking to historical versions

### Changed

**Existing Commands Enhanced**

- `/changelog` command now groups dependency updates into 2-3 concise lines instead of listing every package
- `/release` command now suggests running `/archive-changelog` when changelog exceeds 1000 lines

**Code Quality**

- Removed unused `AlertDialogTrigger` import from AppSidebar component
- Code formatting improvements across AI-related files

## [0.18.0] - 2025-12-10

### Added

**AI Conversation History**

- Conversation history dropdown in AI chat header to browse and resume past conversations
- `ConversationHistoryDropdown` component with recent conversations list
- `ConversationList` component for sidebar conversation navigation
- Automatic conversation persistence - new conversations are saved and can be resumed later
- Load conversation messages when selecting a previous conversation

**AI System Prompt Architecture**

- Modular prompt system with dedicated sections (`src/lib/ai/prompts/`)
- Prompt sections for identity, context, rules, tools, dates, examples, conversation, formatting, and guidelines
- `buildSystemPrompt()` function for composable prompt generation
- `createTemporalContext()` for timezone-aware date handling
- `getUserStats()` for including user statistics in AI context
- Type-safe prompt context with `PromptContext` interface

**AI Verbose Logging**

- New environment variable `AI_VERBOSE_LOGGING` for detailed AI debugging
- Verbose logging of full messages sent to AI
- Verbose logging of AI responses (content, tool calls, finish reason)
- Tool call logging with input parameters
- Tool result logging with execution time tracking

### Changed

**AI Assistant Improvements**

- AI chat drawer now persists conversation ID across messages
- New chat button to start fresh conversations
- Removed cost display from chat (simplified UI)
- Improved chat message tool indicator showing whether tools were used or response was direct
- AI responses now use lower temperature (0.2) for more consistent output

**Database Schema**

- Removed `costUsd` column from `ai_usage` table (cost tracking simplified)

**UI/UX Enhancements**

- Sidebar header height standardized to 64px (`h-16`) for visual consistency with AI drawer
- Sidebar colors now use CSS variables referencing main theme colors for better theme integration
- Simplified dark mode CSS by using CSS variables instead of duplicate rules
- Dashboard layout main content now has `min-w-0` to prevent overflow issues
- Logout button now shows confirmation dialog before signing out
- ThemeToggle component now properly handles hydration with useEffect
- Select component trigger now shows pointer cursor
- Sheet close button now shows pointer cursor
- Trash list item title no longer truncates text
- Trash list action buttons have `shrink-0` to prevent squishing

**Code Quality**

- Refactored AI logging configuration with three separate environment variables:
  - `AI_LOGGING_ENABLED` - Basic logging (default: true)
  - `AI_DB_LOGGING_ENABLED` - Database logging (default: false)
  - `AI_VERBOSE_LOGGING` - Detailed debug logs (default: false)

## [0.17.1] - 2025-12-09

### Changed

**Dependencies**

- Updated Next.js to 16.0.8, React to 19.2.1, and 20+ other dependencies
- Major version updates: @react-email/components (1.0.1), vitest (4.0.15)
- Notable updates: better-auth (1.4.6), drizzle-orm (0.45.0), @opennextjs/cloudflare (1.14.4)

**Configuration Improvements**

- Modernized ESLint configuration to use native Next.js config imports instead of @eslint/eslintrc compatibility layer
- Simplified eslint.config.mjs by removing FlatCompat wrapper and using direct imports
- Updated TypeScript configuration with improved paths and module resolution
- Updated next-env.d.ts to use import statement instead of triple-slash reference for better type safety
- Standardized code formatting across configuration files

**Type System Enhancements**

- Improved TypeScript type definitions in cloudflare-env.d.ts with better interface formatting
- Enhanced WorkflowEntrypoint interface formatting for better readability
- Updated type imports in package.json for better type resolution

## [0.17.0] - 2025-11-24

### Added

**AI Assistant Enhancements**

- `query_entities` tool for direct entity listing without text search (list tasks, events, notes, projects with filters and sorting)
- `NoteContentCard` component for note content display with zoom controls
- AI logging system with comprehensive operation tracking (`src/lib/ai/logger.ts`)
- AI log database table for debugging and monitoring AI operations
- Database migration for AI logging schema

**AI Logging Infrastructure**

- Log levels: DEBUG, INFO, WARNING, ERROR
- Tool call and result logging with execution time tracking
- API call and response logging with token usage metrics
- Database query logging for AI operations
- Search operation logging with query and result tracking

### Changed

**AI Assistant Improvements**

- Enhanced AI system prompt with better markdown formatting instructions and examples
- Improved AI chat message markdown rendering with proper heading, blockquote, and list styles
- AI tool handlers now include comprehensive logging for debugging
- AI chat drawer focus management improved (removed focus outline on sheet)

**Form Improvements**

- Date inputs in EventForm, TaskForm, and ProjectForm now have max date validation to prevent invalid dates (max year 9999)

**UI/UX Enhancements**

- Markdown editor preview now has proper top padding for better readability
- MarkdownRenderer component now supports customizable zoom level via `initialZoom` prop
- Chat message bullet lists now use custom styled bullets with better spacing
- Chat message headings (h1, h2, h3) and blockquotes now properly rendered
- Note detail page now uses new `NoteContentCard` component with zoom controls

## [0.16.0] - 2025-11-06

### Added

**AI Assistant Integration**

- AI chat drawer component with conversational interface for natural language interactions
- AI assistant powered by Claude Haiku 4.5 via OpenRouter API
- Conversational AI interface accessible via Cmd+Shift+A keyboard shortcut or header button
- Chat message components with markdown rendering support for rich AI responses
- Token usage tracking and cost calculation for AI API calls
- AI conversation persistence in database with message history
- Tool/function calling support for AI to interact with app data (create tasks, search entities, get statistics)
- AI assistant trigger button in dashboard header with tooltip
- `AiDrawerProvider` context for managing chat drawer state across the app

**AI Backend Infrastructure**

- OpenRouter API integration for Claude model access
- AI conversation database schema with JSONB message storage
- AI usage tracking table for monitoring token consumption and costs
- Server actions for sending AI messages and managing conversations
- Tool handlers for AI function execution (entity operations, search, statistics)
- Type-safe AI function definitions and response handling
- Cost tracking in cents (USD) for precise billing calculations

**AI Components**

- `AiChatDrawer` - Main drawer UI with chat interface
- `AiChatTrigger` - Button component to open AI assistant
- `ChatInput` - Text input with auto-resize and keyboard shortcuts
- `ChatMessage` - Message display with markdown rendering and tool indicators
- `use-ai-drawer` hook for managing drawer open/close state

**Hook Improvements**

- Renamed `useProjectSelection` hook file from PascalCase to kebab-case for consistency
- Renamed attachment preview hooks to kebab-case naming convention

### Changed

**Code Quality & Naming Conventions**

- Migrated hook files to kebab-case naming convention:
  - `useProjectSelection.ts` → `use-project-selection.ts`
  - `useAttachmentPreview.ts` → `use-attachment-preview.ts`
  - `useImagePreview.ts` → `use-image-preview.ts`
  - `usePDFPreview.ts` → `use-pdf-preview.ts`
- Updated all import statements across components to reference new hook file names
- Improved markdown rendering in chat with syntax highlighting for code blocks
- Enhanced chat message styling with proper text color inheritance in both light and dark modes

**Dashboard Layout**

- Dashboard layout now includes AI assistant trigger in header
- Added `AiDrawerProvider` wrapper for AI state management
- Header layout improved with AI chat button positioned in top-right

**Environment Configuration**

- Added OpenRouter API configuration to environment variables
- Updated `.env.example` with AI assistant setup instructions
- Added default Claude Haiku 4.5 model configuration

**Documentation**

- Updated roadmap with AI assistant implementation status
- Removed `.env.local` from repository (moved to gitignore)
- Moved planning documentation to docs folder (ENV_SETUP.md)

**Dependencies**

- Added `rehype-sanitize` (^6.0.0) for secure markdown rendering in AI chat
- Added `react-markdown` and related plugins for chat message formatting

### Removed

- `.env.local` file removed from version control (should remain gitignored)

## [0.15.0] - 2025-11-04

### Added

**Code Reusability - Generic Entity Action Buttons**

- `EntityActionButton` component replacing entity-specific delete and archive button components
- Generic action button supporting both delete and archive operations for all entity types
- Configurable confirmation dialogs with entity-specific messaging
- Centralized loading states and error handling for destructive actions

### Changed

**Component Consolidation**

- Replaced entity-specific delete buttons with generic `EntityActionButton` across all entity detail pages
- Replaced entity-specific archive buttons with generic `EntityActionButton` across all entity detail pages
- Updated entity detail pages (tasks, events, notes, projects) to use consolidated action buttons
- Improved consistency in confirmation dialog messaging across all entity types
- Enhanced error handling with consistent toast notifications for delete and archive operations

**Code Quality**

- Removed code duplication from delete and archive button components (reduced ~500 lines of duplicate code)
- Centralized action button logic in a single reusable component
- Improved maintainability with configuration-based approach for entity-specific behavior
- Better type safety with TypeScript discriminated unions for action types
- Removed unused imports across multiple components for cleaner code

### Removed

- `src/components/tasks/DeleteTaskButton.tsx` (replaced by EntityActionButton)
- `src/components/tasks/ArchiveTaskButton.tsx` (replaced by EntityActionButton)
- `src/components/events/DeleteEventButton.tsx` (replaced by EntityActionButton)
- `src/components/events/ArchiveEventButton.tsx` (replaced by EntityActionButton)
- `src/components/notes/DeleteNoteButton.tsx` (replaced by EntityActionButton)
- `src/components/notes/ArchiveNoteButton.tsx` (replaced by EntityActionButton)
- `src/components/projects/DeleteProjectButton.tsx` (replaced by EntityActionButton)
- `src/components/projects/ArchiveProjectButton.tsx` (replaced by EntityActionButton)
- Removed planning/documentation markdown files moved to docs folder (ENV_SETUP.md, PREVIEW_REFACTORING.md, REFACTORING_PLAN.md)

## [0.14.0] - 2025-10-31

### Added

**PDF Preview Support**

- PDF preview modal with embedded viewer and navigation controls
- `usePDFPreview` hook for managing PDF-specific preview functionality with URL caching
- `PDFPreviewModal` component with download, keyboard shortcuts, and gallery navigation
- PDF preview support integrated into the attachment preview system
- `isPDFMimeType` utility function for PDF type detection

### Changed

**Attachment Preview System**

- Extended preview configuration to support PDF files
- Updated `useAttachmentPreview` hook to handle PDF previews via `usePDFPreview`
- Modified `AttachmentPreviewModal` to render PDF preview modal for PDF files
- Updated `AttachmentThumbnail` to use generic thumbnail for PDFs (icon-based)
- Improved preview type handling to support multiple file types beyond images

### Removed

- Deleted `tsconfig.tsbuildinfo` build artifact from repository

## [0.13.0] - 2025-10-31

### Added

**Attachment Preview System Refactoring**

- `AttachmentThumbnail` component as a generic wrapper for all thumbnail types
- `GenericThumbnail` component for icon-based thumbnails (non-previewable files)
- `AttachmentPreviewModal` component as a generic wrapper for preview modals
- `useAttachmentPreview` hook as a unified interface for all preview types
- Preview configuration system in `preview-config.ts` for managing preview types
- Extensible architecture supporting future preview types (PDF, video, etc.)
- Centralized preview type detection with `canPreview()` and `getPreviewType()` utilities

### Changed

**Attachment System Architecture**

- Refactored attachment preview system to use generic wrapper components
- Replaced direct usage of `ImageThumbnail` with `AttachmentThumbnail` in `AttachmentCard`
- Replaced `ImagePreviewModal` with `AttachmentPreviewModal` in `AttachmentList`
- Extracted file icon and color utilities from `AttachmentCard` to `GenericThumbnail`
- Renamed `isImage` check to `hasPreview` for better semantics
- Improved code organization with clear separation between preview types

**Code Quality**

- Reduced code duplication by centralizing file type detection logic
- Better separation of concerns with dedicated components for each thumbnail type
- Improved maintainability with configuration-based preview type system
- Added comprehensive JSDoc comments explaining extensibility patterns

## [0.12.0] - 2025-10-30

### Added

**Enhanced Attachment System**

- AttachmentCard component extracted from AttachmentList for better reusability
- Image preview modal with navigation between images
- Click-to-preview functionality for image attachments
- Keyboard navigation support for image galleries (prev/next)
- `useAttachment` hook for managing attachment state and operations
- `useAttachmentDownload` hook for handling file downloads with progress tracking
- ImagePreviewModal component with fullscreen viewing and navigation controls
- Attachment helper utilities for file type detection and icon selection

### Changed

**Component Architecture Improvements**

- AttachmentList refactored to use new AttachmentCard component for better code organization
- Image attachments now open in a preview modal instead of downloading directly
- Attachment cards now have preview capability in addition to download and delete actions
- FileUpload component improved with consistent shrink class usage

**UI/UX Enhancements**

- Improved visual consistency across attachment-related components
- Better file type indicators with color-coded icons and backgrounds
- Enhanced attachment interaction patterns with click-to-preview for images
- Improved spacing and layout in attachment cards

**Code Quality & Consistency**

- Replaced all instances of `flex-shrink-0` with Tailwind's `shrink-0` shorthand across 10+ components
- Replaced all instances of `break-words` with `wrap-break-word` for consistent text wrapping
- Standardized import ordering across all attachment components
- Fixed CSS class inconsistencies in Command component
- Removed unused variables and improved code cleanliness in StorageQuota component

**Component Refactoring**

- Attachment handling logic extracted into reusable hooks for better testability
- Download logic centralized in useAttachmentDownload hook
- File type detection and icon selection moved to utility functions
- Preview state management separated into dedicated hook

### Fixed

- Command component CSS selector syntax corrected (replaced `[&_[cmdk-*]]` with proper syntax)
- BreadcrumbList component text wrapping class updated to use correct Tailwind utility
- CommentCard word wrapping behavior improved for better text display

## [0.11.0] - 2025-10-30

### Added

**Code Reusability Improvements**

- Generic `ParentEntityCard` component replacing entity-specific parent card components
- `fetchEntityPageData` utility function for fetching common entity page data (tags, comments, links, attachments)
- `useProjectSelection` hook for standardized project loading in forms
- `FormActions` component for consistent form action buttons across all entity forms
- Tag utility function `createAndAssignTags` for handling tag creation and assignment

**New Shared Components and Utilities**

- `src/components/common/ParentEntityCard.tsx` - Generic, configurable parent entity card
- `src/lib/entity-data.ts` - Centralized entity page data fetching
- `src/hooks/useProjectSelection.ts` - Reusable project selection hook
- `src/components/forms/FormActions.tsx` - Standardized form action buttons
- `src/features/tags/utils.ts` - Tag creation and assignment utilities
- Parent entity configuration files for all entity types (tasks, events, notes, projects)

### Changed

**Refactoring for Code Reusability**

- Replaced entity-specific parent cards (ParentTaskCard, ParentEventCard, etc.) with generic `ParentEntityCard`
- Unified entity page data fetching across all detail and edit pages using `fetchEntityPageData`
- Standardized project selection logic across TaskForm, EventForm, and NoteForm using `useProjectSelection` hook
- Consolidated form action buttons in all entity forms using `FormActions` component
- Refactored tag creation logic to use shared `createAndAssignTags` utility

**Component Simplification**

- All entity detail pages (view and edit) now use `fetchEntityPageData` instead of individual Promise.all calls
- All entity forms now use `FormActions` component for consistent button layout and behavior
- Removed duplicate project loading logic from EventForm, TaskForm, and NoteForm
- Removed entity-specific parent card components in favor of configuration-based approach

**Architecture Improvements**

- Reduced code duplication across entity pages by ~30%
- Improved type safety with generic components using TypeScript generics
- Better separation of concerns with utility functions and hooks
- More maintainable codebase with shared, reusable components

### Removed

- `src/components/tasks/ParentTaskCard.tsx` (replaced by ParentEntityCard)
- `src/components/events/ParentEventCard.tsx` (replaced by ParentEntityCard)
- `src/components/notes/ParentNoteCard.tsx` (replaced by ParentEntityCard)
- `src/components/projects/ParentProjectCard.tsx` (replaced by ParentEntityCard)
- Duplicate project loading code from multiple form components
- Duplicate tag creation logic from entity action handlers
- Redundant form action button implementations across forms

---

## Archived Versions

Older changelog entries have been moved to archive files for better readability:

- **2025** (v0.1.0 - v0.10.0): [CHANGELOG-2025-archive.md](changelogs/CHANGELOG-2025-archive.md)

---

[unreleased]: https://github.com/essedev/plannerinator/compare/v0.23.0...HEAD
[0.23.0]: https://github.com/essedev/plannerinator/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/essedev/plannerinator/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/essedev/plannerinator/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/essedev/plannerinator/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/essedev/plannerinator/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/essedev/plannerinator/compare/v0.17.1...v0.18.0
[0.17.1]: https://github.com/essedev/plannerinator/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/essedev/plannerinator/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/essedev/plannerinator/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/essedev/plannerinator/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/essedev/plannerinator/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/essedev/plannerinator/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/essedev/plannerinator/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/essedev/plannerinator/compare/v0.10.0...v0.11.0
