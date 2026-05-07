import { db } from "@/core/storage/client";
import type { CRDTTransaction, CRDTAccount, CRDTCategory, CRDTRule } from "@nuts/types";
import type { Database } from "@nuts/types/storage";
import { Kysely, sql } from "kysely";
import { Result, ok, err } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";
import { logger } from "@/lib/logger";

// ─── Output types ─────────────────────────────────────────────────────────────
//
// Typed outputs for every public query method so the UI boundary is safe.
// These are what callers actually receive — not raw DB rows, not `any`.

export interface TransactionRow {
  id: string;
  amount: number;
  type: string;
  account_id: string;
  category_id: string | null;
  destination_account_id: string | null;
  transaction_datetime: number;
  description: string;
  details: Record<string, unknown>;
  is_external: boolean;
  provider_transaction_id: string | null;
  created_at: number;
  updated_at: number;
  date_only: string;
  account_name: string | null;
  account_type: string | null;
  account_currency: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
}

export interface TransactionPage {
  data: TransactionRow[];
  pagination: { total: number; totalPages: number };
}

export interface AccountRow {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  subtype: string | null;
  meta: Record<string, unknown> | null;
  is_external: boolean;
  provider_account_id: string | null;
  provider_name: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
  connection_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
  is_default: boolean;
  color: string;
  icon: string | null;
  type: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface RuleRow {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  conditions: CRDTRule["conditions"];
  actions: CRDTRule["actions"];
  created_by: string;
  updated_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface DbStats {
  transactions: number;
  accounts: number;
  categories: number;
  rules: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

/**
 * Converts an ISO timestamp string or null to a Unix milliseconds integer
 * for storage in SQLite integer columns. Returns null when the input is
 * absent — preserving the actual deletion time rather than stamping "now".
 */
function toUnixMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function parseJsonSafe<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function insertBatched<T extends object>(database: Kysely<Database>, table: keyof Database & string, rows: T[]): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await (database.insertInto(table as any) as any).values(rows.slice(i, i + BATCH_SIZE)).execute();
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

class KyselyQueryService {
  private isInitialized = false;
  private initPromise: Promise<Result<void, ServiceError>> | null = null;

  // ─── Initialization ─────────────────────────────────────────────────────────

  async initialize(): Promise<Result<void, ServiceError>> {
    if (this.isInitialized) return ok(undefined);
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  private async performInitialization(): Promise<Result<void, ServiceError>> {
    try {
      await db.initialize();
      this.isInitialized = true;
      this.initPromise = null;
      logger.info("Kysely query service initialized");
      return ok(undefined);
    } catch (error) {
      this.initPromise = null;
      return err(ServiceError.initialization("Failed to initialize Kysely query service", error));
    }
  }

  private async ensureInitialized(): Promise<Result<void, ServiceError>> {
    return this.isInitialized ? ok(undefined) : this.initialize();
  }

  async close(): Promise<Result<void, ServiceError>> {
    await db.close();
    this.isInitialized = false;
    this.initPromise = null;
    return ok(undefined);
  }

  // ─── Rebuild ─────────────────────────────────────────────────────────────────

  /**
   * Rebuilds all SQLite tables from the current CRDT snapshot.
   *
   * The entire operation runs inside a single SQLite transaction so a crash
   * mid-rebuild leaves the previous state intact rather than an empty database.
   * Timestamps are taken from CRDT records, not stamped as "now".
   */
  async rebuildFromCRDT(
    transactions: Record<string, CRDTTransaction>,
    accounts: Record<string, CRDTAccount>,
    categories: Record<string, CRDTCategory>,
    rules: Record<string, CRDTRule> = {}
  ): Promise<Result<void, ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return initResult;

    const startTime = performance.now();
    const database = db.db;

    const accountsArray = Object.values(accounts);
    const categoriesArray = Object.values(categories);
    const transactionsArray = Object.values(transactions);
    const rulesArray = Object.values(rules);

    logger.info(
      `[KYSELY] Rebuilding from CRDT: ${accountsArray.length} accounts, ` +
        `${transactionsArray.length} transactions, ${categoriesArray.length} categories, ` +
        `${rulesArray.length} rules`
    );

    try {
      await database.transaction().execute(async (trx) => {
        await trx.deleteFrom("transactions").execute();
        await trx.deleteFrom("accounts").execute();
        await trx.deleteFrom("categories").execute();
        await trx.deleteFrom("rules").execute();

        if (accountsArray.length > 0) {
          await insertBatched(
            trx as unknown as Kysely<Database>,
            "accounts",
            accountsArray.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              currency: a.currency,
              balance: a.balance,
              subtype: a.subtype ?? null,
              is_active: a.is_active ? 1 : 0,
              is_external: a.is_external ? 1 : 0,
              created_at: toUnixMs(a.created_at) ?? Date.now(),
              updated_at: toUnixMs(a.updated_at) ?? Date.now(),
              deleted_at: toUnixMs(a.deleted_at),
            }))
          );
        }

        if (categoriesArray.length > 0) {
          await insertBatched(
            trx as unknown as Kysely<Database>,
            "categories",
            categoriesArray.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
              color: c.color,
              icon: c.icon ?? null,
              parent_id: c.parent_id ?? null,
              is_active: c.is_active ? 1 : 0,
              is_default: 0,
              created_by: c.created_by ?? "system",
              updated_by: c.updated_by ?? null,
              created_at: toUnixMs(c.created_at) ?? Date.now(),
              updated_at: toUnixMs(c.updated_at) ?? Date.now(),
              deleted_at: toUnixMs(c.deleted_at),
            }))
          );
        }

        if (transactionsArray.length > 0) {
          const total = transactionsArray.length;
          for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = transactionsArray.slice(i, i + BATCH_SIZE).map((t) => ({
              id: t.id,
              amount: t.amount,
              transaction_datetime: toUnixMs(t.transaction_datetime) ?? Date.now(),
              description: t.description,
              category_id: t.category_id ?? null,
              account_id: t.account_id,
              type: t.type,
              destination_account_id: t.destination_account_id ?? null,
              is_external: t.is_external ? 1 : 0,
              is_categorized: t.category_id ? 1 : 0,
              transaction_currency: t.transaction_currency,
              original_amount: t.original_amount,
              details: t.details ? JSON.stringify(t.details) : null,
              created_at: toUnixMs(t.created_at) ?? Date.now(),
              updated_at: toUnixMs(t.updated_at) ?? Date.now(),
              deleted_at: toUnixMs(t.deleted_at),
            }));

            await (trx.insertInto("transactions") as any).values(batch).execute();

            if (total > 1000 && i % 1000 === 0) {
              logger.info(`[KYSELY] Rebuild progress: ${i}/${total} transactions`);
            }
          }
        }

