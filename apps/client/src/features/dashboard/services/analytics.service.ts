import { transactionService } from "@/features/transactions/services/transaction.service";
import { Result, ok, err, ServiceError } from "@/lib/result";
import { startOfMonth, endOfMonth, format, subMonths, eachMonthOfInterval } from "date-fns";

export interface MonthlySpendingByCategory {
  month: string;
  [category: string]: string | number;
}

export interface CategoryTotal {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyIncomeExpense {
  month: string;
  income: number;
  expense: number;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function createAnalyticsService() {
  const getMonthlySpendingByCategory = async (
    monthsBack: number = 6
  ): Promise<Result<MonthlySpendingByCategory[], ServiceError>> => {
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(endDate, monthsBack - 1));

    const transactionsResult = await transactionService.getTransactions({
      page: 1,
      limit: 10000,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      type: "expense",
    });

    if (transactionsResult.isErr()) return err(transactionsResult.error);

    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthlyData: Record<string, Record<string, number>> = {};

    months.forEach((month) => {
      const monthKey = format(month, "MMM");
      monthlyData[monthKey] = { month: monthKey };
    });

    transactionsResult.value.data.forEach((group) => {
      group.transactions.forEach((tx) => {
        const monthKey = format(tx.transaction_datetime, "MMM");
        const categoryName = tx.category?.name || "Uncategorized";

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey };
        }

        if (!monthlyData[monthKey][categoryName]) {
          monthlyData[monthKey][categoryName] = 0;
        }

        monthlyData[monthKey][categoryName] += Math.abs(tx.amount);
      });
    });

    const result = Object.values(monthlyData) as MonthlySpendingByCategory[];
    return ok(result);
  };

  const getCategoryBreakdown = async (
    monthsBack: number = 1
  ): Promise<Result<CategoryTotal[], ServiceError>> => {
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(endDate, monthsBack - 1));

    const transactionsResult = await transactionService.getTransactions({
      page: 1,
      limit: 10000,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      type: "expense",
    });

    if (transactionsResult.isErr()) return err(transactionsResult.error);

    const categoryTotals: Record<string, number> = {};

    transactionsResult.value.data.forEach((group) => {
      group.transactions.forEach((tx) => {
        const categoryName = tx.category?.name || "Uncategorized";
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += Math.abs(tx.amount);
      });
    });

    const result: CategoryTotal[] = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

    return ok(result);
  };

  const getMonthlyIncomeExpense = async (
    monthsBack: number = 6
  ): Promise<Result<MonthlyIncomeExpense[], ServiceError>> => {
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(endDate, monthsBack - 1));

    const transactionsResult = await transactionService.getTransactions({
      page: 1,
      limit: 10000,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    });

    if (transactionsResult.isErr()) return err(transactionsResult.error);

    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const monthlyData: Record<string, MonthlyIncomeExpense> = {};

    months.forEach((month) => {
      const monthKey = format(month, "MMM");
      monthlyData[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
      };
    });

    transactionsResult.value.data.forEach((group) => {
      group.transactions.forEach((tx) => {
        const monthKey = format(tx.transaction_datetime, "MMM");

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            income: 0,
            expense: 0,
          };
        }

        if (tx.type === "income") {
          monthlyData[monthKey].income += Math.abs(tx.amount);
        } else if (tx.type === "expense") {
          monthlyData[monthKey].expense += Math.abs(tx.amount);
        }
      });
    });

    const result = Object.values(monthlyData);
    return ok(result);
  };

  return {
    getMonthlySpendingByCategory,
    getCategoryBreakdown,
    getMonthlyIncomeExpense,
  };
}

export const analyticsService = createAnalyticsService();
