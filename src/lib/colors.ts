/**
 * Centralized color constants for the application.
 *
 * All color classes and values used across components are defined here
 * to ensure consistency and reduce duplication.
 */

/** Default color for new tags */
export const DEFAULT_TAG_COLOR = "#6b7280";

/** Badge colors: bg + text for card badges */
export const TASK_PRIORITY_COLORS = {
  low: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  medium: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-300",
} as const;

export const TASK_STATUS_COLORS = {
  todo: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  done: "bg-green-500/10 text-green-700 dark:text-green-300",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
} as const;

export const EVENT_CALENDAR_TYPE_COLORS = {
  personal: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  work: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  family: "bg-green-500/10 text-green-700 dark:text-green-300",
  other: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
} as const;

export const PROJECT_STATUS_COLORS = {
  active: "bg-green-500/10 text-green-700 dark:text-green-300",
  on_hold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  archived: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-300",
} as const;

export const NOTE_TYPE_COLORS = {
  note: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  document: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  research: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  idea: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  snippet: "bg-green-500/10 text-green-700 dark:text-green-300",
} as const;

export const COMMON_COLORS = {
  archived: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  favorite: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  allDay: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
} as const;

/** Border-left colors for KanbanCard priority indicators */
export const TASK_PRIORITY_BORDER_COLORS = {
  low: "border-l-blue-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  urgent: "border-l-red-500",
} as const;

/** Text colors for priority labels (e.g. UpcomingDeadlines) */
export const TASK_PRIORITY_TEXT_COLORS = {
  low: "text-blue-600 dark:text-blue-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-orange-600 dark:text-orange-400",
  urgent: "text-red-600 dark:text-red-400",
} as const;

/** Solid bg colors for calendar type indicators (e.g. TodayView sidebar dots) */
export const EVENT_CALENDAR_TYPE_SOLID_COLORS = {
  personal: "bg-blue-500",
  work: "bg-purple-500",
  family: "bg-green-500",
  other: "bg-gray-500",
} as const;

/** Hex colors for calendar type (e.g. EventCalendar inline styles) */
export const EVENT_CALENDAR_TYPE_HEX_COLORS = {
  personal: "#3b82f6",
  work: "#a855f7",
  family: "#22c55e",
  other: "#6b7280",
} as const;
