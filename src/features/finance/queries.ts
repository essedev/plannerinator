/**
 * Finance Feature Queries
 *
 * Read-only database queries for the finance section.
 */

import { db } from "@/db";
import {
  transaction,
  category,
  bankAccount,
  fixedExpenseGroup,
  fixedExpense,
  budget,
  taxProfile,
  annualRevenue,
  f24Payment,
  workProfile,
  client,
  recurringInvoice,
  investment,
  cryptoHolding,
  financeSettings,
  goal,
} from "@/db/schema";
import { eq, and, isNull, desc, asc, gte, lte, sql } from "drizzle-orm";
import { transactionFilterSchema } from "./schema";

// ============================================
// TRANSACTION QUERIES
// ============================================

export async function getTransactions(userId: string, filters: unknown = {}) {
  const parsed = transactionFilterSchema.parse(filters);

  const conditions = [eq(transaction.userId, userId), isNull(transaction.deletedAt)];

  if (parsed.type) conditions.push(eq(transaction.type, parsed.type));
  if (parsed.categoryId) conditions.push(eq(transaction.categoryId, parsed.categoryId));
  if (parsed.bankAccountId) conditions.push(eq(transaction.bankAccountId, parsed.bankAccountId));
  if (parsed.from) conditions.push(gte(transaction.date, parsed.from));
  if (parsed.to) conditions.push(lte(transaction.date, parsed.to));

  const rows = await db
    .select()
    .from(transaction)
    .where(and(...conditions))
    .orderBy(desc(transaction.date), desc(transaction.createdAt))
    .limit(parsed.limit ?? 50)
    .offset(parsed.offset ?? 0);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transaction)
    .where(and(...conditions));

  return {
    transactions: rows,
    pagination: {
      total: countResult?.count ?? 0,
      limit: parsed.limit ?? 50,
      offset: parsed.offset ?? 0,
    },
  };
}

export async function getTransactionById(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(transaction)
    .where(
      and(eq(transaction.id, id), eq(transaction.userId, userId), isNull(transaction.deletedAt))
    )
    .limit(1);
  return row ?? null;
}

// ============================================
// CATEGORY QUERIES
// ============================================

export async function getCategories(userId: string, type?: "income" | "expense" | "transfer") {
  const conditions = [eq(category.userId, userId), isNull(category.deletedAt)];
  if (type) conditions.push(eq(category.type, type));

  return db
    .select()
    .from(category)
    .where(and(...conditions))
    .orderBy(asc(category.sortOrder), asc(category.name));
}

// ============================================
// BANK ACCOUNT QUERIES
// ============================================

export async function getBankAccounts(userId: string, activeOnly = false) {
  const conditions = [eq(bankAccount.userId, userId), isNull(bankAccount.deletedAt)];
  if (activeOnly) conditions.push(eq(bankAccount.isActive, true));

  return db
    .select()
    .from(bankAccount)
    .where(and(...conditions))
    .orderBy(asc(bankAccount.name));
}

export async function getAccountBalance(accountId: string, userId: string) {
  const [account] = await db
    .select()
    .from(bankAccount)
    .where(
      and(
        eq(bankAccount.id, accountId),
        eq(bankAccount.userId, userId),
        isNull(bankAccount.deletedAt)
      )
    )
    .limit(1);

  if (!account) return null;

  // SUM incoming transactions (income + transfers TO this account)
  const [incoming] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, userId),
        isNull(transaction.deletedAt),
        sql`(
          (${transaction.bankAccountId} = ${accountId} AND ${transaction.type} = 'income')
          OR (${transaction.toAccountId} = ${accountId} AND ${transaction.type} = 'transfer')
        )`
      )
    );

  // SUM outgoing transactions (expense + transfers FROM this account)
  const [outgoing] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, userId),
        isNull(transaction.deletedAt),
        sql`(
          (${transaction.bankAccountId} = ${accountId} AND ${transaction.type} IN ('expense', 'transfer'))
        )`
      )
    );

  const initial = parseFloat(account.initialBalance);
  const inc = parseFloat(incoming?.total ?? "0");
  const out = parseFloat(outgoing?.total ?? "0");

  return {
    ...account,
    currentBalance: initial + inc - out,
  };
}

