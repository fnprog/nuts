import { api } from "@/lib/ky";

export interface ChartData {
  balanceOverview: Array<{ name: string; value: number }>;
  incomeVsExpenses: Array<{ name: string; income: number; expenses: number }>;
  expenseCategories: Array<{ name: string; value: number }>;
}

export const getChartData = async (): Promise<ChartData> => {
  // The baseUrl in ky config should be set to "http://localhost:3001" in .env for local/dev usage,
  // Or adjust as necessary here if this endpoint is non-standard compared to the rest.
  return await api.get("chartData").json<ChartData>();
};
