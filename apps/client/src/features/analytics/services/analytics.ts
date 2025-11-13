import { api } from "@/lib/axios";
import { ResultAsync, ServiceError } from "@/lib/result";

export interface IncomeExpenseData {
  period: string;
  income: number;
  expenses: number;
}

export interface AssetLiabilityData {
  period: string;
  assets: number;
  liabilities: number;
}

export interface CategorySpendingData {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetData {
  category: string;
  budget: number;
  actual: number;
  variance: number;
}

const getIncomeExpense = (timeframe: string) => {
  return ResultAsync.fromPromise(
    api.get(`/analytics/income-expense?timeframe=${timeframe}`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const getAssetsLiabilities = (timeframe: string) => {
  return ResultAsync.fromPromise(
    api.get(`/analytics/assets-liabilities?timeframe=${timeframe}`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const getCategorySpending = (timeframe: string) => {
  return ResultAsync.fromPromise(
    api.get(`/analytics/category-spending?timeframe=${timeframe}`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const getBudgetComparison = (timeframe: string) => {
  return ResultAsync.fromPromise(
    api.get(`/analytics/budget-comparison?timeframe=${timeframe}`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const getFinancialHealth = () => {
  return ResultAsync.fromPromise(
    api.get("/analytics/financial-health").then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

export const analyticsService = {
  getIncomeExpense,
  getAssetsLiabilities,
  getCategorySpending,
  getBudgetComparison,
  getFinancialHealth,
};
