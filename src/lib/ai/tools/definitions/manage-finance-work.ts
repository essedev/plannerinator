import { z } from "zod";
import { defineTool } from "../types";
import {
  upsertWorkProfile,
  createClient,
  updateClient,
  deleteClient,
  createRecurringInvoice,
  deleteRecurringInvoice,
} from "@/features/finance/actions";
import { getWorkProfile, getClients, getRecurringInvoices } from "@/features/finance/queries";
import { formatCurrency, normalizeToMonthly } from "@/features/finance/helpers";

export const manageFinanceWorkTool = defineTool({
  name: "manage_finance_work",
  description:
    "Manage work profile, clients, and recurring invoices. View or update professional " +
    "information, manage client list, and track recurring billing.",
  promptDocs: {
    trigger:
      '"lavoro", "profilo professionale", "clienti", "fattura", "tariffa", "P.IVA", "competenze"',
    examples: [
      '"Mostrami il mio profilo lavoro"',
      '"Aggiungi un cliente: ACME Corp"',
      '"Quanto guadagno al mese di ricorrente?"',
      '"Aggiorna la mia tariffa oraria a 60 euro"',
      '"Aggiungi una fattura ricorrente di 2000 euro mensili per ACME"',
    ],
    notes: [
      "Profilo lavoro: ruolo, azienda, P.IVA, tariffe, competenze, specializzazioni",
      "Clienti: nome, email, azienda, tariffa default",
      "Fatture ricorrenti: collegate a un cliente, con frequenza e importo",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("view_profile").describe("View work profile"),
    }),
    z.object({
      action: z.literal("update_profile").describe("Create or update work profile"),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      partitaIva: z.string().optional(),
      hourlyRate: z.string().optional(),
      monthlyRate: z.string().optional(),
      skills: z.array(z.string()).optional(),
      specializations: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("add_client").describe("Add a new client"),
      name: z.string().describe("Client name"),
      email: z.string().optional(),
      company: z.string().optional(),
      defaultRate: z.string().optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("update_client").describe("Update an existing client"),
      clientId: z.string().describe("Client UUID"),
      name: z.string().optional(),
      email: z.string().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("delete_client").describe("Delete a client"),
      clientId: z.string().describe("Client UUID"),
    }),
    z.object({
      action: z.literal("list_clients").describe("List all clients"),
      activeOnly: z.boolean().optional(),
    }),
    z.object({
      action: z.literal("add_invoice").describe("Add a recurring invoice"),
      clientId: z.string().describe("Client UUID"),
      description: z.string().describe("Invoice description"),
      amount: z.string().describe("Invoice amount"),
      frequency: z
        .enum(["monthly", "bimonthly", "quarterly", "semiannual", "annual"])
        .optional()
        .describe("Billing frequency (default: monthly)"),
      nextDueDate: z.string().optional().describe("Next due date (YYYY-MM-DD)"),
    }),
    z.object({
      action: z.literal("delete_invoice").describe("Delete a recurring invoice"),
      invoiceId: z.string().describe("Invoice UUID"),
    }),
    z.object({
      action: z.literal("list_invoices").describe("List recurring invoices"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "view_profile": {
        const profile = await getWorkProfile(userId);
        if (!profile) {
          return {
            success: true,
            data: { message: "Nessun profilo lavoro configurato." },
          };
        }
        return {
          success: true,
          data: {
            results: {
              jobTitle: profile.jobTitle,
              companyName: profile.companyName,
              partitaIva: profile.partitaIva,
              hourlyRate: profile.hourlyRate ? formatCurrency(profile.hourlyRate) : null,
              monthlyRate: profile.monthlyRate ? formatCurrency(profile.monthlyRate) : null,
              skills: profile.skills,
              specializations: profile.specializations,
            },
          },
        };
      }

      case "update_profile": {
        const { action, ...data } = input;
        void action;
        const result = await upsertWorkProfile(data);
        return {
          success: true,
          data: {
            message: "Profilo lavoro aggiornato.",
            results: {
              jobTitle: result.jobTitle,
              companyName: result.companyName,
            },
          },
        };
      }

      case "add_client": {
        const result = await createClient({
          name: input.name,
          email: input.email ?? null,
          company: input.company ?? null,
          defaultRate: input.defaultRate ?? null,
          notes: input.notes ?? null,
        });
        return {
          success: true,
          data: {
            message: `Cliente "${result.name}" aggiunto.`,
            results: { id: result.id, name: result.name },
          },
        };
      }

      case "update_client": {
        const { clientId, action, ...data } = input;
        void action;
        const result = await updateClient(clientId, data);
        return {
          success: true,
          data: {
            message: `Cliente "${result.name}" aggiornato.`,
            results: { id: result.id, name: result.name },
          },
        };
      }

      case "delete_client": {
        await deleteClient(input.clientId);
        return {
          success: true,
          data: { message: "Cliente eliminato." },
        };
      }

      case "list_clients": {
        const clients = await getClients(userId, input.activeOnly ?? false);
        return {
          success: true,
          data: {
            count: clients.length,
            results: clients.map((c) => ({
              id: c.id,
              name: c.name,
              company: c.company,
              email: c.email,
              defaultRate: c.defaultRate ? formatCurrency(c.defaultRate) : null,
              isActive: c.isActive,
            })),
          },
        };
      }

      case "add_invoice": {
        const result = await createRecurringInvoice({
          clientId: input.clientId,
          description: input.description,
          amount: input.amount,
          frequency: input.frequency,
          nextDueDate: input.nextDueDate ?? null,
        });
        return {
          success: true,
          data: {
            message: `Fattura ricorrente di ${formatCurrency(input.amount)} creata.`,
            results: { id: result.id, description: result.description },
          },
        };
      }

      case "delete_invoice": {
        await deleteRecurringInvoice(input.invoiceId);
        return {
          success: true,
          data: { message: "Fattura ricorrente eliminata." },
        };
      }

      case "list_invoices": {
        const invoices = await getRecurringInvoices(userId);
        const clients = await getClients(userId);
        const clientMap = new Map(clients.map((c) => [c.id, c.name]));

        const monthlyTotal = invoices
          .filter((i) => i.isActive)
          .reduce((s, i) => s + normalizeToMonthly(i.amount, i.frequency), 0);

        return {
          success: true,
          data: {
            count: invoices.length,
            monthlyTotal: formatCurrency(monthlyTotal),
            results: invoices.map((i) => ({
              id: i.id,
              client: clientMap.get(i.clientId) ?? "—",
              description: i.description,
              amount: formatCurrency(i.amount),
              frequency: i.frequency,
              nextDueDate: i.nextDueDate,
              isActive: i.isActive,
            })),
          },
        };
      }
    }
  },
});
