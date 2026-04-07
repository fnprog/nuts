import type { Migration } from "../types";

export const migration008: Migration = {
  version: 8,
  name: "add_crdt_backups_table",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS crdt_backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        backup_id TEXT NOT NULL UNIQUE,
        document_binary BLOB NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    await execute(`CREATE INDEX IF NOT EXISTS idx_crdt_backups_backup_id ON crdt_backups(backup_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_crdt_backups_created_at ON crdt_backups(created_at)`);
  },

  async down(execute) {
    await execute(`DROP TABLE IF EXISTS crdt_backups`);
  },
};
