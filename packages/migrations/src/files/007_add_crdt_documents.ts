import type { Migration } from "../types";

export const migration007: Migration = {
  version: 7,
  name: "add_crdt_documents_table",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS crdt_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        document_binary BLOB NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await execute(`CREATE INDEX IF NOT EXISTS idx_crdt_documents_user_id ON crdt_documents(user_id)`);
  },

  async down(execute) {
    await execute(`DROP TABLE IF EXISTS crdt_documents`);
  },
};
