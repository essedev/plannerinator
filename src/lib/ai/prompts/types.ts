/**
 * AI Prompt System Types
 *
 * Type definitions for the modular prompt builder.
 */

/**
 * User context passed to prompt builder
 */
export type UserContext = {
  id: string;
  name: string;
  email?: string;
  preferences?: {
    language?: "it" | "en";
    timezone?: string;
  };
};

/**
 * Dynamic statistics for context-aware prompts
 */
export type UserStats = {
  tasksOpenCount: number;
  tasksCompletedToday: number;
  tasksDueToday: number;
  tasksDueTomorrow: number;
  tasksOverdue: number;
  eventsToday: number;
  eventsTomorrow: number;
  activeProjectsCount: number;
  recentProjectNames: string[];
  // Health stats (optional)
  activeProtocolsCount?: number;
  activeSupplementsCount?: number;
  latestWeight?: { value: string; date: string };
  activeHealthGoalsCount?: number;
  // Finance stats (optional)
  monthlyIncome?: number;
  monthlyExpenses?: number;
  activeAccountsCount?: number;
  activeFinanceGoalsCount?: number;
  unpaidF24Count?: number;
};

/**
 * Temporal context for date handling
 */
export type TemporalContext = {
  now: Date;
  timezone: string;
  locale: string;
  formatted: {
    date: string;
    time: string;
    dayOfWeek: string;
  };
};

/**
 * Conversation context for reference resolution
 */
export type ConversationContext = {
  lastMentionedTask?: { id: string; title: string };
  lastMentionedEvent?: { id: string; title: string };
  lastMentionedNote?: { id: string; title: string };
  lastMentionedProject?: { id: string; name: string };
  recentEntityIds: string[];
};

/**
 * Complete context for prompt building
 */
export type PromptContext = {
  user: UserContext;
  stats?: UserStats;
  temporal: TemporalContext;
  conversation?: ConversationContext;
};

/**
 * A single prompt section
 */
export type PromptSection = {
  name: string;
  tag?: string;
  content: string;
  priority: number; // Lower = earlier in prompt
};

/**
 * Options for prompt builder
 */
export type PromptBuilderOptions = {
  includeStats?: boolean;
  includeExamples?: boolean;
  verbose?: boolean;
};
