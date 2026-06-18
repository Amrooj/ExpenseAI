// ============================================================
// src/repositories/expense.repository.ts — Expense Data Layer
// ============================================================
//
// 🎓 TEACHING: Prisma Query Patterns
//
// This file shows several important Prisma patterns:
//
// 1. DYNAMIC WHERE CLAUSES
//    We build the `where` object conditionally based on which
//    filters the user passed. Prisma handles undefined values
//    gracefully — undefined = "don't filter on this field".
//
// 2. TRANSACTIONS
//    Prisma transactions group multiple queries so they either
//    ALL succeed or ALL fail. Used for bulk operations.
//
// 3. SELECT vs INCLUDE
//    - select:  pick exactly which fields to return (efficient)
//    - include: include related records (like SQL JOIN)
//    - You can't use both at the same time
//
// 4. RAW QUERIES (prisma.$queryRaw)
//    For complex analytics SQL that Prisma's query builder can't express
// ============================================================

import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ListExpensesQuery } from "../validators/expense.validator";

// ── Standard expense select (used in most queries) ────────────
// Always include category — frontend always needs it for display
const expenseSelect = {
  id:               true,
  userId:           true,
  amount:           true,
  currency:         true,
  description:      true,
  date:             true,
  categoryId:       true,
  tags:             true,
  receiptUrl:       true,
  isRecurring:      true,
  recurringInterval: true,
  recurringEndDate: true,
  recurringParentId: true,
  aiConfidence:     true,
  aiProvider:       true,
  aiOverridden:     true,
  notes:            true,
  createdAt:        true,
  updatedAt:        true,
  category: {
    select: {
      id:        true,
      name:      true,
      color:     true,
      icon:      true,
      isDefault: true,
    },
  },
} satisfies Prisma.ExpenseSelect;

// ── Build WHERE Clause from Filters ──────────────────────────
//
// 🎓 TEACHING: Prisma's WhereInput type
// Prisma generates typed WHERE input for every model.
// Prisma.ExpenseWhereInput ensures your filter object is valid.
function buildWhereClause(
  userId:  string,
  filters: ListExpensesQuery
): Prisma.ExpenseWhereInput {
  return {
    userId, // ALWAYS filter by userId — users only see THEIR expenses
    // If search is provided → filter description (case-insensitive)
    ...(filters.search && {
      description: {
        contains: filters.search,
        mode: "insensitive", // PostgreSQL ILIKE
      },
    }),
    // Category filter
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    // Date range filter
    ...(filters.startDate || filters.endDate) && {
      date: {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate   && { lte: new Date(filters.endDate) }),
      },
    },
    // Amount range filter
    ...(filters.minAmount || filters.maxAmount) && {
      amount: {
        ...(filters.minAmount && { gte: new Prisma.Decimal(filters.minAmount) }),
        ...(filters.maxAmount && { lte: new Prisma.Decimal(filters.maxAmount) }),
      },
    },
    // Recurring filter
    ...(filters.isRecurring !== undefined && { isRecurring: filters.isRecurring }),
    // Tags filter (array contains)
    ...(filters.tags && {
      tags: { hasSome: filters.tags.split(",").map((t) => t.trim()) },
    }),
  };
}

// ── Find Many Expenses (paginated + filtered) ─────────────────
export async function findManyExpenses(
  userId:  string,
  filters: ListExpensesQuery
) {
  const where = buildWhereClause(userId, filters);
  const orderBy = { [filters.sortBy]: filters.sortOrder };
  const skip = (filters.page - 1) * filters.limit;

  // 🎓 TEACHING: prisma.$transaction
  // We run TWO queries simultaneously using a transaction:
  //   1. Get the current page of expenses
  //   2. Count total matching expenses (for pagination meta)
  // Without a transaction, a new expense could be added between
  // queries 1 and 2, making the count incorrect.
  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      select: expenseSelect,
      orderBy,
      skip,
      take: filters.limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total };
}

// ── Find One Expense ──────────────────────────────────────────
export async function findExpenseById(id: string, userId: string) {
  return prisma.expense.findFirst({
    where: { id, userId }, // userId check = ownership verification
    select: expenseSelect,
  });
}

// ── Create Expense ────────────────────────────────────────────
export async function createExpense(
  userId: string,
  data:   Omit<Prisma.ExpenseUncheckedCreateInput, "userId">
) {
  return prisma.expense.create({
    data: { ...data, userId },
    select: expenseSelect,
  });
}

// ── Update Expense ────────────────────────────────────────────
export async function updateExpense(
  id:     string,
  userId: string,
  data:   Prisma.ExpenseUpdateInput
) {
  // findFirst with userId check ensures users can only update THEIR expenses
  const expense = await prisma.expense.findFirst({ where: { id, userId } });
  if (!expense) return null;

  return prisma.expense.update({
    where: { id },
    data,
    select: expenseSelect,
  });
}

// ── Delete Expense ────────────────────────────────────────────
export async function deleteExpense(id: string, userId: string): Promise<boolean> {
  const expense = await prisma.expense.findFirst({ where: { id, userId } });
  if (!expense) return false;

  await prisma.expense.delete({ where: { id } });
  return true;
}

// ── Bulk Create (CSV Import) ──────────────────────────────────
export async function bulkCreateExpenses(
  expenses: Prisma.ExpenseUncheckedCreateInput[]
): Promise<number> {
  // createMany is more efficient than N individual creates
  // skipDuplicates: ignore rows that violate unique constraints
  const result = await prisma.expense.createMany({
    data:           expenses,
    skipDuplicates: true,
  });
  return result.count;
}

// ── Update Receipt URL ────────────────────────────────────────
export async function updateReceiptUrl(
  id:         string,
  userId:     string,
  receiptUrl: string
) {
  return prisma.expense.updateMany({
    where: { id, userId },
    data:  { receiptUrl },
  });
}

// ── Analytics Queries ─────────────────────────────────────────

// Total spent per category for a date range
export async function getSpendingByCategory(
  userId:    string,
  startDate: Date,
  endDate:   Date
) {
  return prisma.expense.groupBy({
    by:    ["categoryId"],
    where: { userId, date: { gte: startDate, lte: endDate } },
    _sum:  { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
  });
}

// Monthly spending totals (for trend charts)
export async function getMonthlyTotals(userId: string, months: number = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Raw SQL for date truncation (Prisma doesn't support date_trunc natively)
  return prisma.$queryRaw<Array<{ month: Date; total: number }>>`
    SELECT
      DATE_TRUNC('month', date) AS month,
      SUM(amount)::float         AS total
    FROM expenses
    WHERE "userId" = ${userId}
      AND date >= ${startDate}
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month ASC
  `;
}

// Total spent this month vs last month (for dashboard summary)
export async function getMonthlySummary(userId: string) {
  const now       = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonth, lastMonth, totalExpenses] = await prisma.$transaction([
    prisma.expense.aggregate({
      where:  { userId, date: { gte: thisMonthStart } },
      _sum:   { amount: true },
      _count: true,
      _avg:   { amount: true },
    }),
    prisma.expense.aggregate({
      where:  { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum:   { amount: true },
    }),
    prisma.expense.count({ where: { userId } }),
  ]);

  return { thisMonth, lastMonth, totalExpenses };
}
