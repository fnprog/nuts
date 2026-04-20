import type { Migration } from "../types";

export const migration013: Migration = {
  version: 13,
  name: "add_sync_conflicts_table",
  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('transaction', 'account', 'category', 'rule')),
        local_version TEXT NOT NULL,
        server_version TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        PRIMARY KEY (id, type)
      )
    `);
    await execute(`CREATE INDEX IF NOT EXISTS idx_sync_conflicts_type ON sync_conflicts(type)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_sync_conflicts_timestamp ON sync_conflicts(timestamp)`);
  },
  async down(execute) {
    await execute(`DROP INDEX IF EXISTS idx_sync_conflicts_timestamp`);
    await execute(`DROP INDEX IF EXISTS idx_sync_conflicts_type`);
    await execute(`DROP TABLE IF EXISTS sync_conflicts`);
  },
};
