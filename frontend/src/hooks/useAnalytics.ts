import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getTrendsData } from "../api/analytics.api";
import { queryKeys } from "./useExpenses";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardStats,
  });
}

export function useTrendsData() {
  return useQuery({
    queryKey: queryKeys.trends,
    queryFn: getTrendsData,
  });
}
