import { z } from "zod";
import { defineTool } from "../types";
import {
  createFinanceGoal,
  updateFinanceGoal,
  deleteFinanceGoal,
} from "@/features/finance/actions";
import { getFinanceGoals } from "@/features/finance/queries";

export const manageFinanceGoalTool = defineTool({
  name: "manage_finance_goal",
  description:
    "Manage financial goals. Create, update, list, or delete savings, investment, " +
    "and debt goals with progress tracking.",
  promptDocs: {
    trigger:
      '"obiettivo finanziario", "risparmio", "risparmiare", "obiettivo soldi", "fondo emergenza"',
    examples: [
      '"Crea obiettivo: fondo emergenza 10.000 EUR entro dicembre"',
      '"Aggiorna il progresso del fondo emergenza a 3500 EUR"',
      '"Come vanno i miei obiettivi finanziari?"',
    ],
    notes: [
      "Obiettivi finanziari: risparmio, investimento, debito, patrimonio, etc.",
      "Stati: active, paused, completed, abandoned",
      "targetUnit di default è EUR per obiettivi finanziari",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("create").describe("Create a new finance goal"),
      title: z.string().describe("Goal title"),
      description: z.string().optional().describe("Goal description"),
      category: z
        .string()
        .optional()
        .describe("Category (e.g., 'risparmio', 'investimento', 'debito')"),
      targetValue: z.string().optional().describe("Target value (e.g., '10000')"),
      targetUnit: z.string().optional().describe("Unit (default: EUR)"),
      currentValue: z.string().optional().describe("Current value"),
      targetDate: z.string().optional().describe("Target date (YYYY-MM-DD)"),
    }),
    z.object({
      action: z.literal("update").describe("Update an existing goal"),
      goalId: z.string().describe("Goal UUID"),
      title: z.string().optional(),
      description: z.string().optional(),
      currentValue: z.string().optional().describe("Updated current value"),
      status: z
        .enum(["active", "paused", "completed", "abandoned"])
        .optional()
        .describe("New status"),
      targetValue: z.string().optional(),
      targetDate: z.string().optional(),
    }),
    z.object({
      action: z.literal("list").describe("List finance goals"),
      statusFilter: z
        .enum(["active", "paused", "completed", "abandoned"])
        .optional()
        .describe("Filter by status"),
    }),
    z.object({
      action: z.literal("delete").describe("Delete a finance goal"),
      goalId: z.string().describe("Goal UUID"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "create": {
        const result = await createFinanceGoal({
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
          targetValue: input.targetValue ?? null,
          targetUnit: input.targetUnit ?? "EUR",
          currentValue: input.currentValue ?? null,
          targetDate: input.targetDate ?? null,
        });
        return {
          success: true,
          data: {
            message: `Obiettivo finanziario "${result.title}" creato.`,
            results: { id: result.id, title: result.title },
          },
        };
      }

      case "update": {
        const result = await updateFinanceGoal(input.goalId, {
          title: input.title,
          description: input.description,
          currentValue: input.currentValue,
          status: input.status,
          targetValue: input.targetValue,
          targetDate: input.targetDate,
        });
        return {
          success: true,
          data: {
            message: `Obiettivo "${result.title}" aggiornato.`,
            results: {
              id: result.id,
              title: result.title,
              status: result.status,
              currentValue: result.currentValue,
              targetValue: result.targetValue,
            },
          },
        };
      }

      case "list": {
        const goals = await getFinanceGoals(userId, input.statusFilter);
        return {
          success: true,
          data: {
            count: goals.length,
            results: goals.map((g) => ({
              id: g.id,
              title: g.title,
              status: g.status,
              category: g.category,
              currentValue: g.currentValue,
              targetValue: g.targetValue,
              targetUnit: g.targetUnit,
            })),
          },
        };
      }

      case "delete": {
        await deleteFinanceGoal(input.goalId);
        return {
          success: true,
          data: { message: "Obiettivo eliminato." },
        };
      }
    }
  },
});
