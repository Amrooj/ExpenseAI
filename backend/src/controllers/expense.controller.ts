// ============================================================
// src/controllers/expense.controller.ts
// ============================================================

import { Response, NextFunction } from "express";
import { AuthRequest }      from "../types";
import * as expenseService  from "../services/expense.service";
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from "../utils/response";
import { ListExpensesQuery } from "../validators/expense.validator";
import { uploadFile }       from "../storage/StorageService";
import * as expenseRepo     from "../repositories/expense.repository";
import { createError }      from "../middleware/errorHandler";

export async function listExpenses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await expenseService.listExpenses(
      req.user!.userId,
      req.query as unknown as ListExpensesQuery
    );
    sendPaginated(
      res,
      result.expenses,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    );
  } catch (e) { next(e); }
}

export async function getExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.getExpense(req.params["id"]!, req.user!.userId);
    sendSuccess(res, { expense });
  } catch (e) { next(e); }
}

export async function createExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.createExpense(req.user!.userId, req.body);
    sendCreated(res, { expense }, "Expense created successfully");
  } catch (e) { next(e); }
}

export async function updateExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await expenseService.updateExpense(
      req.params["id"]!,
      req.user!.userId,
      req.body
    );
    sendSuccess(res, { expense }, "Expense updated");
  } catch (e) { next(e); }
}

export async function deleteExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await expenseService.deleteExpense(req.params["id"]!, req.user!.userId);
    sendNoContent(res);
  } catch (e) { next(e); }
}

export async function bulkImport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await expenseService.bulkImportExpenses(req.user!.userId, req.body.rows);
    sendSuccess(res, result, `Imported ${result.imported} expenses`);
  } catch (e) { next(e); }
}

export async function suggestCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { description, amount } = req.body as { description: string; amount: number };
    const suggestion = await expenseService.suggestCategory(
      description,
      amount,
      req.user!.userId
    );
    sendSuccess(res, { suggestion });
  } catch (e) { next(e); }
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await expenseService.getDashboardSummary(req.user!.userId);
    sendSuccess(res, summary);
  } catch (e) { next(e); }
}

export async function getSpendingTrends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const trends = await expenseService.getSpendingTrends(req.user!.userId);
    sendSuccess(res, trends);
  } catch (e) { next(e); }
}

// ── POST /api/expenses/:id/receipt ────────────────────────────
export async function uploadReceiptHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw createError.badRequest("No file provided. Please upload a receipt image or PDF.");
    }

    // Verify expense exists and belongs to user
    const expense = await expenseRepo.findExpenseById(req.params["id"]!, req.user!.userId);
    if (!expense) {
      throw createError.notFound("Expense");
    }

    // Upload file via storage provider
    const result = await uploadFile(req.file);

    // Save the URL on the expense record
    await expenseRepo.updateReceiptUrl(req.params["id"]!, req.user!.userId, result.url);

    sendSuccess(res, {
      receiptUrl: result.url,
      filename:   result.filename,
      size:       result.size,
      mimetype:   result.mimetype,
    }, "Receipt uploaded successfully");
  } catch (e) { next(e); }
}
