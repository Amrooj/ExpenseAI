// ============================================================
// src/hooks/useExpenses.ts — TanStack Query Custom Hooks
// ============================================================
//
// 🎓 TEACHING: Custom Hooks + TanStack Query
//
// Custom hooks encapsulate complex logic into reusable functions.
// TanStack Query (React Query) manages:
//   - Caching API responses
//   - Automatic refetching when data is stale
//   - Loading/error states
//   - Optimistic updates
//   - Cache invalidation after mutations
//
// Pattern: useQuery for reads, useMutation for writes
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as expenseApi from "../api/expense.api";
import { ExpenseFilters } from "../types";
import toast from "react-hot-toast";

// ── Query Keys ────────────────────────────────────────────────
// Centralized query keys prevent typo bugs and enable smart cache invalidation
export const QUERY_KEYS = {
  expenses:    (filters?: ExpenseFilters) => ["expenses", filters] as const,
  expense:     (id: string) => ["expenses", id] as const,
  categories:  ["categories"] as const,
  dashboard:   ["dashboard"] as const,
  trends:      ["trends"] as const,
};

// ── Fetch Expenses (paginated, filtered) ──────────────────────
export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.expenses(filters),
    queryFn:  () => expenseApi.fetchExpenses(filters),
  });
}

// ── Fetch Single Expense ──────────────────────────────────────
export function useExpense(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.expense(id),
    queryFn:  () => expenseApi.fetchExpense(id),
    enabled:  !!id, // Only fetch when id is truthy
  });
}

// ── Fetch Categories ──────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn:  expenseApi.fetchCategories,
    staleTime: 30 * 60 * 1000, // Categories change rarely — cache 30 min
  });
}

// ── Create Expense ────────────────────────────────────────────
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseApi.createExpense,
    onSuccess: () => {
      // Invalidate expense and dashboard queries → triggers refetch
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trends });
      toast.success("Expense added!");
    },
    onError: () => {
      toast.error("Failed to create expense");
    },
  });
}

// ── Update Expense ────────────────────────────────────────────
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      expenseApi.updateExpense(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trends });
      toast.success("Expense updated!");
    },
    onError: () => {
      toast.error("Failed to update expense");
    },
  });
}

// ── Delete Expense ────────────────────────────────────────────
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trends });
      toast.success("Expense deleted");
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
  });
}

// ── Upload Receipt ────────────────────────────────────────────
export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      expenseApi.uploadReceipt(expenseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Receipt uploaded!");
    },
  });
}

// ── Dashboard Analytics ───────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn:  expenseApi.fetchDashboardSummary,
  });
}

export function useSpendingTrends() {
  return useQuery({
    queryKey: QUERY_KEYS.trends,
    queryFn:  expenseApi.fetchSpendingTrends,
  });
}

// ── AI Suggestion ─────────────────────────────────────────────
export function useSuggestCategory() {
  return useMutation({
    mutationFn: ({ description, amount }: { description: string; amount: number }) =>
      expenseApi.suggestCategory(description, amount),
  });
}
