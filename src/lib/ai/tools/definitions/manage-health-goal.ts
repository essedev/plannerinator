import { z } from "zod";
import { defineTool } from "../types";
import { createHealthGoal, updateHealthGoal, deleteHealthGoal } from "@/features/health/actions";
import { getHealthGoals } from "@/features/health/queries";

export const manageHealthGoalTool = defineTool({
  name: "manage_health_goal",
  description:
    "Manage health goals. Create, update, list, or delete health and wellness goals " +
    "with progress tracking.",
  promptDocs: {
    trigger:
      '"obiettivo salute", "goal", "voglio raggiungere", "come va il mio obiettivo", "traguardo"',
    examples: [
      '"Crea obiettivo: raggiungere 75kg entro giugno"',
      '"Come vanno i miei obiettivi salute?"',
      '"Aggiorna il progresso del mio obiettivo peso a 77kg"',
    ],
    notes: [
      "Gli obiettivi hanno stati: active, paused, completed, abandoned",
      "Possono avere un valore target numerico per tracciare il progresso",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("create").describe("Create a new health goal"),
      title: z.string().describe("Goal title"),
      description: z.string().optional().describe("Goal description"),
      category: z.string().optional().describe("Category (e.g., 'weight', 'fitness', 'nutrition')"),
      targetValue: z.string().optional().describe("Target value (e.g., '75')"),
      targetUnit: z.string().optional().describe("Unit (e.g., 'kg')"),
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
      action: z.literal("list").describe("List health goals"),
      statusFilter: z
        .enum(["active", "paused", "completed", "abandoned"])
        .optional()
        .describe("Filter by status"),
    }),
    z.object({
      action: z.literal("delete").describe("Delete a health goal"),
      goalId: z.string().describe("Goal UUID"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "create": {
        const result = await createHealthGoal({
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
          targetValue: input.targetValue ?? null,
          targetUnit: input.targetUnit ?? null,
          currentValue: input.currentValue ?? null,
          targetDate: input.targetDate ?? null,
        });
        return {
          success: true,
          data: {
            message: `Obiettivo "${result.title}" creato.`,
            results: { id: result.id, title: result.title },
          },
        };
      }

      case "update": {
        const result = await updateHealthGoal(input.goalId, {
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
        const goals = await getHealthGoals(userId, input.statusFilter);
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
        await deleteHealthGoal(input.goalId);
        return {
          success: true,
          data: { message: "Obiettivo eliminato." },
        };
      }
    }
  },
});
