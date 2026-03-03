import { z } from "zod";
import { defineTool } from "../types";
import {
  upsertTaxProfile,
  createAnnualRevenue,
  createF24Payment,
  markF24Paid,
  deleteF24Payment,
} from "@/features/finance/actions";
import { getTaxProfile, getAnnualRevenues, getF24Payments } from "@/features/finance/queries";
import { formatCurrency, calculateForfettarioTax } from "@/features/finance/helpers";

export const manageFinanceFiscalTool = defineTool({
  name: "manage_finance_fiscal",
  description:
    "Manage fiscal data. View or update tax profile, manage F24 payments, " +
    "add annual revenue, and simulate Forfettario taxes.",
  promptDocs: {
    trigger: '"tasse", "fiscale", "F24", "forfettario", "INPS", "partita IVA", "fatturato annuo"',
    examples: [
      '"Mostrami il mio profilo fiscale"',
      '"Aggiungi un F24 da 1200 euro per il 16 giugno"',
      '"Segna il F24 come pagato"',
      '"Simula le tasse su 50000 euro di fatturato"',
      '"Registra fatturato 2025: 48000 euro"',
    ],
    notes: [
      "Profilo fiscale: regime, ATECO, coefficiente redditivita, aliquote INPS e sostitutiva",
      "Simulazione Forfettario: revenue x coeff = imponibile, poi INPS e imposta sostitutiva",
      "F24: pagamenti fiscali con scadenza, importo, periodo",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("view_profile").describe("View current tax profile"),
    }),
    z.object({
      action: z.literal("update_profile").describe("Create or update tax profile"),
      regime: z.string().optional().describe("Tax regime (e.g. 'forfettario')"),
      atecoCode: z.string().optional().describe("ATECO code (e.g. '62.01.00')"),
      atecoDescription: z.string().optional(),
      coefficienteRedditività: z.string().optional().describe("e.g. '0.78'"),
      inpsRate: z.string().optional().describe("e.g. '0.2607'"),
      taxRate: z.string().optional().describe("e.g. '0.05' or '0.15'"),
      inpsMinimum: z.string().optional(),
    }),
    z.object({
      action: z.literal("simulate_tax").describe("Simulate Forfettario taxes"),
      revenue: z.number().describe("Annual revenue amount"),
      coefficienteRedditività: z.number().optional().describe("Override profile value"),
      inpsRate: z.number().optional().describe("Override profile value"),
      taxRate: z.number().optional().describe("Override profile value"),
    }),
    z.object({
      action: z.literal("add_revenue").describe("Add annual revenue entry"),
      year: z.number().int().describe("Year (e.g. 2026)"),
      totalRevenue: z.string().describe("Total revenue amount"),
      totalExpenses: z.string().optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("list_revenues").describe("List annual revenue entries"),
    }),
    z.object({
      action: z.literal("add_f24").describe("Add an F24 payment"),
      date: z.string().describe("Due date (YYYY-MM-DD)"),
      totalAmount: z.string().describe("Payment amount"),
      period: z.string().optional().describe("Tax period reference"),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("list_f24").describe("List F24 payments"),
      paid: z.boolean().optional().describe("Filter: true=paid, false=unpaid, undefined=all"),
    }),
    z.object({
      action: z.literal("pay_f24").describe("Mark an F24 as paid"),
      paymentId: z.string().describe("F24 payment UUID"),
    }),
    z.object({
      action: z.literal("delete_f24").describe("Delete an F24 payment"),
      paymentId: z.string().describe("F24 payment UUID"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "view_profile": {
        const profile = await getTaxProfile(userId);
        if (!profile) {
          return {
            success: true,
            data: { message: "Nessun profilo fiscale configurato." },
          };
        }
        return {
          success: true,
          data: {
            results: {
              regime: profile.regime,
              atecoCode: profile.atecoCode,
              atecoDescription: profile.atecoDescription,
              coefficienteRedditività: profile.coefficienteRedditività,
              inpsRate: profile.inpsRate,
              taxRate: profile.taxRate,
              inpsMinimum: profile.inpsMinimum,
            },
          },
        };
      }

      case "update_profile": {
        const { action, ...data } = input;
        void action;
        const result = await upsertTaxProfile(data);
        return {
          success: true,
          data: {
            message: "Profilo fiscale aggiornato.",
            results: { regime: result.regime, atecoCode: result.atecoCode },
          },
        };
      }

      case "simulate_tax": {
        let { coefficienteRedditività, inpsRate, taxRate } = input;

        // Fall back to profile values
        if (!coefficienteRedditività || !inpsRate || !taxRate) {
          const profile = await getTaxProfile(userId);
          if (profile) {
            coefficienteRedditività ??= profile.coefficienteRedditività
              ? parseFloat(profile.coefficienteRedditività)
              : undefined;
            inpsRate ??= profile.inpsRate ? parseFloat(profile.inpsRate) : undefined;
            taxRate ??= profile.taxRate ? parseFloat(profile.taxRate) : undefined;
          }
        }

        if (!coefficienteRedditività || !inpsRate || !taxRate) {
          return {
            success: false,
            error:
              "Mancano i parametri fiscali. Configura il profilo fiscale o fornisci coefficienteRedditività, inpsRate e taxRate.",
          };
        }

        const sim = calculateForfettarioTax({
          revenue: input.revenue,
          coefficienteRedditività,
          inpsRate,
          taxRate,
        });

        return {
          success: true,
          data: {
            results: {
              fatturato: formatCurrency(input.revenue),
              redditoImponibile: formatCurrency(sim.redditoImponibile),
              contributiInps: formatCurrency(sim.contributiInps),
              impostaSostitutiva: formatCurrency(sim.impostaSostitutiva),
              totaleTasse: formatCurrency(sim.totaleTasse),
              nettoStimato: formatCurrency(sim.nettoStimato),
            },
          },
        };
      }

      case "add_revenue": {
        const result = await createAnnualRevenue({
          year: input.year,
          totalRevenue: input.totalRevenue,
          totalExpenses: input.totalExpenses,
          notes: input.notes ?? null,
        });
        return {
          success: true,
          data: {
            message: `Revenue ${input.year} registrata.`,
            results: {
              id: result.id,
              year: result.year,
              totalRevenue: formatCurrency(result.totalRevenue),
            },
          },
        };
      }

      case "list_revenues": {
        const revenues = await getAnnualRevenues(userId);
        return {
          success: true,
          data: {
            count: revenues.length,
            results: revenues.map((r) => ({
              id: r.id,
              year: r.year,
              totalRevenue: formatCurrency(r.totalRevenue),
              totalExpenses: formatCurrency(r.totalExpenses),
            })),
          },
        };
      }

      case "add_f24": {
        const result = await createF24Payment({
          date: input.date,
          totalAmount: input.totalAmount,
          period: input.period ?? null,
          notes: input.notes ?? null,
        });
        return {
          success: true,
          data: {
            message: `F24 di ${formatCurrency(input.totalAmount)} creato per ${input.date}.`,
            results: { id: result.id, date: result.date, totalAmount: result.totalAmount },
          },
        };
      }

      case "list_f24": {
        const payments = await getF24Payments(userId, input.paid);
        return {
          success: true,
          data: {
            count: payments.length,
            results: payments.map((f) => ({
              id: f.id,
              date: f.date,
              totalAmount: formatCurrency(f.totalAmount),
              isPaid: f.isPaid,
              period: f.period,
            })),
          },
        };
      }

      case "pay_f24": {
        await markF24Paid(input.paymentId);
        return {
          success: true,
          data: { message: "F24 segnato come pagato." },
        };
      }

      case "delete_f24": {
        await deleteF24Payment(input.paymentId);
        return {
          success: true,
          data: { message: "F24 eliminato." },
        };
      }
    }
  },
});
