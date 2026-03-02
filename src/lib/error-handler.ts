"use client";

/**
 * Client-side error handling utilities.
 *
 * Provides toast-based error display and error message extraction.
 */

import { toast } from "sonner";
import { type ErrorCode, isAppError } from "./errors";

const ERROR_TITLES: Record<ErrorCode, string> = {
  INVALID_INPUT: "Invalid Input",
  VALIDATION_FAILED: "Validation Failed",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Access Denied",
  NOT_FOUND: "Not Found",
  TASK_NOT_FOUND: "Task Not Found",
  EVENT_NOT_FOUND: "Event Not Found",
  NOTE_NOT_FOUND: "Note Not Found",
  PROJECT_NOT_FOUND: "Project Not Found",
  ALREADY_EXISTS: "Already Exists",
  INTERNAL_ERROR: "Error",
};

function getErrorTitle(code: ErrorCode): string {
  return ERROR_TITLES[code] ?? "Error";
}

export function handleActionError(error: unknown): void {
  if (isAppError(error)) {
    toast.error(getErrorTitle(error.code), {
      description: error.message,
    });
  } else if (error instanceof Error) {
    toast.error("Error", {
      description: error.message,
    });
  } else {
    toast.error("An unexpected error occurred");
  }
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return isAppError(error) && error.code === code;
}
