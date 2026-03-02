import { z } from "zod";
import { defineTool } from "../types";
import {
  getProtocols,
  getBodyMetrics,
  getHealthGoals,
  getHealthDashboardData,
  getDailyRoutine,
  getHealthProfile,
} from "@/features/health/queries";
import { calculateBMI, getBMICategory, formatMetricValue } from "@/features/health/helpers";

export const queryHealthStatusTool = defineTool({
  name: "query_health_status",
  description:
    "Query health status information. Get an overview of health data, supplement protocols, " +
    "body metrics, daily routine, or health goals. Read-only.",
  promptDocs: {
    trigger:
      '"come sto?", "stato salute", "cosa devo prendere oggi?", "i miei integratori", "il mio peso"',
    examples: [
      '"Come sto?"',
      '"Cosa devo prendere oggi?"',
      '"Qual è il mio peso attuale?"',
      '"Mostrami le metriche del corpo"',
    ],
    notes: [
      "Tool read-only — per modifiche usa manage_supplement_protocol, log_body_metric, manage_health_goal",
    ],
  },
  schema: z.object({
    aspect: z
      .enum(["overview", "supplements", "metrics", "goals", "routine"])
      .describe(
        "What to query: 'overview' (general health dashboard), 'supplements' (protocols & supplements), " +
          "'metrics' (body measurements), 'goals' (health goals), 'routine' (today's supplement schedule)"
      ),
    metricType: z
      .string()
      .optional()
      .describe("Filter metrics by type (e.g., 'weight', 'body_fat')"),
    dateRange: z
      .object({
        from: z.string().optional().describe("Start date (ISO 8601)"),
        to: z.string().optional().describe("End date (ISO 8601)"),
      })
      .optional()
      .describe("Date range for metrics"),
  }),
  async execute(input, userId) {
    switch (input.aspect) {
      case "overview": {
        const [dashboard, profile] = await Promise.all([
          getHealthDashboardData(userId),
          getHealthProfile(userId),
        ]);

        let bmiInfo = null;
        if (dashboard.latestWeight && profile?.height) {
          const bmi = calculateBMI(
            parseFloat(dashboard.latestWeight.value),
            parseFloat(profile.height)
          );
          if (bmi) {
            bmiInfo = { value: bmi, category: getBMICategory(bmi) };
          }
        }

        return {
          success: true,
          data: {
            results: {
              activeProtocols: dashboard.activeProtocols.map((p) => ({
                name: p.name,
                supplementCount: p.supplementCount,
              })),
              activeSupplementsCount: dashboard.activeSupplementsCount,
              latestWeight: dashboard.latestWeight
                ? formatMetricValue(
                    dashboard.latestWeight.value,
                    dashboard.latestWeight.unit ?? "kg"
                  )
                : null,
              bmi: bmiInfo,
              activeGoals: dashboard.activeGoals.map((g) => ({
                title: g.title,
                status: g.status,
                currentValue: g.currentValue,
                targetValue: g.targetValue,
                targetUnit: g.targetUnit,
              })),
            },
          },
        };
      }

      case "supplements": {
        const protocols = await getProtocols(userId);
        return {
          success: true,
          data: {
            count: protocols.length,
            results: protocols.map((p) => ({
              id: p.id,
              name: p.name,
              isActive: p.isActive,
              supplementCount: p.supplementCount,
              description: p.description,
            })),
          },
        };
      }

      case "metrics": {
        const filters: Record<string, unknown> = {};
        if (input.metricType) filters.metricType = input.metricType;
        if (input.dateRange?.from) filters.from = new Date(input.dateRange.from);
        if (input.dateRange?.to) filters.to = new Date(input.dateRange.to);

        const metricsData = await getBodyMetrics(userId, filters);
        return {
          success: true,
          data: {
            count: metricsData.pagination.total,
            results: metricsData.metrics.map((m) => ({
              id: m.id,
              metricType: m.metricType,
              value: m.value,
              unit: m.unit,
              measuredAt: m.measuredAt,
              notes: m.notes,
            })),
          },
        };
      }

      case "goals": {
        const goals = await getHealthGoals(userId);
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

      case "routine": {
        const routine = await getDailyRoutine(userId);
        const formatted: Record<string, unknown[]> = {};
        for (const [timeSlot, items] of Object.entries(routine)) {
          if (items.length > 0) {
            formatted[timeSlot] = items.map((item) => ({
              name: item.supplement.name,
              dosage: item.supplement.dosage,
              brand: item.supplement.brand,
              frequency: item.supplement.frequency,
              protocol: item.protocolName,
            }));
          }
        }
        return {
          success: true,
          data: {
            message:
              Object.keys(formatted).length > 0
                ? "Routine giornaliera integratori"
                : "Nessun integratore nella routine di oggi",
            results: formatted,
          },
        };
      }
    }
  },
});
