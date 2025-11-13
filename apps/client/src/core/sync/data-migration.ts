import { crdtService } from "./crdt";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";
import { api as axios } from "@/lib/axios";
import { logger } from "@/lib/logger";
import { db } from "@/core/storage/client";

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
  failedTransactions?: number;
  failedAccounts?: number;
  failedCategories?: number;
  error?: string;
}

export interface MigrationOptions {
  dryRun?: boolean;
  chunkSize?: number;
  maxRetries?: number;
}

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

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

class DataMigrationService {
  private listeners: Set<(progress: MigrationProgress) => void> = new Set();
  private isRunning = false;

  async migrateAnonymousDataToAuthenticated(options: MigrationOptions = {}): Promise<MigrationResult> {
    const { dryRun = false, chunkSize = DEFAULT_CHUNK_SIZE, maxRetries = DEFAULT_MAX_RETRIES } = options;

    if (this.isRunning) {
      throw new Error("Migration already in progress");
    }

    this.isRunning = true;

    const result: MigrationResult = {
      success: false,
      migratedTransactions: 0,
      migratedAccounts: 0,
      migratedCategories: 0,
      failedTransactions: 0,
      failedAccounts: 0,
      failedCategories: 0,
    };

    const backup = dryRun ? "" : await this.createBackup();

    try {
      this.notifyProgress({ stage: "started", progress: 0 });

      const anonymousUser = anonymousUserService.getAnonymousUser();

      if (!anonymousUser) {
        logger.info("No anonymous user found - nothing to migrate");
        this.notifyProgress({ stage: "completed", progress: 100 });
        result.success = true;
        return result;
      }

      const existingState = await this.loadMigrationState(anonymousUser.id);

      if (existingState && existingState.status === "completed") {
        logger.info("Migration already completed for this user");
        result.success = true;
        result.migratedCategories = existingState.migrated_categories;
        result.migratedAccounts = existingState.migrated_accounts;
        result.migratedTransactions = existingState.migrated_transactions;
        return result;
      }

      const transactions = Object.values(crdtService.getTransactions());
      const accounts = Object.values(crdtService.getAccounts());
      const categories = Object.values(crdtService.getCategories());

      const totalItems = transactions.length + accounts.length + categories.length;

      if (totalItems === 0) {
        logger.info("No data to migrate");
        this.notifyProgress({ stage: "completed", progress: 100 });
        result.success = true;
        return result;
      }

      logger.info(
        `${dryRun ? "[DRY RUN]" : ""} Starting migration of ${totalItems} items from anonymous user ${anonymousUser.id}`
      );

      const migrationId = existingState?.migration_id || crypto.randomUUID();

      const totalChunks = Math.ceil(totalItems / chunkSize);
      const needsChunking = totalChunks > 1;

      if (needsChunking) {
        logger.info(`Migration will be processed in ${totalChunks} chunks of ${chunkSize} items`);
      }

      if (dryRun) {
        logger.info("[DRY RUN] Validating migration data...");
        const validation = this.validateMigrationData(categories, accounts, transactions);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }
        logger.info("[DRY RUN] Validation passed - no data will be migrated");
        result.success = true;
        return result;
      }

      const state: MigrationState = existingState || {
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

      if (needsChunking) {
        await this.migrateInChunks(state, categories, accounts, transactions, chunkSize, maxRetries);
      } else {
        await this.migrateSingleChunk(state, categories, accounts, transactions, maxRetries);
      }

      const finalState = await this.loadMigrationState(anonymousUser.id);
      if (finalState) {
        result.migratedCategories = finalState.migrated_categories;
        result.migratedAccounts = finalState.migrated_accounts;
        result.migratedTransactions = finalState.migrated_transactions;
        result.failedCategories = finalState.failed_categories;
        result.failedAccounts = finalState.failed_accounts;
        result.failedTransactions = finalState.failed_transactions;

        const totalMigrated =
          finalState.migrated_categories + finalState.migrated_accounts + finalState.migrated_transactions;
        const totalFailed = finalState.failed_categories + finalState.failed_accounts + finalState.failed_transactions;

        if (totalMigrated === totalItems && totalFailed === 0) {
          logger.info("All items migrated successfully, clearing local data");
          await crdtService.clear();
          anonymousUserService.clearAnonymousUser();
          await this.deleteBackup(backup);
          await this.deleteMigrationState(anonymousUser.id);
          result.success = true;
          this.notifyProgress({ stage: "completed", progress: 100 });
        } else if (totalMigrated > 0) {
          logger.warn(`Partial migration: ${totalMigrated}/${totalItems} items migrated, ${totalFailed} failed`);
          result.success = false;
          result.error = `Only ${totalMigrated} of ${totalItems} items migrated successfully`;
          this.notifyProgress({
            stage: "error",
            progress: Math.floor((totalMigrated / totalItems) * 100),
            error: "Partial migration - local data preserved for retry",
          });
        } else {
          result.success = false;
          result.error = finalState.last_error || "Migration failed";
          this.notifyProgress({
            stage: "error",
            progress: 0,
            error: result.error,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error("Migration failed, restoring from backup:", error);
      this.notifyProgress({
        stage: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Migration failed",
      });

      if (!dryRun) {
        try {
          await this.restoreBackup(backup);
          logger.info("Successfully restored from backup after migration failure");
        } catch (restoreError) {
          logger.error("Failed to restore backup:", restoreError);
        }
      }

      result.success = false;
      result.error = error instanceof Error ? error.message : "Unknown error";
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  private async migrateSingleChunk(
    state: MigrationState,
    categories: any[],
    accounts: any[],
    transactions: any[],
    maxRetries: number
  ): Promise<void> {
    const migrationRequest = {
      migration_id: state.migration_id,
      anonymous_user_id: state.anonymous_user_id,
      items: {
        categories: categories.map((cat) => ({
          name: cat.name,
          icon: cat.icon || "",
          color: cat.color || "#000000",
          type: cat.type,
        })),
        accounts: accounts.map((acc) => ({
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          balance: acc.balance || 0,
          currency: acc.currency || "USD",
        })),
        transactions: transactions.map((txn) => ({
          account_name: accounts.find((a) => a.id === txn.account_id)?.name || "",
          category_name: categories.find((c) => c.id === txn.category_id)?.name || "",
          amount: txn.amount,
          type: txn.type,
          description: txn.description,
          transaction_datetime: txn.transaction_datetime,
          transaction_currency: txn.transaction_currency || "USD",
          original_amount: txn.original_amount || txn.amount,
          details: txn.details,
        })),
      },
    };

    this.notifyProgress({ stage: "uploading", progress: 30 });

    const response = await this.executeWithRetry(() => axios.post("/migrate", migrationRequest), maxRetries, state);

    this.notifyProgress({ stage: "uploading", progress: 90 });

    if (response.data) {
      state.migrated_categories = response.data.categories_migrated || 0;
      state.migrated_accounts = response.data.accounts_migrated || 0;
      state.migrated_transactions = response.data.transactions_migrated || 0;
      state.failed_categories = response.data.categories_failed || 0;
      state.failed_accounts = response.data.accounts_failed || 0;
      state.failed_transactions = response.data.transactions_failed || 0;
      state.status = "completed";
      state.stage = "completed";
      state.progress = 100;

      await this.saveMigrationState(state);
    }
  }

  private async migrateInChunks(
    state: MigrationState,
    categories: any[],
    accounts: any[],
    transactions: any[],
    chunkSize: number,
    maxRetries: number
  ): Promise<void> {
    const allItems = [...categories, ...accounts, ...transactions];
    const totalChunks = Math.ceil(allItems.length / chunkSize);

    for (let chunkIndex = state.current_chunk; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, allItems.length);
      const chunk = allItems.slice(start, end);

      const chunkCategories = chunk.filter((item) => categories.includes(item));
      const chunkAccounts = chunk.filter((item) => accounts.includes(item));
      const chunkTransactions = chunk.filter((item) => transactions.includes(item));

      logger.info(`Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} items)`);

      const chunkRequest = {
        migration_id: `${state.migration_id}-chunk-${chunkIndex}`,
        anonymous_user_id: state.anonymous_user_id,
        items: {
          categories: chunkCategories.map((cat) => ({
            name: cat.name,
            icon: cat.icon || "",
            color: cat.color || "#000000",
            type: cat.type,
          })),
          accounts: chunkAccounts.map((acc) => ({
            name: acc.name,
            type: acc.type,
            subtype: acc.subtype,
            balance: acc.balance || 0,
            currency: acc.currency || "USD",
          })),
          transactions: chunkTransactions.map((txn) => ({
            account_name: accounts.find((a) => a.id === txn.account_id)?.name || "",
            category_name: categories.find((c) => c.id === txn.category_id)?.name || "",
            amount: txn.amount,
            type: txn.type,
            description: txn.description,
            transaction_datetime: txn.transaction_datetime,
            transaction_currency: txn.transaction_currency || "USD",
            original_amount: txn.original_amount || txn.amount,
            details: txn.details,
          })),
        },
      };

      const progress = Math.floor(((chunkIndex + 1) / totalChunks) * 90);
      this.notifyProgress({
        stage: "uploading",
        progress,
        currentChunk: chunkIndex + 1,
        totalChunks,
      });

      try {
        const response = await this.executeWithRetry(() => axios.post("/migrate", chunkRequest), maxRetries, state);

        if (response.data) {
          state.migrated_categories += response.data.categories_migrated || 0;
          state.migrated_accounts += response.data.accounts_migrated || 0;
          state.migrated_transactions += response.data.transactions_migrated || 0;
          state.failed_categories += response.data.categories_failed || 0;
          state.failed_accounts += response.data.accounts_failed || 0;
          state.failed_transactions += response.data.transactions_failed || 0;
        }

        state.current_chunk = chunkIndex + 1;
        state.progress = progress;
        await this.saveMigrationState(state);
      } catch (error) {
        logger.error(`Failed to migrate chunk ${chunkIndex + 1}:`, error);
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

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    state: MigrationState
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        logger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);

        if (attempt < maxRetries) {
          const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          state.retry_count++;
          await this.saveMigrationState(state);
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  private validateMigrationData(
    categories: any[],
    accounts: any[],
    transactions: any[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (categories.some((cat) => !cat.name || !cat.type)) {
      errors.push("Some categories are missing required fields (name, type)");
    }

    if (accounts.some((acc) => !acc.name || !acc.type)) {
      errors.push("Some accounts are missing required fields (name, type)");
    }

    if (transactions.some((txn) => !txn.account_id || !txn.amount || !txn.type)) {
      errors.push("Some transactions are missing required fields (account_id, amount, type)");
    }

    const accountIds = new Set(accounts.map((a) => a.id));
    const categoryIds = new Set(categories.map((c) => c.id));

    const invalidTransactions = transactions.filter(
      (txn) => !accountIds.has(txn.account_id) || (txn.category_id && !categoryIds.has(txn.category_id))
    );

    if (invalidTransactions.length > 0) {
      errors.push(`${invalidTransactions.length} transactions reference invalid accounts or categories`);
    }

    return { valid: errors.length === 0, errors };
  }

  async resumeMigration(options: MigrationOptions = {}): Promise<MigrationResult> {
    const anonymousUser = anonymousUserService.getAnonymousUser();
    if (!anonymousUser) {
      throw new Error("No anonymous user found");
    }

    const state = await this.loadMigrationState(anonymousUser.id);
    if (!state || state.status === "completed") {
      throw new Error("No migration in progress to resume");
    }

    logger.info(`Resuming migration from chunk ${state.current_chunk}/${state.total_chunks}`);
    return this.migrateAnonymousDataToAuthenticated(options);
  }

  private async saveMigrationState(state: MigrationState): Promise<void> {
    try {
      await db.initialize();
      const timestamp = new Date().toISOString();

      const existing = await db.execute("SELECT id FROM migration_state WHERE migration_id = ?", [state.migration_id]);

      if (existing.results && existing.results.length > 0) {
        await db.execute(
          `UPDATE migration_state SET 
            status = ?, stage = ?, progress = ?, total_items = ?,
            migrated_categories = ?, migrated_accounts = ?, migrated_transactions = ?,
            failed_categories = ?, failed_accounts = ?, failed_transactions = ?,
            current_chunk = ?, total_chunks = ?, retry_count = ?, last_error = ?,
            updated_at = ?
          WHERE migration_id = ?`,
          [
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
            state.migration_id,
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO migration_state (
            migration_id, anonymous_user_id, status, stage, progress, total_items,
            migrated_categories, migrated_accounts, migrated_transactions,
            failed_categories, failed_accounts, failed_transactions,
            current_chunk, total_chunks, retry_count, last_error,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      }

      logger.debug("Migration state saved", { migrationId: state.migration_id, progress: state.progress });
    } catch (error) {
      logger.error("Failed to save migration state:", error);
    }
  }

  private async loadMigrationState(anonymousUserId: string): Promise<MigrationState | null> {
    try {
      await db.initialize();
      const result = await db.execute(
        "SELECT * FROM migration_state WHERE anonymous_user_id = ? ORDER BY created_at DESC LIMIT 1",
        [anonymousUserId]
      );

      if (!result.results || result.results.length === 0) {
        return null;
      }

      return result.results[0] as MigrationState;
    } catch (error) {
      logger.error("Failed to load migration state:", error);
      return null;
    }
  }

  private async deleteMigrationState(anonymousUserId: string): Promise<void> {
    try {
      await db.initialize();
      await db.execute("DELETE FROM migration_state WHERE anonymous_user_id = ?", [anonymousUserId]);
      logger.info(`Deleted migration state for user: ${anonymousUserId}`);
    } catch (error) {
      logger.error("Failed to delete migration state:", error);
    }
  }

  private async createBackup(): Promise<string> {
    const backupId = `backup-${Date.now()}`;
    const doc = crdtService.getBinaryDocument();

    if (!doc) {
      return backupId;
    }

    try {
      await db.initialize();
      const binaryArray = Array.from(doc);
      const timestamp = new Date().toISOString();

      await db.execute("INSERT INTO crdt_backups (backup_id, document_binary, created_at) VALUES (?, ?, ?)", [
        backupId,
        binaryArray,
        timestamp,
      ]);

      logger.info(`Created CRDT backup: ${backupId}`);
      return backupId;
    } catch (error) {
      logger.error("Failed to create backup:", error);
      return backupId;
    }
  }

  private async restoreBackup(backupId: string): Promise<void> {
    try {
      await db.initialize();

      const result = await db.execute("SELECT document_binary FROM crdt_backups WHERE backup_id = ?", [backupId]);

      if (!result.results || result.results.length === 0) {
        logger.warn(`Backup ${backupId} not found`);
        return;
      }

      const binaryData = result.results[0].document_binary;
      let documentBinary: Uint8Array;

      if (binaryData instanceof Uint8Array) {
        documentBinary = binaryData;
      } else if (Array.isArray(binaryData)) {
        documentBinary = new Uint8Array(binaryData);
      } else {
        logger.error("Invalid backup data format");
        return;
      }

      const anonymousUser = anonymousUserService.getAnonymousUser();
      if (!anonymousUser) {
        logger.error("Cannot restore backup: no anonymous user found");
        return;
      }

      await db.execute("UPDATE crdt_documents SET document_binary = ?, updated_at = ? WHERE user_id = ?", [
        Array.from(documentBinary),
        new Date().toISOString(),
        anonymousUser.id,
      ]);

      logger.info(`Restored CRDT backup: ${backupId}`);
    } catch (error) {
      logger.error("Failed to restore backup:", error);
      throw error;
    }
  }

  private async deleteBackup(backupId: string): Promise<void> {
    try {
      await db.initialize();
      await db.execute("DELETE FROM crdt_backups WHERE backup_id = ?", [backupId]);
      logger.info(`Deleted CRDT backup: ${backupId}`);
    } catch (error) {
      logger.error("Failed to delete backup:", error);
    }
  }

  onProgress(callback: (progress: MigrationProgress) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyProgress(progress: MigrationProgress): void {
    this.listeners.forEach((listener) => listener(progress));
  }

  isMigrationRunning(): boolean {
    return this.isRunning;
  }
}

export const dataMigrationService = new DataMigrationService();
