import { db } from "@/core/storage/client";
import { CRDTTransaction, CRDTAccount, CRDTCategory, CRDTRule } from "@nuts/types";
import type { GetTransactionsParams } from "@/features/transactions/services/transaction";
import { sql } from "kysely";
import { Result, ok, err } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";

class KyselyQueryService {
  private isInitialized = false;
  private initPromise: Promise<Result<void, ServiceError>> | null = null;

  async initialize(): Promise<Result<void, ServiceError>> {
    if (this.isInitialized) return ok(undefined);
    if (this.initPromise) {
      return await this.initPromise;
    }

    this.initPromise = this.performInitialization();
    const result = await this.initPromise;
    return result;
  }

  private async performInitialization(): Promise<Result<void, ServiceError>> {
    try {
      await db.initialize();
      this.isInitialized = true;
      this.initPromise = null;
      console.log("Kysely query service initialized");
      return ok(undefined);
    } catch (error) {
      this.initPromise = null;
      return err(ServiceError.initialization("Failed to initialize Kysely query service", error));
    }
  }

  getDb() {
    return db.db;
  }

  async rebuildFromCRDT(
    transactions: Record<string, CRDTTransaction>,
    accounts: Record<string, CRDTAccount>,
    categories: Record<string, CRDTCategory>,
    rules?: Record<string, CRDTRule>
  ): Promise<Result<void, ServiceError>> {
    const startTime = performance.now();
    console.log(
      "[KYSELY] rebuildFromCRDT called with:",
      Object.keys(accounts).length,
      "accounts,",
      Object.keys(transactions).length,
      "transactions,",
      Object.keys(categories).length,
      "categories,",
      Object.keys(rules || {}).length,
      "rules"
    );

    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return initResult;

    try {
      const database = db.db;

      console.log("[KYSELY] Step 1: Clearing existing SQLite data...");
      await database.deleteFrom("transactions").execute();
      await database.deleteFrom("accounts").execute();
      await database.deleteFrom("categories").execute();
      await database.deleteFrom("rules").execute();
      console.log("[KYSELY] Step 2: Tables cleared");

      const accountsArray = Object.values(accounts);
      if (accountsArray.length > 0) {
        console.log("[KYSELY] Step 3: Inserting accounts into SQLite (batch)...");
        const accountValues = accountsArray.map((account) => ({
          id: account.id || crypto.randomUUID(),
          name: account.name || "",
          type: (account.type || "checking") as any,
          currency: account.currency || "USD",
          balance: account.balance || 0,
          subtype: null,
          is_active: (account.is_active !== false ? 1 : 0) as 0 | 1,
          is_external: 0 as 0 | 1,
          created_at: Date.now(),
          updated_at: Date.now(),
          deleted_at: account.deleted_at ? Date.now() : null,
        }));

        const BATCH_SIZE = 100;
        for (let i = 0; i < accountValues.length; i += BATCH_SIZE) {
          const batch = accountValues.slice(i, i + BATCH_SIZE);
          await database.insertInto("accounts").values(batch).execute();
        }
        console.log("[KYSELY] Step 4: Inserted", accountsArray.length, "accounts");
      }

      const categoriesArray = Object.values(categories);
      if (categoriesArray.length > 0) {
        console.log("[KYSELY] Step 5: Inserting categories into SQLite (batch)...");
        const categoryValues = categoriesArray.map((category) => ({
          id: category.id || crypto.randomUUID(),
          name: category.name || "",
          type: "expense" as "income" | "expense",
          color: category.color || "#000000",
          icon: category.icon || "Box",
          parent_id: category.parent_id || null,
          is_active: (category.is_active !== false ? 1 : 0) as 0 | 1,
          is_default: 0 as 0 | 1,
          created_by: "",
          created_at: Date.now(),
          updated_at: Date.now(),
          deleted_at: category.deleted_at ? Date.now() : null,
        }));

        const BATCH_SIZE = 100;
        for (let i = 0; i < categoryValues.length; i += BATCH_SIZE) {
          const batch = categoryValues.slice(i, i + BATCH_SIZE);
          await database.insertInto("categories").values(batch).execute();
        }
        console.log("[KYSELY] Step 6: Inserted", categoriesArray.length, "categories");
      }

      const transactionsArray = Object.values(transactions);
      if (transactionsArray.length > 0) {
        console.log("[KYSELY] Step 7: Inserting transactions into SQLite (batch)...");
        const transactionValues = transactionsArray.map((transaction) => ({
          id: transaction.id || crypto.randomUUID(),
          amount: transaction.amount || 0,
          transaction_datetime: Date.now(),
          description: transaction.description || "",
          category_id: transaction.category_id || null,
          account_id: transaction.account_id || "",
          type: (transaction.type || "expense") as any,
          destination_account_id: transaction.destination_account_id || null,
          is_external: (transaction.is_external ? 1 : 0) as 0 | 1,
          is_categorized: (transaction.category_id ? 1 : 0) as 0 | 1,
          transaction_currency: transaction.transaction_currency || "USD",
          original_amount: transaction.original_amount || transaction.amount || 0,
          details: null,
          created_at: Date.now(),
          updated_at: Date.now(),
          deleted_at: transaction.deleted_at ? Date.now() : null,
        }));

        const BATCH_SIZE = 100;
        for (let i = 0; i < transactionValues.length; i += BATCH_SIZE) {
          const batch = transactionValues.slice(i, i + BATCH_SIZE);
          await database.insertInto("transactions").values(batch).execute();
          if (transactionValues.length > 1000 && i % 1000 === 0) {
            console.log(`[KYSELY] Progress: ${i}/${transactionValues.length} transactions inserted`);
          }
        }
        console.log("[KYSELY] Step 8: Inserted", transactionsArray.length, "transactions");
      }

      const rulesArray = Object.values(rules || {});
      if (rulesArray.length > 0) {
        console.log("[KYSELY] Step 9: Inserting rules into SQLite (batch)...");
        const ruleValues = rulesArray.map((rule) => ({
          id: rule.id || crypto.randomUUID(),
          name: rule.name || "",
          is_active: (rule.is_active !== false ? 1 : 0) as 0 | 1,
          priority: rule.priority || 0,
          conditions: JSON.stringify(rule.conditions || []),
          actions: JSON.stringify(rule.actions || []),
          created_by: rule.created_by || "",
          updated_by: rule.updated_by || null,
          created_at: Date.now(),
          updated_at: Date.now(),
          deleted_at: rule.deleted_at ? Date.now() : null,
        }));

        const BATCH_SIZE = 100;
        for (let i = 0; i < ruleValues.length; i += BATCH_SIZE) {
          const batch = ruleValues.slice(i, i + BATCH_SIZE);
          await database.insertInto("rules").values(batch).execute();
        }
        console.log("[KYSELY] Step 10: Inserted", rulesArray.length, "rules");
      }

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(
        `[KYSELY] ✅ Database rebuilt from CRDT data in ${duration}s - Total:`,
        accountsArray.length,
        "accounts,",
        transactionsArray.length,
        "transactions,",
        categoriesArray.length,
        "categories,",
        rulesArray.length,
        "rules"
      );

      return ok(undefined);
    } catch (error) {
      console.error("[KYSELY] Failed to rebuild from CRDT:", error);
      return err(ServiceError.database("Failed to rebuild database from CRDT", error));
    }
  }

