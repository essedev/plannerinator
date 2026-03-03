import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
  date,
  index,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ============================================
// FINANCE / FINANZA ENUMS
// ============================================

export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense", "transfer"]);

export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "cash",
  "investment",
  "credit_card",
  "other",
]);

export const expenseFrequencyEnum = pgEnum("expense_frequency", [
  "monthly",
  "bimonthly",
  "quarterly",
  "semiannual",
  "annual",
]);

export const investmentTypeEnum = pgEnum("investment_type", [
  "etf",
  "stock",
  "bond",
  "fund",
  "other",
]);

// ============================================
// FINANCE CORE TABLES
// ============================================

/**
 * Categories for transactions.
 * Hierarchical via parentId (e.g. "Casa" → "Affitto", "Utilities").
 * Typed: income categories vs expense categories.
 */
export const category = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: transactionTypeEnum("type").notNull(), // income or expense (not transfer)
    icon: text("icon"),
    color: text("color"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentId: uuid("parent_id").references((): any => category.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_category_user").on(table.userId),
    index("idx_category_type").on(table.type),
    index("idx_category_parent").on(table.parentId),
    index("idx_category_deleted").on(table.deletedAt),
  ]
);

/**
 * Bank accounts — where money lives.
 * Tracks name, type, currency, initial balance.
 */
export const bankAccount = pgTable(
  "bank_account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: accountTypeEnum("type").default("checking").notNull(),
    currency: text("currency").default("EUR").notNull(),
    initialBalance: numeric("initial_balance", { precision: 12, scale: 2 }).default("0").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_bank_account_user").on(table.userId),
    index("idx_bank_account_active").on(table.isActive),
    index("idx_bank_account_deleted").on(table.deletedAt),
  ]
);

/**
 * Transactions — the core financial entity.
 * Every money movement is a transaction: income, expense, or transfer.
 */
export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    date: date("date").notNull(),
    description: text("description"),

    categoryId: uuid("category_id").references(() => category.id, { onDelete: "set null" }),
    bankAccountId: uuid("bank_account_id").references(() => bankAccount.id, {
      onDelete: "set null",
    }),
    // For transfers: destination account
    toAccountId: uuid("to_account_id").references(() => bankAccount.id, {
      onDelete: "set null",
    }),

    notes: text("notes"),
    metadata: jsonb("metadata").default({}).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_transaction_user").on(table.userId),
    index("idx_transaction_date").on(table.date),
    index("idx_transaction_type").on(table.type),
    index("idx_transaction_category").on(table.categoryId),
    index("idx_transaction_account").on(table.bankAccountId),
    index("idx_transaction_deleted").on(table.deletedAt),
  ]
);

/**
 * Fixed expense groups — logical grouping of recurring bills.
 * e.g. "Affitto & Casa", "Assicurazioni", "Abbonamenti"
 */
export const fixedExpenseGroup = pgTable(
  "fixed_expense_group",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_fixed_expense_group_user").on(table.userId),
    index("idx_fixed_expense_group_deleted").on(table.deletedAt),
  ]
);

/**
 * Fixed expenses — individual recurring bills within a group.
 * e.g. "Affitto" (750/month), "Enel" (80/bimonthly)
 */
export const fixedExpense = pgTable(
  "fixed_expense",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => fixedExpenseGroup.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    frequency: expenseFrequencyEnum("frequency").default("monthly").notNull(),
    dueDay: integer("due_day"), // Day of month (1-31) when due
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_fixed_expense_user").on(table.userId),
    index("idx_fixed_expense_group").on(table.groupId),
    index("idx_fixed_expense_active").on(table.isActive),
    index("idx_fixed_expense_deleted").on(table.deletedAt),
  ]
);

/**
 * Monthly budget per category.
 * Actual spending = SUM(transactions) for that category+month.
 * One row per category per month.
 */
