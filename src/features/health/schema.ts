import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const supplementFrequencySchema = z.enum([
  "daily",
  "twice_daily",
  "weekly",
  "as_needed",
  "custom",
]);

export const healthGoalStatusSchema = z.enum(["active", "paused", "completed", "abandoned"]);

// ============================================
// SUPPLEMENT PROTOCOL SCHEMAS
// ============================================

export const createProtocolSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0).optional(),
});

export const updateProtocolSchema = createProtocolSchema.partial();

// ============================================
// SUPPLEMENT SCHEMAS
// ============================================

export const createSupplementSchema = z.object({
  protocolId: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
  brand: z.string().max(255).optional().nullable(),
  dosage: z.string().max(100).optional().nullable(),
  frequency: supplementFrequencySchema.default("daily").optional(),
  timeOfDay: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateSupplementSchema = createSupplementSchema.omit({ protocolId: true }).partial();

// ============================================
// BODY METRIC SCHEMAS
// ============================================

export const logBodyMetricSchema = z.object({
  metricType: z.string().min(1).max(100).trim(),
  value: z.string().min(1).max(100).trim(),
  unit: z.string().max(50).optional().nullable(),
  measuredAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const bodyMetricFilterSchema = z.object({
  metricType: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================
// HEALTH PROFILE SCHEMAS
// ============================================

export const upsertHealthProfileSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  height: z.string().max(10).optional().nullable(),
  allergies: z.array(z.string()).optional().nullable(),
  conditions: z.array(z.string()).optional().nullable(),
  sleepTarget: z.string().max(20).optional().nullable(),
  exerciseRoutine: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// ============================================
// HEALTH GOAL SCHEMAS
// ============================================

export const createHealthGoalSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  targetValue: z.string().max(100).optional().nullable(),
  targetUnit: z.string().max(50).optional().nullable(),
  currentValue: z.string().max(100).optional().nullable(),
  metricType: z.string().max(100).optional().nullable(),
  status: healthGoalStatusSchema.default("active").optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const updateHealthGoalSchema = createHealthGoalSchema.partial();

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateProtocolInput = z.infer<typeof createProtocolSchema>;
export type UpdateProtocolInput = z.infer<typeof updateProtocolSchema>;
export type CreateSupplementInput = z.infer<typeof createSupplementSchema>;
export type UpdateSupplementInput = z.infer<typeof updateSupplementSchema>;
export type LogBodyMetricInput = z.infer<typeof logBodyMetricSchema>;
export type BodyMetricFilterInput = z.infer<typeof bodyMetricFilterSchema>;
export type UpsertHealthProfileInput = z.infer<typeof upsertHealthProfileSchema>;
export type CreateHealthGoalInput = z.infer<typeof createHealthGoalSchema>;
export type UpdateHealthGoalInput = z.infer<typeof updateHealthGoalSchema>;
