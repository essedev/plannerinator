import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const transactionTypeSchema = z.enum(["income", "expense", "transfer"]);
export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "cash",
  "investment",
  "credit_card",
  "other",
]);
export const expenseFrequencySchema = z.enum([
  "monthly",
  "bimonthly",
  "quarterly",
  "semiannual",
  "annual",
]);
export const investmentTypeSchema = z.enum(["etf", "stock", "bond", "fund", "other"]);

// ============================================
// TRANSACTION SCHEMAS
// ============================================

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.string().min(1).trim(),
  date: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid().optional().nullable(),
  toAccountId: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFilterSchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  type: transactionTypeSchema,
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// BANK ACCOUNT SCHEMAS
// ============================================

export const createBankAccountSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  type: accountTypeSchema.default("checking").optional(),
  currency: z.string().max(10).default("EUR").optional(),
  initialBalance: z.string().default("0").optional(),
  isActive: z.boolean().default(true).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

// ============================================
// FIXED EXPENSE GROUP SCHEMAS
// ============================================

export const createFixedExpenseGroupSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0).optional(),
});

export const updateFixedExpenseGroupSchema = createFixedExpenseGroupSchema.partial();

// ============================================
// FIXED EXPENSE SCHEMAS
// ============================================

export const createFixedExpenseSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(1).max(255).trim(),
  amount: z.string().min(1).trim(),
  frequency: expenseFrequencySchema.default("monthly").optional(),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  isActive: z.boolean().default(true).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateFixedExpenseSchema = createFixedExpenseSchema.omit({ groupId: true }).partial();

// ============================================
// BUDGET SCHEMAS
// ============================================

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: z.string().min(1), // "2026-03-01"
  plannedAmount: z.string().min(1).trim(),
});

// ============================================
// TAX PROFILE SCHEMAS
// ============================================

