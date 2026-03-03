import { z } from "zod";
import { defineTool } from "../types";
import {
  getFinanceDashboardData,
  getBankAccounts,
  getAccountBalance,
  getBudgetsForMonth,
  getCategories,
  getInvestments,
  getCryptoHoldings,
  getFinanceGoals,
  getFixedExpenseGroups,
} from "@/features/finance/queries";
import { formatCurrency, normalizeToMonthly, getMonthKey } from "@/features/finance/helpers";
import { getCryptoPrices } from "@/features/finance/coingecko";

export const queryFinanceStatusTool = defineTool({
  name: "query_finance_status",
  description:
    "Query financial status information. Get an overview of finances, account balances, " +
    "budget progress, investments, or fixed expenses. Read-only.",
  promptDocs: {
    trigger:
      '"come vanno le finanze?", "quanto ho speso?", "il mio budget", "i miei conti", "investimenti", "spese fisse"',
    examples: [
      '"Come vanno le finanze questo mese?"',
      '"Quanto ho sul conto corrente?"',
      '"Come va il budget di marzo?"',
      '"Mostrami i miei investimenti"',
      '"Quanto spendo di spese fisse al mese?"',
    ],
    notes: [
      "Tool read-only — per modifiche usa manage_finance_transaction, manage_finance_account, manage_finance_goal",
    ],
  },
  schema: z.object({
    aspect: z
      .enum(["overview", "accounts", "budget", "investments", "fixed_expenses", "goals"])
      .describe(
        "What to query: 'overview' (monthly summary), 'accounts' (balances), " +
          "'budget' (monthly budget vs actual), 'investments' (portfolio), " +
          "'fixed_expenses' (recurring bills), 'goals' (finance goals)"
      ),
    month: z
      .string()
      .optional()
      .describe("Month for budget queries (YYYY-MM-DD, first of month). Defaults to current."),
    accountId: z.string().optional().describe("Specific account UUID for balance query"),
  }),
  async execute(input, userId) {
    switch (input.aspect) {
      case "overview": {
        const data = await getFinanceDashboardData(userId);
        return {
          success: true,
          data: {
            results: {
              monthlyIncome: formatCurrency(data.monthlyIncome),
              monthlyExpenses: formatCurrency(data.monthlyExpenses),
              netMonth: formatCurrency(data.monthlyIncome - data.monthlyExpenses),
              activeAccounts: data.accounts.length,
              activeGoals: data.activeGoals.length,
              unpaidF24: data.unpaidF24Count,
            },
          },
        };
      }

      case "accounts": {
        if (input.accountId) {
          const balance = await getAccountBalance(input.accountId, userId);
          if (!balance) {
            return { success: false, error: "Conto non trovato." };
          }
          return {
            success: true,
            data: {
              results: {
                id: balance.id,
                name: balance.name,
                type: balance.type,
                currentBalance: formatCurrency(balance.currentBalance),
              },
            },
          };
        }

        const accounts = await getBankAccounts(userId, true);
        const balances = await Promise.all(
          accounts.map(async (a) => {
            const b = await getAccountBalance(a.id, userId);
            return {
              id: a.id,
              name: a.name,
              type: a.type,
              currentBalance: b ? formatCurrency(b.currentBalance) : "N/A",
            };
          })
        );
        return {
          success: true,
          data: {
            count: balances.length,
            results: balances,
          },
        };
      }

      case "budget": {
        const month = input.month ?? getMonthKey(new Date().toISOString().slice(0, 10));
        const [budgets, categories] = await Promise.all([
          getBudgetsForMonth(userId, month),
          getCategories(userId, "expense"),
        ]);

        const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

        return {
          success: true,
          data: {
            count: budgets.length,
            results: budgets.map((b) => ({
              category: categoryMap.get(b.categoryId) ?? "Sconosciuta",
              planned: formatCurrency(b.plannedAmount),
              spent: formatCurrency(b.spent),
              remaining: formatCurrency(parseFloat(b.plannedAmount) - b.spent),
              overBudget: b.spent > parseFloat(b.plannedAmount),
            })),
          },
        };
      }

      case "investments": {
        const [investments, crypto] = await Promise.all([
          getInvestments(userId),
          getCryptoHoldings(userId),
        ]);

        // Fetch live crypto prices
        const symbols = crypto.map((c) => c.symbol);
        const livePrices = symbols.length > 0 ? await getCryptoPrices(symbols) : {};

        return {
          success: true,
          data: {
            results: {
              investments: investments.map((i) => ({
                id: i.id,
                name: i.name,
                type: i.type,
                ticker: i.ticker,
                quantity: i.quantity,
                currentValue: i.currentValue ? formatCurrency(i.currentValue) : null,
              })),
              crypto: crypto.map((c) => {
                const livePrice = livePrices[c.symbol.toUpperCase()];
                const totalValue = livePrice ? parseFloat(c.quantity) * livePrice : null;
                return {
                  id: c.id,
                  symbol: c.symbol,
                  name: c.name,
                  quantity: c.quantity,
                  exchange: c.exchange,
                  livePrice: livePrice ? formatCurrency(livePrice) : null,
                  totalValue: totalValue ? formatCurrency(totalValue) : null,
                };
              }),
            },
          },
        };
      }

      case "fixed_expenses": {
        const groups = await getFixedExpenseGroups(userId);
        let totalMonthly = 0;

        const formatted = groups.map((g) => {
          const groupMonthly = g.expenses
            .filter((e) => e.isActive)
            .reduce((s, e) => s + normalizeToMonthly(e.amount, e.frequency), 0);
          totalMonthly += groupMonthly;

          return {
            group: g.name,
            monthlyTotal: formatCurrency(groupMonthly),
            expenses: g.expenses.map((e) => ({
              name: e.name,
              amount: formatCurrency(e.amount),
              frequency: e.frequency,
              isActive: e.isActive,
            })),
          };
        });

        return {
          success: true,
          data: {
            message: `Spese fisse totali: ${formatCurrency(totalMonthly)}/mese`,
            results: formatted,
          },
        };
      }

      case "goals": {
        const goals = await getFinanceGoals(userId);
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
              targetDate: g.targetDate,
            })),
          },
        };
      }
    }
  },
});
