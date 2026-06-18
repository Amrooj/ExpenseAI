// ============================================================
// src/api/expense.api.ts — Expense API Functions
// ============================================================

import api from "./client";
import { ApiResponse, Expense, ExpenseFilters, Category } from "../types";

// ── Expenses ──────────────────────────────────────────────────

export async function fetchExpenses(filters: ExpenseFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const { data } = await api.get<ApiResponse<Expense[]>>(`/api/expenses?${params}`);
  return data;
}

export async function fetchExpense(id: string) {
  const { data } = await api.get<ApiResponse<{ expense: Expense }>>(`/api/expenses/${id}`);
  return data.data!.expense;
}

export async function createExpense(expense: {
  amount:       number;
  description:  string;
  date:         string;
  categoryId:   string;
  currency?:    string;
  tags?:        string[];
  notes?:       string;
  isRecurring?: boolean;
  recurringInterval?: string;
}) {
  const { data } = await api.post<ApiResponse<{ expense: Expense }>>("/api/expenses", expense);
  return data.data!.expense;
}

export async function updateExpense(id: string, updates: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<{ expense: Expense }>>(`/api/expenses/${id}`, updates);
  return data.data!.expense;
}

export async function deleteExpense(id: string) {
  await api.delete(`/api/expenses/${id}`);
}

export async function uploadReceipt(expenseId: string, file: File) {
  const formData = new FormData();
  formData.append("receipt", file);
  const { data } = await api.post<ApiResponse<{ receiptUrl: string }>>(
    `/api/expenses/${expenseId}/receipt`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data!;
}

export async function suggestCategory(description: string, amount: number) {
  const { data } = await api.post<ApiResponse<{ suggestion: {
    categoryId:   string;
    categoryName: string;
    confidence:   number;
    provider:     string;
    requiresConfirmation: boolean;
  } | null }>>("/api/expenses/suggest-category", { description, amount });
  return data.data!.suggestion;
}

// ── Categories ────────────────────────────────────────────────

export async function fetchCategories() {
  const { data } = await api.get<ApiResponse<{ categories: Category[] }>>("/api/expenses/categories");
  return data.data!.categories;
}

export async function createCategory(cat: { name: string; color?: string; icon?: string }) {
  const { data } = await api.post<ApiResponse<{ category: Category }>>("/api/expenses/categories", cat);
  return data.data!.category;
}

// ── Analytics ─────────────────────────────────────────────────

export async function fetchDashboardSummary() {
  const { data } = await api.get<ApiResponse<{
    thisMonth:     { total: number; count: number; average: number };
    lastMonth:     { total: number };
    changePercent: number;
    totalExpenses: number;
  }>>("/api/expenses/analytics/dashboard");
  return data.data!;
}

export async function fetchSpendingTrends() {
  const { data } = await api.get<ApiResponse<{
    monthly:    Array<{ month: string; total: number }>;
    byCategory: Array<{ categoryId: string; _sum: { amount: number }; _count: number }>;
  }>>("/api/expenses/analytics/trends");
  return data.data!;
}