  async queryTransactions(params: GetTransactionsParams): Promise<Result<{
    data: any[];
    pagination: { total: number; totalPages: number };
  }, ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const database = db.db;

    const { page = 1, limit = 50, q: search, account_id: accountId, category_id: categoryId, type, start_date: startDate, end_date: endDate } = params;

    const offset = (page - 1) * limit;

    let query = database
      .selectFrom("transactions as t")
      .leftJoin("accounts as a", "a.id", "t.account_id")
      .leftJoin("categories as c", "c.id", "t.category_id")
      .where("t.deleted_at", "is", null)
      .select([
        "t.id",
        "t.amount",
        "t.type",
        "t.account_id",
        "t.category_id",
        "t.destination_account_id",
        "t.transaction_datetime",
        "t.description",
        "t.details",
        "t.is_external",
        "t.provider_transaction_id",
        "t.created_at",
        "t.updated_at",
        "a.name as account_name",
        "a.type as account_type",
        "a.currency as account_currency",
        "c.name as category_name",
        "c.icon as category_icon",
        "c.color as category_color",
      ]);

    if (search) {
      query = query.where("t.description", "like", `%${search}%`);
    }

    if (accountId) {
      query = query.where("t.account_id", "=", accountId);
    }

    if (categoryId) {
      query = query.where("t.category_id", "=", categoryId);
    }

    if (type) {
      query = query.where("t.type", "=", type as any);
    }

