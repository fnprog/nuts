import * as SQLite from 'expo-sqlite';
import { Kysely } from 'kysely';
import { ExpoSqliteDialect } from './kysely-dialect';
import type { Database } from '@nuts/types/storage';
import { MigrationRunner, allMigrations } from '@nuts/migrations';
import { defaultCurrencies } from './constants/default-currencies';

export class LocalDatabaseClient {
  private static instance: LocalDatabaseClient;
  private db: SQLite.SQLiteDatabase;
  private kysely: Kysely<Database>;

  private constructor(dbName: string = 'nuts.db') {
    this.db = SQLite.openDatabaseSync(dbName);
    this.kysely = new Kysely<Database>({
      dialect: new ExpoSqliteDialect({ database: this.db }),
    });
  }

  static getInstance(dbName?: string): LocalDatabaseClient {
    if (!LocalDatabaseClient.instance) {
      LocalDatabaseClient.instance = new LocalDatabaseClient(dbName);
    }
    return LocalDatabaseClient.instance;
  }

  getKysely(): Kysely<Database> {
    return this.kysely;
  }

  getDatabase(): SQLite.SQLiteDatabase {
    return this.db;
  }

  async initialize(): Promise<void> {
    const executeFunction = async (sql: string, params?: unknown[]) => {
      const sqliteParams = (params || []) as (string | number | null | boolean | Uint8Array)[];
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await this.db.getAllAsync(sql, sqliteParams);
        return { results: rows, columns: [] };
      } else {
        await this.db.runAsync(sql, sqliteParams);
        return { results: [], columns: [] };
      }
    };

    const runner = new MigrationRunner(executeFunction);
    await runner.initialize();
    runner.registerMigrations(allMigrations);
    await runner.runPending();
    await this.seedDefaultCurrencies();
  }

  private async seedDefaultCurrencies(): Promise<void> {
    const existingCount = await this.kysely
      .selectFrom('currencies')
      .select(({ fn }) => fn.count<number>('code').as('count'))
      .executeTakeFirst();

    if (!existingCount || existingCount.count === 0) {
      await this.kysely.insertInto('currencies').values(defaultCurrencies).execute();
    }
  }

  async close(): Promise<void> {
    await this.kysely.destroy();
  }

  async clearAllData(): Promise<void> {
    await this.db.execAsync(`
      DELETE FROM rules;
      DELETE FROM budgets;
      DELETE FROM tags;
      DELETE FROM transactions;
      DELETE FROM preferences;
      DELETE FROM categories;
      DELETE FROM accounts;
      DELETE FROM users;
    `);
  }
}
