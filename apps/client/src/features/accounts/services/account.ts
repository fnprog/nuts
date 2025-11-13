/**
 * Offline-First Account Service
 *
 * Provides the same API as the server-based account service but operates
 * on local CRDT data. This service can be swapped in place of the server
 * service using feature flags.
 */

import { crdtService } from "@/core/sync/crdt";
import { kyselyQueryService } from "@/core/sync/query";
import { CRDTAccount } from "@nuts/types";
import { Account, AccountCreate, AccountWTrend, AccountBalanceTimeline } from "@/features/accounts/services/account.types";
import { generateId } from "@/lib/generate-id";
import { Result, ok, err, ServiceError } from "@/lib/result";

export function createAccountService() {
  let isInitialized = false;

  const ensureInitialized = async (): Promise<Result<void, ServiceError>> => {
    if (!isInitialized) {
      return await initialize();
    }
    return ok(undefined);
  };

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    if (isInitialized) return ok(undefined);

    const crdtResult = await crdtService.initialize();
    if (crdtResult.isErr()) return err(crdtResult.error);

    const kyselyResult = await kyselyQueryService.initialize();
    if (kyselyResult.isErr()) return err(kyselyResult.error);

    isInitialized = true;
    console.log("Offline-first account service initialized with Kysely");
    return ok(undefined);
  };

  const getAccounts = async (): Promise<Result<Account[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtAccounts = crdtService.getAccounts();
    const accounts = Object.values(crdtAccounts)
      .map(convertFromCRDTFormat)
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok(accounts);
  };

  const getAccountsWTrends = async (): Promise<Result<AccountWTrend[], ServiceError>> => {
    const accountsResult = await getAccounts();
    if (accountsResult.isErr()) return err(accountsResult.error);

    const now = Date.now();
    const startDate = now - 30 * 24 * 60 * 60 * 1000;

    const accountsWithTrends = await Promise.all(
      accountsResult.value.map(async (account) => {
        const trendData = await calculateAccountTrend(account.id, startDate, now);
        return {
          ...account,
          trend: trendData.trend,
          balance_timeseries: trendData.timeseries,
        };
      })
    );

    return ok(accountsWithTrends);
  };

  const calculateAccountTrend = async (
    accountId: string,
    startDate: number,
    endDate: number
  ): Promise<{ trend: number; timeseries: Array<{ date: Date; balance: number }> }> => {
    try {
      const db = kyselyQueryService.getDb();

      const transactions = await db
        .selectFrom("transactions")
        .selectAll()
        .where((eb: any) => eb.or([eb("transactions.account_id", "=", accountId), eb("transactions.destination_account_id", "=", accountId)]))
        .where("transactions.transaction_datetime", ">=", startDate)
        .where("transactions.transaction_datetime", "<=", endDate)
        .where("transactions.deleted_at", "is", null)
        .orderBy("transactions.transaction_datetime", "asc")
        .execute();

      let startBalance = 0;
      let currentBalance = 0;
      const dailyBalances = new Map<string, number>();

      for (const tx of transactions) {
        let amount = 0;

        if (tx.type === "income" && tx.account_id === accountId) {
          amount = tx.amount;
        } else if (tx.type === "expense" && tx.account_id === accountId) {
          amount = -tx.amount;
        } else if (tx.type === "transfer" && tx.account_id === accountId) {
          amount = -tx.amount;
        } else if (tx.type === "transfer" && tx.destination_account_id === accountId) {
          amount = tx.amount;
        }

        currentBalance += amount;

        const date = new Date(tx.transaction_datetime).toISOString().split("T")[0];
        dailyBalances.set(date, currentBalance);
      }

      const endBalance = currentBalance;

      const trend = startBalance === 0 ? (endBalance > 0 ? 100 : endBalance < 0 ? -100 : 0) : ((endBalance - startBalance) / Math.abs(startBalance)) * 100;

      const timeseries = Array.from(dailyBalances.entries()).map(([date, balance]) => ({
        date: new Date(date),
        balance,
      }));

      return { trend, timeseries };
    } catch (error) {
      console.error("Error calculating account trend:", error);
      return { trend: 0, timeseries: [] };
    }
  };

  const getAccountsBalanceTimeline = async (): Promise<Result<AccountBalanceTimeline[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const db = kyselyQueryService.getDb();
      const now = Date.now();
      const startMonth = now - 11 * 30 * 24 * 60 * 60 * 1000;

      const accounts = await db.selectFrom("accounts").selectAll().where("accounts.deleted_at", "is", null).execute();

      const monthlyBalances = new Map<string, number>();

      for (const account of accounts) {
        const transactions = await db
          .selectFrom("transactions")
          .selectAll()
          .where((eb: any) => eb.or([eb("transactions.account_id", "=", account.id), eb("transactions.destination_account_id", "=", account.id)]))
          .where("transactions.transaction_datetime", ">=", startMonth)
          .where("transactions.deleted_at", "is", null)
          .orderBy("transactions.transaction_datetime", "asc")
          .execute();

        let currentBalance = 0;

        for (const tx of transactions) {
          let amount = 0;

          if (tx.type === "income" && tx.account_id === account.id) {
            amount = tx.amount;
          } else if (tx.type === "expense" && tx.account_id === account.id) {
            amount = -tx.amount;
          } else if (tx.type === "transfer" && tx.account_id === account.id) {
            amount = -tx.amount;
          } else if (tx.type === "transfer" && tx.destination_account_id === account.id) {
            amount = tx.amount;
          }

          currentBalance += amount;

          const monthKey = new Date(tx.transaction_datetime).toISOString().slice(0, 7);
          monthlyBalances.set(monthKey, (monthlyBalances.get(monthKey) || 0) + amount);
        }
      }

      const timeline: AccountBalanceTimeline[] = [];
      let cumulativeBalance = 0;

      const sortedMonths = Array.from(monthlyBalances.keys()).sort();

      for (const month of sortedMonths) {
        cumulativeBalance += monthlyBalances.get(month) || 0;
        timeline.push({
          month: new Date(month + "-01"),
          balance: cumulativeBalance,
        });
      }

      return ok(timeline);
    } catch (error) {
      console.error("Error calculating balance timeline:", error);
      return err(ServiceError.database("Failed to calculate balance timeline", error));
    }
  };

  const createAccount = async (accountData: AccountCreate): Promise<Result<Account, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const id = generateId();
    console.log("[ACCOUNT] Creating account with ID:", id, "data:", accountData);

    const crdtAccount = convertToCRDTFormat({
      ...accountData,
      id,
      is_external: false,
      updated_at: new Date().toISOString(),
    });

    try {
      console.log("[ACCOUNT] Step 1: Calling crdtService.createAccount...");
      const createResult = await crdtService.createAccount(crdtAccount);
      if (createResult.isErr()) return err(createResult.error);
      console.log("[ACCOUNT] Step 2: Account added to CRDT, calling rebuildFromCRDT...");

      const rebuildResult = await rebuildFromCRDT();
      if (rebuildResult.isErr()) return err(rebuildResult.error);
      console.log("[ACCOUNT] Step 3: SQLite index rebuilt successfully");

      console.log("[ACCOUNT] ✅ Account creation complete:", id);
      return ok(convertFromCRDTFormat(crdtAccount));
    } catch (error) {
      console.error("[ACCOUNT] ❌ Error during account creation:", error);
      throw error;
    }
  };

  const updateAccount = async (id: string, accountData: AccountCreate): Promise<Result<Account, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log("[ACCOUNT] Updating account:", id, "with data:", accountData);

    try {
      const crdtUpdates = convertToCRDTFormat({
        ...accountData,
        id,
        is_external: false,
        updated_at: new Date().toISOString(),
      });

      const { id: _id, ...updates } = crdtUpdates;

      console.log("[ACCOUNT] Step 1: Calling crdtService.updateAccount...");
      const updateResult = await crdtService.updateAccount(id, updates);
      if (updateResult.isErr()) return err(updateResult.error);
      console.log("[ACCOUNT] Step 2: Account updated in CRDT, calling rebuildFromCRDT...");

      const rebuildResult = await rebuildFromCRDT();
      if (rebuildResult.isErr()) return err(rebuildResult.error);
      console.log("[ACCOUNT] Step 3: SQLite index rebuilt successfully");

      const accounts = crdtService.getAccounts();
      const updatedAccount = accounts[id];

      if (!updatedAccount) {
        return err(ServiceError.notFound("Account", id));
      }

      console.log("[ACCOUNT] ✅ Account update complete:", id);
      return ok(convertFromCRDTFormat(updatedAccount));
    } catch (error) {
      console.error("[ACCOUNT] ❌ Error during account update:", error);
      throw error;
    }
  };

  const deleteAccount = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log("[ACCOUNT] Deleting account:", id);

    const timestamp = new Date().toISOString();
    console.log("[ACCOUNT] Step 1: Marking account as deleted in CRDT...");
    const updateResult = await crdtService.updateAccount(id, {
      deleted_at: timestamp,
      updated_at: timestamp,
    });
    if (updateResult.isErr()) return err(updateResult.error);
    console.log("[ACCOUNT] Step 2: Account marked deleted, calling rebuildFromCRDT...");

    const rebuildResult = await rebuildFromCRDT();
    if (rebuildResult.isErr()) return err(rebuildResult.error);
    console.log("[ACCOUNT] Step 3: SQLite index rebuilt successfully");

    console.log("[ACCOUNT] ✅ Account deletion complete:", id);
    return ok(undefined);
  };

  const linkTellerAccount = async (_payload: any): Promise<Result<void, ServiceError>> => {
    return err(ServiceError.unavailable("External account linking"));
  };

  const linkMonoAccount = async (_payload: any): Promise<Result<void, ServiceError>> => {
    return err(ServiceError.unavailable("External account linking"));
  };

  /**
   * Convert CRDT account format to API format
   */
  const convertFromCRDTFormat = (crdtAccount: CRDTAccount): Account => {
    return {
      id: crdtAccount.id,
      name: crdtAccount.name,
      type: crdtAccount.type as any,
      balance: crdtAccount.balance,
      currency: crdtAccount.currency,
      is_external: crdtAccount.is_external,
      updated_at: crdtAccount.updated_at,
      meta: crdtAccount.meta || null,
    };
  };

  /**
   * Convert API account format to CRDT format
   */
  const convertToCRDTFormat = (account: any): CRDTAccount => {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      subtype: account.subtype ?? null,
      currency: account.currency,
      balance: account.balance || 0,
      meta: account.meta ?? null,
      is_active: true,
      is_external: account.is_external || false,
      provider_account_id: account.provider_account_id ?? null,
      provider_name: account.provider_name ?? null,
      sync_status: account.sync_status ?? null,
      last_synced_at: account.last_synced_at ?? null,
      connection_id: account.connection_id ?? null,
      shared_finance_id: account.shared_finance_id ?? null,
      created_by: account.created_by ?? null,
      updated_by: account.updated_by ?? null,
      created_at: account.created_at || new Date().toISOString(),
      updated_at: account.updated_at || new Date().toISOString(),
    };
  };

  const rebuildFromCRDT = async (): Promise<Result<void, ServiceError>> => {
    console.log("[ACCOUNT] rebuildFromCRDT: Fetching data from CRDT...");
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    const rules = crdtService.getRules();

    console.log(
      "[ACCOUNT] rebuildFromCRDT: Found",
      Object.keys(accounts).length,
      "accounts,",
      Object.keys(transactions).length,
      "transactions,",
      Object.keys(categories).length,
      "categories,",
      Object.keys(rules).length,
      "rules"
    );
    console.log("[ACCOUNT] rebuildFromCRDT: Calling kyselyQueryService.rebuildFromCRDT...");

    const rebuildResult = await kyselyQueryService.rebuildFromCRDT(transactions, accounts, categories, rules);
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    console.log("[ACCOUNT] rebuildFromCRDT: ✅ SQLite rebuild complete");
    return ok(undefined);
  };

  return {
    initialize,
    getAccounts,
    getAccountsWTrends,
    getAccountsBalanceTimeline,
    createAccount,
    updateAccount,
    deleteAccount,
    linkTellerAccount,
    linkMonoAccount,
  };
}

// Export singleton instance
export const accountService = createAccountService();