export const budget = pgTable(
  "budget",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    month: date("month").notNull(), // First day of month (e.g. "2026-03-01")
    plannedAmount: numeric("planned_amount", { precision: 12, scale: 2 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_budget_user").on(table.userId),
    index("idx_budget_month").on(table.month),
    index("idx_budget_category").on(table.categoryId),
    unique("uq_budget_user_category_month").on(table.userId, table.categoryId, table.month),
  ]
);

// ============================================
// FINANCE FISCAL TABLES
// ============================================

/**
 * Tax profile — singleton per user.
 * Italian Forfettario regime data for tax calculations.
 */
export const taxProfile = pgTable(
  "tax_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    regime: text("regime").default("forfettario").notNull(), // "forfettario" | "ordinario"
    atecoCode: text("ateco_code"),
    atecoDescription: text("ateco_description"),
    coefficienteRedditività: numeric("coefficiente_redditivita", { precision: 5, scale: 2 }),
    inpsRate: numeric("inps_rate", { precision: 5, scale: 2 }),
    inpsMinimum: numeric("inps_minimum", { precision: 10, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }), // Imposta sostitutiva (5% or 15%)
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_tax_profile_user").on(table.userId)]
);

/**
 * Annual revenue tracking.
 * One row per year — stores totals and calculated taxable income.
 */
export const annualRevenue = pgTable(
  "annual_revenue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    year: integer("year").notNull(),
    totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
    totalExpenses: numeric("total_expenses", { precision: 12, scale: 2 }).default("0").notNull(),
    taxableIncome: numeric("taxable_income", { precision: 12, scale: 2 }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_annual_revenue_user").on(table.userId),
    unique("uq_annual_revenue_user_year").on(table.userId, table.year),
  ]
);

/**
 * F24 tax payments.
 * Items stored as JSONB (always viewed/edited with parent).
 *
 * Items schema:
 * [{ code: "PX", section: "inps", amount: 1234.56, description: "Acconto INPS" }]
 */
export const f24Payment = pgTable(
  "f24_payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    date: date("date").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    isPaid: boolean("is_paid").default(false).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    period: text("period"), // e.g. "2025-S1", "2025-Q2", "2025"
    items: jsonb("items")
      .$type<
        Array<{
          code: string;
          section: string;
          amount: number;
          description?: string;
        }>
      >()
      .default([])
      .notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_f24_payment_user").on(table.userId),
    index("idx_f24_payment_date").on(table.date),
    index("idx_f24_payment_paid").on(table.isPaid),
    index("idx_f24_payment_deleted").on(table.deletedAt),
  ]
);

// ============================================
// FINANCE WORK TABLES
// ============================================

/**
 * Work profile — singleton per user.
 * Professional info + JSONB fields for semi-static data:
 * skills, workHistory, specializations, incomeTargets, planB
 */
export const workProfile = pgTable(
  "work_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    jobTitle: text("job_title"),
    companyName: text("company_name"),
    partitaIva: text("partita_iva"),
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
    monthlyRate: numeric("monthly_rate", { precision: 10, scale: 2 }),

    // JSONB fields for semi-static data
    skills: jsonb("skills").$type<string[]>().default([]),
    specializations: jsonb("specializations").$type<string[]>().default([]),
    workHistory: jsonb("work_history")
      .$type<
        Array<{
          company: string;
          role: string;
          from: string;
          to?: string;
          notes?: string;
        }>
      >()
      .default([]),
    incomeTargets: jsonb("income_targets")
      .$type<
        Array<{
          year: number;
          grossTarget: number;
          notes?: string;
        }>
      >()
      .default([]),
    planB: jsonb("plan_b")
      .$type<{
        description?: string;
        items?: Array<{ action: string; priority?: string; notes?: string }>;
      }>()
      .default({}),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_work_profile_user").on(table.userId)]
);

/**
 * Clients — freelance/business clients.
 * Referenced by transactions and recurring invoices.
 */
export const client = pgTable(
  "client",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    vatNumber: text("vat_number"),
    defaultRate: numeric("default_rate", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_client_user").on(table.userId),
    index("idx_client_active").on(table.isActive),
    index("idx_client_deleted").on(table.deletedAt),
  ]
);

/**
 * Recurring invoices — templates for repeated billing.
 * Linked to a client, generates transactions on schedule.
 */
export const recurringInvoice = pgTable(
  "recurring_invoice",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    frequency: expenseFrequencyEnum("frequency").default("monthly").notNull(),
    nextDueDate: date("next_due_date"),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_recurring_invoice_user").on(table.userId),
    index("idx_recurring_invoice_client").on(table.clientId),
    index("idx_recurring_invoice_active").on(table.isActive),
    index("idx_recurring_invoice_deleted").on(table.deletedAt),
  ]
);

// ============================================
// FINANCE INVESTMENT TABLES
// ============================================