    if (startDate) {
      query = query.where(sql`DATE(t.transaction_datetime)`, ">=", startDate);
    }

    if (endDate) {
      query = query.where(sql`DATE(t.transaction_datetime)`, "<=", endDate);
    }

    const countQuery = query.clearSelect().select(database.fn.countAll<number>().as("total"));
    const countResult = await countQuery.executeTakeFirst();
    const totalCount = Number(countResult?.total || 0);

    const transactions = await query.orderBy("t.transaction_datetime", "desc").limit(limit).offset(offset).execute();

    const transformedTransactions = transactions.map((tx: any) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      account_id: tx.account_id,
      category_id: tx.category_id,
      destination_account_id: tx.destination_account_id,
      transaction_datetime: tx.transaction_datetime,
      description: tx.description,
      details: tx.details ? JSON.parse(tx.details) : {},
      is_external: Boolean(tx.is_external),
      provider_transaction_id: tx.provider_transaction_id,
      created_at: tx.created_at,
      updated_at: tx.updated_at,
      date_only: new Date(tx.transaction_datetime).toISOString().split("T")[0],
      account_name: tx.account_name,
      account_type: tx.account_type,
      account_currency: tx.account_currency,
      category_name: tx.category_name,
      category_icon: tx.category_icon,
      category_color: tx.category_color,
    }));

    return ok({
      data: transformedTransactions,
      pagination: {
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  }

  async getAccounts(): Promise<Result<any[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const accounts = await db.db.selectFrom("accounts").selectAll().where("deleted_at", "is", null).orderBy("name", "asc").execute();

    return ok(accounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      currency: acc.currency,
      subtype: acc.subtype,
      meta: acc.meta ? JSON.parse(acc.meta) : null,
      is_external: Boolean(acc.is_external),
      provider_account_id: acc.provider_account_id,
      provider_name: acc.provider_name,
      sync_status: acc.sync_status,
      last_synced_at: acc.last_synced_at,
      connection_id: acc.connection_id,
      created_by: acc.created_by,
      updated_by: acc.updated_by,
      created_at: acc.created_at,
      updated_at: acc.updated_at,
    })));
  }

  async getCategories(): Promise<Result<any[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const categories = await db.db.selectFrom("categories").selectAll().where("deleted_at", "is", null).orderBy("name", "asc").execute();

    return ok(categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id,
      is_default: Boolean(cat.is_default),
      color: cat.color,
      icon: cat.icon,
      created_by: cat.created_by,
      updated_by: cat.updated_by,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    })));
  }

  async getRules(): Promise<Result<any[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const rules = await db.db.selectFrom("rules").selectAll().where("deleted_at", "is", null).orderBy("priority", "desc").orderBy("name", "asc").execute();

    return ok(rules.map((rule: any) => ({
      id: rule.id,
      name: rule.name,
      is_active: Boolean(rule.is_active),
      priority: rule.priority,
      conditions: JSON.parse(rule.conditions),
      actions: JSON.parse(rule.actions),
      created_by: rule.created_by,
      updated_by: rule.updated_by,
      created_at: rule.created_at,
      updated_at: rule.updated_at,
    })));
  }

  async executeRaw(sql: string, params: any[] = []): Promise<Result<any[], ServiceError>> {
    const result = await db.execute(sql, params);
    return ok(result.results || []);
  }

  async getStats(): Promise<Result<{
    transactions: number;
    accounts: number;
    categories: number;
    rules: number;
  }, ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const database = db.db;

    const [transactionsResult, accountsResult, categoriesResult, rulesResult] = await Promise.all([
      database.selectFrom("transactions").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
      database.selectFrom("accounts").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
      database.selectFrom("categories").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
      database.selectFrom("rules").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
    ]);

    return ok({
      transactions: Number(transactionsResult?.count || 0),
      accounts: Number(accountsResult?.count || 0),
      categories: Number(categoriesResult?.count || 0),
      rules: Number(rulesResult?.count || 0),
    });
  }

  private async ensureInitialized(): Promise<Result<void, ServiceError>> {
    if (!this.isInitialized) {
      return await this.initialize();
    }
    return ok(undefined);
  }

  async close(): Promise<Result<void, ServiceError>> {
    await db.close();
    this.isInitialized = false;
    this.initPromise = null;
    return ok(undefined);
  }
}

export const kyselyQueryService = new KyselyQueryService();
