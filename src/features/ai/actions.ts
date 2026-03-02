/**
 * AI Chat Server Actions
 *
 * Handles communication with Claude via OpenRouter and manages conversations.
 * Uses OpenRouter's OpenAI-compatible API format.
 */

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiConversation, aiUsage } from "@/db/schema";
import { aiTools, executeToolCall } from "@/lib/ai/tools/registry";
import { eq, desc } from "drizzle-orm";
import { aiLogger } from "@/lib/ai/logger";
import {
  buildSystemPrompt,
  createTemporalContext,
  getUserStats,
  type PromptContext,
} from "@/lib/ai/prompts";

/**
 * OpenRouter configuration
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";

/**
 * OpenRouter API response types (OpenAI-compatible format)
 */
type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | { type: string; text?: string }[];
  tool_calls?: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }[];
  tool_call_id?: string;
};

type OpenRouterResponse = {
  id: string;
  choices: {
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: {
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }[];
    };
    finish_reason: "stop" | "tool_calls" | "length";
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Call OpenRouter API
 */
async function callOpenRouter(messages: OpenRouterMessage[]): Promise<OpenRouterResponse> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://plannerinator.com",
      "X-Title": "Plannerinator AI Assistant",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: aiTools,
      max_tokens: 2048,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Send a message to the AI assistant
 */
export async function sendAiMessage(userMessage: string, conversationId?: string) {
  // Validate session
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Non autenticato" };
  }

  // TODO: Add rate limiting
  // For now, we rely on OpenRouter's rate limiting

  try {
    // Load or create conversation
    let conversation;
    let messageHistory: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: string;
      toolsUsed?: Array<{ name: string; result: unknown }>;
    }> = [];

    if (conversationId) {
      const [existing] = await db
        .select()
        .from(aiConversation)
        .where(eq(aiConversation.id, conversationId))
        .limit(1);

      if (existing && existing.userId === session.user.id) {
        conversation = existing;
        messageHistory = existing.messages || [];
      }
    }

    // If no conversation, create one
    if (!conversation) {
      const [newConv] = await db
        .insert(aiConversation)
        .values({
          userId: session.user.id,
          title: userMessage.substring(0, 100),
          messages: [],
        })
        .returning();
      conversation = newConv;
    }

    // Build prompt context with user stats
    const [userStats] = await Promise.all([getUserStats(session.user.id)]);

    const promptContext: PromptContext = {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        preferences: {
          language: "it",
          timezone: "Europe/Rome",
        },
      },
      stats: userStats,
      temporal: createTemporalContext("Europe/Rome", "it-IT"),
    };

    // Build messages array for OpenRouter (OpenAI format)
    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt(promptContext),
      },
      ...messageHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    // Log API call
    await aiLogger.logApiCall(messages.length, true, session.user.id, conversation.id);

    // VERBOSE: Log full messages sent to AI
    await aiLogger.logVerboseMessages(messages, session.user.id, conversation.id);

    // First API call - get tool use or direct response
    const initialResponse = await callOpenRouter(messages);
    const initialChoice = initialResponse.choices[0];

    // Log API response
    await aiLogger.logApiResponse(
      initialChoice.finish_reason,
      initialChoice.message.tool_calls?.length || 0,
      {
        prompt: initialResponse.usage.prompt_tokens,
        completion: initialResponse.usage.completion_tokens,
        total: initialResponse.usage.total_tokens,
      },
      session.user.id,
      conversation.id
    );

    // VERBOSE: Log AI response content
    await aiLogger.logVerboseAiResponse(
      initialChoice.message.content,
      initialChoice.message.tool_calls,
      initialChoice.finish_reason,
      session.user.id,
      conversation.id
    );

    let finalResponse = initialResponse;
    const toolsUsedForHistory: Array<{ name: string; result: unknown }> = [];

    // Handle tool calls
    if (initialChoice.finish_reason === "tool_calls" && initialChoice.message.tool_calls) {
      // Add assistant's message with tool calls to conversation
      messages.push({
        role: "assistant",
        content: initialChoice.message.content || "",
        tool_calls: initialChoice.message.tool_calls,
      });

      // Execute all tool calls
      for (const toolCall of initialChoice.message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolInput = JSON.parse(toolCall.function.arguments);

        // Log tool call
        await aiLogger.logToolCall(toolName, toolInput, session.user.id, conversation.id);

        const startTime = Date.now();
        const result = await executeToolCall(toolName, toolInput, session.user.id, conversation.id);
        const executionTime = Date.now() - startTime;

        // Log tool result
        await aiLogger.logToolResult(
          toolName,
          result,
          session.user.id,
          executionTime,
          conversation.id
        );

        // Add tool result to messages
        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        });

        toolsUsedForHistory.push({
          name: toolName,
          result,
        });
      }

      // Second API call - get final response with tool results
      finalResponse = await callOpenRouter(messages);

      // VERBOSE: Log second AI response (after tool execution)
      await aiLogger.logVerboseAiResponse(
        finalResponse.choices[0].message.content,
        finalResponse.choices[0].message.tool_calls,
        finalResponse.choices[0].finish_reason,
        session.user.id,
        conversation.id
      );
    }

    // Extract text response
    const assistantMessage = finalResponse.choices[0].message.content || "Scusa, non ho capito.";

    // VERBOSE: Log final response
    await aiLogger.logVerboseFinalResponse(assistantMessage, session.user.id, conversation.id);

    // Calculate total tokens
    const totalInputTokens =
      initialResponse.usage.prompt_tokens +
      (finalResponse !== initialResponse ? finalResponse.usage.prompt_tokens : 0);
    const totalOutputTokens =
      initialResponse.usage.completion_tokens +
      (finalResponse !== initialResponse ? finalResponse.usage.completion_tokens : 0);

    // Save conversation messages
    const updatedMessages = [
      ...messageHistory,
      {
        id: crypto.randomUUID(),
        role: "user" as const,
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: assistantMessage,
        timestamp: new Date().toISOString(),
        toolsUsed: toolsUsedForHistory.length > 0 ? toolsUsedForHistory : undefined,
      },
    ];

    await db
      .update(aiConversation)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(aiConversation.id, conversation.id));

    // Track usage
    await db.insert(aiUsage).values({
      userId: session.user.id,
      conversationId: conversation.id,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      model: MODEL,
    });

    return {
      success: true,
      data: {
        conversationId: conversation.id,
        message: assistantMessage,
        tokensUsed: totalInputTokens + totalOutputTokens,
      },
    };
  } catch (error) {
    console.error("AI chat error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante l'elaborazione del messaggio",
    };
  }
}

