import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, suggestCategory } from "../api/expenses.api";
import type { ExpenseFilters, CreateExpenseDto, UpdateExpenseDto } from "../types";

export const queryKeys = {
  all: ["expenses"] as const,
  lists: () => [...queryKeys.all, "list"] as const,
  list: (filters: string) => [...queryKeys.lists(), { filters }] as const,
  details: () => [...queryKeys.all, "detail"] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  dashboard: ["analytics", "dashboard"] as const,
  trends: ["analytics", "trends"] as const,
};

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: queryKeys.list(JSON.stringify(filters)),
    queryFn: () => getExpenses(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => getExpense(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseDto) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.trends });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) => updateExpense({ id, data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.trends });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.trends });
    },
  });
}

export function useSuggestCategory() {
  return useMutation({
    mutationFn: ({ description, amount }: { description: string; amount: number }) => suggestCategory(description, amount),
  });
}
