import { expose } from "comlink";
import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite.mjs";
import * as SQLite from "wa-sqlite";
import { AccessHandlePoolVFS } from "wa-sqlite/src/examples/AccessHandlePoolVFS.js";

interface QueryResult {
  results: Record<string, any>[];
  columns: string[];
}

class SQLiteWorker {
  private sqlite3: any = null;
  private db: number | null = null;
  private vfs: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const module = await SQLiteESMFactory();
    this.sqlite3 = SQLite.Factory(module);

    this.vfs = await AccessHandlePoolVFS.create("nuts-db", module);
    console.debug("Using AccessHandlePoolVFS (OPFS)");

    this.sqlite3.vfs_register(this.vfs, true);
    this.db = await this.sqlite3.open_v2("nuts.db", this.sqlite3.SQLITE_OPEN_READWRITE | this.sqlite3.SQLITE_OPEN_CREATE, "nuts-db");

    this.initialized = true;
    console.log("SQLite worker initialized");
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    if (!this.initialized || !this.db) {
      throw new Error("SQLite worker not initialized");
    }

    const results: Record<string, any>[] = [];
    let columns: string[] = [];

    for await (const stmt of this.sqlite3.statements(this.db, sql)) {
      this.sqlite3.bind_collection(stmt, params);

      if (columns.length === 0) {
        columns = this.sqlite3.column_names(stmt);
      }

      while ((await this.sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
        const row = this.sqlite3.row(stmt);
        const rowObject: Record<string, any> = {};
        for (let i = 0; i < columns.length; i++) {
          rowObject[columns[i]] = row[i];
        }
        results.push(rowObject);
      }
    }

    return { results, columns };
  }

  async exec(sql: string): Promise<void> {
    if (!this.initialized || !this.db) {
      throw new Error("SQLite worker not initialized");
    }

    await this.sqlite3.exec(this.db, sql);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite3.close(this.db);
      this.db = null;
    }

    this.vfs = null;
    this.initialized = false;
  }
}

const worker = new SQLiteWorker();
expose(worker);
