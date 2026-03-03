/**
 * User Stats Query
 *
 * Fetches dynamic statistics for context-aware prompts.
 */

import { db } from "@/db";
import {
  task,
  event,
  project,
  supplementProtocol,
  supplement,
  bodyMetric,
  goal,
  transaction,
  bankAccount,
  f24Payment,
} from "@/db/schema";
import { eq, and, gte, lt, ne, isNull, desc, sql } from "drizzle-orm";
import type { UserStats } from "./types";

/**
 * Get user statistics for prompt context
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const now = new Date();

  // Start of today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // End of today
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Start of tomorrow
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // End of tomorrow
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // Run queries in parallel for performance
  const [
    openTasksResult,
    completedTodayResult,
    dueTodayResult,
    dueTomorrowResult,
    overdueResult,
    eventsTodayResult,
    eventsTomorrowResult,
    activeProjectsResult,
    activeProtocolsResult,
    activeSupplementsResult,
    latestWeightResult,
    activeGoalsResult,
    monthlyIncomeResult,
    monthlyExpensesResult,
    activeAccountsResult,
    activeFinanceGoalsResult,
    unpaidF24Result,
  ] = await Promise.all([
    // Open tasks count
    db
      .select({ count: sql<number>`count(*)` })
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          ne(task.status, "done"),
          ne(task.status, "cancelled"),
          isNull(task.deletedAt),
          isNull(task.archivedAt)
        )
      ),

    // Tasks completed today
    db
      .select({ count: sql<number>`count(*)` })
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          eq(task.status, "done"),
          gte(task.completedAt, todayStart),
          isNull(task.deletedAt)
        )
      ),

    // Tasks due today
    db
      .select({ count: sql<number>`count(*)` })
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          ne(task.status, "done"),
          ne(task.status, "cancelled"),
          gte(task.dueDate, todayStart),
          lt(task.dueDate, tomorrowStart),
          isNull(task.deletedAt),
          isNull(task.archivedAt)
        )
      ),

    // Tasks due tomorrow
    db
      .select({ count: sql<number>`count(*)` })
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          ne(task.status, "done"),
          ne(task.status, "cancelled"),
          gte(task.dueDate, tomorrowStart),
          lt(task.dueDate, tomorrowEnd),
          isNull(task.deletedAt),
          isNull(task.archivedAt)
        )
      ),

    // Overdue tasks
    db
      .select({ count: sql<number>`count(*)` })
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          ne(task.status, "done"),
          ne(task.status, "cancelled"),
          lt(task.dueDate, todayStart),
          isNull(task.deletedAt),
          isNull(task.archivedAt)
        )
      ),

    // Events today
    db
      .select({ count: sql<number>`count(*)` })
      .from(event)
      .where(
        and(
          eq(event.userId, userId),
          gte(event.startTime, todayStart),
          lt(event.startTime, tomorrowStart),
          isNull(event.deletedAt),
          isNull(event.archivedAt)
        )
      ),

    // Events tomorrow
    db
      .select({ count: sql<number>`count(*)` })
      .from(event)
      .where(
        and(
          eq(event.userId, userId),
          gte(event.startTime, tomorrowStart),
          lt(event.startTime, tomorrowEnd),
          isNull(event.deletedAt),
          isNull(event.archivedAt)
        )
      ),

    // Active projects with names
    db
      .select({ name: project.name })
      .from(project)
      .where(
        and(
          eq(project.userId, userId),
          eq(project.status, "active"),
          isNull(project.deletedAt),
          isNull(project.archivedAt)
        )
      )
      .limit(5),

    // Health: Active protocols count
    db
      .select({ count: sql<number>`count(*)` })
      .from(supplementProtocol)
      .where(
        and(
          eq(supplementProtocol.userId, userId),
          eq(supplementProtocol.isActive, true),
          isNull(supplementProtocol.deletedAt)
        )
      ),

    // Health: Active supplements count
    db
      .select({ count: sql<number>`count(*)` })
      .from(supplement)
      .innerJoin(supplementProtocol, eq(supplement.protocolId, supplementProtocol.id))
      .where(
        and(
          eq(supplement.userId, userId),
          eq(supplement.isActive, true),
          eq(supplementProtocol.isActive, true),
          isNull(supplement.deletedAt),
          isNull(supplementProtocol.deletedAt)
        )
      ),

    // Health: Latest weight
    db
      .select({ value: bodyMetric.value, measuredAt: bodyMetric.measuredAt })
      .from(bodyMetric)
      .where(
        and(
          eq(bodyMetric.userId, userId),
          eq(bodyMetric.metricType, "weight"),
          isNull(bodyMetric.deletedAt)
        )
      )
      .orderBy(desc(bodyMetric.measuredAt))
      .limit(1),

    // Health: Active goals count
    db
      .select({ count: sql<number>`count(*)` })
      .from(goal)
      .where(
        and(
          eq(goal.userId, userId),
          eq(goal.domain, "health"),
          eq(goal.status, "active"),
          isNull(goal.deletedAt)
        )
      ),

    // Finance: Monthly income
    db
      .select({ total: sql<string>`coalesce(sum(${transaction.amount}), 0)` })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, userId),
          eq(transaction.type, "income"),
          gte(
            transaction.date,
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
          ),
          isNull(transaction.deletedAt)
        )
      ),

    // Finance: Monthly expenses
    db
      .select({ total: sql<string>`coalesce(sum(${transaction.amount}), 0)` })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, userId),
          eq(transaction.type, "expense"),
          gte(
            transaction.date,
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
          ),
          isNull(transaction.deletedAt)
        )
      ),

    // Finance: Active accounts count
    db
      .select({ count: sql<number>`count(*)` })
      .from(bankAccount)
      .where(
        and(
          eq(bankAccount.userId, userId),
          eq(bankAccount.isActive, true),
          isNull(bankAccount.deletedAt)
        )
      ),

    // Finance: Active finance goals count
    db
      .select({ count: sql<number>`count(*)` })
      .from(goal)
      .where(
        and(
          eq(goal.userId, userId),
          eq(goal.domain, "finance"),
          eq(goal.status, "active"),
          isNull(goal.deletedAt)
        )
      ),

    // Finance: Unpaid F24 count
    db
      .select({ count: sql<number>`count(*)` })
      .from(f24Payment)
      .where(
        and(
          eq(f24Payment.userId, userId),
          eq(f24Payment.isPaid, false),
          isNull(f24Payment.deletedAt)
        )
      ),
  ]);

  // Build latest weight info
  let latestWeightInfo: { value: string; date: string } | undefined;
  if (latestWeightResult[0]) {
    const daysAgo = Math.floor(
      (now.getTime() - new Date(latestWeightResult[0].measuredAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    latestWeightInfo = {
      value: latestWeightResult[0].value,
      date: daysAgo === 0 ? "oggi" : daysAgo === 1 ? "ieri" : `${daysAgo} giorni fa`,
    };
  }

  return {
    tasksOpenCount: Number(openTasksResult[0]?.count ?? 0),
    tasksCompletedToday: Number(completedTodayResult[0]?.count ?? 0),
    tasksDueToday: Number(dueTodayResult[0]?.count ?? 0),
    tasksDueTomorrow: Number(dueTomorrowResult[0]?.count ?? 0),
    tasksOverdue: Number(overdueResult[0]?.count ?? 0),
    eventsToday: Number(eventsTodayResult[0]?.count ?? 0),
    eventsTomorrow: Number(eventsTomorrowResult[0]?.count ?? 0),
    activeProjectsCount: activeProjectsResult.length,
    recentProjectNames: activeProjectsResult.map((p) => p.name),
    activeProtocolsCount: Number(activeProtocolsResult[0]?.count ?? 0),
    activeSupplementsCount: Number(activeSupplementsResult[0]?.count ?? 0),
    latestWeight: latestWeightInfo,
    activeHealthGoalsCount: Number(activeGoalsResult[0]?.count ?? 0),
    monthlyIncome: parseFloat((monthlyIncomeResult[0] as { total: string })?.total ?? "0"),
    monthlyExpenses: parseFloat((monthlyExpensesResult[0] as { total: string })?.total ?? "0"),
    activeAccountsCount: Number(activeAccountsResult[0]?.count ?? 0),
    activeFinanceGoalsCount: Number(activeFinanceGoalsResult[0]?.count ?? 0),
    unpaidF24Count: Number(unpaidF24Result[0]?.count ?? 0),
  };
}
