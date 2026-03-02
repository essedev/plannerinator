/**
 * Tools Section — Data-Driven
 *
 * Generates the tool usage guide from the registry's promptDocs.
 * No manual maintenance needed when adding new tools.
 */

import type { PromptSection, PromptContext } from "../types";
import { allTools } from "@/lib/ai/tools/registry";

const TOOL_ICONS: Record<string, string> = {
  query_entities: "📋",
  search_entities: "🔍",
  create_task: "➕",
  create_event: "➕",
  create_note: "➕",
  create_project: "➕",
  update_task: "✏️",
  update_event: "✏️",
  update_note: "✏️",
  update_project: "✏️",
  delete_entity: "🗑️",
  get_statistics: "📊",
};

export function buildToolsSection(ctx: PromptContext): PromptSection {
  const isItalian = ctx.user.preferences?.language !== "en";

  const header = isItalian ? "QUANDO CHIAMARE OGNI TOOL:" : "WHEN TO CALL EACH TOOL:";

  const toolLines = allTools.map((tool) => {
    const icon = TOOL_ICONS[tool.name] || "🔧";
    const lines: string[] = [];

    lines.push(`${icon} ${tool.name} - ${tool.description.split(". ")[0]}`);
    lines.push(`Trigger: ${tool.promptDocs.trigger}`);

    if (tool.promptDocs.examples) {
      for (const example of tool.promptDocs.examples) {
        lines.push(isItalian ? `Esempio: ${example}` : `Example: ${example}`);
      }
    }

    if (tool.promptDocs.notes) {
      for (const note of tool.promptDocs.notes) {
        lines.push(note);
      }
    }

    return lines.join("\n");
  });

  const content = `${header}\n\n${toolLines.join("\n\n")}`;

  return {
    name: "tools",
    tag: "tool_selection",
    content,
    priority: 20,
  };
}
