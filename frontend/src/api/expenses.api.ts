import api from "./client";
import type { ApiResponse, Expense, ExpenseFilters, CreateExpenseDto, UpdateExpenseDto, CategorySuggestion } from "../types";

export async function getExpenses(filters: ExpenseFilters): Promise<{ expenses: Expense[]; meta: ApiResponse["meta"] }> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(`${key}[]`, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  });

  const { data } = await api.get<ApiResponse<{ expenses: Expense[] }>>(`/api/expenses?${params.toString()}`);
  return { expenses: data.data!.expenses, meta: data.meta };
}

export async function getExpense(id: string): Promise<Expense> {
  const { data } = await api.get<ApiResponse<{ expense: Expense }>>(`/api/expenses/${id}`);
  return data.data!.expense;
}

export async function createExpense(expense: CreateExpenseDto): Promise<Expense> {
  const { data } = await api.post<ApiResponse<{ expense: Expense }>>("/api/expenses", expense);
  return data.data!.expense;
}

export async function updateExpense({ id, data }: { id: string; data: UpdateExpenseDto }): Promise<Expense> {
  const { data: res } = await api.patch<ApiResponse<{ expense: Expense }>>(`/api/expenses/${id}`, data);
  return res.data!.expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/api/expenses/${id}`);
}

export async function suggestCategory(description: string, amount: number): Promise<CategorySuggestion> {
  const { data } = await api.post<ApiResponse<CategorySuggestion>>("/api/expenses/suggest-category", { description, amount });
  return data.data!;
}
