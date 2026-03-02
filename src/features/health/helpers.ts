/**
 * Health Feature Helpers
 *
 * Utility functions for health calculations and formatting.
 */

/**
 * Calculate BMI from weight (kg) and height (cm).
 * Returns null if inputs are invalid.
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category label.
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Sottopeso";
  if (bmi < 25) return "Normopeso";
  if (bmi < 30) return "Sovrappeso";
  return "Obeso";
}

/**
 * Calculate trend from an array of metric values.
 * Compares the average of the last 3 values to the average of the previous 3.
 */
export function getMetricTrend(
  metrics: { value: string; measuredAt: Date }[]
): "up" | "down" | "stable" | null {
  if (metrics.length < 2) return null;

  const values = metrics.map((m) => parseFloat(m.value)).filter((v) => !isNaN(v));

  if (values.length < 2) return null;

  const recent = values.slice(0, Math.min(3, values.length));
  const previous = values.slice(Math.min(3, values.length), Math.min(6, values.length));

  if (previous.length === 0) {
    // Only compare first and last
    const diff = recent[0] - recent[recent.length - 1];
    if (Math.abs(diff) < 0.1) return "stable";
    return diff > 0 ? "up" : "down";
  }

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;

  const diff = recentAvg - previousAvg;
  const threshold = previousAvg * 0.01; // 1% threshold

  if (Math.abs(diff) < threshold) return "stable";
  return diff > 0 ? "up" : "down";
}

/**
 * Format a metric value with its unit.
 */
export function formatMetricValue(value: string, unit?: string | null): string {
  if (!unit) return value;
  return `${value} ${unit}`;
}

/**
 * Calculate goal progress as a percentage (0-100).
 */
export function calculateGoalProgress(
  currentValue: string | null,
  targetValue: string | null,
  startValue?: string | null
): number | null {
  if (!currentValue || !targetValue) return null;

  const current = parseFloat(currentValue);
  const target = parseFloat(targetValue);
  if (isNaN(current) || isNaN(target)) return null;

  const start = startValue ? parseFloat(startValue) : 0;
  if (isNaN(start)) return null;

  const totalRange = Math.abs(target - start);
  if (totalRange === 0) return current === target ? 100 : 0;

  const progress = Math.abs(current - start) / totalRange;
  return Math.min(100, Math.max(0, Math.round(progress * 100)));
}