        if (rulesArray.length > 0) {
          await insertBatched(
            trx as unknown as Kysely<Database>,
            "rules",
            rulesArray.map((r) => ({
              id: r.id,
              name: r.name,
              is_active: r.is_active ? 1 : 0,
              priority: r.priority,
              conditions: JSON.stringify(r.conditions),
              actions: JSON.stringify(r.actions),
              created_by: r.created_by,
              updated_by: r.updated_by ?? null,
              created_at: toUnixMs(r.created_at) ?? Date.now(),
              updated_at: toUnixMs(r.updated_at) ?? Date.now(),
              deleted_at: toUnixMs(r.deleted_at),
            }))
          );
        }
      });

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      logger.info(
        `[KYSELY] Rebuild complete in ${duration}s — ` +
          `${accountsArray.length} accounts, ${transactionsArray.length} transactions, ` +
          `${categoriesArray.length} categories, ${rulesArray.length} rules`
      );

      return ok(undefined);
    } catch (error) {
      logger.error("[KYSELY] Rebuild failed, transaction rolled back:", error);
      return err(ServiceError.database("Failed to rebuild database from CRDT", error));
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async queryTransactions(params: GetTransactionsParams): Promise<Result<TransactionPage, ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
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

      if (search) query = query.where("t.description", "like", `%${search}%`);
      if (accountId) query = query.where("t.account_id", "=", accountId);
      if (categoryId) query = query.where("t.category_id", "=", categoryId);
      if (type) query = query.where("t.type", "=", type as any);
      if (startDate) query = query.where(sql`DATE(t.transaction_datetime / 1000, 'unixepoch')`, ">=", startDate);
      if (endDate) query = query.where(sql`DATE(t.transaction_datetime / 1000, 'unixepoch')`, "<=", endDate);

      const countResult = await query.clearSelect().select(database.fn.countAll<number>().as("total")).executeTakeFirst();

      const totalCount = Number(countResult?.total ?? 0);

      const rows = await query.orderBy("t.transaction_datetime", "desc").limit(limit).offset(offset).execute();

      const data: TransactionRow[] = rows.map((tx: any) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        account_id: tx.account_id,
        category_id: tx.category_id,
        destination_account_id: tx.destination_account_id,
        transaction_datetime: tx.transaction_datetime,
        description: tx.description,
        details: parseJsonSafe<Record<string, unknown>>(tx.details, {}),
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

      return ok({ data, pagination: { total: totalCount, totalPages: Math.ceil(totalCount / limit) } });
    } catch (error) {
      logger.error("[KYSELY] queryTransactions failed:", error);
      return err(ServiceError.database("Failed to query transactions", error));
    }
  }

  async exportTransactions(params: Omit<GetTransactionsParams, "page" | "limit">): Promise<Result<TransactionRow[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const database = db.db;
      const { q: search, account_id: accountId, category_id: categoryId, type, start_date: startDate, end_date: endDate } = params;

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

      if (search) query = query.where("t.description", "like", `%${search}%`);
      if (accountId) query = query.where("t.account_id", "=", accountId);
      if (categoryId) query = query.where("t.category_id", "=", categoryId);
      if (type) query = query.where("t.type", "=", type as any);
      if (startDate) query = query.where(sql`DATE(t.transaction_datetime / 1000, 'unixepoch')`, ">=", startDate);
      if (endDate) query = query.where(sql`DATE(t.transaction_datetime / 1000, 'unixepoch')`, "<=", endDate);

      const rows = await query.orderBy("t.transaction_datetime", "desc").execute();

      const data: TransactionRow[] = rows.map((tx: any) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        account_id: tx.account_id,
        category_id: tx.category_id,
        destination_account_id: tx.destination_account_id,
        transaction_datetime: tx.transaction_datetime,
        description: tx.description,
        details: parseJsonSafe<Record<string, unknown>>(tx.details, {}),
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

      return ok(data);
    } catch (error) {
      logger.error("[KYSELY] exportTransactions failed:", error);
      return err(ServiceError.database("Failed to export transactions", error));
    }
  }

  async getAccounts(): Promise<Result<AccountRow[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const rows = await db.db.selectFrom("accounts").selectAll().where("deleted_at", "is", null).orderBy("name", "asc").execute();

      return ok(
        rows.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          currency: acc.currency,
          subtype: acc.subtype,
          meta: parseJsonSafe<Record<string, unknown> | null>(acc.meta, null),
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
        }))
      );
    } catch (error) {
      logger.error("[KYSELY] getAccounts failed:", error);
      return err(ServiceError.database("Failed to get accounts", error));
    }
  }

  async getCategories(): Promise<Result<CategoryRow[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const rows = await db.db.selectFrom("categories").selectAll().where("deleted_at", "is", null).orderBy("name", "asc").execute();

      return ok(
        rows.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          parent_id: cat.parent_id,
          is_default: Boolean(cat.is_default),
          color: cat.color,
          icon: cat.icon,
          type: cat.type,
          created_by: cat.created_by,
          updated_by: cat.updated_by,
          created_at: cat.created_at,
          updated_at: cat.updated_at,
        }))
      );
    } catch (error) {
      logger.error("[KYSELY] getCategories failed:", error);
      return err(ServiceError.database("Failed to get categories", error));
    }
  }

  async getRules(): Promise<Result<RuleRow[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const rows = await db.db.selectFrom("rules").selectAll().where("deleted_at", "is", null).orderBy("priority", "desc").orderBy("name", "asc").execute();

      return ok(
        rows.map((rule: any) => ({
          id: rule.id,
          name: rule.name,
          is_active: Boolean(rule.is_active),
          priority: rule.priority,
          conditions: parseJsonSafe<CRDTRule["conditions"]>(rule.conditions, []),
          actions: parseJsonSafe<CRDTRule["actions"]>(rule.actions, []),
          created_by: rule.created_by,
          updated_by: rule.updated_by,
          created_at: rule.created_at,
          updated_at: rule.updated_at,
        }))
      );
    } catch (error) {
      logger.error("[KYSELY] getRules failed:", error);
      return err(ServiceError.database("Failed to get rules", error));
    }
  }

  async getStats(): Promise<Result<DbStats, ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const database = db.db;
      const [txResult, accResult, catResult, ruleResult] = await Promise.all([
        database.selectFrom("transactions").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
        database.selectFrom("accounts").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
        database.selectFrom("categories").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
        database.selectFrom("rules").select(database.fn.countAll<number>().as("count")).where("deleted_at", "is", null).executeTakeFirst(),
      ]);

      return ok({
        transactions: Number(txResult?.count ?? 0),
        accounts: Number(accResult?.count ?? 0),
        categories: Number(catResult?.count ?? 0),
        rules: Number(ruleResult?.count ?? 0),
      });
    } catch (error) {
      logger.error("[KYSELY] getStats failed:", error);
      return err(ServiceError.database("Failed to get database stats", error));
    }
  }

  async executeRaw(query: string, params: unknown[] = []): Promise<Result<unknown[], ServiceError>> {
    const initResult = await this.ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const result = await db.execute(query, params);
      return ok(result.results ?? []);
    } catch (error) {
      logger.error("[KYSELY] executeRaw failed:", error);
      return err(ServiceError.database("Raw query failed", error));
    }
  }
}

export const kyselyQueryService = new KyselyQueryService();
