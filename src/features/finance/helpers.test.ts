import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  calculateBudgetProgress,
  normalizeToMonthly,
  calculateForfettarioTax,
  getMonthKey,
  calculateNetPatrimony,
} from "./helpers";

/**
 * Finance Helpers Tests
 *
 * Tests pure calculation functions used across the finance section.
 * Forfettario tests validated against known Italian tax calculation rules.
 */

describe("Finance Helpers", () => {
  // ============================================================================
  // FORMAT CURRENCY
  // ============================================================================

  describe("formatCurrency", () => {
    it("should format a number as EUR", () => {
      const result = formatCurrency(1234.56);
      // Node.js it-IT may or may not include thousand separator depending on ICU
      expect(result).toContain("234,56");
      expect(result).toContain("€");
    });

    it("should format a string amount", () => {
      const result = formatCurrency("500.00");
      expect(result).toContain("500,00");
      expect(result).toContain("€");
    });

    it("should return dash for NaN", () => {
      expect(formatCurrency("abc")).toBe("—");
      expect(formatCurrency(NaN)).toBe("—");
    });

    it("should format zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0,00");
    });

    it("should format negative numbers", () => {
      const result = formatCurrency(-250.5);
      expect(result).toContain("250,50");
    });

    it("should support custom currency", () => {
      const result = formatCurrency(100, "USD");
      expect(result).toContain("100,00");
      // Should use USD formatting
      expect(result).toContain("US");
    });
  });

  // ============================================================================
  // CALCULATE BUDGET PROGRESS
  // ============================================================================

  describe("calculateBudgetProgress", () => {
    it("should return 0 when nothing spent", () => {
      expect(calculateBudgetProgress(0, 500)).toBe(0);
    });

    it("should return 50 at half budget", () => {
      expect(calculateBudgetProgress(250, 500)).toBe(50);
    });

    it("should return 100 at full budget", () => {
      expect(calculateBudgetProgress(500, 500)).toBe(100);
    });

    it("should cap at 100 when over budget", () => {
      expect(calculateBudgetProgress(750, 500)).toBe(100);
    });

    it("should return 0 when planned is zero", () => {
      expect(calculateBudgetProgress(100, 0)).toBe(0);
    });

    it("should return 0 when planned is negative", () => {
      expect(calculateBudgetProgress(100, -50)).toBe(0);
    });

    it("should round to nearest integer", () => {
      expect(calculateBudgetProgress(333, 1000)).toBe(33);
      expect(calculateBudgetProgress(666, 1000)).toBe(67);
    });
  });

  // ============================================================================
  // NORMALIZE TO MONTHLY
  // ============================================================================

  describe("normalizeToMonthly", () => {
    it("should return same amount for monthly", () => {
      expect(normalizeToMonthly(100, "monthly")).toBe(100);
    });

    it("should divide by 2 for bimonthly", () => {
      expect(normalizeToMonthly(200, "bimonthly")).toBe(100);
    });

    it("should divide by 3 for quarterly", () => {
      expect(normalizeToMonthly(300, "quarterly")).toBe(100);
    });

    it("should divide by 6 for semiannual", () => {
      expect(normalizeToMonthly(600, "semiannual")).toBe(100);
    });

    it("should divide by 12 for annual", () => {
      expect(normalizeToMonthly(1200, "annual")).toBe(100);
    });

    it("should handle string amounts", () => {
      expect(normalizeToMonthly("240", "quarterly")).toBe(80);
    });

    it("should return 0 for NaN input", () => {
      expect(normalizeToMonthly("invalid", "monthly")).toBe(0);
    });

    it("should default to monthly for unknown frequency", () => {
      expect(normalizeToMonthly(100, "weekly")).toBe(100);
    });
  });

  // ============================================================================
  // CALCULATE FORFETTARIO TAX
  // ============================================================================

  describe("calculateForfettarioTax", () => {
    /**
     * Standard Forfettario calculation for a software developer:
     * - ATECO 62.01.00 → coefficiente redditivita = 78%
     * - INPS gestione separata = 26.07%
     * - Imposta sostitutiva = 5% (first 5 years) or 15% (after)
     */

    it("should calculate correctly for a typical 5% rate scenario", () => {
      const result = calculateForfettarioTax({
        revenue: 50000,
        coefficienteRedditività: 0.78,
        inpsRate: 0.2607,
        taxRate: 0.05,
      });

      // Step 1: reddito imponibile = 50000 * 0.78 = 39000
      expect(result.redditoImponibile).toBe(39000);

      // Step 2: contributi INPS = 39000 * 0.2607 = 10167.30
      expect(result.contributiInps).toBe(10167.3);

      // Step 3: base imponibile = 39000 - 10167.30 = 28832.70
      // imposta sostitutiva = 28832.70 * 0.05 ≈ 1441.64 (floating point: round2 may give ±0.01)
      expect(result.impostaSostitutiva).toBeCloseTo(1441.64, 1);

      // Step 4: totale tasse = INPS + imposta
      expect(result.totaleTasse).toBeCloseTo(10167.3 + result.impostaSostitutiva, 1);

      // Step 5: netto = revenue - totaleTasse
      expect(result.nettoStimato).toBeCloseTo(50000 - result.totaleTasse, 1);
    });

    it("should calculate correctly for 15% rate scenario", () => {
      const result = calculateForfettarioTax({
        revenue: 50000,
        coefficienteRedditività: 0.78,
        inpsRate: 0.2607,
        taxRate: 0.15,
      });

      // reddito imponibile = 39000
      expect(result.redditoImponibile).toBe(39000);

      // INPS = 10167.30
      expect(result.contributiInps).toBe(10167.3);

      // imposta sostitutiva = (39000 - 10167.30) * 0.15 ≈ 4324.91 (floating point: ±0.01)
      expect(result.impostaSostitutiva).toBeCloseTo(4324.91, 1);

      // totale = INPS + imposta
      expect(result.totaleTasse).toBeCloseTo(10167.3 + result.impostaSostitutiva, 1);

      // netto = revenue - totaleTasse
      expect(result.nettoStimato).toBeCloseTo(50000 - result.totaleTasse, 1);
    });

    it("should handle different coefficiente redditivita values", () => {
      // Commercio: coefficiente = 40%
      const result = calculateForfettarioTax({
        revenue: 60000,
        coefficienteRedditività: 0.4,
        inpsRate: 0.2607,
        taxRate: 0.15,
      });

      // reddito imponibile = 60000 * 0.4 = 24000
      expect(result.redditoImponibile).toBe(24000);

      // INPS = 24000 * 0.2607 = 6256.80
      expect(result.contributiInps).toBe(6256.8);

      // imposta = (24000 - 6256.80) * 0.15 = 17743.20 * 0.15 = 2661.48
      expect(result.impostaSostitutiva).toBe(2661.48);
    });

    it("should apply INPS minimum when calculated is lower", () => {
      const result = calculateForfettarioTax({
        revenue: 5000,
        coefficienteRedditività: 0.78,
        inpsRate: 0.2607,
        taxRate: 0.05,
        inpsMinimum: 4200,
      });

      // reddito imponibile = 5000 * 0.78 = 3900
      expect(result.redditoImponibile).toBe(3900);

      // calculated INPS = 3900 * 0.2607 = 1016.73 < 4200 minimum
      expect(result.contributiInps).toBe(4200);

      // base imponibile = max(0, 3900 - 4200) = 0
      expect(result.impostaSostitutiva).toBe(0);

      // totale = 4200 + 0 = 4200
      expect(result.totaleTasse).toBe(4200);

      // netto = 5000 - 4200 = 800
      expect(result.nettoStimato).toBe(800);
    });

    it("should handle zero revenue", () => {
      const result = calculateForfettarioTax({
        revenue: 0,
        coefficienteRedditività: 0.78,
        inpsRate: 0.2607,
        taxRate: 0.05,
      });

      expect(result.redditoImponibile).toBe(0);
      expect(result.contributiInps).toBe(0);
      expect(result.impostaSostitutiva).toBe(0);
      expect(result.totaleTasse).toBe(0);
      expect(result.nettoStimato).toBe(0);
    });

    it("should handle the 85000 EUR cap scenario", () => {
      // Maximum Forfettario threshold
      const result = calculateForfettarioTax({
        revenue: 85000,
        coefficienteRedditività: 0.78,
        inpsRate: 0.2607,
        taxRate: 0.05,
      });

      // reddito imponibile = 85000 * 0.78 = 66300
      expect(result.redditoImponibile).toBe(66300);

      // INPS = 66300 * 0.2607 = 17284.41
      expect(result.contributiInps).toBe(17284.41);

      // imposta = (66300 - 17284.41) * 0.05 = 49015.59 * 0.05 = 2450.7795 → 2450.78
      expect(result.impostaSostitutiva).toBe(2450.78);

      // netto = 85000 - (17284.41 + 2450.78) = 65264.81
      expect(result.nettoStimato).toBe(65264.81);
    });

    it("should produce consistent results (all fields sum correctly)", () => {
      const result = calculateForfettarioTax({
        revenue: 42000,
        coefficienteRedditività: 0.78,
        inpsRate: 0.2607,
        taxRate: 0.05,
      });

      // totaleTasse = contributiInps + impostaSostitutiva (within floating point tolerance)
      expect(result.totaleTasse).toBeCloseTo(result.contributiInps + result.impostaSostitutiva, 1);

      // nettoStimato = revenue - totaleTasse
      expect(result.nettoStimato).toBeCloseTo(42000 - result.totaleTasse, 1);
    });
  });

  // ============================================================================
  // GET MONTH KEY
  // ============================================================================

  describe("getMonthKey", () => {
    it("should return first of month", () => {
      expect(getMonthKey("2026-03-15")).toBe("2026-03-01");
    });

    it("should work for first day", () => {
      expect(getMonthKey("2026-01-01")).toBe("2026-01-01");
    });

    it("should work for last day", () => {
      expect(getMonthKey("2026-12-31")).toBe("2026-12-01");
    });
  });

  // ============================================================================
  // CALCULATE NET PATRIMONY
  // ============================================================================

  describe("calculateNetPatrimony", () => {
    it("should sum all sources", () => {
      expect(
        calculateNetPatrimony({
          accountBalances: [1000, 2000, 3000],
          investmentValues: [5000, 10000],
          cryptoValues: [500, 1500],
        })
      ).toBe(23000);
    });

    it("should return 0 with empty arrays", () => {
      expect(
        calculateNetPatrimony({
          accountBalances: [],
          investmentValues: [],
          cryptoValues: [],
        })
      ).toBe(0);
    });

    it("should handle negative balances", () => {
      expect(
        calculateNetPatrimony({
          accountBalances: [-500, 2000],
          investmentValues: [1000],
          cryptoValues: [],
        })
      ).toBe(2500);
    });

    it("should round to 2 decimal places", () => {
      expect(
        calculateNetPatrimony({
          accountBalances: [100.333, 200.666],
          investmentValues: [],
          cryptoValues: [],
        })
      ).toBe(301);
    });
  });
});
