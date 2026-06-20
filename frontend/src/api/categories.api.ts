import api from "./client";
import type { ApiResponse, Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiResponse<{ categories: Category[] }>>("/api/categories");
  return data.data!.categories;
}

export async function createCategory(category: { name: string; color: string; icon: string }): Promise<Category> {
  const { data } = await api.post<ApiResponse<{ category: Category }>>("/api/categories", category);
  return data.data!.category;
}

export async function updateCategory({ id, data }: { id: string; data: Partial<{ name: string; color: string; icon: string }> }): Promise<Category> {
  const { data: res } = await api.patch<ApiResponse<{ category: Category }>>(`/api/categories/${id}`, data);
  return res.data!.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}
