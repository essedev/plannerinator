import { z } from "zod";
import { defineTool } from "../types";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/features/finance/actions";
import { getTransactions } from "@/features/finance/queries";

export const manageFinanceTransactionTool = defineTool({
  name: "manage_finance_transaction",
  description:
    "Manage financial transactions. Create, update, list, or delete income, expense, " +
    "and transfer records.",
  promptDocs: {
    trigger:
      '"registra spesa", "entrata", "uscita", "transazione", "ho speso", "ho guadagnato", "trasferimento"',
    examples: [
      '"Registra una spesa di 45 euro per la spesa al supermercato"',
      '"Ho ricevuto 2500 euro di stipendio"',
      '"Mostrami le transazioni di questo mese"',
      '"Trasferisci 500 euro dal conto corrente al risparmio"',
    ],
    notes: [
      "Tipi: income (entrata), expense (uscita), transfer (trasferimento)",
      "L'importo è sempre positivo — il tipo determina il segno",
      "Per trasferimenti: bankAccountId = da, toAccountId = a",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("create").describe("Create a new transaction"),
      type: z.enum(["income", "expense", "transfer"]).describe("Transaction type"),
      amount: z.string().describe("Amount (positive, e.g. '45.50')"),
      date: z.string().describe("Date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Transaction description"),
      categoryId: z.string().optional().describe("Category UUID"),
      bankAccountId: z.string().optional().describe("Source bank account UUID"),
      toAccountId: z.string().optional().describe("Destination account UUID (transfers only)"),
      notes: z.string().optional().describe("Additional notes"),
    }),
    z.object({
      action: z.literal("update").describe("Update an existing transaction"),
      transactionId: z.string().describe("Transaction UUID"),
      type: z.enum(["income", "expense", "transfer"]).optional(),
      amount: z.string().optional(),
      date: z.string().optional(),
      description: z.string().optional(),
      categoryId: z.string().optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("list").describe("List transactions with optional filters"),
      type: z.enum(["income", "expense", "transfer"]).optional().describe("Filter by type"),
      from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      to: z.string().optional().describe("End date (YYYY-MM-DD)"),
      limit: z.number().optional().describe("Max results (default 20)"),
    }),
    z.object({
      action: z.literal("delete").describe("Delete a transaction"),
      transactionId: z.string().describe("Transaction UUID"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "create": {
        const result = await createTransaction({
          type: input.type,
          amount: input.amount,
          date: input.date,
          description: input.description ?? null,
          categoryId: input.categoryId ?? null,
          bankAccountId: input.bankAccountId ?? null,
          toAccountId: input.toAccountId ?? null,
          notes: input.notes ?? null,
        });
        const typeLabel =
          input.type === "income"
            ? "Entrata"
            : input.type === "expense"
              ? "Uscita"
              : "Trasferimento";
        return {
          success: true,
          data: {
            message: `${typeLabel} di ${input.amount} EUR registrata.`,
            results: {
              id: result.id,
              type: result.type,
              amount: result.amount,
              date: result.date,
              description: result.description,
            },
          },
        };
      }

      case "update": {
        const { transactionId, action, ...updateData } = input;
        void action;
        const result = await updateTransaction(transactionId, updateData);
        return {
          success: true,
          data: {
            message: `Transazione aggiornata.`,
            results: {
              id: result.id,
              type: result.type,
              amount: result.amount,
              date: result.date,
            },
          },
        };
      }

      case "list": {
        const { transactions, pagination } = await getTransactions(userId, {
          type: input.type,
          from: input.from,
          to: input.to,
          limit: input.limit ?? 20,
        });
        return {
          success: true,
          data: {
            count: pagination.total,
            results: transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              date: t.date,
              description: t.description,
              categoryId: t.categoryId,
            })),
          },
        };
      }

      case "delete": {
        await deleteTransaction(input.transactionId);
        return {
          success: true,
          data: { message: "Transazione eliminata." },
        };
      }
    }
  },
});
