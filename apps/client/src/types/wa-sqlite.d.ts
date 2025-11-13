declare module "wa-sqlite/dist/wa-sqlite.mjs" {
  const SQLiteESMFactory: () => Promise<any>;
  export default SQLiteESMFactory;
}

declare module "wa-sqlite" {
  export function Factory(module: any): any;
  export const SQLITE_ROW: number;
  export const SQLITE_DONE: number;
  export const SQLITE_OK: number;
}

declare module "wa-sqlite/src/examples/AccessHandlePoolVFS.js" {
  export class AccessHandlePoolVFS {
    static create(name: string, module: any): Promise<any>;
  }
}
