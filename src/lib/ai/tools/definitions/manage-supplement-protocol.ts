import { z } from "zod";
import { defineTool } from "../types";
import {
  createProtocol,
  updateProtocol,
  deleteProtocol,
  createSupplement,
  updateSupplement,
  deleteSupplement,
} from "@/features/health/actions";
import { getProtocols } from "@/features/health/queries";

export const manageSupplementProtocolTool = defineTool({
  name: "manage_supplement_protocol",
  description:
    "Manage supplement protocols and individual supplements. " +
    "Can create/update/delete protocols, add/update/delete supplements within protocols, and list all protocols.",
  promptDocs: {
    trigger: '"protocollo", "integratore", "supplemento", "integratori", "stack"',
    examples: [
      '"Crea un protocollo mattutino con vitamina D e omega 3"',
      '"Aggiungi magnesio al protocollo serale"',
      '"Mostrami i miei protocolli"',
      '"Disattiva il protocollo invernale"',
    ],
    notes: [
      "Un protocollo raggruppa più integratori (es. 'Stack mattutino')",
      "Ogni integratore ha nome, dosaggio, frequenza e momento della giornata",
    ],
  },
  schema: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("create_protocol").describe("Create a new supplement protocol"),
      name: z.string().describe("Protocol name"),
      description: z.string().optional().describe("Protocol description"),
      isActive: z.boolean().optional().describe("Whether the protocol is active (default true)"),
    }),
    z.object({
      action: z.literal("update_protocol").describe("Update an existing protocol"),
      protocolId: z.string().describe("Protocol UUID"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
      isActive: z.boolean().optional().describe("Active status"),
    }),
    z.object({
      action: z.literal("delete_protocol").describe("Delete a protocol"),
      protocolId: z.string().describe("Protocol UUID"),
    }),
    z.object({
      action: z.literal("add_supplement").describe("Add a supplement to a protocol"),
      protocolId: z.string().describe("Protocol UUID to add supplement to"),
      name: z.string().describe("Supplement name (e.g., 'Vitamina D3')"),
      brand: z.string().optional().describe("Brand name"),
      dosage: z.string().optional().describe("Dosage (e.g., '2000 UI', '500mg')"),
      frequency: z
        .enum(["daily", "twice_daily", "weekly", "as_needed", "custom"])
        .optional()
        .describe("How often to take (default: daily)"),
      timeOfDay: z
        .string()
        .optional()
        .describe("When to take: 'morning', 'afternoon', or 'evening'"),
      notes: z.string().optional().describe("Additional notes"),
    }),
    z.object({
      action: z.literal("update_supplement").describe("Update a supplement"),
      supplementId: z.string().describe("Supplement UUID"),
      name: z.string().optional().describe("New name"),
      dosage: z.string().optional().describe("New dosage"),
      frequency: z.enum(["daily", "twice_daily", "weekly", "as_needed", "custom"]).optional(),
      timeOfDay: z.string().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    }),
    z.object({
      action: z.literal("delete_supplement").describe("Delete a supplement"),
      supplementId: z.string().describe("Supplement UUID"),
    }),
    z.object({
      action: z.literal("list_protocols").describe("List all supplement protocols"),
    }),
  ]),
  async execute(input, userId) {
    switch (input.action) {
      case "create_protocol": {
        const result = await createProtocol({
          name: input.name,
          description: input.description ?? null,
          isActive: input.isActive ?? true,
        });
        return {
          success: true,
          data: {
            message: `Protocollo "${result.name}" creato.`,
            results: { id: result.id, name: result.name },
          },
        };
      }

      case "update_protocol": {
        const result = await updateProtocol(input.protocolId, {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
        });
        return {
          success: true,
          data: {
            message: `Protocollo "${result.name}" aggiornato.`,
            results: { id: result.id, name: result.name, isActive: result.isActive },
          },
        };
      }

      case "delete_protocol": {
        await deleteProtocol(input.protocolId);
        return {
          success: true,
          data: { message: "Protocollo eliminato." },
        };
      }

      case "add_supplement": {
        const result = await createSupplement({
          protocolId: input.protocolId,
          name: input.name,
          brand: input.brand ?? null,
          dosage: input.dosage ?? null,
          frequency: input.frequency ?? "daily",
          timeOfDay: input.timeOfDay ?? null,
          notes: input.notes ?? null,
        });
        return {
          success: true,
          data: {
            message: `Integratore "${result.name}" aggiunto al protocollo.`,
            results: { id: result.id, name: result.name },
          },
        };
      }

      case "update_supplement": {
        const result = await updateSupplement(input.supplementId, {
          name: input.name,
          dosage: input.dosage,
          frequency: input.frequency,
          timeOfDay: input.timeOfDay,
          isActive: input.isActive,
          notes: input.notes,
        });
        return {
          success: true,
          data: {
            message: `Integratore "${result.name}" aggiornato.`,
            results: { id: result.id, name: result.name },
          },
        };
      }

      case "delete_supplement": {
        await deleteSupplement(input.supplementId);
        return {
          success: true,
          data: { message: "Integratore eliminato." },
        };
      }

      case "list_protocols": {
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
    }
  },
});
