# Archived Changelog - 2025 (v0.1.0 - v0.10.0)

This file contains archived changelog entries for early versions of Plannerinator.

For current and recent changes, see [CHANGELOG.md](../CHANGELOG.md) in the root directory.

---

## [0.10.0] - 2025-10-29

### Added

**Tag Management System**

- Tag Manager page at `/dashboard/tags` with comprehensive tag management
- Create, edit, delete, and merge tags functionality
- Tag usage statistics by entity type
- TagSelector and TagsCard components

**Parent Relationship Cards**

- Parent relationship cards for all entity types
- Clickable parent links on detail pages
- Parent selection dropdowns in forms

### Changed

- Tag system refactored with new components
- Entity helpers updated for tag management
- Dependencies updated

### Fixed

- Build errors related to imports and type mismatches

## [0.9.0] - 2025-10-27

### Added

- Archive and delete buttons for all entities with confirmation dialogs
- Edit buttons in page headers
- Parent relationship management across all entities
- ProjectDetailView component with tabbed interface

### Changed

- Detail pages refactored to view-only mode
- Edit functionality moved to dedicated `/edit` routes
- Improved UI/UX consistency

## [0.8.0] - 2025-10-27

### Added

**Trash System**

- Soft delete functionality for all entities
- Trash page showing deleted items
- Restore and permanent delete capabilities

**Shared Entity Helpers**

- `entity-helpers.ts` with reusable CRUD utilities
- Standardized session validation and ownership checks

### Changed

- All delete operations now soft delete by default
- Reduced code duplication across action files by ~40%
- Database schema updated with `deletedAt` and `archivedAt` fields

## [0.7.0] - 2025-10-26

### Added

- Project edit page route
- Additional form fields in creation forms

### Changed

- Comments now use optimistic UI updates
- Project detail page layout reorganized
- Form consistency improvements

### Fixed

- Text overflow issues in PageHeader
- ProjectCard layout issues

## [0.6.0] - 2025-10-24

### Added

**File Attachments**

- Complete file attachment system with Cloudflare R2 storage
- File upload with drag-and-drop and progress tracking
- Image preview with lightbox
- Per-user storage quota tracking
- AttachmentsSection component

### Changed

- Detail pages simplified with improved layout
- Dependencies: Added AWS SDK packages for R2 storage

## [0.5.4] - 2025-10-24

### Changed

- Tag filter and TagInput UI improvements
- Consistent popover widths

## [0.5.3] - 2025-10-24

### Added

- Unified authentication page at `/auth` with tabs

### Removed

- Separate `/login` and `/register` pages

## [0.5.2] - 2025-10-24

### Changed

- Filter components UI improvements with icon indicators
- Breadcrumbs now show on all dashboard pages
- Kanban board drag-and-drop improvements

## [0.5.1] - 2025-10-23

### Added

- Logout button in sidebar footer
- Dedicated calendar.css stylesheet

### Changed

- Sidebar footer redesigned
- Filter layouts improved

## [0.5.0] - 2025-10-23

### Added

**Modern Dashboard Layout**

- AppSidebar component with collapsible sidebar (Cmd+B)
- DashboardBreadcrumbs component
- ConditionalLayout component
- Sidebar state persistence via cookies

### Removed

- DashboardNav component (replaced by AppSidebar)

## [0.4.0]

### Added

**Dashboard Enhancements**

- QuickStats, QuickActions, TodayView, and UpcomingDeadlines components

**Kanban Board**

- KanbanBoard with drag-and-drop task management
- Status-based columns (Todo, In Progress, Done, Cancelled)

**UI Components**

- Skeleton component for loading states

### Changed

- PageHeader component enhanced with back buttons and actions
- EmptyState component applied to all list views
- Form action buttons standardized

## [0.3.0]

### Added

**Tag Filtering System**

- TagFilter component with AND/OR logic
- URL synchronization for tag filters

**Event Calendar View**

- EventCalendar component with monthly grid view
- react-big-calendar integration

**Rich Markdown Editor**

- MarkdownEditor component with live preview
- Syntax highlighting and GFM support

**Developer Tools**

- Custom slash commands: `/changelog`, `/release`, `/deploy`

## [0.2.0]

### Added - Phase 1: Core Entities

**Event Management**

- Full CRUD operations for events
- Event pages, components, and filters
- Database queries with advanced filtering

**Note Management**

- Full CRUD operations for notes
- Note types and pinning functionality
- Markdown content support

**Project Management**

- Full CRUD operations for projects
- Project archiving and stats tracking
- Color and icon customization

**Universal Features**

- Tags system with entity associations
- Comments system for all entities
- Links system connecting entities
- Global search with command palette

**Testing Infrastructure**

- Vitest configuration
- Schema validation tests

### Changed

- Dashboard navigation updated with new sections
- Database configuration updated

### Removed

- Blog, newsletter, and contacts placeholder pages

## [0.1.0]

### Added - Phase 0: Foundation

**Authentication & Authorization**

- Better Auth integration with PostgreSQL
- Email/password authentication
- Password reset and email verification
- RBAC system (user/admin roles)
- Session management with JWT

**Database & Schema**

- Complete database schema for all entities
- Database indexes for performance
- Drizzle ORM setup with migrations

**Type Safety & Validation**

- TypeScript strict mode
- Zod validation schemas for all entities
- Branded types for IDs
- Runtime type guards

**UI Infrastructure**

- Next.js 15 App Router with React 19
- Tailwind CSS 4 for styling
- shadcn/ui component library
- Dark mode support
- Responsive dashboard layout

**User Management**

- Profile page with edit functionality
- Password change
- User list (admin only)
- Role management

**Developer Experience**

- ESLint and Prettier configuration
- TypeScript strict mode
- Cloudflare Workers deployment config

**Security**

- CSRF protection
- XSS prevention
- SQL injection prevention
- Rate limiting on auth endpoints
- Password hashing with PBKDF2

**Performance**

- Server-side rendering (RSC)
- Server Actions
- Database connection pooling
- Optimized indexes
- Code splitting

[0.10.0]: https://github.com/essedev/plannerinator/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/essedev/plannerinator/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/essedev/plannerinator/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/essedev/plannerinator/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/essedev/plannerinator/compare/v0.5.4...v0.6.0
[0.5.4]: https://github.com/essedev/plannerinator/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/essedev/plannerinator/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/essedev/plannerinator/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/essedev/plannerinator/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/essedev/plannerinator/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/essedev/plannerinator/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/essedev/plannerinator/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/essedev/plannerinator/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/essedev/plannerinator/releases/tag/v0.1.0
