/**
 * AI Tool Registry
 *
 * Central registry that collects all tool definitions and provides:
 * - `aiTools` — OpenAI-compatible JSON schema array for the OpenRouter API
 * - `executeToolCall()` — validated tool dispatch with runtime input validation
 * - `allTools` — raw tool definitions for prompt generation
 */

import { z } from "zod";
import { aiLogger } from "@/lib/ai/logger";
import type { AiToolDefinition, ToolResult } from "./types";
import {
  createTaskTool,
  createEventTool,
  createNoteTool,
  createProjectTool,
  queryEntitiesTool,
  searchEntitiesTool,
  updateTaskTool,
  updateEventTool,
  updateNoteTool,
  updateProjectTool,
  deleteEntityTool,
  getStatisticsTool,
  manageSupplementProtocolTool,
  logBodyMetricTool,
  manageHealthGoalTool,
  queryHealthStatusTool,
  manageFinanceTransactionTool,
  manageFinanceAccountTool,
  manageFinanceGoalTool,
  queryFinanceStatusTool,
  manageFinanceFiscalTool,
  manageFinanceWorkTool,
} from "./definitions";

/**
 * All registered tool definitions.
 */
export const allTools: AiToolDefinition[] = [
  createTaskTool,
  createEventTool,
  createNoteTool,
  createProjectTool,
  queryEntitiesTool,
  searchEntitiesTool,
  updateTaskTool,
  updateEventTool,
  updateNoteTool,
  updateProjectTool,
  deleteEntityTool,
  getStatisticsTool,
  manageSupplementProtocolTool,
  logBodyMetricTool,
  manageHealthGoalTool,
  queryHealthStatusTool,
  manageFinanceTransactionTool,
  manageFinanceAccountTool,
  manageFinanceGoalTool,
  queryFinanceStatusTool,
  manageFinanceFiscalTool,
  manageFinanceWorkTool,
];

/**
 * O(1) lookup map for tool dispatch.
 */
const toolMap = new Map<string, AiToolDefinition>(allTools.map((tool) => [tool.name, tool]));

/**
 * OpenAI-compatible tool definitions for the OpenRouter API.
 * Generated from Zod schemas via toJSONSchema().
 */
export const aiTools = allTools.map((tool) => {
  const jsonSchema = z.toJSONSchema(tool.schema);

  // Remove $schema — not needed by OpenAI function calling format
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $schema, ...parameters } = jsonSchema as Record<string, unknown>;

  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters,
    },
  };
});

/**
 * Execute a tool call with runtime validation.
 */
export async function executeToolCall(
  toolName: string,
  toolInput: unknown,
  userId: string,
  conversationId?: string
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    await aiLogger.logToolCall(toolName, toolInput, userId, conversationId);

    const tool = toolMap.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    // Runtime input validation via Zod safeParse
    const parseResult = tool.schema.safeParse(toolInput);
    if (!parseResult.success) {
      const issues = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");

      await aiLogger.error(`Tool input validation failed (${toolName})`, {
        userId,
        conversationId,
        toolName,
        issues,
      });

      return {
        success: false,
        error: `Invalid input for ${toolName}: ${issues}`,
      };
    }

    const result = await tool.execute(parseResult.data, userId, conversationId);

    const executionTime = Date.now() - startTime;
    await aiLogger.logToolResult(toolName, result, userId, executionTime, conversationId);

    return result;
  } catch (error) {
    await aiLogger.error(`Tool execution error (${toolName})`, {
      userId,
      conversationId,
      toolName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}
