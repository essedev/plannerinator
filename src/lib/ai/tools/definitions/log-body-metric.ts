import { z } from "zod";
import { defineTool } from "../types";
import { logBodyMetric } from "@/features/health/actions";

export const logBodyMetricTool = defineTool({
  name: "log_body_metric",
  description:
    "Log a body metric measurement (weight, body fat, blood pressure, heart rate, etc.). " +
    "Used for tracking health data over time.",
  promptDocs: {
    trigger: '"peso", "registra", "logga", "segna", "il mio peso è", "peso oggi"',
    examples: [
      '"Il mio peso è 76.5"',
      '"Registra pressione 120/80"',
      '"Segna grasso corporeo 18%"',
    ],
    notes: [
      "Tipi comuni: weight (kg), body_fat (%), blood_pressure (mmHg), heart_rate (bpm), waist (cm)",
      "Il valore è stringa per supportare formati come '120/80'",
    ],
  },
  schema: z.object({
    metricType: z
      .string()
      .describe(
        "Type of metric: 'weight', 'body_fat', 'blood_pressure', 'heart_rate', 'waist', or custom"
      ),
    value: z.string().describe("Metric value as string (e.g., '76.5', '120/80')"),
    unit: z
      .string()
      .optional()
      .describe("Unit of measurement (e.g., 'kg', '%', 'mmHg', 'bpm', 'cm')"),
    measuredAt: z
      .string()
      .optional()
      .describe("ISO 8601 date-time when measured (defaults to now)"),
    notes: z.string().optional().describe("Optional notes"),
  }),
  async execute(input) {
    const result = await logBodyMetric({
      metricType: input.metricType,
      value: input.value,
      unit: input.unit ?? null,
      measuredAt: input.measuredAt ? new Date(input.measuredAt) : undefined,
      notes: input.notes ?? null,
    });

    const unitStr = result.unit ? ` ${result.unit}` : "";
    return {
      success: true,
      data: {
        message: `Metrica registrata: ${result.metricType} = ${result.value}${unitStr}`,
        results: {
          id: result.id,
          metricType: result.metricType,
          value: result.value,
          unit: result.unit,
        },
      },
    };
  },
});
