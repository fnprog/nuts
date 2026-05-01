import { wrap, Remote } from "comlink";
import { Kysely } from "kysely";
import { WaSqliteDialect } from "./dialect";

import type { Database } from "@nuts/types/storage";
import { MigrationRunner, allMigrations } from "@nuts/migrations";
import { CURRENCIES } from "@nuts/constants";
import { logger } from "@/lib/logger";

export interface SQLiteWorkerAPI {
  initialize(): Promise<void>;
  execute(sql: string, params?: any[]): Promise<{ results: any[]; columns: string[] }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export class DatabaseClient {
  private lastWorkerError: ErrorEvent | null = null;
  private worker: Worker | null = null;
  private workerAPI: Remote<SQLiteWorkerAPI> | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private _db: Kysely<Database> | null = null;
  private migrationRunner: MigrationRunner | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    if (this.lastWorkerError) throw new Error(`Previous SQLite worker error: ${this.lastWorkerError.message || this.lastWorkerError.type}`);

    this.initPromise = this.performInitialization()
      .catch((err) => {
        // Defensive: if initialization fails, clear references and state for future retries
        this.isInitialized = false;
        this._db = null;
        this.migrationRunner = null;
        this.workerAPI = null;
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
        }
        throw err;
      });
    await this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    logger.info("Starting SQLite worker initialization...");

    this.worker = new Worker(new URL("./sqlite.worker.ts", import.meta.url), { type: "module" });

    // Keep a reference to this specific worker instance so we can ignore
    // late-firing onerror events from a terminated worker on future retries.
    const currentWorker = this.worker;

    // Add error handler
    this.worker.onerror = (error) => {
      if (this.worker !== currentWorker) return; // stale event from a previous worker
      logger.error("SQLite worker error:", error);
      this.handleWorkerError(error);
    };

    this.worker.onmessageerror = (error) => {
      logger.error("SQLite worker message error:", error);
    };

    this.workerAPI = wrap<SQLiteWorkerAPI>(this.worker);

    await this.workerAPI.initialize();
    logger.info("✓ SQLite worker initialized");

    this._db = new Kysely<Database>({
      dialect: new WaSqliteDialect({
        executeQuery: async (sql: string, params: any[]) => {
          return await this.workerAPI!.execute(sql, params);
        },
        executeExec: async (sql: string) => {
          await this.workerAPI!.exec(sql);
        },
      }),
    });

    this.migrationRunner = new MigrationRunner(this.execute.bind(this));
    this.migrationRunner.registerMigrations(allMigrations);

    await this.runMigrations();
    await this.seedDefaultData();

    this.isInitialized = true;
    this.initPromise = null;
    logger.info("Local database client initialized with wa-sqlite worker and OPFS VFS");
  }

  get db(): Kysely<Database> {
    if (!this._db) {
      throw new Error("Database not initialized");
    }
    return this._db;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.workerAPI) {
      throw new Error("Worker not initialized");
    }
    return await this.workerAPI.execute(sql, params);
  }

  async exec(sql: string): Promise<void> {
    if (!this.workerAPI) {
      throw new Error("Worker not initialized");
    }
    await this.workerAPI.exec(sql);
  }

  /**
   * Handles errors from the SQLite worker (e.g. OPFS unavailable, WASM failure).
   * Sets state so that future initialization attempts throw immediately.
   */
  private handleWorkerError(error: ErrorEvent) {
    this.lastWorkerError = error;
    this.isInitialized = false;
    this._db = null;
    this.migrationRunner = null;
    this.workerAPI = null;
    if (this.worker) {
      this.worker.onerror = null; // detach before terminate to prevent re-entry
      this.worker.terminate();
      this.worker = null;
    }
    // Create an immediately rejected promise for callers.
    // Attach a no-op catch to prevent unhandled promise rejection warnings.
    const rejected = Promise.reject(
      new Error(
        `SQLite worker initialization failed: ${error?.message || error?.type || "unknown error"}`
      )
    );
    rejected.catch(() => {});
    this.initPromise = rejected;
  }

  /**
   * Get the raw database interface (for compatibility)
   */
  getRaw() {
    return {
      execute: this.execute.bind(this),
      exec: this.exec.bind(this),
    };
  }

  /**
   * Persist database (handled automatically by OPFS)
   */
  persist(): void {
    // OPFS handles persistence automatically
  }

  private async runMigrations(): Promise<void> {
    if (!this.migrationRunner) {
      throw new Error("Migration runner not initialized");
    }

    try {
      await this.migrationRunner.initialize();

      const currentVersion = await this.migrationRunner.getCurrentVersion();
      const pending = await this.migrationRunner.getPendingMigrations();

      logger.info(`Database version: ${currentVersion}. Pending: ${pending.length}`);

      if (pending.length > 0) {
        logger.debug("Running pending migrations...");

        const results = await this.migrationRunner.runPending();

        const failed = results.find((r) => !r.success);
        if (failed) {
          throw new Error(`Migration ${failed.version} failed: ${failed.error}`);
        }

        logger.info(`✓ Successfully applied ${results.length} migration(s)`);
      } else {
        logger.debug("Database is up to date");
      }
    } catch (error) {
      logger.error("Failed to run migrations:", error);
      throw error;
    }
  }

  /**
   * Seed default data
   * NOTE: i think it might be better to just put it as a migration
   */
  private async seedDefaultData(): Promise<void> {
    // Fail loudly if seeding is unsuccessful
    const result = await this.execute("SELECT COUNT(*) as count FROM currencies");
    const count = result.results[0]?.count || 0;
    const currencies = CURRENCIES.map(({ code, name }) => ({
      code,
      name,
    }));

    if (count === 0) {
      for (const currency of currencies) {
        await this.execute("INSERT INTO currencies (code, name) VALUES (?, ?)", [currency.code, currency.name]);
      }
      console.log("Default currencies seeded");
    }
  }

  async close(): Promise<void> {
    if (this.workerAPI) {
      await this.workerAPI.close();
    }
    if (this.worker) {
      this.worker.onerror = null; // detach before terminate to prevent stale events poisoning next retry
      this.worker.terminate();
      this.worker = null;
    }
    this.workerAPI = null;
    this._db = null;
    this.migrationRunner = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.lastWorkerError = null;
  }


  async getMigrationInfo() {
    if (!this.migrationRunner) {
      throw new Error("Migration runner not initialized");
    }

    const currentVersion = await this.migrationRunner.getCurrentVersion();
    const appliedMigrations = await this.migrationRunner.getAppliedMigrations();
    const pendingMigrations = await this.migrationRunner.getPendingMigrations();
    const info = this.migrationRunner.getMigrationInfo();

    return {
      currentVersion,
      totalMigrations: info.total,
      appliedMigrations,
      pendingMigrations,
    };
  }

  async rollbackMigration(targetVersion: number) {
    if (!this.migrationRunner) {
      throw new Error("Migration runner not initialized");
    }

    return await this.migrationRunner.migrateToVersion(targetVersion);
  }

  async resetDatabase() {
    if (!this.migrationRunner) {
      throw new Error("Migration runner not initialized");
    }
    this.lastWorkerError = null; // On a reset, clear previous fatal error
    logger.warn("⚠️ Resetting database - all data will be lost!");
    await this.migrationRunner.reset();
    logger.info("✓ Database reset complete");
  }

  getMigrationRunner(): MigrationRunner {
    if (!this.migrationRunner) {
      throw new Error("Migration runner not initialized");
    }
    return this.migrationRunner;
  }
}

export const db = new DatabaseClient();
