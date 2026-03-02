/**
 * Structured error handling system.
 *
 * Provides typed error codes, custom AppError class, factory functions,
 * and a safe Zod parseInput wrapper.
 */

export const ErrorCode = {
  // 400 Bad Request
  INVALID_INPUT: "INVALID_INPUT",
  VALIDATION_FAILED: "VALIDATION_FAILED",

  // 401 Unauthorized
  UNAUTHORIZED: "UNAUTHORIZED",

  // 403 Forbidden
  FORBIDDEN: "FORBIDDEN",

  // 404 Not Found
  NOT_FOUND: "NOT_FOUND",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  NOTE_NOT_FOUND: "NOTE_NOT_FOUND",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",

  // 409 Conflict
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // 500 Internal Server Error
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_CODE_MAP: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
  EVENT_NOT_FOUND: 404,
  NOTE_NOT_FOUND: 404,
  PROJECT_NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  get statusCode(): number {
    return STATUS_CODE_MAP[this.code];
  }

  toJSON(): { code: ErrorCode; message: string; details?: Record<string, unknown> } {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export const errors = {
  unauthorized: (message = "You must be logged in") => new AppError("UNAUTHORIZED", message),

  forbidden: (message = "Permission denied") => new AppError("FORBIDDEN", message),

  notFound: (resource: string, details?: Record<string, unknown>) =>
    new AppError(
      "NOT_FOUND",
      `${resource} not found or you don't have permission to access it`,
      details
    ),

  taskNotFound: (taskId?: string) =>
    new AppError(
      "TASK_NOT_FOUND",
      "Task not found or you don't have permission to access it",
      taskId ? { taskId } : undefined
    ),

  eventNotFound: (eventId?: string) =>
    new AppError(
      "EVENT_NOT_FOUND",
      "Event not found or you don't have permission to access it",
      eventId ? { eventId } : undefined
    ),

  noteNotFound: (noteId?: string) =>
    new AppError(
      "NOTE_NOT_FOUND",
      "Note not found or you don't have permission to access it",
      noteId ? { noteId } : undefined
    ),

  projectNotFound: (projectId?: string) =>
    new AppError(
      "PROJECT_NOT_FOUND",
      "Project not found or you don't have permission to access it",
      projectId ? { projectId } : undefined
    ),

  invalidInput: (message: string, details?: Record<string, unknown>) =>
    new AppError("INVALID_INPUT", message, details),

  validationFailed: (message: string, details?: Record<string, unknown>) =>
    new AppError("VALIDATION_FAILED", message, details),

  alreadyExists: (resource: string, details?: Record<string, unknown>) =>
    new AppError("ALREADY_EXISTS", `${resource} already exists`, details),

  internal: (message = "An internal error occurred") => new AppError("INTERNAL_ERROR", message),
};

export function parseInput<T>(schema: { parse: (data: unknown) => T }, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as Error & {
        errors: { message: string; path: (string | number)[] }[];
      };
      const firstIssue = zodError.errors[0];
      const message = firstIssue?.message || "Invalid input data";
      throw new AppError("VALIDATION_FAILED", message);
    }
    throw error;
  }
}
