"use server";

import { db } from "@/db";
import {
  transaction,
  category,
  bankAccount,
  fixedExpenseGroup,
  fixedExpense,
  budget,
  taxProfile,
  annualRevenue,
  f24Payment,
  workProfile,
  client,
  recurringInvoice,
  investment,
  cryptoHolding,
  financeSettings,
  goal,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { validateSession } from "@/lib/entity-helpers";
import { parseInput, errors } from "@/lib/errors";
import {
  createTransactionSchema,
  updateTransactionSchema,
  createCategorySchema,
  updateCategorySchema,
  createBankAccountSchema,
  updateBankAccountSchema,
  createFixedExpenseGroupSchema,
  updateFixedExpenseGroupSchema,
  createFixedExpenseSchema,
  updateFixedExpenseSchema,
  upsertBudgetSchema,
  upsertTaxProfileSchema,
  createAnnualRevenueSchema,
  updateAnnualRevenueSchema,
  createF24PaymentSchema,
  updateF24PaymentSchema,
  upsertWorkProfileSchema,
  createClientSchema,
  updateClientSchema,
  createRecurringInvoiceSchema,
  updateRecurringInvoiceSchema,
  createInvestmentSchema,
  updateInvestmentSchema,
  createCryptoHoldingSchema,
  updateCryptoHoldingSchema,
  upsertFinanceSettingsSchema,
  createFinanceGoalSchema,
  updateFinanceGoalSchema,
} from "./schema";

const FINANZA = "/finanza";

// ============================================
// TRANSACTION ACTIONS
// ============================================

export async function createTransaction(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createTransactionSchema, input);

  const [created] = await db
    .insert(transaction)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/storico`);
  return created;
}

export async function updateTransaction(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateTransactionSchema, input);

  const [existing] = await db
    .select()
    .from(transaction)
    .where(and(eq(transaction.id, id), eq(transaction.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Transaction");

  const [updated] = await db
    .update(transaction)
    .set(data)
    .where(eq(transaction.id, id))
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/storico`);
  return updated;
}

