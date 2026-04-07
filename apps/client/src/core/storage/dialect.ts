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
} from "kysely";

export interface WaSqliteDialectConfig {
  executeQuery: (sql: string, params: any[]) => Promise<any>;
  executeExec: (sql: string) => Promise<void>;
}

export class WaSqliteDialect implements Dialect {
  constructor(private config: WaSqliteDialectConfig) { }

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new WaSqliteDriver(this.config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

class WaSqliteDriver implements Driver {
  constructor(private config: WaSqliteDialectConfig) { }

  async init(): Promise<void> { }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new WaSqliteConnection(this.config);
  }

  async beginTransaction(connection: DatabaseConnection, _settings: TransactionSettings): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("BEGIN"));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("COMMIT"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("ROLLBACK"));
  }

  async releaseConnection(): Promise<void> { }

  async destroy(): Promise<void> { }
}

class WaSqliteConnection implements DatabaseConnection {
  constructor(private config: WaSqliteDialectConfig) { }

  async executeQuery(compiledQuery: any): Promise<any> {
    const { sql, parameters } = compiledQuery;

    const result = await this.config.executeQuery(sql, parameters as any[]);

    return {
      rows: result.results || [],
    };
  }

  async *streamQuery(): AsyncIterableIterator<any> {
    throw new Error("Streaming is not supported by wa-sqlite dialect");
  }
}