/**
 * Investments — portfolio positions (ETFs, stocks, bonds, funds).
 */
export const investment = pgTable(
  "investment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: investmentTypeEnum("type").default("etf").notNull(),
    ticker: text("ticker"),
    quantity: numeric("quantity", { precision: 12, scale: 6 }),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
    purchaseDate: date("purchase_date"),
    currentValue: numeric("current_value", { precision: 12, scale: 2 }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_investment_user").on(table.userId),
    index("idx_investment_type").on(table.type),
    index("idx_investment_deleted").on(table.deletedAt),
  ]
);

/**
 * Crypto holdings — cryptocurrency positions.
 * Live prices fetched from CoinGecko server-side with 5min cache.
 */
export const cryptoHolding = pgTable(
  "crypto_holding",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    symbol: text("symbol").notNull(), // e.g. "BTC", "ETH"
    name: text("name").notNull(), // e.g. "Bitcoin", "Ethereum"
    quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
    exchange: text("exchange"), // e.g. "Binance", "Kraken"
    walletType: text("wallet_type"), // "exchange", "cold", "hot"
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_crypto_holding_user").on(table.userId),
    index("idx_crypto_holding_symbol").on(table.symbol),
    index("idx_crypto_holding_deleted").on(table.deletedAt),
  ]
);

// ============================================
// FINANCE SETTINGS
// ============================================

/**
 * Finance settings — singleton per user.
 * Stores configuration data as JSONB:
 * pensionFund, investmentStrategy, riskProfile, vehicles
 */
export const financeSettings = pgTable(
  "finance_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    pensionFund: jsonb("pension_fund")
      .$type<{
        fundName?: string;
        monthlyContribution?: number;
        totalAccrued?: number;
        projectedAt67?: number;
        notes?: string;
      }>()
      .default({}),

    investmentStrategy: jsonb("investment_strategy")
      .$type<{
        targetAllocation?: Record<string, number>;
        rebalancingFrequency?: string;
        riskTolerance?: string;
        notes?: string;
      }>()
      .default({}),

    riskProfile: jsonb("risk_profile")
      .$type<{
        overallScore?: number;
        factors?: Array<{ name: string; score: number; notes?: string }>;
      }>()
      .default({}),

    vehicles: jsonb("vehicles")
      .$type<
        Array<{
          make: string;
          model: string;
          year: number;
          plate?: string;
          insuranceMonthly?: number;
          notes?: string;
        }>
      >()
      .default([]),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("idx_finance_settings_user").on(table.userId)]
);

// ============================================
// FINANCE TYPE EXPORTS
// ============================================

export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;

export type BankAccount = typeof bankAccount.$inferSelect;
export type NewBankAccount = typeof bankAccount.$inferInsert;

export type FixedExpenseGroup = typeof fixedExpenseGroup.$inferSelect;
export type NewFixedExpenseGroup = typeof fixedExpenseGroup.$inferInsert;

export type FixedExpense = typeof fixedExpense.$inferSelect;
export type NewFixedExpense = typeof fixedExpense.$inferInsert;

export type Budget = typeof budget.$inferSelect;
export type NewBudget = typeof budget.$inferInsert;

export type TaxProfile = typeof taxProfile.$inferSelect;
export type NewTaxProfile = typeof taxProfile.$inferInsert;

export type AnnualRevenue = typeof annualRevenue.$inferSelect;
export type NewAnnualRevenue = typeof annualRevenue.$inferInsert;

export type F24Payment = typeof f24Payment.$inferSelect;
export type NewF24Payment = typeof f24Payment.$inferInsert;

export type WorkProfile = typeof workProfile.$inferSelect;
export type NewWorkProfile = typeof workProfile.$inferInsert;

export type Client = typeof client.$inferSelect;
export type NewClient = typeof client.$inferInsert;

export type RecurringInvoice = typeof recurringInvoice.$inferSelect;
export type NewRecurringInvoice = typeof recurringInvoice.$inferInsert;

export type Investment = typeof investment.$inferSelect;
export type NewInvestment = typeof investment.$inferInsert;

export type CryptoHolding = typeof cryptoHolding.$inferSelect;
export type NewCryptoHolding = typeof cryptoHolding.$inferInsert;

export type FinanceSettings = typeof financeSettings.$inferSelect;
export type NewFinanceSettings = typeof financeSettings.$inferInsert;
