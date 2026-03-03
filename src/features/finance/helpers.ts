/**
 * Finance Feature Helpers
 *
 * Pure utility functions for financial calculations and formatting.
 */

/**
 * Format a numeric string as EUR currency.
 */
export function formatCurrency(amount: string | number, currency = "EUR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Calculate budget progress: spent / planned as percentage (0-100).
 */
export function calculateBudgetProgress(spent: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.min(100, Math.round((spent / planned) * 100));
}

/**
 * Normalize a recurring amount to its monthly equivalent.
 *
 * monthly     → × 1
 * bimonthly   → ÷ 2
 * quarterly   → ÷ 3
 * semiannual  → ÷ 6
 * annual      → ÷ 12
 */
export function normalizeToMonthly(amount: string | number, frequency: string): number {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;

  const divisors: Record<string, number> = {
    monthly: 1,
    bimonthly: 2,
    quarterly: 3,
    semiannual: 6,
    annual: 12,
  };

  return num / (divisors[frequency] ?? 1);
}

/**
 * Calculate Forfettario regime taxes.
 *
 * 1. revenue × coefficiente = reddito imponibile
 * 2. reddito imponibile × INPS rate = contributi INPS
 * 3. (reddito imponibile - contributi INPS) × tax rate = imposta sostitutiva
 */
export function calculateForfettarioTax(params: {
  revenue: number;
  coefficienteRedditività: number; // e.g. 0.78
  inpsRate: number; // e.g. 0.2607
  taxRate: number; // e.g. 0.05 or 0.15
  inpsMinimum?: number;
}): {
  redditoImponibile: number;
  contributiInps: number;
  impostaSostitutiva: number;
  totaleTasse: number;
  nettoStimato: number;
} {
  const { revenue, coefficienteRedditività, inpsRate, taxRate, inpsMinimum = 0 } = params;

  const redditoImponibile = revenue * coefficienteRedditività;
  const contributiInps = Math.max(redditoImponibile * inpsRate, inpsMinimum);
  const baseImponibile = Math.max(0, redditoImponibile - contributiInps);
  const impostaSostitutiva = baseImponibile * taxRate;
  const totaleTasse = contributiInps + impostaSostitutiva;

  return {
    redditoImponibile: round2(redditoImponibile),
    contributiInps: round2(contributiInps),
    impostaSostitutiva: round2(impostaSostitutiva),
    totaleTasse: round2(totaleTasse),
    nettoStimato: round2(revenue - totaleTasse),
  };
}

/**
 * Get the first day of month for a given date string.
 * "2026-03-15" → "2026-03-01"
 */
export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

/**
 * Calculate net patrimony from accounts and investments.
 */
export function calculateNetPatrimony(params: {
  accountBalances: number[];
  investmentValues: number[];
  cryptoValues: number[];
}): number {
  const accounts = params.accountBalances.reduce((a, b) => a + b, 0);
  const investments = params.investmentValues.reduce((a, b) => a + b, 0);
  const crypto = params.cryptoValues.reduce((a, b) => a + b, 0);
  return round2(accounts + investments + crypto);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