export const upsertTaxProfileSchema = z.object({
  regime: z.string().max(50).default("forfettario").optional(),
  atecoCode: z.string().max(20).optional().nullable(),
  atecoDescription: z.string().max(500).optional().nullable(),
  coefficienteRedditività: z.string().optional().nullable(),
  inpsRate: z.string().optional().nullable(),
  inpsMinimum: z.string().optional().nullable(),
  taxRate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// ============================================
// ANNUAL REVENUE SCHEMAS
// ============================================

export const createAnnualRevenueSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  totalRevenue: z.string().default("0").optional(),
  totalExpenses: z.string().default("0").optional(),
  taxableIncome: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateAnnualRevenueSchema = createAnnualRevenueSchema.partial();

// ============================================
// F24 PAYMENT SCHEMAS
// ============================================

const f24ItemSchema = z.object({
  code: z.string().min(1),
  section: z.string().min(1),
  amount: z.number(),
  description: z.string().optional(),
});

export const createF24PaymentSchema = z.object({
  date: z.string().min(1),
  totalAmount: z.string().min(1).trim(),
  isPaid: z.boolean().default(false).optional(),
  period: z.string().max(50).optional().nullable(),
  items: z.array(f24ItemSchema).default([]).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateF24PaymentSchema = createF24PaymentSchema.partial();

// ============================================
// WORK PROFILE SCHEMAS
// ============================================

export const upsertWorkProfileSchema = z.object({
  jobTitle: z.string().max(255).optional().nullable(),
  companyName: z.string().max(255).optional().nullable(),
  partitaIva: z.string().max(20).optional().nullable(),
  hourlyRate: z.string().optional().nullable(),
  monthlyRate: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  workHistory: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        from: z.string(),
        to: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  incomeTargets: z
    .array(
      z.object({
        year: z.number(),
        grossTarget: z.number(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  planB: z
    .object({
      description: z.string().optional(),
      items: z
        .array(
          z.object({
            action: z.string(),
            priority: z.string().optional(),
            notes: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  notes: z.string().max(5000).optional().nullable(),
});

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  vatNumber: z.string().max(50).optional().nullable(),
  defaultRate: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

// ============================================
// RECURRING INVOICE SCHEMAS
// ============================================

export const createRecurringInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  description: z.string().min(1).max(500).trim(),
  amount: z.string().min(1).trim(),
  frequency: expenseFrequencySchema.default("monthly").optional(),
  nextDueDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateRecurringInvoiceSchema = createRecurringInvoiceSchema
  .omit({ clientId: true })
  .partial();

// ============================================
// INVESTMENT SCHEMAS
// ============================================

export const createInvestmentSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  type: investmentTypeSchema.default("etf").optional(),
  ticker: z.string().max(20).optional().nullable(),
  quantity: z.string().optional().nullable(),
  purchasePrice: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  currentValue: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

// ============================================
// CRYPTO HOLDING SCHEMAS
// ============================================

export const createCryptoHoldingSchema = z.object({
  symbol: z.string().min(1).max(20).trim(),
  name: z.string().min(1).max(255).trim(),
  quantity: z.string().min(1).trim(),
  purchasePrice: z.string().optional().nullable(),
  exchange: z.string().max(100).optional().nullable(),
  walletType: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCryptoHoldingSchema = createCryptoHoldingSchema.partial();

// ============================================
// FINANCE SETTINGS SCHEMAS
// ============================================

export const upsertFinanceSettingsSchema = z.object({
  pensionFund: z
    .object({
      fundName: z.string().optional(),
      monthlyContribution: z.number().optional(),
      totalAccrued: z.number().optional(),
      projectedAt67: z.number().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  investmentStrategy: z
    .object({
      targetAllocation: z.record(z.string(), z.number()).optional(),
      rebalancingFrequency: z.string().optional(),
      riskTolerance: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  riskProfile: z
    .object({
      overallScore: z.number().optional(),
      factors: z
        .array(
          z.object({
            name: z.string(),
            score: z.number(),
            notes: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  vehicles: z
    .array(
      z.object({
        make: z.string(),
        model: z.string(),
        year: z.number(),
        plate: z.string().optional(),
        insuranceMonthly: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

// ============================================
// FINANCE GOAL SCHEMAS
// ============================================

export const goalStatusSchema = z.enum(["active", "paused", "completed", "abandoned"]);

export const createFinanceGoalSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  targetValue: z.string().max(100).optional().nullable(),
  targetUnit: z.string().max(50).optional().nullable(),
  currentValue: z.string().max(100).optional().nullable(),
  status: goalStatusSchema.default("active").optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const updateFinanceGoalSchema = createFinanceGoalSchema.partial();

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type CreateFixedExpenseGroupInput = z.infer<typeof createFixedExpenseGroupSchema>;
export type UpdateFixedExpenseGroupInput = z.infer<typeof updateFixedExpenseGroupSchema>;
export type CreateFixedExpenseInput = z.infer<typeof createFixedExpenseSchema>;
export type UpdateFixedExpenseInput = z.infer<typeof updateFixedExpenseSchema>;
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
export type UpsertTaxProfileInput = z.infer<typeof upsertTaxProfileSchema>;
export type CreateAnnualRevenueInput = z.infer<typeof createAnnualRevenueSchema>;
export type UpdateAnnualRevenueInput = z.infer<typeof updateAnnualRevenueSchema>;
export type CreateF24PaymentInput = z.infer<typeof createF24PaymentSchema>;
export type UpdateF24PaymentInput = z.infer<typeof updateF24PaymentSchema>;
export type UpsertWorkProfileInput = z.infer<typeof upsertWorkProfileSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateRecurringInvoiceInput = z.infer<typeof createRecurringInvoiceSchema>;
export type UpdateRecurringInvoiceInput = z.infer<typeof updateRecurringInvoiceSchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type CreateCryptoHoldingInput = z.infer<typeof createCryptoHoldingSchema>;
export type UpdateCryptoHoldingInput = z.infer<typeof updateCryptoHoldingSchema>;
export type UpsertFinanceSettingsInput = z.infer<typeof upsertFinanceSettingsSchema>;
export type CreateFinanceGoalInput = z.infer<typeof createFinanceGoalSchema>;
export type UpdateFinanceGoalInput = z.infer<typeof updateFinanceGoalSchema>;
