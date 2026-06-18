// ============================================================
// src/services/expense.service.ts — Expense Business Logic
// ============================================================

import * as expenseRepo  from "../repositories/expense.repository";
import * as categoryRepo from "../repositories/category.repository";
import { categorizeExpense } from "../ai/AICategorizerService";
import { createError } from "../middleware/errorHandler";
import { log } from "../utils/logger";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ListExpensesQuery,
} from "../validators/expense.validator";

// ── List Expenses (paginated + filtered) ──────────────────────
export async function listExpenses(userId: string, query: ListExpensesQuery) {
  const { expenses, total } = await expenseRepo.findManyExpenses(userId, query);

  return {
    expenses,
    pagination: {
      total,
      page:       query.page,
      limit:      query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page < Math.ceil(total / query.limit),
      hasPrevPage: query.page > 1,
    },
  };
}

// ── Get Single Expense ────────────────────────────────────────
export async function getExpense(id: string, userId: string) {
  const expense = await expenseRepo.findExpenseById(id, userId);
  if (!expense) {
    throw createError.notFound("Expense");
  }
  return expense;
}

// ── Create Expense (with AI categorization) ───────────────────
export async function createExpense(userId: string, dto: CreateExpenseDto) {
  // Validate that the provided categoryId exists and belongs to this user
  const category = await categoryRepo.findCategoryById(dto.categoryId, userId);
  if (!category) {
    throw createError.badRequest("Invalid category. Please select a valid category.");
  }

  // Run AI categorization in background (don't block on it)
  // The user explicitly provided a category — AI is advisory only
  let aiMeta = {};
  try {
    const aiResult = await categorizeExpense(dto.description, dto.amount, userId);
    aiMeta = {
      aiConfidence: aiResult.confidence,
      aiProvider:   aiResult.provider,
      // Was the user's choice different from what AI suggested?
      aiOverridden: aiResult.categoryId !== dto.categoryId,
    };
  } catch (aiError) {
    // AI failure should NEVER block expense creation
    log.warn("AI categorization failed during expense creation", { error: aiError });
  }

  const expense = await expenseRepo.createExpense(userId, {
    amount:      dto.amount,
    currency:    dto.currency ?? "USD",
    description: dto.description,
    date:        new Date(dto.date),
    categoryId:  dto.categoryId,
    tags:        dto.tags ?? [],
    notes:       dto.notes,
    isRecurring: dto.isRecurring ?? false,
    recurringInterval: dto.recurringInterval ?? undefined,
    recurringEndDate:  dto.recurringEndDate ? new Date(dto.recurringEndDate) : undefined,
    ...aiMeta,
  });

  log.info("Expense created", { expenseId: expense.id, userId });
  return expense;
}

// ── AI Suggest Category (before user submits form) ────────────
// Called as the user types the description (debounced on frontend)
export async function suggestCategory(
  description: string,
  amount:      number,
  userId:      string
) {
  if (!description || description.trim().length < 3) {
    return null;
  }

  try {
    const result = await categorizeExpense(description, amount, userId);
    return result;
  } catch {
    return null;
  }
}

// ── Update Expense ────────────────────────────────────────────
export async function updateExpense(
  id:     string,
  userId: string,
  dto:    UpdateExpenseDto
) {
  // Verify ownership
  const existing = await expenseRepo.findExpenseById(id, userId);
  if (!existing) {
    throw createError.notFound("Expense");
  }

  // If category changed, validate it
  if (dto.categoryId) {
    const category = await categoryRepo.findCategoryById(dto.categoryId, userId);
    if (!category) {
      throw createError.badRequest("Invalid category.");
    }
  }

  const updated = await expenseRepo.updateExpense(id, userId, {
    ...(dto.amount      !== undefined && { amount:      dto.amount }),
    ...(dto.currency    !== undefined && { currency:    dto.currency }),
    ...(dto.description !== undefined && { description: dto.description }),
    ...(dto.date        !== undefined && { date:        new Date(dto.date) }),
    ...(dto.categoryId  !== undefined && { categoryId:  dto.categoryId }),
    ...(dto.tags        !== undefined && { tags:        dto.tags }),
    ...(dto.notes       !== undefined && { notes:       dto.notes }),
    ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
    ...(dto.recurringInterval !== undefined && { recurringInterval: dto.recurringInterval }),
    ...(dto.recurringEndDate  !== undefined && {
      recurringEndDate: dto.recurringEndDate ? new Date(dto.recurringEndDate) : null,
    }),
    ...(dto.aiOverridden !== undefined && { aiOverridden: dto.aiOverridden }),
  });

  log.info("Expense updated", { expenseId: id, userId });
  return updated;
}

// ── Delete Expense ────────────────────────────────────────────
export async function deleteExpense(id: string, userId: string): Promise<void> {
  const deleted = await expenseRepo.deleteExpense(id, userId);
  if (!deleted) {
    throw createError.notFound("Expense");
  }
  log.info("Expense deleted", { expenseId: id, userId });
}

// ── Bulk CSV Import ───────────────────────────────────────────
export async function bulkImportExpenses(
  userId:  string,
  rows:    Array<{
    amount: number;
    description: string;
    date: string;
    category: string;
    currency?: string;
    tags?: string;
    notes?: string;
  }>
) {
  const results = { imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      // Find or fall back to "Other" for the category name from CSV
      let category = await categoryRepo.findCategoryByName(row.category, userId);
      if (!category) {
        category = await categoryRepo.findCategoryByName("Other", userId);
      }
      if (!category) continue;

      await expenseRepo.createExpense(userId, {
        amount:      row.amount,
        currency:    row.currency ?? "USD",
        description: row.description,
        date:        new Date(row.date),
        categoryId:  category.id,
        tags:        row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
        notes:       row.notes,
      });
      results.imported++;
    } catch {
      results.skipped++;
      results.errors.push(`Row "${row.description}": failed to import`);
    }
  }

  log.info("CSV import complete", { userId, ...results });
  return results;
}

// ── Analytics ─────────────────────────────────────────────────
export async function getDashboardSummary(userId: string) {
  const summary = await expenseRepo.getMonthlySummary(userId);

  const thisMonthTotal = Number(summary.thisMonth._sum.amount ?? 0);
  const lastMonthTotal = Number(summary.lastMonth._sum.amount ?? 0);
  const changePercent  = lastMonthTotal === 0
    ? 0
    : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

  return {
    thisMonth: {
      total:   thisMonthTotal,
      count:   summary.thisMonth._count,
      average: Number(summary.thisMonth._avg.amount ?? 0),
    },
    lastMonth: { total: lastMonthTotal },
    changePercent: Math.round(changePercent * 10) / 10,
    totalExpenses: summary.totalExpenses,
  };
}

export async function getSpendingTrends(userId: string) {
  const [monthly, byCategory] = await Promise.all([
    expenseRepo.getMonthlyTotals(userId, 6),
    expenseRepo.getSpendingByCategory(
      userId,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date()
    ),
  ]);
  return { monthly, byCategory };
}
