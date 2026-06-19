/**
 * Offline-First Initialization Service
 *
 * Coordinates sequential startup of all offline-first services and provides
 * ordered teardown on failure. Each service is registered in the order it
 * must be initialized; cleanup runs in reverse.
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
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { db } from "../storage/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceName = "anonymous-user" | "auth" | "crdt" | "kysely" | "default-categories" | "transaction" | "account" | "category" | "preferences" | "sync";

export interface InitStatus {
  isInitialized: boolean;
  syncEnabled: boolean;
  services: Record<ServiceName, boolean>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INIT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

// ─── Service ──────────────────────────────────────────────────────────────────

class OfflineFirstInitService {
  private isInitialized = false;
  private initializePromise: Promise<void> | null = null;
  private initializedServices: Set<ServiceName> = new Set();

  // ─── Public API ─────────────────────────────────────────────────────────────

  async initialize(options?: { maxRetries?: number; timeout?: number }): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializePromise) return this.initializePromise;

    const maxRetries = options?.maxRetries ?? MAX_RETRIES;
    const timeout = options?.timeout ?? INIT_TIMEOUT_MS;

    this.initializePromise = this.initializeWithRetry(maxRetries, timeout).finally(() => {
      // Always clear the promise slot so a future call can retry from scratch
      // if this attempt ultimately failed.
      if (!this.isInitialized) this.initializePromise = null;
    });

    return this.initializePromise;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getStatus(): InitStatus {
    const all: ServiceName[] = ["anonymous-user", "auth", "crdt", "kysely", "default-categories", "transaction", "account", "category", "preferences", "sync"];
    return {
      isInitialized: this.isInitialized,
      syncEnabled: featureFlagsService.isSyncEnabled(),
      services: Object.fromEntries(all.map((s) => [s, this.initializedServices.has(s)])) as Record<ServiceName, boolean>,
    };
  }

  async reinitialize(): Promise<void> {
    logger.info("Reinitializing offline-first services...");
    await this.clear();
    await this.initialize();
  }

  async clear(): Promise<void> {
    logger.info("Clearing offline-first data...");

    try {
      syncService.stopBackgroundSync();
      if (this.initializedServices.has("sync")) await syncService.clear();

      const closeResult = await kyselyQueryService.close();
      if (closeResult.isErr()) logger.warn("Failed to close Kysely:", closeResult.error);

      await Promise.all([crdtService.clear(), authService.clear()]);

      anonymousUserService.clearAnonymousUser();
      preferencesService.clear();
      userService.clear();
    } catch (error) {
      logger.error("Failed to clear offline-first data:", error);
      throw error;
    } finally {
      this.isInitialized = false;
      this.initializePromise = null;
      this.initializedServices.clear();
    }
  }

  // ─── Initialization ──────────────────────────────────────────────────────────

  private async initializeWithRetry(maxRetries: number, timeout: number): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Initialization attempt ${attempt}/${maxRetries}`);
        await this.withTimeout(this.performInitialization(), timeout);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Initialization attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          await this.cleanupPartialInitialization();
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          logger.info(`Retrying in ${delay}ms…`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    await this.cleanupPartialInitialization();
    throw new Error(`Failed to initialize after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Initialization timed out after ${ms}ms`)), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  private async performInitialization(): Promise<void> {
    logger.info("Starting offline-first service initialization…");

    // ── 1. Anonymous user (only when running unauthenticated) ─────────────────
    if (useAuthStore.getState().isAnonymous) {
      const result = await anonymousUserService.initialize();
      if (result.isErr()) throw result.error;
      this.initializedServices.add("anonymous-user");
      logger.info("✓ Anonymous user initialized");
    } else {
      logger.info("✓ Anonymous user skipped (authenticated session)");
    }

    // ── 2. Auth ───────────────────────────────────────────────────────────────
    const authResult = await authService.initialize();
    if (authResult.isErr()) throw authResult.error;
    this.initializedServices.add("auth");
    logger.info("✓ Auth service initialized");

    // ── 3. CRDT ───────────────────────────────────────────────────────────────
    const crdtResult = await crdtService.initialize();
    if (crdtResult.isErr()) throw crdtResult.error;
    this.initializedServices.add("crdt");
    logger.info("✓ CRDT service initialized");

    // ── 4. Kysely ─────────────────────────────────────────────────────────────
    const kyselyResult = await kyselyQueryService.initialize();
    if (kyselyResult.isErr()) throw kyselyResult.error;
    this.initializedServices.add("kysely");
    logger.info("✓ Kysely query service initialized");

    // ── 5. Domain services ────────────────────────────────────────────────────
    for (const [name, svc] of [
      ["transaction", transactionService],
      ["account", accountService],
      ["category", categoryService],
      ["preferences", preferencesService],
    ] as const) {
      const result = await (svc as { initialize(): Promise<{ isErr(): boolean; error: unknown }> }).initialize();
      if (result.isErr()) throw result.error;
      this.initializedServices.add(name as ServiceName);
      logger.info(`✓ ${name} service initialized`);
    }

    // ── 6. Sync (optional — failure is non-fatal) ─────────────────────────────
    if (featureFlagsService.isSyncEnabled()) {
      const syncResult = await syncService.initialize();
      if (syncResult.isErr()) {
        logger.warn("Sync service failed to initialize — continuing in offline mode:", syncResult.error);
      } else {
        this.initializedServices.add("sync");
        logger.info("✓ Sync service initialized");
      }
    } else {
      logger.info("✓ Sync service disabled by feature flag");
    }

    // ── 7. Populate SQLite from CRDT ──────────────────────────────────────────
    //
    // There's a known data flow awkwardness: default categories live in SQLite
    // (seeded at migration time), get copied into the CRDT, then the CRDT is
    // used to rebuild SQLite. The right long-term fix is to seed defaults
    // directly into the CRDT on first run so SQLite is always a derived view.
    // For now we skip the rebuild when only default categories are present to
    // avoid the round-trip.
    await this.rebuildSQLiteIfNeeded();

    this.isInitialized = true;
    logger.info("✓ All offline-first services initialized");
  }

  // ─── SQLite rebuild ───────────────────────────────────────────────────────────

  /**
   * Rebuilds the SQLite query layer from the CRDT snapshot.
   *
   * Skipped entirely when the CRDT is empty — avoids deleting seed data
   * (default categories) that was just written by migrations. When the CRDT
   * has no categories, we instead copy defaults from SQLite into the CRDT so
   * subsequent rebuilds produce the correct state.
   */
  private async rebuildSQLiteIfNeeded(): Promise<void> {
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    const _rules = crdtService.getRules();

    const hasTransactions = Object.keys(transactions).length > 0;
    const hasAccounts = Object.keys(accounts).length > 0;
    const hasCategories = Object.keys(categories).length > 0;

    // No CRDT data at all → new user. Load default categories from SQLite into
    // the CRDT first, then a rebuild will naturally include them.
    if (!hasTransactions && !hasAccounts && !hasCategories) {
      const loaded = await this.loadDefaultCategoriesIntoCRDT();
      this.initializedServices.add("default-categories");

      if (!loaded) {
        logger.info("✓ SQLite rebuild skipped — no CRDT data and no default categories found");
        return;
      }

      // Flush any deferred CRDT persist before reading back from the document
      // for the SQLite rebuild. Without this, the 60 category writes queued by
      // loadDefaultCategoriesIntoCRDT may not have hit disk yet.
      await crdtService.flushPending();

      // Default categories were just written into the CRDT; rebuild so SQLite
      // reflects them as proper query-layer rows.
      logger.info("Rebuilding SQLite with default categories…");
    } else {
      this.initializedServices.add("default-categories");
      logger.info("Rebuilding SQLite from existing CRDT data…");
    }

    const rebuildResult = await kyselyQueryService.rebuildFromCRDT(
      crdtService.getTransactions(),
      crdtService.getAccounts(),
      crdtService.getCategories(),
      crdtService.getRules()
    );

    if (rebuildResult.isErr()) throw rebuildResult.error;
    logger.info("✓ SQLite rebuilt from CRDT");
  }

  /**
   * Copies system default categories from SQLite into the CRDT.
   * Returns true if any categories were loaded, false if none were found.
   * Throws on error so the init sequence fails cleanly.
   */
  private async loadDefaultCategoriesIntoCRDT(): Promise<boolean> {
    const defaults = await db.db.selectFrom("categories").selectAll().where("is_default", "=", 1).where("created_by", "=", "system").execute();

    if (defaults.length === 0) {
      logger.info("No default categories found in SQLite");
      return false;
    }

    logger.info(`Loading ${defaults.length} default categories into CRDT…`);

    for (const cat of defaults) {
      const result = await crdtService.createCategory({
        id: cat.id,
        name: cat.name,
        type: (cat.type as "income" | "expense") ?? "expense",
        color: cat.color ?? "#000000",
        icon: cat.icon ?? null,
        parent_id: cat.parent_id ?? null,
        is_active: true,
        created_by: cat.created_by ?? "system",
        updated_by: cat.updated_by ?? null,
      });

      if (result.isErr()) {
        throw new Error(`Failed to load default category "${cat.name}": ${result.error.message}`);
      }
    }

    logger.info(`✓ ${defaults.length} default categories loaded into CRDT`);
    return true;
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────────

  /**
   * Tears down services in reverse initialization order.
   * Each failure is logged but does not prevent subsequent cleanups —
   * we want to release as many resources as possible even if one step fails.
   */
  private async cleanupPartialInitialization(): Promise<void> {
    if (this.initializedServices.size === 0) return;

    logger.info("Cleaning up partially initialized services…");

    const teardownOrder: ServiceName[] = [
      "sync",
      "preferences",
      "category",
      "account",
      "transaction",
      "default-categories",
      "crdt",
      "kysely",
      "auth",
      "anonymous-user",
    ];

    for (const service of teardownOrder) {
      if (!this.initializedServices.has(service)) continue;

      try {
        switch (service) {
          case "sync":
            syncService.stopBackgroundSync();
            await syncService.clear();
            break;
          case "preferences":
            preferencesService.clear();
            break;
          case "kysely":
            await kyselyQueryService.close();
            break;
          case "crdt":
            await crdtService.clear();
            break;
          case "auth":
            authService.clear();
            break;
          case "anonymous-user":
            anonymousUserService.clearAnonymousUser();
            break;
          // domain services have no teardown; inclusion in the set is enough
          // for tracking — no action needed for category/account/transaction/
          // default-categories.
        }
        logger.info(`  cleaned up: ${service}`);
      } catch (error) {
        logger.warn(`  cleanup failed for ${service}:`, error);
      }
    }

    this.initializedServices.clear();
  }
}

export const offlineFirstInitService = new OfflineFirstInitService();
