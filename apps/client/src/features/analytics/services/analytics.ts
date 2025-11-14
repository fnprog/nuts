import { kyselyQueryService } from "@/core/sync/query";
import { Result, ok, err, ServiceError } from "@/lib/result";

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

export interface FinancialHealthScore {
  score: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
}

export function createAnalyticsService() {
  let isInitialized = false;

  const ensureInitialized = async (): Promise<Result<void, ServiceError>> => {
    if (!isInitialized) {
      const kyselyResult = await kyselyQueryService.initialize();
      if (kyselyResult.isErr()) return err(kyselyResult.error);
      isInitialized = true;
    }
    return ok(undefined);
  };

  const getTimeRange = (timeframe: string): { startDate: number; endDate: number; groupBy: "day" | "week" | "month" } => {
    const now = Date.now();
    let startDate: number;
    let groupBy: "day" | "week" | "month";

    switch (timeframe) {
      case "7d":
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        groupBy = "day";
        break;
      case "30d":
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        groupBy = "day";
        break;
      case "90d":
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        groupBy = "week";
        break;
      case "1y":
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        groupBy = "month";
        break;
      default:
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        groupBy = "day";
    }

    return { startDate, endDate: now, groupBy };
  };

  const getIncomeExpense = async (timeframe: string): Promise<Result<IncomeExpenseData[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const { startDate, endDate, groupBy } = getTimeRange(timeframe);
      const db = kyselyQueryService.getDb();

      const transactions = await db
        .selectFrom("transactions")
        .selectAll()
        .where("transactions.transaction_datetime", ">=", startDate)
        .where("transactions.transaction_datetime", "<=", endDate)
        .where("transactions.deleted_at", "is", null)
        .orderBy("transactions.transaction_datetime", "asc")
        .execute();

      const periodMap = new Map<string, { income: number; expenses: number }>();

      for (const tx of transactions) {
        const date = new Date(tx.transaction_datetime);
        let period: string;

        if (groupBy === "day") {
          period = date.toISOString().split("T")[0];
        } else if (groupBy === "week") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split("T")[0];
        } else {
          period = date.toISOString().slice(0, 7);
        }

        if (!periodMap.has(period)) {
          periodMap.set(period, { income: 0, expenses: 0 });
        }

        const periodData = periodMap.get(period)!;

        if (tx.type === "income") {
          periodData.income += tx.amount;
        } else if (tx.type === "expense") {
          periodData.expenses += tx.amount;
        }
      }

      const data: IncomeExpenseData[] = Array.from(periodMap.entries())
        .map(([period, values]) => ({
          period,
          income: values.income,
          expenses: values.expenses,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return ok(data);
    } catch (error) {
      return err(ServiceError.database("Failed to calculate income/expense", error));
    }
  };

  const getAssetsLiabilities = async (timeframe: string): Promise<Result<AssetLiabilityData[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const { startDate, endDate, groupBy } = getTimeRange(timeframe);
      const db = kyselyQueryService.getDb();

      const accounts = await db
        .selectFrom("accounts")
        .selectAll()
        .where("accounts.deleted_at", "is", null)
        .execute();

      const transactions = await db
        .selectFrom("transactions")
        .selectAll()
        .where("transactions.transaction_datetime", ">=", startDate)
        .where("transactions.transaction_datetime", "<=", endDate)
        .where("transactions.deleted_at", "is", null)
        .orderBy("transactions.transaction_datetime", "asc")
        .execute();

      const accountBalances = new Map<string, number>();
      for (const account of accounts) {
        accountBalances.set(account.id, 0);
      }

      const periodMap = new Map<string, { assets: number; liabilities: number }>();

      for (const tx of transactions) {
        const date = new Date(tx.transaction_datetime);
        let period: string;

        if (groupBy === "day") {
          period = date.toISOString().split("T")[0];
        } else if (groupBy === "week") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split("T")[0];
        } else {
          period = date.toISOString().slice(0, 7);
        }

        if (tx.account_id) {
          const currentBalance = accountBalances.get(tx.account_id) || 0;
          if (tx.type === "income") {
            accountBalances.set(tx.account_id, currentBalance + tx.amount);
          } else if (tx.type === "expense") {
            accountBalances.set(tx.account_id, currentBalance - tx.amount);
          } else if (tx.type === "transfer") {
            accountBalances.set(tx.account_id, currentBalance - tx.amount);
            if (tx.destination_account_id) {
              const destBalance = accountBalances.get(tx.destination_account_id) || 0;
              accountBalances.set(tx.destination_account_id, destBalance + tx.amount);
            }
          }
        }

        let assets = 0;
        let liabilities = 0;

        for (const [accountId, balance] of accountBalances.entries()) {
          const account = accounts.find((a) => a.id === accountId);
          if (!account) continue;

          if (["checking", "savings", "investment", "cash"].includes(account.type)) {
            assets += balance;
          } else if (["credit", "loan"].includes(account.type)) {
            liabilities += Math.abs(balance);
          }
        }

        periodMap.set(period, { assets, liabilities });
      }

      const data: AssetLiabilityData[] = Array.from(periodMap.entries())
        .map(([period, values]) => ({
          period,
          assets: values.assets,
          liabilities: values.liabilities,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return ok(data);
    } catch (error) {
      return err(ServiceError.database("Failed to calculate assets/liabilities", error));
    }
  };

  const getCategorySpending = async (timeframe: string): Promise<Result<CategorySpendingData[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const { startDate, endDate } = getTimeRange(timeframe);
      const db = kyselyQueryService.getDb();

      const transactions = await db
        .selectFrom("transactions")
        .innerJoin("categories", "transactions.category_id", "categories.id")
        .select(["categories.name as category", "transactions.amount", "transactions.type"])
        .where("transactions.transaction_datetime", ">=", startDate)
        .where("transactions.transaction_datetime", "<=", endDate)
        .where("transactions.type", "=", "expense")
        .where("transactions.deleted_at", "is", null)
        .execute();

      const categoryTotals = new Map<string, number>();
      let totalSpending = 0;

      for (const tx of transactions) {
        const current = categoryTotals.get(tx.category) || 0;
        categoryTotals.set(tx.category, current + tx.amount);
        totalSpending += tx.amount;
      }

      const data: CategorySpendingData[] = Array.from(categoryTotals.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return ok(data);
    } catch (error) {
      return err(ServiceError.database("Failed to calculate category spending", error));
    }
  };

  const getBudgetComparison = async (timeframe: string): Promise<Result<BudgetData[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const { startDate, endDate } = getTimeRange(timeframe);
      const db = kyselyQueryService.getDb();

      const budgets = await db
        .selectFrom("budgets")
        .innerJoin("categories", "budgets.category_id", "categories.id")
        .select(["categories.name as category", "budgets.amount as budget", "budgets.category_id"])
        .where("budgets.deleted_at", "is", null)
        .execute();

      const data: BudgetData[] = [];

      for (const budget of budgets) {
        const transactions = await db
          .selectFrom("transactions")
          .select(["amount"])
          .where("transactions.category_id", "=", budget.category_id)
          .where("transactions.type", "=", "expense")
          .where("transactions.transaction_datetime", ">=", startDate)
          .where("transactions.transaction_datetime", "<=", endDate)
          .where("transactions.deleted_at", "is", null)
          .execute();

        const actual = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const variance = budget.budget - actual;

        data.push({
          category: budget.category,
          budget: budget.budget,
          actual,
          variance,
        });
      }

      return ok(data);
    } catch (error) {
      return err(ServiceError.database("Failed to calculate budget comparison", error));
    }
  };

  const getFinancialHealth = async (): Promise<Result<FinancialHealthScore, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const db = kyselyQueryService.getDb();
      const now = Date.now();
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const transactions = await db
        .selectFrom("transactions")
        .select(["type", "amount"])
        .where("transactions.transaction_datetime", ">=", monthAgo)
        .where("transactions.transaction_datetime", "<=", now)
        .where("transactions.deleted_at", "is", null)
        .execute();

      let totalIncome = 0;
      let totalExpenses = 0;

      for (const tx of transactions) {
        if (tx.type === "income") {
          totalIncome += tx.amount;
        } else if (tx.type === "expense") {
          totalExpenses += tx.amount;
        }
      }

      const accounts = await db
        .selectFrom("accounts")
        .select(["type", "balance"])
        .where("accounts.deleted_at", "is", null)
        .execute();

      let totalAssets = 0;
      let totalLiabilities = 0;
      let liquidAssets = 0;

      for (const account of accounts) {
        if (["checking", "savings", "investment", "cash"].includes(account.type)) {
          totalAssets += account.balance;
          if (["checking", "savings", "cash"].includes(account.type)) {
            liquidAssets += account.balance;
          }
        } else if (["credit", "loan"].includes(account.type)) {
          totalLiabilities += Math.abs(account.balance);
        }
      }

      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      const debtToIncomeRatio = totalIncome > 0 ? (totalLiabilities / totalIncome) * 100 : 0;
      const monthlyExpenses = totalExpenses;
      const emergencyFundMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;

      let score = 50;
      if (savingsRate > 20) score += 20;
      else if (savingsRate > 10) score += 10;
      if (debtToIncomeRatio < 20) score += 20;
      else if (debtToIncomeRatio < 35) score += 10;
      if (emergencyFundMonths >= 6) score += 10;
      else if (emergencyFundMonths >= 3) score += 5;

      return ok({
        score: Math.min(100, Math.max(0, score)),
        savingsRate,
        debtToIncomeRatio,
        emergencyFundMonths,
      });
    } catch (error) {
      return err(ServiceError.database("Failed to calculate financial health", error));
    }
  };

  return {
    getIncomeExpense,
    getAssetsLiabilities,
    getCategorySpending,
    getBudgetComparison,
    getFinancialHealth,
  };
}

export const analyticsService = createAnalyticsService();
