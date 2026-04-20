import type { Migration } from "../types";

export const migration012: Migration = {
  version: 12,
  name: "add_sync_queue_table",
  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
        type TEXT NOT NULL CHECK (type IN ('transaction', 'account', 'category', 'rule')),
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    await execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type)`);
  },
  async down(execute) {
    await execute(`DROP INDEX IF EXISTS idx_sync_queue_type`);
    await execute(`DROP INDEX IF EXISTS idx_sync_queue_timestamp`);
    await execute(`DROP TABLE IF EXISTS sync_queue`);
  },
};
