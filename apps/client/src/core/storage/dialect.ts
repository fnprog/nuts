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
  executeQuery: (sql: string, params: unknown[]) => Promise<{ results: Record<string, unknown>[] }>;
  executeExec: (sql: string) => Promise<void>;
}

export class WaSqliteDialect implements Dialect {
  constructor(private config: WaSqliteDialectConfig) {}

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new WaSqliteDriver(this.config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createIntrospector(db: Kysely<Record<string, unknown>>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

class WaSqliteDriver implements Driver {
  private connection: WaSqliteConnection | null = null;
  private connectionInUse: boolean = false;
  constructor(private config: WaSqliteDialectConfig) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    if (this.connectionInUse) {
      throw new Error(
        "Multiple concurrent transactions are not supported with wa-sqlite in-browser storage. Only one connection/transaction can be active at a time."
      );
    }
    if (!this.connection) {
      this.connection = new WaSqliteConnection(this.config);
    }
    this.connectionInUse = true;
    return this.connection;
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

  async releaseConnection(): Promise<void> {
    this.connectionInUse = false;
    // We intentionally do NOT null the connection; stays alive for reuse
  }

  async destroy(): Promise<void> {
    this.connection = null;
    this.connectionInUse = false;
  }
}

class WaSqliteConnection implements DatabaseConnection {
  constructor(private config: WaSqliteDialectConfig) {}

  async executeQuery(compiledQuery: CompiledQuery): Promise<{ rows: Record<string, unknown>[] }> {
    const { sql, parameters } = compiledQuery;

    const result = await this.config.executeQuery(sql, parameters as unknown[]);

    return {
      rows: result.results || [],
    };
  }

  async streamQuery(): Promise<never> {
    throw new Error("Streaming is not supported by wa-sqlite dialect");
  }
}
