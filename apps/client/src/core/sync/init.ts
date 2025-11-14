/**
 * Offline-First Initialization Service
 *
 * Handles the initialization and coordination of all offline-first services
 */

import { crdtService } from "./crdt";
import { kyselyQueryService } from "./query";
import { syncService } from "./sync";
import { featureFlagsService } from "./feature-flags";
import { authService } from "@/features/auth/services/auth.service";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { accountService } from "@/features/accounts/services/account";
import { categoryService } from "@/features/categories/services/category.service";
import { preferencesService } from "@/features/preferences/services/preferences.service";
import { userService } from "@/features/users/services/user.service";
import { logger } from "@/lib/logger";

//NOTE: We have a weird redunduncy concerning data flow here. The default categories are in sqlite, we then put them in crdt then rebuild the db from the crdt again

type InitializedService =
  | "anonymous-user"
  | "auth"
  | "crdt"
  | "kysely"
  | "default-categories"
  | "transaction"
  | "account"
  | "category"
  | "preferences"
  | "sync";

class OfflineFirstInitService {
  private isInitialized = false;
  private initializePromise: Promise<void> | null = null;
  private initializedServices: Set<InitializedService> = new Set();
  private readonly INIT_TIMEOUT_MS = 30000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  async initialize(options?: { maxRetries?: number; timeout?: number }): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializePromise) return this.initializePromise;

    const maxRetries = options?.maxRetries ?? this.MAX_RETRIES;
    const timeout = options?.timeout ?? this.INIT_TIMEOUT_MS;

    this.initializePromise = this.initializeWithRetry(maxRetries, timeout);
    await this.initializePromise;
  }

  private async initializeWithRetry(maxRetries: number, timeout: number): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Initialization attempt ${attempt}/${maxRetries}`);

        await this.withTimeout(this.performInitialization(), timeout);

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Initialization attempt ${attempt} failed:`, lastError);

        if (attempt < maxRetries) {
          const delay = this.RETRY_DELAY_MS * attempt;
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          await this.cleanupPartialInitialization();
          this.initializedServices.clear();
        }
      }
    }

    throw new Error(`Failed to initialize after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Initialization timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  private async performInitialization(): Promise<void> {
    try {
      logger.info("Initializing offline-first services...");

      logger.info("1. Initializing anonymous user...");
      const anonymousResult = await anonymousUserService.initialize();
      if (anonymousResult.isErr()) throw anonymousResult.error;
      this.initializedServices.add("anonymous-user");

      logger.info("2. Initializing offline auth service...");
      const authResult = await authService.initialize();
      if (authResult.isErr()) throw authResult.error;
      this.initializedServices.add("auth");

      logger.info("3. Initializing CRDT service...");
      const crdtResult = await crdtService.initialize();
      if (crdtResult.isErr()) throw crdtResult.error;
      this.initializedServices.add("crdt");

      logger.info("4. Initializing Kysely query service...");
      const kyselyResult = await kyselyQueryService.initialize();
      if (kyselyResult.isErr()) throw kyselyResult.error;
      this.initializedServices.add("kysely");

      logger.info("4a. Loading default categories from SQLite to CRDT...");
      const loadedDefaults = await this.loadDefaultCategories();
      this.initializedServices.add("default-categories");

      logger.info("5. Initializing transaction service...");
      const transactionInitResult = await transactionService.initialize();
      if (transactionInitResult.isErr()) throw transactionInitResult.error;
      this.initializedServices.add("transaction");

      logger.info("6. Initializing account service...");
      const accountInitResult = await accountService.initialize();
      if (accountInitResult.isErr()) throw accountInitResult.error;
      this.initializedServices.add("account");

      logger.info("7. Initializing category service...");
      const categoryInitResult = await categoryService.initialize();
      if (categoryInitResult.isErr()) throw categoryInitResult.error;
      this.initializedServices.add("category");

      logger.info("8. Initializing adaptive preferences service...");
      const preferencesResult = await preferencesService.initialize();
      if (preferencesResult.isErr()) throw preferencesResult.error;
      this.initializedServices.add("preferences");

      if (featureFlagsService.isSyncEnabled()) {
        logger.info("9. Initializing sync service...");
        const syncInitResult = await syncService.initialize();
        if (syncInitResult.isErr()) {
          logger.warn("Sync service initialization failed, continuing in offline mode:", syncInitResult.error);
        } else {
          this.initializedServices.add("sync");
        }
      } else {
        logger.info("9. Sync service disabled");
      }


      const transactions = crdtService.getTransactions();
      const accounts = crdtService.getAccounts();
      const categories = crdtService.getCategories();
      const rules = crdtService.getRules();

      const hasUserData = Object.keys(transactions).length > 0 || Object.keys(accounts).length > 0;
      const hasNonDefaultCategories = !loadedDefaults && Object.keys(categories).length > 0;

      if (hasUserData || hasNonDefaultCategories) {
        logger.info("🔄 Rebuilding Kysely database from CRDT data...");
        const rebuildResult = await kyselyQueryService.rebuildFromCRDT(transactions, accounts, categories, rules);
        if (rebuildResult.isErr()) throw rebuildResult.error;
      } else if (loadedDefaults) {
        logger.info("✓ Skipped redundant rebuild - default categories already in SQLite");
      }

      this.isInitialized = true;
      logger.info("Offline-first services initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize offline-first services:", error);
      logger.error("Services initialized before failure:", Array.from(this.initializedServices));
      await this.cleanupPartialInitialization();
      this.isInitialized = false;
      throw error;
    }
  }

  private async cleanupPartialInitialization(): Promise<void> {
    logger.info("Cleaning up partially initialized services...");

    const servicesToClean = Array.from(this.initializedServices).reverse();

    for (const service of servicesToClean) {
      try {
        switch (service) {
          case "sync":
            await syncService.clear();
            logger.info("Cleaned up sync service");
            break;
          case "preferences":
            preferencesService.clear();
            logger.info("Cleaned up preferences service");
            break;
          case "category":
            logger.info("Category service cleanup (no action needed)");
            break;
          case "account":
            logger.info("Account service cleanup (no action needed)");
            break;
          case "transaction":
            logger.info("Transaction service cleanup (no action needed)");
            break;
          case "default-categories":
            logger.info("Default categories cleanup (no action needed)");
            break;
          case "kysely":
            await kyselyQueryService.close();
            logger.info("Cleaned up kysely service");
            break;
          case "crdt":
            await crdtService.clear();
            logger.info("Cleaned up CRDT service");
            break;
          case "auth":
            await authService.clear();
            logger.info("Cleaned up auth service");
            break;
          case "anonymous-user":
            anonymousUserService.clearAnonymousUser();
            logger.info("Cleaned up anonymous user service");
            break;
        }
      } catch (cleanupError) {
        logger.warn(`Failed to cleanup ${service}:`, cleanupError);
      }
    }

    this.initializedServices.clear();
    logger.info("Partial initialization cleanup complete");
  }

  private async loadDefaultCategories(): Promise<boolean> {
    try {
      const existingCategories = crdtService.getCategories();
      if (Object.keys(existingCategories).length > 0) {
        logger.info("Categories already exist in CRDT, skipping default load");
        return false;
      }

      const db = kyselyQueryService.getDb();
      const sqliteCategories = await db.selectFrom("categories").selectAll().where("is_default", "=", 1).where("created_by", "=", "system").execute();

      if (sqliteCategories.length === 0) {
        logger.info("No default categories found in SQLite");
        return false;
      }

      logger.info(`Loading ${sqliteCategories.length} default categories into CRDT...`);

      for (const category of sqliteCategories) {
        try {
          const categoryData: any = {
            id: category.id,
            name: category.name,
            type: (category.type as "income" | "expense") || "expense",
            color: category.color || "#000000",
            icon: category.icon || "",
            is_active: true,
          };

          if (category.parent_id) {
            categoryData.parent_id = category.parent_id;
          }

          const createResult = await crdtService.createCategory(categoryData);
          if (createResult.isErr()) {
            logger.error(`Failed to create category ${category.name}:`, createResult.error);
            throw createResult.error;
          }
        } catch (categoryError) {
          logger.error(`Failed to create category ${category.name}:`, categoryError);
          throw categoryError;
        }
      }

      logger.info("Default categories loaded into CRDT");
      return true;
    } catch (error) {
      logger.error("Failed to load default categories:", error);
      logger.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw error;
    }
  }

  /**
   * Check if services are initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  getStatus(): {
    isInitialized: boolean;
    syncEnabled: boolean;
    services: {
      anonymousUser: boolean;
      auth: boolean;
      crdt: boolean;
      kysely: boolean;
      defaultCategories: boolean;
      transaction: boolean;
      account: boolean;
      category: boolean;
      preferences: boolean;
      sync: boolean;
    };
  } {
    return {
      isInitialized: this.isInitialized,
      syncEnabled: featureFlagsService.isSyncEnabled(),
      services: {
        anonymousUser: this.initializedServices.has("anonymous-user"),
        auth: this.initializedServices.has("auth"),
        crdt: this.initializedServices.has("crdt"),
        kysely: this.initializedServices.has("kysely"),
        defaultCategories: this.initializedServices.has("default-categories"),
        transaction: this.initializedServices.has("transaction"),
        account: this.initializedServices.has("account"),
        category: this.initializedServices.has("category"),
        preferences: this.initializedServices.has("preferences"),
        sync: this.initializedServices.has("sync"),
      },
    };
  }

  /**
   * Reinitialize services (useful when feature flags change)
   * NOTE: We should make it stop running service first (sync polling, DB connections, etc...)
   */
  async reinitialize(): Promise<void> {
    logger.info("Reinitializing offline-first services...");
    await this.stopRunningServices();
    await this.clear();
    this.isInitialized = false;
    this.initializePromise = null;
    this.initializedServices.clear();
    await this.initialize();
  }

  private async stopRunningServices(): Promise<void> {
    logger.info("Stopping running services...");

    try {
      if (this.initializedServices.has("sync")) {
        syncService.stopBackgroundSync();
        logger.info("Stopped sync background polling");
      }
    } catch (error) {
      logger.warn("Failed to stop services:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      logger.info("Clearing offline-first data...");

      await this.stopRunningServices();

      if (this.initializedServices.has("sync")) {
        await syncService.clear();
      }

      const closeResult = await kyselyQueryService.close();
      if (closeResult.isErr()) logger.warn("Failed to close kysely:", closeResult.error);

      await Promise.all([crdtService.clear(), authService.clear()]);

      anonymousUserService.clearAnonymousUser();
      preferencesService.clear();
      userService.clear();

      this.isInitialized = false;
      this.initializePromise = null;
      this.initializedServices.clear();

      logger.info("Offline-first data cleared");
    } catch (error) {
      logger.error("Failed to clear offline-first data:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineFirstInitService = new OfflineFirstInitService();