// ============================================
// FIXED EXPENSE QUERIES
// ============================================

export async function getFixedExpenseGroups(userId: string) {
  const groups = await db
    .select()
    .from(fixedExpenseGroup)
    .where(and(eq(fixedExpenseGroup.userId, userId), isNull(fixedExpenseGroup.deletedAt)))
    .orderBy(asc(fixedExpenseGroup.sortOrder), asc(fixedExpenseGroup.name));

  const expenses = await db
    .select()
    .from(fixedExpense)
    .where(and(eq(fixedExpense.userId, userId), isNull(fixedExpense.deletedAt)))
    .orderBy(asc(fixedExpense.name));

  const expensesByGroup = new Map<string, typeof expenses>();
  for (const exp of expenses) {
    const list = expensesByGroup.get(exp.groupId) ?? [];
    list.push(exp);
    expensesByGroup.set(exp.groupId, list);
  }

  return groups.map((g) => ({
    ...g,
    expenses: expensesByGroup.get(g.id) ?? [],
  }));
}

// ============================================
// BUDGET QUERIES
// ============================================

export async function getBudgetsForMonth(userId: string, month: string) {
  const budgets = await db
    .select()
    .from(budget)
    .where(and(eq(budget.userId, userId), eq(budget.month, month)));

  // Get actual spending per category for this month
  const nextMonth = getNextMonth(month);

  const spending = await db
    .select({
      categoryId: transaction.categoryId,
      spent: sql<string>`coalesce(sum(${transaction.amount}), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, userId),
        eq(transaction.type, "expense"),
        gte(transaction.date, month),
        lte(transaction.date, nextMonth),
        isNull(transaction.deletedAt)
      )
    )
    .groupBy(transaction.categoryId);

  const spentMap = new Map(spending.map((s) => [s.categoryId, parseFloat(s.spent)]));

  return budgets.map((b) => ({
    ...b,
    spent: spentMap.get(b.categoryId) ?? 0,
  }));
}

// ============================================
// FISCAL QUERIES
// ============================================

export async function getTaxProfile(userId: string) {
  const [row] = await db.select().from(taxProfile).where(eq(taxProfile.userId, userId)).limit(1);
  return row ?? null;
}

export async function getAnnualRevenues(userId: string) {
  return db
    .select()
    .from(annualRevenue)
    .where(eq(annualRevenue.userId, userId))
    .orderBy(desc(annualRevenue.year));
}

export async function getF24Payments(userId: string, paidFilter?: boolean) {
  const conditions = [eq(f24Payment.userId, userId), isNull(f24Payment.deletedAt)];
  if (paidFilter !== undefined) conditions.push(eq(f24Payment.isPaid, paidFilter));

  return db
    .select()
    .from(f24Payment)
    .where(and(...conditions))
    .orderBy(desc(f24Payment.date));
}

// ============================================
// WORK QUERIES
// ============================================

export async function getWorkProfile(userId: string) {
  const [row] = await db.select().from(workProfile).where(eq(workProfile.userId, userId)).limit(1);
  return row ?? null;
}

export async function getClients(userId: string, activeOnly = false) {
  const conditions = [eq(client.userId, userId), isNull(client.deletedAt)];
  if (activeOnly) conditions.push(eq(client.isActive, true));

  return db
    .select()
    .from(client)
    .where(and(...conditions))
    .orderBy(asc(client.name));
}

export async function getRecurringInvoices(userId: string) {
  return db
    .select()
    .from(recurringInvoice)
    .where(and(eq(recurringInvoice.userId, userId), isNull(recurringInvoice.deletedAt)))
    .orderBy(asc(recurringInvoice.nextDueDate));
}

// ============================================
// INVESTMENT QUERIES
// ============================================

export async function getInvestments(userId: string) {
  return db
    .select()
    .from(investment)
    .where(and(eq(investment.userId, userId), isNull(investment.deletedAt)))
    .orderBy(asc(investment.name));
}

export async function getCryptoHoldings(userId: string) {
  return db
    .select()
    .from(cryptoHolding)
    .where(and(eq(cryptoHolding.userId, userId), isNull(cryptoHolding.deletedAt)))
    .orderBy(asc(cryptoHolding.symbol));
}

// ============================================
// SETTINGS QUERIES
// ============================================

export async function getFinanceSettings(userId: string) {
  const [row] = await db
    .select()
    .from(financeSettings)
    .where(eq(financeSettings.userId, userId))
    .limit(1);
  return row ?? null;
}

// ============================================
// FINANCE GOAL QUERIES
// ============================================

export async function getFinanceGoals(userId: string, statusFilter?: string) {
  const conditions = [eq(goal.userId, userId), eq(goal.domain, "finance"), isNull(goal.deletedAt)];

  if (statusFilter) {
    conditions.push(
      eq(goal.status, statusFilter as "active" | "paused" | "completed" | "abandoned")
    );
  }

  return db
    .select()
    .from(goal)
    .where(and(...conditions))
    .orderBy(desc(goal.createdAt));
}

export async function getFinanceGoalById(id: string, userId: string) {
  const [result] = await db
    .select()
    .from(goal)
    .where(and(eq(goal.id, id), eq(goal.userId, userId), isNull(goal.deletedAt)))
    .limit(1);

  return result ?? null;
}

// ============================================
// DASHBOARD AGGREGATE QUERY
// ============================================

export async function getFinanceDashboardData(userId: string) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [accounts, monthlyIncome, monthlyExpenses, activeGoals, unpaidF24Count] = await Promise.all(
    [
      getBankAccounts(userId, true),

      // Monthly income total
      db
        .select({ total: sql<string>`coalesce(sum(${transaction.amount}), 0)` })
        .from(transaction)
        .where(
          and(
            eq(transaction.userId, userId),
            eq(transaction.type, "income"),
            gte(transaction.date, currentMonth),
            isNull(transaction.deletedAt)
          )
        ),

      // Monthly expense total
      db
        .select({ total: sql<string>`coalesce(sum(${transaction.amount}), 0)` })
        .from(transaction)
        .where(
          and(
            eq(transaction.userId, userId),
            eq(transaction.type, "expense"),
            gte(transaction.date, currentMonth),
            isNull(transaction.deletedAt)
          )
        ),

      // Active finance goals
      db
        .select()
        .from(goal)
        .where(
          and(
            eq(goal.userId, userId),
            eq(goal.domain, "finance"),
            eq(goal.status, "active"),
            isNull(goal.deletedAt)
          )
        ),

      // Unpaid F24 count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(f24Payment)
        .where(
          and(
            eq(f24Payment.userId, userId),
            eq(f24Payment.isPaid, false),
            isNull(f24Payment.deletedAt)
          )
        ),
    ]
  );

  return {
    accounts,
    monthlyIncome: parseFloat(monthlyIncome[0]?.total ?? "0"),
    monthlyExpenses: parseFloat(monthlyExpenses[0]?.total ?? "0"),
    activeGoals,
    unpaidF24Count: unpaidF24Count[0]?.count ?? 0,
  };
}

// ============================================
// MONTHLY SUMMARY QUERY
// ============================================

export async function getMonthlySummary(userId: string, from: string, to: string) {
  const rows = await db
    .select({
      month: sql<string>`to_char(${transaction.date}::date, 'YYYY-MM-01')`,
      type: transaction.type,
      total: sql<string>`coalesce(sum(${transaction.amount}), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, userId),
        gte(transaction.date, from),
        lte(transaction.date, to),
        isNull(transaction.deletedAt)
      )
    )
    .groupBy(sql`to_char(${transaction.date}::date, 'YYYY-MM-01')`, transaction.type)
    .orderBy(sql`to_char(${transaction.date}::date, 'YYYY-MM-01')`);

  // Group by month
  const result: Record<string, { income: number; expenses: number }> = {};
  for (const row of rows) {
    if (!result[row.month]) result[row.month] = { income: 0, expenses: 0 };
    if (row.type === "income") result[row.month].income = parseFloat(row.total);
    if (row.type === "expense") result[row.month].expenses = parseFloat(row.total);
  }

  return result;
}

// ============================================
// HELPERS
// ============================================

function getNextMonth(month: string): string {
  const date = new Date(month);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}
