import {
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  Driver,
  Kysely,
  QueryCompiler,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  TransactionSettings,
  CompiledQuery,
} from 'kysely';
import * as SQLite from 'expo-sqlite';

export interface ExpoSqliteDialectConfig {
  database: SQLite.SQLiteDatabase;
}

export class ExpoSqliteDialect implements Dialect {
  constructor(private config: ExpoSqliteDialectConfig) {}

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new ExpoSqliteDriver(this.config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

class ExpoSqliteDriver implements Driver {
  constructor(private config: ExpoSqliteDialectConfig) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new ExpoSqliteConnection(this.config.database);
  }

  async beginTransaction(
    connection: DatabaseConnection,
    _settings: TransactionSettings
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('BEGIN'));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('COMMIT'));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('ROLLBACK'));
  }

  async releaseConnection(): Promise<void> {}

  async destroy(): Promise<void> {
    await this.config.database.closeAsync();
  }
}

class ExpoSqliteConnection implements DatabaseConnection {
  constructor(private database: SQLite.SQLiteDatabase) {}

  async executeQuery(compiledQuery: any): Promise<any> {
    const { sql, parameters } = compiledQuery;

    const result = await this.database.getAllAsync(sql, ...(parameters as any[]));

    return {
      rows: result || [],
    };
  }

  async *streamQuery(): AsyncIterableIterator<any> {
    throw new Error('Streaming is not supported by expo-sqlite dialect');
  }
}
