/**
 * AI Assistant Logger
 *
 * Comprehensive logging system for tracking AI operations, tool calls,
 * database queries, and debugging issues with data access.
 */

import { db } from "@/db";
import { aiLog } from "@/db/schema";

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export interface AILogContext {
  userId: string;
  conversationId?: string;
  toolName?: string;
  [key: string]: unknown;
}

/**
 * Console colors for better visibility
 */
const COLORS = {
  DEBUG: "\x1b[36m", // Cyan
  INFO: "\x1b[32m", // Green
  WARNING: "\x1b[33m", // Yellow
  ERROR: "\x1b[31m", // Red
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
};

/**
 * Safe JSON stringify that handles circular references
 */
function safeStringify(obj: unknown, indent = 2): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      // Handle circular references
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      // Skip internal Drizzle properties
      if (key === "table" || key === "_" || key === "config") {
        return "[Drizzle Internal]";
      }
      return value;
    },
    indent
  );
}

/**
 * Format log message with colors
 */
function formatConsoleLog(level: LogLevel, message: string, context?: AILogContext): string {
  const color = COLORS[level];
  const timestamp = new Date().toISOString();
  const contextStr = context ? safeStringify(context, 2) : "";

  return `${color}${COLORS.BOLD}[AI ${level}]${COLORS.RESET} ${COLORS.DIM}${timestamp}${COLORS.RESET}
${color}${message}${COLORS.RESET}
${contextStr ? `${COLORS.DIM}Context: ${contextStr}${COLORS.RESET}` : ""}
${"=".repeat(80)}`;
}

/**
 * Main logger class
 */
class AILogger {
  private enabled = process.env.AI_LOGGING_ENABLED !== "false"; // Default: enabled
  private dbLoggingEnabled = process.env.AI_DB_LOGGING_ENABLED === "true"; // Default: disabled
  private verboseLoggingEnabled = process.env.AI_VERBOSE_LOGGING === "true"; // Default: disabled

  /**
   * Log a message
   */
  async log(level: LogLevel, message: string, context?: AILogContext) {
    if (!this.enabled) return;

    // Console logging (always)
    console.log(formatConsoleLog(level, message, context));

    // Database logging (optional, for production analysis)
    if (this.dbLoggingEnabled && context?.userId) {
      try {
        await db.insert(aiLog).values({
          userId: context.userId,
          conversationId: context.conversationId || null,
          level,
          message,
          metadata: context as Record<string, unknown>,
        });
      } catch (error) {
        console.error("Failed to write AI log to database:", error);
      }
    }
  }

  debug(message: string, context?: AILogContext) {
    return this.log("DEBUG", message, context);
  }

  info(message: string, context?: AILogContext) {
    return this.log("INFO", message, context);
  }

  warning(message: string, context?: AILogContext) {
    return this.log("WARNING", message, context);
  }

  error(message: string, context?: AILogContext) {
    return this.log("ERROR", message, context);
  }

  /**
   * Log tool call details
   */
  async logToolCall(toolName: string, input: unknown, userId: string, conversationId?: string) {
    await this.info(`🔧 Tool called: ${toolName}`, {
      userId,
      conversationId,
      toolName,
      input,
    });
  }

  /**
   * Log tool result
   */
  async logToolResult(
    toolName: string,
    result: unknown,
    userId: string,
    executionTimeMs: number,
    conversationId?: string
  ) {
    const success = (result as { success?: boolean }).success ?? false;
    const level = success ? "INFO" : "WARNING";

    await this.log(
      level,
      `${success ? "✅" : "⚠️"} Tool result: ${toolName} (${executionTimeMs}ms)`,
      {
        userId,
        conversationId,
        toolName,
        executionTimeMs,
        result,
      }
    );
  }

  /**
   * Log database query
   */
  async logDbQuery(
    operation: string,
    table: string,
    conditions: unknown,
    resultCount: number,
    userId: string,
    conversationId?: string
  ) {
    await this.debug(`🗄️ Database query: ${operation} on ${table}`, {
      userId,
      conversationId,
      operation,
      table,
      conditions,
      resultCount,
    });
  }

  /**
   * Log search operation
   */
  async logSearch(
    query: string,
    entityTypes: string[] | undefined,
    results: {
      tasks: unknown[];
      events: unknown[];
      notes: unknown[];
      projects: unknown[];
    },
    userId: string,
    conversationId?: string
  ) {
    const totalResults =
      results.tasks.length + results.events.length + results.notes.length + results.projects.length;

    await this.info(`🔍 Search executed: "${query}"`, {
      userId,
      conversationId,
      query,
      entityTypes,
      resultCounts: {
        tasks: results.tasks.length,
        events: results.events.length,
        notes: results.notes.length,
        projects: results.projects.length,
        total: totalResults,
      },
      sampleResults: {
        tasks: results.tasks.slice(0, 3),
        events: results.events.slice(0, 3),
        notes: results.notes.slice(0, 3),
        projects: results.projects.slice(0, 3),
      },
    });
  }

  /**
   * Log API call to OpenRouter
   */
  async logApiCall(
    messageCount: number,
    hasTools: boolean,
    userId: string,
    conversationId?: string
  ) {
    await this.debug(`📡 Calling OpenRouter API`, {
      userId,
      conversationId,
      messageCount,
      hasTools,
    });
  }

  /**
   * Log API response
   */
  async logApiResponse(
    finishReason: string,
    toolCallsCount: number,
    tokenUsage: { prompt: number; completion: number; total: number },
    userId: string,
    conversationId?: string
  ) {
    await this.debug(`📥 OpenRouter API response`, {
      userId,
      conversationId,
      finishReason,
      toolCallsCount,
      tokenUsage,
    });
  }

  /**
   * VERBOSE: Log complete messages sent to OpenRouter
   */
  async logVerboseMessages(messages: unknown[], userId: string, conversationId?: string) {
    if (!this.verboseLoggingEnabled) return;

    await this.debug(
      `📤 VERBOSE: Full message history sent to OpenRouter (${messages.length} messages)`,
      {
        userId,
        conversationId,
        messages,
      }
    );
  }

  /**
   * VERBOSE: Log AI response content
   */
  async logVerboseAiResponse(
    content: string | null,
    toolCalls: unknown[] | undefined,
    finishReason: string,
    userId: string,
    conversationId?: string
  ) {
    if (!this.verboseLoggingEnabled) return;

    const hasToolCalls = toolCalls && toolCalls.length > 0;

    await this.debug(
      `🤖 VERBOSE: AI Response - ${hasToolCalls ? `Called ${toolCalls.length} tool(s)` : "Direct response (NO TOOLS)"}`,
      {
        userId,
        conversationId,
        finishReason,
        content: content || "(empty)",
        toolCalls: toolCalls || [],
      }
    );
  }

  /**
   * VERBOSE: Log final response sent to user
   */
  async logVerboseFinalResponse(content: string, userId: string, conversationId?: string) {
    if (!this.verboseLoggingEnabled) return;

    await this.debug(`💬 VERBOSE: Final response to user`, {
      userId,
      conversationId,
      content,
      length: content.length,
    });
  }
}

/**
 * Export singleton instance
 */
export const aiLogger = new AILogger();
