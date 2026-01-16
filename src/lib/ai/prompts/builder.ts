/**
 * Prompt Builder
 *
 * Assembles all prompt sections into a complete system prompt.
 */

import type { PromptContext, PromptSection, PromptBuilderOptions, TemporalContext } from "./types";
import {
  buildIdentitySection,
  buildContextSection,
  buildRulesSection,
  buildToolsSection,
  buildDatesSection,
  buildExamplesSection,
  buildConversationSection,
  buildFormattingSection,
  buildGuidelinesSection,
} from "./sections";

/**
 * Create temporal context from current time
 */
export function createTemporalContext(timezone = "Europe/Rome", locale = "it-IT"): TemporalContext {
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });

  const dayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: timezone,
  });

  return {
    now,
    timezone,
    locale,
    formatted: {
      date: dateFormatter.format(now),
      time: timeFormatter.format(now),
      dayOfWeek: dayFormatter.format(now),
    },
  };
}

/**
 * Format a section with optional XML tag wrapper
 */
function formatSection(section: PromptSection): string {
  if (section.tag) {
    return `<${section.tag}>\n${section.content}\n</${section.tag}>`;
  }
  return section.content;
}

/**
 * Build the complete system prompt from all sections
 */
export function buildSystemPrompt(ctx: PromptContext, options: PromptBuilderOptions = {}): string {
  const { includeExamples = true } = options;

  // Collect all sections
  const sections: PromptSection[] = [
    buildIdentitySection(ctx),
    buildContextSection(ctx),
    buildRulesSection(ctx),
    buildToolsSection(ctx),
    buildDatesSection(ctx),
    buildConversationSection(ctx),
    buildFormattingSection(ctx),
    buildGuidelinesSection(ctx),
  ];

  // Optionally include examples (can be excluded to save tokens)
  if (includeExamples) {
    sections.push(buildExamplesSection(ctx));
  }

  // Sort by priority
  sections.sort((a, b) => a.priority - b.priority);

  // Build final prompt
  const formattedSections = sections.map(formatSection);
  return formattedSections.join("\n\n");
}

/**
 * Quick builder for simple use cases (no stats, default temporal)
 */
export function buildSimpleSystemPrompt(
  userName: string,
  options: PromptBuilderOptions = {}
): string {
  const ctx: PromptContext = {
    user: {
      id: "",
      name: userName,
      preferences: {
        language: "it",
        timezone: "Europe/Rome",
      },
    },
    temporal: createTemporalContext(),
  };

  return buildSystemPrompt(ctx, options);
}
