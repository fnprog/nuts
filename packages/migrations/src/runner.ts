import type { Migration, MigrationRecord, MigrationResult, ExecuteFunction } from "./types";

export class MigrationRunner {
  private migrations: Migration[] = [];
  private execute: (sql: string, params?: unknown[]) => Promise<{ results: unknown[]; columns: string[] }>;

  constructor(execute: (sql: string, params?: unknown[]) => Promise<{ results: unknown[]; columns: string[] }>) {
    this.execute = execute;
  }

  registerMigrations(migrations: Migration[]): void {
    this.migrations = migrations.sort((a, b) => a.version - b.version);
  }

  async initialize(): Promise<void> {
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON _migrations(applied_at);
    `;

    await this.execute(createMigrationsTable);
  }

  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.execute("SELECT version FROM _migrations ORDER BY version DESC LIMIT 1");

      if (result.results.length === 0) {
        return 0;
      }

      return (result.results[0] as MigrationRecord).version;
    } catch (error) {
      console.error("Failed to get current version:", error);
      return 0;
    }
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      const result = await this.execute("SELECT version, name, applied_at FROM _migrations ORDER BY version ASC");
      return result.results as MigrationRecord[];
    } catch (error) {
      console.error("Failed to get applied migrations:", error);
      return [];
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const currentVersion = await this.getCurrentVersion();
    return this.migrations.filter((m) => m.version > currentVersion);
  }

  async runPending(): Promise<MigrationResult[]> {
    const pending = await this.getPendingMigrations();
    const results: MigrationResult[] = [];

    for (const migration of pending) {
      const result = await this.runMigration(migration);
      results.push(result);

      if (!result.success) {
        console.error(`Migration ${migration.version} failed, stopping...`);
        break;
      }
    }

    return results;
  }

  async migrateToVersion(targetVersion: number): Promise<MigrationResult[]> {
    const currentVersion = await this.getCurrentVersion();
    const results: MigrationResult[] = [];

    if (targetVersion === currentVersion) {
      return results;
    }

    if (targetVersion > currentVersion) {
      const migrationsToRun = this.migrations.filter((m) => m.version > currentVersion && m.version <= targetVersion);

      for (const migration of migrationsToRun) {
        const result = await this.runMigration(migration);
        results.push(result);

        if (!result.success) break;
      }
    } else {
      const migrationsToRollback = this.migrations.filter((m) => m.version > targetVersion && m.version <= currentVersion).reverse();

      for (const migration of migrationsToRollback) {
        const result = await this.rollbackMigration(migration);
        results.push(result);

        if (!result.success) break;
      }
    }

    return results;
  }

  private async runMigration(migration: Migration): Promise<MigrationResult> {
    const executeWrapper: ExecuteFunction = async (sql: string, params?: unknown[]) => {
      await this.execute(sql, params);
    };

    try {
      console.log(`Running migration ${migration.version}: ${migration.name}`);

      await this.execute("BEGIN TRANSACTION");

      await migration.up(executeWrapper);

      await this.execute("INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)", [migration.version, migration.name, Date.now()]);

      await this.execute("COMMIT");

      console.log(`✓ Migration ${migration.version} completed successfully`);

      return {
        success: true,
        version: migration.version,
        name: migration.name,
      };
    } catch (error) {
      await this.execute("ROLLBACK");

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Migration ${migration.version} failed:`, errorMessage);

      return {
        success: false,
        version: migration.version,
        name: migration.name,
        error: errorMessage,
      };
    }
  }

  private async rollbackMigration(migration: Migration): Promise<MigrationResult> {
    const executeWrapper: ExecuteFunction = async (sql: string, params?: unknown[]) => {
      await this.execute(sql, params);
    };

    try {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

      await this.execute("BEGIN TRANSACTION");

      await migration.down(executeWrapper);

      await this.execute("DELETE FROM _migrations WHERE version = ?", [migration.version]);

      await this.execute("COMMIT");

      console.log(`✓ Rollback ${migration.version} completed successfully`);

      return {
        success: true,
        version: migration.version,
        name: migration.name,
      };
    } catch (error) {
      await this.execute("ROLLBACK");

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Rollback ${migration.version} failed:`, errorMessage);

      return {
        success: false,
        version: migration.version,
        name: migration.name,
        error: errorMessage,
      };
    }
  }

  async reset(): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const migrationsToRollback = applied.reverse();

    for (const record of migrationsToRollback) {
      const migration = this.migrations.find((m) => m.version === record.version);
      if (migration) {
        await this.rollbackMigration(migration);
      }
    }
  }

  getMigrationInfo(): { total: number; registered: Migration[] } {
    return {
      total: this.migrations.length,
      registered: this.migrations,
    };
  }
}
