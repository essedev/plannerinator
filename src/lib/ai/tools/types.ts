/**
 * AI Tool Definition Types
 *
 * Single source of truth for tool definitions. Each tool defines its schema (Zod),
 * handler (execute), and prompt documentation in one place.
 */

import { z } from "zod";

/**
 * Tool call result type
 */
export type ToolResult = {
  success: boolean;
  data?: {
    created?: number;
    count?: number;
    total?: number;
    tasks?: Array<{ id: string; title: string; dueDate?: Date | null; priority?: string | null }>;
    events?: Array<{ id: string; title: string; startTime?: Date; endTime?: Date | null }>;
    notes?: Array<{ id: string; title: string | null; type?: string }>;
    projects?: Array<{ id: string; name: string; status?: string; color?: string }>;
    results?: unknown;
    message?: string;
    metric?: string;
    value?: number;
    breakdown?: Record<string, number>;
    matches?: Array<{ id: string; title: string }>;
    errors?: string[];
  };
  error?: string;
};

/**
 * Prompt documentation for a tool, used to generate the tools section of the system prompt.
 */
export type ToolPromptDocs = {
  /** Trigger words that activate this tool (e.g., "crea", "aggiungi", "nuovo") */
  trigger: string;
  /** Usage examples */
  examples?: string[];
  /** Additional notes */
  notes?: string[];
};

/**
 * A self-contained AI tool definition.
 * Schema (Zod) is the single source of truth for:
 * - JSON schema sent to OpenRouter (via toJSONSchema)
 * - TypeScript types (via z.infer)
 * - Runtime input validation (via safeParse)
 */
export type AiToolDefinition<TSchema extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  promptDocs: ToolPromptDocs;
  schema: TSchema;
  execute: (
    input: z.infer<TSchema>,
    userId: string,
    conversationId?: string
  ) => Promise<ToolResult>;
};

/**
 * Helper to define a tool with full type inference.
 */
export function defineTool<TSchema extends z.ZodType>(
  def: AiToolDefinition<TSchema>
): AiToolDefinition<TSchema> {
  return def;
}
