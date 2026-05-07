import { crdtService } from "./crdt";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { db } from "@/core/storage/client";
import type { CRDTTransaction, CRDTAccount, CRDTCategory } from "@nuts/types";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MigrationProgress {
  stage: "started" | "uploading" | "completed" | "error";
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  migratedTransactions: number;
  migratedAccounts: number;
  migratedCategories: number;
  failedTransactions: number;
  failedAccounts: number;
  failedCategories: number;
  error?: string;
}

export interface MigrationOptions {
  dryRun?: boolean;
  chunkSize?: number;
  maxRetries?: number;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface MigrationState {
  migration_id: string;
  anonymous_user_id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";
  stage: "started" | "uploading" | "completed" | "error";
  progress: number;
  total_items: number;
  migrated_categories: number;
  migrated_accounts: number;
  migrated_transactions: number;
  failed_categories: number;
  failed_accounts: number;
  failed_transactions: number;
  current_chunk: number;
  total_chunks: number;
  retry_count: number;
  last_error: string | null;
}

interface MigrationItems {
  categories: CRDTCategory[];
  accounts: CRDTAccount[];
  transactions: CRDTTransaction[];
}

interface ChunkRequest {
  migration_id: string;
  anonymous_user_id: string;
  items: {
    categories: SerializedCategory[];
    accounts: SerializedAccount[];
    transactions: SerializedTransaction[];
  };
}

interface SerializedCategory {
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface SerializedAccount {
  name: string;
  type: string;
  subtype: string | null | undefined;
  balance: number;
  currency: string;
}

interface SerializedTransaction {
  account_name: string;
  account_id_missing: boolean;
  category_name: string | null;
  amount: number;
  type: string;
  description: string;
  transaction_datetime: string;
  transaction_currency: string;
  original_amount: number;
  details: unknown;
}

interface MigrateApiResponse {
  categories_migrated: number;
  accounts_migrated: number;
  transactions_migrated: number;
  categories_failed: number;
  accounts_failed: number;
  transactions_failed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function emptyResult(): MigrationResult {
  return {
    success: false,
    migratedTransactions: 0,
    migratedAccounts: 0,
    migratedCategories: 0,
    failedTransactions: 0,
    failedAccounts: 0,
    failedCategories: 0,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

class DataMigrationService {
  private listeners: Set<(progress: MigrationProgress) => void> = new Set();
  private isRunning = false;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await db.initialize();
    this.initialized = true;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  onProgress(callback: (progress: MigrationProgress) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  isMigrationRunning(): boolean {
    return this.isRunning;
  }

  async resumeMigration(options: MigrationOptions = {}): Promise<MigrationResult> {
    const anonymousUser = anonymousUserService.getAnonymousUser();
    if (!anonymousUser) throw new Error("No anonymous user found");

    const state = await this.loadMigrationState(anonymousUser.id);
    if (!state || state.status === "completed") {
      throw new Error("No resumable migration found");
    }

    logger.info(`Resuming migration from chunk ${state.current_chunk}/${state.total_chunks}`);

    // Pass the existing state through so migrateInChunks starts from current_chunk.
    return this.migrateAnonymousDataToAuthenticated(options);
  }

  async migrateAnonymousDataToAuthenticated(options: MigrationOptions = {}): Promise<MigrationResult> {
    const { dryRun = false, chunkSize = DEFAULT_CHUNK_SIZE, maxRetries = DEFAULT_MAX_RETRIES } = options;

    if (this.isRunning) throw new Error("Migration already in progress");
    this.isRunning = true;

    const result = emptyResult();

    try {
      this.notifyProgress({ stage: "started", progress: 0 });

      const anonymousUser = anonymousUserService.getAnonymousUser();
      if (!anonymousUser) {
        logger.info("No anonymous user — nothing to migrate");
        this.notifyProgress({ stage: "completed", progress: 100 });
        result.success = true;
        return result;
      }

      const existingState = await this.loadMigrationState(anonymousUser.id);
      if (existingState?.status === "completed") {
        logger.info("Migration already completed for this user");
        return {
          ...result,
          success: true,
          migratedCategories: existingState.migrated_categories,
          migratedAccounts: existingState.migrated_accounts,
          migratedTransactions: existingState.migrated_transactions,
        };
      }

      const items: MigrationItems = {
        categories: Object.values(crdtService.getCategories()),
        accounts: Object.values(crdtService.getAccounts()),
        transactions: Object.values(crdtService.getTransactions()),
      };

      const totalItems = items.categories.length + items.accounts.length + items.transactions.length;

      if (totalItems === 0) {
        logger.info("No data to migrate");
        this.notifyProgress({ stage: "completed", progress: 100 });
        result.success = true;
        return result;
      }

      // Validation always runs — not just in dry-run — so live migrations have
      // the same guardrails as test runs.
      const validation = this.validateMigrationData(items);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
      }

      if (dryRun) {
        logger.info(`[DRY RUN] Validation passed for ${totalItems} items — no data will be migrated`);
        result.success = true;
        return result;
      }

      // Create backup before touching anything. A failed backup aborts the
      // migration rather than proceeding without a safety net.
      const backupId = await this.createBackup();

      try {
        const migrationId = existingState?.migration_id ?? crypto.randomUUID();
        const totalChunks = Math.ceil(totalItems / chunkSize);

        const state: MigrationState = existingState ?? {
          migration_id: migrationId,
          anonymous_user_id: anonymousUser.id,
          status: "in_progress",
          stage: "uploading",
          progress: 0,
          total_items: totalItems,
          migrated_categories: 0,
          migrated_accounts: 0,
          migrated_transactions: 0,
          failed_categories: 0,
          failed_accounts: 0,
          failed_transactions: 0,
          current_chunk: 0,
          total_chunks: totalChunks,
          retry_count: 0,
          last_error: null,
        };

        await this.saveMigrationState(state);

        if (totalChunks > 1) {
          logger.info(`Migrating ${totalItems} items in ${totalChunks} chunks of ${chunkSize}`);
          await this.migrateInChunks(state, items, chunkSize, maxRetries);
        } else {
          await this.migrateSingleChunk(state, items, maxRetries);
        }

        const finalState = await this.loadMigrationState(anonymousUser.id);
        if (!finalState) throw new Error("Migration state lost after upload");

        const totalMigrated = finalState.migrated_categories + finalState.migrated_accounts + finalState.migrated_transactions;
        const totalFailed = finalState.failed_categories + finalState.failed_accounts + finalState.failed_transactions;

        result.migratedCategories = finalState.migrated_categories;
        result.migratedAccounts = finalState.migrated_accounts;
        result.migratedTransactions = finalState.migrated_transactions;
        result.failedCategories = finalState.failed_categories;
        result.failedAccounts = finalState.failed_accounts;
        result.failedTransactions = finalState.failed_transactions;

        if (totalMigrated === totalItems && totalFailed === 0) {
          logger.info("All items migrated successfully — clearing local data");
          await crdtService.clear();
          anonymousUserService.clearAnonymousUser();
          await this.deleteBackup(backupId);
          await this.deleteMigrationState(anonymousUser.id);
          result.success = true;
          this.notifyProgress({ stage: "completed", progress: 100 });
        } else if (totalMigrated > 0) {
          logger.warn(`Partial migration: ${totalMigrated}/${totalItems} migrated, ${totalFailed} failed`);
          result.success = false;
          result.error = `${totalMigrated} of ${totalItems} items migrated — local data preserved for retry`;
          this.notifyProgress({
            stage: "error",
            progress: Math.floor((totalMigrated / totalItems) * 100),
            error: result.error,
          });
        } else {
          result.success = false;
          result.error = finalState.last_error ?? "Migration failed with no items migrated";
          this.notifyProgress({ stage: "error", progress: 0, error: result.error });
        }
      } catch (error) {
        logger.error("Migration failed — restoring from backup:", error);
        this.notifyProgress({
          stage: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Migration failed",
        });

        try {
          await this.restoreBackup(backupId);
          logger.info("Restored from backup after migration failure");
        } catch (restoreError) {
          // Restoration failure is logged at error level but not re-thrown —
          // the CRDT document is the source of truth and remains intact.
          logger.error("Failed to restore backup — CRDT state is still intact:", restoreError);
        }

        result.success = false;
        result.error = error instanceof Error ? error.message : "Unknown error";
      }

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Serialization ───────────────────────────────────────────────────────────

  /**
   * Builds the server payload for a slice of migration items.
   *
   * Transactions reference accounts and categories by name because the server
   * assigns its own IDs after migration. When an account is missing (the
   * transaction's account_id doesn't match any known account) we set
   * account_id_missing=true so the server can handle or reject it explicitly
   * rather than silently assigning to whatever account has the same name.
   */
  private serializeItems(categories: CRDTCategory[], accounts: CRDTAccount[], transactions: CRDTTransaction[]): ChunkRequest["items"] {
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const serializedCategories: SerializedCategory[] = categories.map((cat) => ({
      name: cat.name,
      icon: cat.icon ?? "",
      color: cat.color,
      type: cat.type,
    }));

    const serializedAccounts: SerializedAccount[] = accounts.map((acc) => ({
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      balance: acc.balance,
      currency: acc.currency,
    }));

    const serializedTransactions: SerializedTransaction[] = transactions.map((txn) => {
      const accountName = accountMap.get(txn.account_id);
      if (!accountName) {
        logger.warn(`Transaction ${txn.id} references unknown account ${txn.account_id}`);
      }
      return {
        account_name: accountName ?? "",
        account_id_missing: !accountName,
        category_name: txn.category_id ? (categoryMap.get(txn.category_id) ?? null) : null,
        amount: txn.amount,
        type: txn.type,
        description: txn.description,
        transaction_datetime: txn.transaction_datetime,
        transaction_currency: txn.transaction_currency,
        original_amount: txn.original_amount,
        details: txn.details,
      };
    });

    return {
      categories: serializedCategories,
      accounts: serializedAccounts,
      transactions: serializedTransactions,
    };
  }

  // ─── Upload ───────────────────────────────────────────────────────────────────

  private async migrateSingleChunk(state: MigrationState, items: MigrationItems, maxRetries: number): Promise<void> {
    this.notifyProgress({ stage: "uploading", progress: 30 });

    const request: ChunkRequest = {
      migration_id: state.migration_id,
      anonymous_user_id: state.anonymous_user_id,
      items: this.serializeItems(items.categories, items.accounts, items.transactions),
    };

    const response = await this.executeWithRetry<MigrateApiResponse>(() => api.post("migrate", { json: request }).then((r) => r.json()), maxRetries, state);

    this.notifyProgress({ stage: "uploading", progress: 90 });

    state.migrated_categories = response.categories_migrated;
    state.migrated_accounts = response.accounts_migrated;
    state.migrated_transactions = response.transactions_migrated;
    state.failed_categories = response.categories_failed;
    state.failed_accounts = response.accounts_failed;
    state.failed_transactions = response.transactions_failed;
    state.status = "completed";
    state.stage = "completed";
    state.progress = 100;

    await this.saveMigrationState(state);
  }

  private async migrateInChunks(state: MigrationState, items: MigrationItems, chunkSize: number, maxRetries: number): Promise<void> {
    // Chunk each entity type independently — no flat-merging of different types
    // into one array, which was previously O(n²) and semantically fragile.
    const categoryChunks = chunkArray(items.categories, chunkSize);
    const accountChunks = chunkArray(items.accounts, chunkSize);
    const transactionChunks = chunkArray(items.transactions, chunkSize);

    // Align into parallel chunk slots. Empty arrays fill slots where one entity
    // type has fewer chunks than the others.
    const totalChunks = Math.max(categoryChunks.length, accountChunks.length, transactionChunks.length);

    // Update state with the recalculated chunk count (may differ from initial
    // estimate if items changed between state creation and now).
    state.total_chunks = totalChunks;

    for (let chunkIndex = state.current_chunk; chunkIndex < totalChunks; chunkIndex++) {
      const chunkCategories = categoryChunks[chunkIndex] ?? [];
      const chunkAccounts = accountChunks[chunkIndex] ?? [];
      const chunkTransactions = transactionChunks[chunkIndex] ?? [];

      const chunkItemCount = chunkCategories.length + chunkAccounts.length + chunkTransactions.length;
      logger.info(`Chunk ${chunkIndex + 1}/${totalChunks}: ${chunkItemCount} items`);

      const request: ChunkRequest = {
        migration_id: `${state.migration_id}-chunk-${chunkIndex}`,
        anonymous_user_id: state.anonymous_user_id,
        items: this.serializeItems(chunkCategories, chunkAccounts, chunkTransactions),
      };

      const progress = Math.floor(((chunkIndex + 1) / totalChunks) * 90);
      this.notifyProgress({
        stage: "uploading",
        progress,
        currentChunk: chunkIndex + 1,
        totalChunks,
      });

      try {
        const response = await this.executeWithRetry<MigrateApiResponse>(() => api.post("migrate", { json: request }).then((r) => r.json()), maxRetries, state);

        state.migrated_categories += response.categories_migrated;
        state.migrated_accounts += response.accounts_migrated;
        state.migrated_transactions += response.transactions_migrated;
        state.failed_categories += response.categories_failed;
        state.failed_accounts += response.accounts_failed;
        state.failed_transactions += response.transactions_failed;
        state.current_chunk = chunkIndex + 1;
        state.progress = progress;

        // State is persisted after every chunk so a page reload can resume
        // from the next chunk rather than restarting from zero.
        await this.saveMigrationState(state);
      } catch (error) {
        state.status = "failed";
        state.last_error = error instanceof Error ? error.message : "Unknown error";
        await this.saveMigrationState(state);
        throw error;
      }
    }

    state.status = "completed";
    state.stage = "completed";
    state.progress = 100;
    await this.saveMigrationState(state);
  }

  // ─── Retry ───────────────────────────────────────────────────────────────────

  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries: number, state: MigrationState): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);

        if (attempt < maxRetries) {
          const delay = Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
          logger.info(`Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          state.retry_count++;
          await this.saveMigrationState(state);
        }
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  // ─── Validation ───────────────────────────────────────────────────────────────

  private validateMigrationData(items: MigrationItems): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { categories, accounts, transactions } = items;

    const invalidCategories = categories.filter((c) => !c.name || !c.type);
    if (invalidCategories.length > 0) {
      errors.push(`${invalidCategories.length} categories missing required fields (name, type)`);
    }

    const invalidAccounts = accounts.filter((a) => !a.name || !a.type);
    if (invalidAccounts.length > 0) {
      errors.push(`${invalidAccounts.length} accounts missing required fields (name, type)`);
    }

    const invalidTransactions = transactions.filter((t) => !t.account_id || !t.amount || !t.type);
    if (invalidTransactions.length > 0) {
      errors.push(`${invalidTransactions.length} transactions missing required fields (account_id, amount, type)`);
    }

    const accountIds = new Set(accounts.map((a) => a.id));
    const categoryIds = new Set(categories.map((c) => c.id));

    const orphanedTransactions = transactions.filter((t) => !accountIds.has(t.account_id) || (t.category_id && !categoryIds.has(t.category_id)));
    if (orphanedTransactions.length > 0) {
      errors.push(`${orphanedTransactions.length} transactions reference unknown accounts or categories`);
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── State persistence ────────────────────────────────────────────────────────

  /**
   * Saves migration state using ON CONFLICT upsert to avoid TOCTOU races
   * and to eliminate the SELECT → branch pattern.
   *
   * This method propagates errors — a failed state save means resumability
   * is broken, which is serious enough to abort the current chunk.
   */
  private async saveMigrationState(state: MigrationState): Promise<void> {
    await this.ensureInitialized();
    const timestamp = new Date().toISOString();

    await db.execute(
      `INSERT INTO migration_state (
        migration_id, anonymous_user_id, status, stage, progress, total_items,
        migrated_categories, migrated_accounts, migrated_transactions,
        failed_categories, failed_accounts, failed_transactions,
        current_chunk, total_chunks, retry_count, last_error,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(migration_id) DO UPDATE SET
        status              = excluded.status,
        stage               = excluded.stage,
        progress            = excluded.progress,
        total_items         = excluded.total_items,
        migrated_categories = excluded.migrated_categories,
        migrated_accounts   = excluded.migrated_accounts,
        migrated_transactions = excluded.migrated_transactions,
        failed_categories   = excluded.failed_categories,
        failed_accounts     = excluded.failed_accounts,
        failed_transactions = excluded.failed_transactions,
        current_chunk       = excluded.current_chunk,
        total_chunks        = excluded.total_chunks,
        retry_count         = excluded.retry_count,
        last_error          = excluded.last_error,
        updated_at          = excluded.updated_at`,
      [
        state.migration_id,
        state.anonymous_user_id,
        state.status,
        state.stage,
        state.progress,
        state.total_items,
        state.migrated_categories,
        state.migrated_accounts,
        state.migrated_transactions,
        state.failed_categories,
        state.failed_accounts,
        state.failed_transactions,
        state.current_chunk,
        state.total_chunks,
        state.retry_count,
        state.last_error,
        timestamp,
        timestamp,
      ]
    );

    logger.debug("Migration state saved", { id: state.migration_id, progress: state.progress });
  }

  private async loadMigrationState(anonymousUserId: string): Promise<MigrationState | null> {
    try {
      await this.ensureInitialized();
      const result = await db.execute("SELECT * FROM migration_state WHERE anonymous_user_id = ? ORDER BY created_at DESC LIMIT 1", [anonymousUserId]);
      return (result.results?.[0] as MigrationState) ?? null;
    } catch (error) {
      logger.error("Failed to load migration state:", error);
      return null;
    }
  }

  private async deleteMigrationState(anonymousUserId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await db.execute("DELETE FROM migration_state WHERE anonymous_user_id = ?", [anonymousUserId]);
    } catch (error) {
      logger.error("Failed to delete migration state:", error);
    }
  }

  // ─── Backup ───────────────────────────────────────────────────────────────────

  /**
   * Creates a binary backup of the current CRDT document.
   * Throws on failure — a failed backup means there's no safety net,
   * so the migration must not proceed.
   */
  private async createBackup(): Promise<string> {
    const doc = crdtService.getBinaryDocument();
    if (!doc) throw new Error("No CRDT document available to back up");

    await this.ensureInitialized();
    const backupId = `backup-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Pass Uint8Array directly — driver accepts it without Array.from() conversion.
    await db.execute("INSERT INTO crdt_backups (backup_id, document_binary, created_at) VALUES (?, ?, ?)", [backupId, doc, timestamp]);

    logger.info(`Created CRDT backup: ${backupId}`);
    return backupId;
  }

  private async restoreBackup(backupId: string): Promise<void> {
    await this.ensureInitialized();

    const result = await db.execute("SELECT document_binary FROM crdt_backups WHERE backup_id = ?", [backupId]);

    if (!result.results?.length) {
      throw new Error(`Backup ${backupId} not found — cannot restore`);
    }

    const raw = result.results[0].document_binary;
    const documentBinary = raw instanceof Uint8Array ? raw : new Uint8Array(raw as number[]);

    const anonymousUser = anonymousUserService.getAnonymousUser();
    if (!anonymousUser) throw new Error("Cannot restore backup: no anonymous user found");

    await db.execute("UPDATE crdt_documents SET document_binary = ?, updated_at = ? WHERE user_id = ?", [
      documentBinary,
      new Date().toISOString(),
      anonymousUser.id,
    ]);

    logger.info(`Restored CRDT backup: ${backupId}`);
  }

  private async deleteBackup(backupId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await db.execute("DELETE FROM crdt_backups WHERE backup_id = ?", [backupId]);
    } catch (error) {
      logger.error("Failed to delete backup:", error);
    }
  }

  // ─── Listeners ────────────────────────────────────────────────────────────────

  private notifyProgress(progress: MigrationProgress): void {
    this.listeners.forEach((listener) => listener(progress));
  }
}

export const dataMigrationService = new DataMigrationService();
