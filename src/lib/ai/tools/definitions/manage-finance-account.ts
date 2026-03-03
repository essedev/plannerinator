import { z } from "zod";
import { defineTool } from "../types";
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "@/features/finance/actions";
import { getBankAccounts } from "@/features/finance/queries";

export const manageFinanceAccountTool = defineTool({
  name: "manage_finance_account",
  description:
    "Manage bank accounts. Create, update, list, or delete financial accounts " +
    "(checking, savings, cash, investment, credit card).",
  promptDocs: {
    trigger: '"conto", "conto corrente", "conto risparmio", "carta", "contante"',
    examples: [
      '"Aggiungi un conto corrente Intesa"',
      '"Mostrami i miei conti"',
      '"Aggiorna il saldo iniziale del conto N26"',
    ],
    notes: [
      "Tipi: checking, savings, cash, investment, credit_card, other",
      "Il saldo corrente è calcolato: saldo iniziale + entrate - uscite",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("create").describe("Create a new bank account"),
      name: z.string().describe("Account name (e.g. 'Conto N26')"),
      type: z
        .enum(["checking", "savings", "cash", "investment", "credit_card", "other"])
        .optional()
        .describe("Account type"),
      currency: z.string().optional().describe("Currency code (default: EUR)"),
      initialBalance: z.string().optional().describe("Initial balance (e.g. '1500.00')"),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("update").describe("Update an existing account"),
      accountId: z.string().describe("Account UUID"),
      name: z.string().optional(),
      type: z
        .enum(["checking", "savings", "cash", "investment", "credit_card", "other"])
        .optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("list").describe("List all bank accounts"),
      activeOnly: z.boolean().optional().describe("Only show active accounts"),
    }),
    z.object({
      action: z.literal("delete").describe("Delete a bank account"),
      accountId: z.string().describe("Account UUID"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "create": {
        const result = await createBankAccount({
          name: input.name,
          type: input.type,
          currency: input.currency,
          initialBalance: input.initialBalance,
          notes: input.notes ?? null,
        });
        return {
          success: true,
          data: {
            message: `Conto "${result.name}" creato.`,
            results: { id: result.id, name: result.name, type: result.type },
          },
        };
      }

      case "update": {
        const { accountId, action, ...updateData } = input;
        void action;
        const result = await updateBankAccount(accountId, updateData);
        return {
          success: true,
          data: {
            message: `Conto "${result.name}" aggiornato.`,
            results: { id: result.id, name: result.name, type: result.type },
          },
        };
      }

      case "list": {
        const accounts = await getBankAccounts(userId, input.activeOnly ?? false);
        return {
          success: true,
          data: {
            count: accounts.length,
            results: accounts.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              currency: a.currency,
              initialBalance: a.initialBalance,
              isActive: a.isActive,
            })),
          },
        };
      }

      case "delete": {
        await deleteBankAccount(input.accountId);
        return {
          success: true,
          data: { message: "Conto eliminato." },
        };
      }
    }
  },
});
