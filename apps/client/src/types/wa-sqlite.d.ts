declare module "wa-sqlite/dist/wa-sqlite.mjs" {
  const SQLiteESMFactory: () => Promise<WaSqliteModule>;
  export default SQLiteESMFactory;
}

declare module "wa-sqlite" {
  export interface WaSqliteModule {
    [key: string]: unknown;
  }
  export interface WaSqliteAPI {
    vfs_register(vfs: WaSqliteVFS, makeDefault: boolean): void;
    open_v2(filename: string, flags: number, vfsName: string): Promise<number>;
    statements(db: number, sql: string): AsyncIterable<unknown>;
    bind_collection(stmt: unknown, params: unknown[]): void;
    column_names(stmt: unknown): string[];
    step(stmt: unknown): Promise<number>;
    row(stmt: unknown): unknown[];
    exec(db: number, sql: string): Promise<void>;
    close(db: number): Promise<void>;
    SQLITE_OPEN_READWRITE: number;
    SQLITE_OPEN_CREATE: number;
  }
  export interface WaSqliteVFS {
    [key: string]: unknown;
  }
  export function Factory(module: WaSqliteModule): WaSqliteAPI;
  export const SQLITE_ROW: number;
  export const SQLITE_DONE: number;
  export const SQLITE_OK: number;
}

declare module "wa-sqlite/src/examples/AccessHandlePoolVFS.js" {
  import type { WaSqliteModule, WaSqliteVFS } from "wa-sqlite";
  export class AccessHandlePoolVFS {
    static create(name: string, module: WaSqliteModule): Promise<WaSqliteVFS>;
  }
}
