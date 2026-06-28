import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface AnalyticsOverview {
  totalSpent: number;
  totalPaid: number;
  totalSettled: number;
  netBalance: number;
  activeGroups: number;
  totalExpenses: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
  count: number;
}

export interface TopGroup {
  id: string;
  name: string;
  totalSpent: number;
  balance: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
  topGroups: TopGroup[];
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/analytics");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