/**
 * Get recent conversations for the current user
 */
export async function getRecentConversations(limit = 10) {
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Non autenticato" };
  }

  try {
    const conversations = await db
      .select()
      .from(aiConversation)
      .where(eq(aiConversation.userId, session.user.id))
      .orderBy(desc(aiConversation.updatedAt))
      .limit(limit);

    return {
      success: true,
      data: conversations,
    };
  } catch {
    return {
      success: false,
      error: "Errore nel caricamento delle conversazioni",
    };
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string) {
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Non autenticato" };
  }

  try {
    const [conversation] = await db
      .select()
      .from(aiConversation)
      .where(eq(aiConversation.id, conversationId))
      .limit(1);

    if (!conversation || conversation.userId !== session.user.id) {
      return { success: false, error: "Conversazione non trovata" };
    }

    return {
      success: true,
      data: conversation,
    };
  } catch {
    return {
      success: false,
      error: "Errore nel caricamento della conversazione",
    };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string) {
  const { headers } = await import("next/headers");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Non autenticato" };
  }

  try {
    const [conversation] = await db
      .select()
      .from(aiConversation)
      .where(eq(aiConversation.id, conversationId))
      .limit(1);

    if (!conversation || conversation.userId !== session.user.id) {
      return { success: false, error: "Conversazione non trovata" };
    }

    await db.delete(aiConversation).where(eq(aiConversation.id, conversationId));

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Errore durante l'eliminazione",
    };
  }
}
