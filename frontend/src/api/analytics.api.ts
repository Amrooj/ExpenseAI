import api from "./client";
import type { ApiResponse, DashboardData, TrendsData } from "../types";

export async function getDashboardStats(): Promise<DashboardData> {
  const { data } = await api.get<ApiResponse<DashboardData>>("/api/analytics/dashboard");
  return data.data!;
}

export async function getTrendsData(): Promise<TrendsData> {
  const { data } = await api.get<ApiResponse<TrendsData>>("/api/analytics/trends");
  return data.data!;
}
