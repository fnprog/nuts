import type { ExecuteFunction, MigrationResult } from "./types";
import type { MigrationRunner } from "./runner";

export interface PluginMigration {
  version: number;
  pluginId: string;
  name: string;
  up: (execute: ExecuteFunction) => Promise<void>;
  down: (execute: ExecuteFunction) => Promise<void>;
}

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  migrations?: PluginMigration[];
  onInstall?: (context: PluginContext) => Promise<void>;
  onUninstall?: (context: PluginContext) => Promise<void>;
  onEnable?: (context: PluginContext) => Promise<void>;
  onDisable?: (context: PluginContext) => Promise<void>;
}

export interface PluginContext {
  pluginId: string;
  crdtService: any;
  execute: ExecuteFunction;
}

export class PluginMigrationRunner {
  constructor(
    private crdtService: any,
    private baseRunner: MigrationRunner
  ) {}

  private get execute(): ExecuteFunction {
    return (this.baseRunner as any).execute.bind(this.baseRunner);
  }

  async installPlugin(config: PluginConfig): Promise<void> {
    const pluginId = config.id;
    const appliedMigrations: PluginMigration[] = [];

    try {
      await this.crdtService.createPlugin({
        id: pluginId,
        name: config.name,
        version: config.version,
        status: "installing",
        installed_at: new Date().toISOString(),
      });

      if (config.migrations && config.migrations.length > 0) {
        for (const migration of config.migrations) {
          await this.runPluginMigration(pluginId, migration);
          appliedMigrations.push(migration);
        }
      }

      await this.crdtService.initializePluginData(pluginId);

      if (config.onInstall) {
        await config.onInstall({
          pluginId,
          crdtService: this.crdtService,
          execute: this.execute,
        });
      }

      await this.crdtService.updatePlugin(pluginId, {
        status: "enabled",
      });
    } catch (error) {
      console.error(`❌ Plugin installation failed, rolling back...`);
      
      if (appliedMigrations.length > 0) {
        const migrations = [...appliedMigrations].reverse();
        for (const migration of migrations) {
          try {
            await this.rollbackPluginMigration(pluginId, migration);
          } catch (rollbackError) {
            console.error(`Failed to rollback migration ${migration.name}:`, rollbackError);
          }
        }
      }

      try {
        await this.crdtService.deletePluginData(pluginId);
      } catch (cleanupError) {
        console.error(`Failed to cleanup plugin data:`, cleanupError);
      }

      try {
        await this.crdtService.deletePlugin(pluginId);
      } catch (cleanupError) {
        console.error(`Failed to delete plugin record:`, cleanupError);
      }

      throw error;
    }
  }

  async uninstallPlugin(pluginId: string, config: PluginConfig): Promise<void> {
    const plugin = this.crdtService.getPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    await this.crdtService.updatePlugin(pluginId, {
      status: "uninstalling",
    });

    if (config.onUninstall) {
      await config.onUninstall({
        pluginId,
        crdtService: this.crdtService,
        execute: this.execute,
      });
    }

    if (config.migrations && config.migrations.length > 0) {
      const migrations = [...config.migrations].reverse();
      for (const migration of migrations) {
        await this.rollbackPluginMigration(pluginId, migration);
      }
    }

    await this.crdtService.deletePluginData(pluginId);
    await this.crdtService.deletePlugin(pluginId);
  }

  async enablePlugin(pluginId: string, config: PluginConfig): Promise<void> {
    if (config.onEnable) {
      await config.onEnable({
        pluginId,
        crdtService: this.crdtService,
        execute: this.execute,
      });
    }

    await this.crdtService.updatePlugin(pluginId, {
      status: "enabled",
    });
  }

  async disablePlugin(pluginId: string, config: PluginConfig): Promise<void> {
    if (config.onDisable) {
      await config.onDisable({
        pluginId,
        crdtService: this.crdtService,
        execute: this.execute,
      });
    }

    await this.crdtService.updatePlugin(pluginId, {
      status: "disabled",
    });
  }

  private async runPluginMigration(pluginId: string, migration: PluginMigration): Promise<MigrationResult> {
    const executeWrapper: ExecuteFunction = async (sql: string, params?: unknown[]) => {
      await this.execute(sql, params);
    };

    try {
      console.log(`Running plugin migration ${pluginId}:${migration.version}: ${migration.name}`);

      await this.execute("BEGIN TRANSACTION");

      await migration.up(executeWrapper);

      await this.execute(
        "INSERT INTO _plugin_migrations (plugin_id, version, name, applied_at) VALUES (?, ?, ?, ?)",
        [pluginId, migration.version, migration.name, Date.now()]
      );

      await this.execute("COMMIT");

      console.log(`✓ Plugin migration ${pluginId}:${migration.version} completed successfully`);

      return {
        success: true,
        version: migration.version,
        name: migration.name,
      };
    } catch (error) {
      await this.execute("ROLLBACK");

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Plugin migration ${pluginId}:${migration.version} failed:`, errorMessage);

      throw new Error(`Plugin migration failed: ${errorMessage}`);
    }
  }

  private async rollbackPluginMigration(pluginId: string, migration: PluginMigration): Promise<MigrationResult> {
    const executeWrapper: ExecuteFunction = async (sql: string, params?: unknown[]) => {
      await this.execute(sql, params);
    };

    try {
      console.log(`Rolling back plugin migration ${pluginId}:${migration.version}: ${migration.name}`);

      await this.execute("BEGIN TRANSACTION");

      await migration.down(executeWrapper);

      await this.execute(
        "DELETE FROM _plugin_migrations WHERE plugin_id = ? AND version = ?",
        [pluginId, migration.version]
      );

      await this.execute("COMMIT");

      console.log(`✓ Plugin migration rollback ${pluginId}:${migration.version} completed successfully`);

      return {
        success: true,
        version: migration.version,
        name: migration.name,
      };
    } catch (error) {
      await this.execute("ROLLBACK");

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Plugin migration rollback ${pluginId}:${migration.version} failed:`, errorMessage);

      throw new Error(`Plugin migration rollback failed: ${errorMessage}`);
    }
  }

  async initializePluginMigrationTable(): Promise<void> {
    const createPluginMigrationsTable = `
      CREATE TABLE IF NOT EXISTS _plugin_migrations (
        plugin_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL,
        PRIMARY KEY (plugin_id, version)
      );
      CREATE INDEX IF NOT EXISTS idx_plugin_migrations_plugin_id 
        ON _plugin_migrations(plugin_id);
      CREATE INDEX IF NOT EXISTS idx_plugin_migrations_applied_at 
        ON _plugin_migrations(applied_at);
    `;

    await this.execute(createPluginMigrationsTable);
  }
}