export async function deleteTransaction(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(transaction)
    .where(and(eq(transaction.id, id), eq(transaction.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Transaction");

  await db.update(transaction).set({ deletedAt: new Date() }).where(eq(transaction.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/storico`);
}

// ============================================
// CATEGORY ACTIONS
// ============================================

export async function createCategory(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createCategorySchema, input);

  const [created] = await db
    .insert(category)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

export async function updateCategory(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateCategorySchema, input);

  const [existing] = await db
    .select()
    .from(category)
    .where(and(eq(category.id, id), eq(category.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Category");

  const [updated] = await db.update(category).set(data).where(eq(category.id, id)).returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function deleteCategory(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(category)
    .where(and(eq(category.id, id), eq(category.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Category");

  await db.update(category).set({ deletedAt: new Date() }).where(eq(category.id, id));

  revalidatePath(FINANZA);
}

// ============================================
// BANK ACCOUNT ACTIONS
// ============================================

export async function createBankAccount(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createBankAccountSchema, input);

  const [created] = await db
    .insert(bankAccount)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

export async function updateBankAccount(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateBankAccountSchema, input);

  const [existing] = await db
    .select()
    .from(bankAccount)
    .where(and(eq(bankAccount.id, id), eq(bankAccount.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Bank account");

  const [updated] = await db
    .update(bankAccount)
    .set(data)
    .where(eq(bankAccount.id, id))
    .returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function deleteBankAccount(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(bankAccount)
    .where(and(eq(bankAccount.id, id), eq(bankAccount.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Bank account");

  await db.update(bankAccount).set({ deletedAt: new Date() }).where(eq(bankAccount.id, id));

  revalidatePath(FINANZA);
}

// ============================================
// FIXED EXPENSE GROUP ACTIONS
// ============================================

export async function createFixedExpenseGroup(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createFixedExpenseGroupSchema, input);

  const [created] = await db
    .insert(fixedExpenseGroup)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-fisse`);
  return created;
}

export async function updateFixedExpenseGroup(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateFixedExpenseGroupSchema, input);

  const [existing] = await db
    .select()
    .from(fixedExpenseGroup)
    .where(and(eq(fixedExpenseGroup.id, id), eq(fixedExpenseGroup.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Fixed expense group");

  const [updated] = await db
    .update(fixedExpenseGroup)
    .set(data)
    .where(eq(fixedExpenseGroup.id, id))
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-fisse`);
  return updated;
}

export async function deleteFixedExpenseGroup(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(fixedExpenseGroup)
    .where(and(eq(fixedExpenseGroup.id, id), eq(fixedExpenseGroup.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Fixed expense group");

  await db
    .update(fixedExpenseGroup)
    .set({ deletedAt: new Date() })
    .where(eq(fixedExpenseGroup.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-fisse`);
}

// ============================================
// FIXED EXPENSE ACTIONS
// ============================================

export async function createFixedExpense(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createFixedExpenseSchema, input);

  // Verify group ownership
  const [group] = await db
    .select()
    .from(fixedExpenseGroup)
    .where(
      and(eq(fixedExpenseGroup.id, data.groupId), eq(fixedExpenseGroup.userId, session.user.id))
    )
    .limit(1);
  if (!group) throw errors.notFound("Fixed expense group");

  const [created] = await db
    .insert(fixedExpense)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-fisse`);
  return created;
}

export async function updateFixedExpense(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateFixedExpenseSchema, input);

  const [existing] = await db
    .select()
    .from(fixedExpense)
    .where(and(eq(fixedExpense.id, id), eq(fixedExpense.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Fixed expense");

  const [updated] = await db
    .update(fixedExpense)
    .set(data)
    .where(eq(fixedExpense.id, id))
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-fisse`);
  return updated;
}

export async function deleteFixedExpense(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(fixedExpense)
    .where(and(eq(fixedExpense.id, id), eq(fixedExpense.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Fixed expense");

  await db.update(fixedExpense).set({ deletedAt: new Date() }).where(eq(fixedExpense.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-fisse`);
}

// ============================================
// BUDGET ACTIONS
// ============================================

export async function upsertBudget(input: unknown) {
  const session = await validateSession();
  const data = parseInput(upsertBudgetSchema, input);

  const [existing] = await db
    .select()
    .from(budget)
    .where(
      and(
        eq(budget.userId, session.user.id),
        eq(budget.categoryId, data.categoryId),
        eq(budget.month, data.month)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(budget)
      .set({ plannedAmount: data.plannedAmount })
      .where(eq(budget.id, existing.id))
      .returning();

    revalidatePath(FINANZA);
    revalidatePath(`${FINANZA}/spese-variabili`);
    return updated;
  }

  const [created] = await db
    .insert(budget)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-variabili`);
  return created;
}

export async function deleteBudget(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(budget)
    .where(and(eq(budget.id, id), eq(budget.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Budget");

  await db.delete(budget).where(eq(budget.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/spese-variabili`);
}

// ============================================
// TAX PROFILE ACTIONS (singleton)
// ============================================

export async function upsertTaxProfile(input: unknown) {
  const session = await validateSession();
  const data = parseInput(upsertTaxProfileSchema, input);

  const [existing] = await db
    .select()
    .from(taxProfile)
    .where(eq(taxProfile.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(taxProfile)
      .set(data)
      .where(eq(taxProfile.userId, session.user.id))
      .returning();

    revalidatePath(FINANZA);
    return updated;
  }

  const [created] = await db
    .insert(taxProfile)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

// ============================================
// ANNUAL REVENUE ACTIONS
// ============================================

export async function createAnnualRevenue(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createAnnualRevenueSchema, input);

  const [created] = await db
    .insert(annualRevenue)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

export async function updateAnnualRevenue(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateAnnualRevenueSchema, input);

  const [existing] = await db
    .select()
    .from(annualRevenue)
    .where(and(eq(annualRevenue.id, id), eq(annualRevenue.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Annual revenue");

  const [updated] = await db
    .update(annualRevenue)
    .set(data)
    .where(eq(annualRevenue.id, id))
    .returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function deleteAnnualRevenue(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(annualRevenue)
    .where(and(eq(annualRevenue.id, id), eq(annualRevenue.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Annual revenue");

  await db.delete(annualRevenue).where(eq(annualRevenue.id, id));

  revalidatePath(FINANZA);
}

// ============================================
// F24 PAYMENT ACTIONS
// ============================================

export async function createF24Payment(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createF24PaymentSchema, input);

  const [created] = await db
    .insert(f24Payment)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

export async function updateF24Payment(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateF24PaymentSchema, input);

  const [existing] = await db
    .select()
    .from(f24Payment)
    .where(and(eq(f24Payment.id, id), eq(f24Payment.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("F24 payment");

  const [updated] = await db.update(f24Payment).set(data).where(eq(f24Payment.id, id)).returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function markF24Paid(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(f24Payment)
    .where(and(eq(f24Payment.id, id), eq(f24Payment.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("F24 payment");

  const [updated] = await db
    .update(f24Payment)
    .set({ isPaid: true, paidAt: new Date() })
    .where(eq(f24Payment.id, id))
    .returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function deleteF24Payment(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(f24Payment)
    .where(and(eq(f24Payment.id, id), eq(f24Payment.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("F24 payment");

  await db.update(f24Payment).set({ deletedAt: new Date() }).where(eq(f24Payment.id, id));

  revalidatePath(FINANZA);
}

// ============================================
// WORK PROFILE ACTIONS (singleton)
// ============================================

export async function upsertWorkProfile(input: unknown) {
  const session = await validateSession();
  const data = parseInput(upsertWorkProfileSchema, input);

  const [existing] = await db
    .select()
    .from(workProfile)
    .where(eq(workProfile.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(workProfile)
      .set(data)
      .where(eq(workProfile.userId, session.user.id))
      .returning();

    revalidatePath(FINANZA);
    return updated;
  }

  const [created] = await db
    .insert(workProfile)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

// ============================================
// CLIENT ACTIONS
// ============================================

export async function createClient(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createClientSchema, input);

  const [created] = await db
    .insert(client)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

export async function updateClient(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateClientSchema, input);

  const [existing] = await db
    .select()
    .from(client)
    .where(and(eq(client.id, id), eq(client.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Client");

  const [updated] = await db.update(client).set(data).where(eq(client.id, id)).returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function deleteClient(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(client)
    .where(and(eq(client.id, id), eq(client.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Client");

  await db.update(client).set({ deletedAt: new Date() }).where(eq(client.id, id));

  revalidatePath(FINANZA);
}

// ============================================
// RECURRING INVOICE ACTIONS
// ============================================

export async function createRecurringInvoice(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createRecurringInvoiceSchema, input);

  // Verify client ownership
  const [cl] = await db
    .select()
    .from(client)
    .where(and(eq(client.id, data.clientId), eq(client.userId, session.user.id)))
    .limit(1);
  if (!cl) throw errors.notFound("Client");

  const [created] = await db
    .insert(recurringInvoice)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

export async function updateRecurringInvoice(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateRecurringInvoiceSchema, input);

  const [existing] = await db
    .select()
    .from(recurringInvoice)
    .where(and(eq(recurringInvoice.id, id), eq(recurringInvoice.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Recurring invoice");

  const [updated] = await db
    .update(recurringInvoice)
    .set(data)
    .where(eq(recurringInvoice.id, id))
    .returning();

  revalidatePath(FINANZA);
  return updated;
}

export async function deleteRecurringInvoice(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(recurringInvoice)
    .where(and(eq(recurringInvoice.id, id), eq(recurringInvoice.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Recurring invoice");

  await db
    .update(recurringInvoice)
    .set({ deletedAt: new Date() })
    .where(eq(recurringInvoice.id, id));

  revalidatePath(FINANZA);
}

// ============================================
// INVESTMENT ACTIONS
// ============================================

export async function createInvestment(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createInvestmentSchema, input);

  const [created] = await db
    .insert(investment)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/investimenti`);
  return created;
}

export async function updateInvestment(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateInvestmentSchema, input);

  const [existing] = await db
    .select()
    .from(investment)
    .where(and(eq(investment.id, id), eq(investment.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Investment");

  const [updated] = await db.update(investment).set(data).where(eq(investment.id, id)).returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/investimenti`);
  return updated;
}

export async function deleteInvestment(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(investment)
    .where(and(eq(investment.id, id), eq(investment.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Investment");

  await db.update(investment).set({ deletedAt: new Date() }).where(eq(investment.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/investimenti`);
}

// ============================================
// CRYPTO HOLDING ACTIONS
// ============================================

export async function createCryptoHolding(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createCryptoHoldingSchema, input);

  const [created] = await db
    .insert(cryptoHolding)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/investimenti`);
  return created;
}

export async function updateCryptoHolding(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateCryptoHoldingSchema, input);

  const [existing] = await db
    .select()
    .from(cryptoHolding)
    .where(and(eq(cryptoHolding.id, id), eq(cryptoHolding.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Crypto holding");

  const [updated] = await db
    .update(cryptoHolding)
    .set(data)
    .where(eq(cryptoHolding.id, id))
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/investimenti`);
  return updated;
}

export async function deleteCryptoHolding(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(cryptoHolding)
    .where(and(eq(cryptoHolding.id, id), eq(cryptoHolding.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Crypto holding");

  await db.update(cryptoHolding).set({ deletedAt: new Date() }).where(eq(cryptoHolding.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/investimenti`);
}

// ============================================
// FINANCE SETTINGS ACTIONS (singleton)
// ============================================

export async function upsertFinanceSettings(input: unknown) {
  const session = await validateSession();
  const data = parseInput(upsertFinanceSettingsSchema, input);

  const [existing] = await db
    .select()
    .from(financeSettings)
    .where(eq(financeSettings.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(financeSettings)
      .set(data)
      .where(eq(financeSettings.userId, session.user.id))
      .returning();

    revalidatePath(FINANZA);
    return updated;
  }

  const [created] = await db
    .insert(financeSettings)
    .values({ ...data, userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  return created;
}

// ============================================
// FINANCE GOAL ACTIONS
// ============================================

export async function createFinanceGoal(input: unknown) {
  const session = await validateSession();
  const data = parseInput(createFinanceGoalSchema, input);

  const [created] = await db
    .insert(goal)
    .values({ ...data, domain: "finance", userId: session.user.id })
    .returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/obiettivi`);
  return created;
}

export async function updateFinanceGoal(id: string, input: unknown) {
  const session = await validateSession();
  const data = parseInput(updateFinanceGoalSchema, input);

  const [existing] = await db
    .select()
    .from(goal)
    .where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Goal");

  const [updated] = await db.update(goal).set(data).where(eq(goal.id, id)).returning();

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/obiettivi`);
  revalidatePath(`${FINANZA}/obiettivi/${id}`);
  return updated;
}

export async function deleteFinanceGoal(id: string) {
  const session = await validateSession();

  const [existing] = await db
    .select()
    .from(goal)
    .where(and(eq(goal.id, id), eq(goal.userId, session.user.id)))
    .limit(1);
  if (!existing) throw errors.notFound("Goal");

  await db.update(goal).set({ deletedAt: new Date() }).where(eq(goal.id, id));

  revalidatePath(FINANZA);
  revalidatePath(`${FINANZA}/obiettivi`);
}
