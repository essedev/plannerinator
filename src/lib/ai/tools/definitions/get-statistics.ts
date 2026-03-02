import { z } from "zod";
import { defineTool } from "../types";
import { db } from "@/db";
import { task, event, project } from "@/db/schema";
import { eq, and, gte, lt, ne, sql, isNull } from "drizzle-orm";
import { resolveProjectByName } from "../utils";

export const getStatisticsTool = defineTool({
  name: "get_statistics",
  description:
    "Get productivity statistics and insights. Use when the user asks questions about their progress, " +
    "completion rates, overdue items, or wants a summary of their work. " +
    "Can filter by project for project-specific stats.",
  promptDocs: {
    trigger: '"statistiche", "quanti completati", "progressi", "overview", "riepilogo"',
    notes: [
      "Metriche: tasks_completed_today/this_week/this_month, overdue_tasks, upcoming_events, tasks_by_priority, tasks_by_status, project_progress",
    ],
  },
  schema: z.object({
    metric: z
      .enum([
        "tasks_completed_today",
        "tasks_completed_this_week",
        "tasks_completed_this_month",
        "overdue_tasks",
        "upcoming_events",
        "project_progress",
        "tasks_by_priority",
        "tasks_by_status",
      ])
      .describe("The metric/statistic to retrieve"),
    projectName: z.string().optional().describe("Optional: Filter stats by specific project name"),
  }),
  async execute(input, userId) {
    try {
      const { metric, projectName } = input;

      let projectId: string | null = null;
      if (projectName) {
        projectId = await resolveProjectByName(projectName);
      }

      switch (metric) {
        case "tasks_completed_today": {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const whereConditions = [
            eq(task.userId, userId),
            eq(task.status, "done"),
            gte(task.completedAt, today),
          ];
          if (projectId) whereConditions.push(eq(task.projectId, projectId));

          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(task)
            .where(and(...whereConditions));

          return {
            success: true,
            data: {
              metric: "tasks_completed_today",
              value: Number(count[0].count),
            },
          };
        }

        case "tasks_completed_this_week": {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);

          const whereConditions = [
            eq(task.userId, userId),
            eq(task.status, "done"),
            gte(task.completedAt, weekStart),
          ];
          if (projectId) whereConditions.push(eq(task.projectId, projectId));

          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(task)
            .where(and(...whereConditions));

          return {
            success: true,
            data: {
              metric: "tasks_completed_this_week",
              value: Number(count[0].count),
            },
          };
        }

        case "tasks_completed_this_month": {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const whereConditions = [
            eq(task.userId, userId),
            eq(task.status, "done"),
            gte(task.completedAt, monthStart),
          ];
          if (projectId) whereConditions.push(eq(task.projectId, projectId));

          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(task)
            .where(and(...whereConditions));

          return {
            success: true,
            data: {
              metric: "tasks_completed_this_month",
              value: Number(count[0].count),
            },
          };
        }

        case "overdue_tasks": {
          const now = new Date();

          const whereConditions = [
            eq(task.userId, userId),
            ne(task.status, "done"),
            ne(task.status, "cancelled"),
            lt(task.dueDate, now),
            isNull(task.deletedAt),
          ];
          if (projectId) whereConditions.push(eq(task.projectId, projectId));

          const overdueTasks = await db
            .select()
            .from(task)
            .where(and(...whereConditions))
            .limit(10);

          return {
            success: true,
            data: {
              metric: "overdue_tasks",
              count: overdueTasks.length,
              tasks: overdueTasks.map((t) => ({
                id: t.id,
                title: t.title,
                dueDate: t.dueDate,
                priority: t.priority,
              })),
            },
          };
        }

        case "upcoming_events": {
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const whereConditions = [
            eq(event.userId, userId),
            gte(event.startTime, now),
            lt(event.startTime, weekFromNow),
            isNull(event.deletedAt),
          ];
          if (projectId) whereConditions.push(eq(event.projectId, projectId));

          const upcomingEvents = await db
            .select()
            .from(event)
            .where(and(...whereConditions))
            .limit(10);

          return {
            success: true,
            data: {
              metric: "upcoming_events",
              count: upcomingEvents.length,
              events: upcomingEvents.map((e) => ({
                id: e.id,
                title: e.title,
                startTime: e.startTime,
                endTime: e.endTime,
              })),
            },
          };
        }

        case "project_progress": {
          const projectConditions = [eq(project.userId, userId), isNull(project.deletedAt)];

          const projects = await db
            .select()
            .from(project)
            .where(and(...projectConditions));

          const progressData: Record<string, { total: number; done: number; name: string }> = {};

          for (const p of projects) {
            if (projectId && p.id !== projectId) continue;

            const taskConditions = [
              eq(task.userId, userId),
              eq(task.projectId, p.id),
              isNull(task.deletedAt),
            ];

            const allTasks = await db
              .select({ count: sql<number>`count(*)` })
              .from(task)
              .where(and(...taskConditions));

            const doneTasks = await db
              .select({ count: sql<number>`count(*)` })
              .from(task)
              .where(and(...taskConditions, eq(task.status, "done")));

            progressData[p.id] = {
              name: p.name,
              total: Number(allTasks[0].count),
              done: Number(doneTasks[0].count),
            };
          }

          const breakdown: Record<string, number> = {};
          for (const [, data] of Object.entries(progressData)) {
            const percentage = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
            breakdown[data.name] = percentage;
          }

          return {
            success: true,
            data: {
              metric: "project_progress",
              breakdown,
            },
          };
        }

        case "tasks_by_priority": {
          const whereConditions = [
            eq(task.userId, userId),
            isNull(task.deletedAt),
            ne(task.status, "done"),
            ne(task.status, "cancelled"),
          ];
          if (projectId) whereConditions.push(eq(task.projectId, projectId));

          const tasks = await db
            .select()
            .from(task)
            .where(and(...whereConditions));

          const byPriority = tasks.reduce(
            (acc, t) => {
              const priority = t.priority || "medium";
              acc[priority] = (acc[priority] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          return {
            success: true,
            data: {
              metric: "tasks_by_priority",
              breakdown: byPriority,
              total: tasks.length,
            },
          };
        }

        case "tasks_by_status": {
          const whereConditions = [eq(task.userId, userId), isNull(task.deletedAt)];
          if (projectId) whereConditions.push(eq(task.projectId, projectId));

          const tasks = await db
            .select()
            .from(task)
            .where(and(...whereConditions));

          const byStatus = tasks.reduce(
            (acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          return {
            success: true,
            data: {
              metric: "tasks_by_status",
              breakdown: byStatus,
              total: tasks.length,
            },
          };
        }

        default:
          return {
            success: false,
            error: `Unknown metric: ${metric}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to get statistics: ${error}`,
      };
    }
  },
});
