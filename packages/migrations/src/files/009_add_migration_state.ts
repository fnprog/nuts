import type { Migration } from "../types";

export const migration009: Migration = {
  version: 9,
  name: "add_migration_state_table",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS migration_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_id TEXT NOT NULL UNIQUE,
        anonymous_user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        stage TEXT NOT NULL,
        progress INTEGER NOT NULL,
        total_items INTEGER NOT NULL,
        migrated_categories INTEGER DEFAULT 0,
        migrated_accounts INTEGER DEFAULT 0,
        migrated_transactions INTEGER DEFAULT 0,
        failed_categories INTEGER DEFAULT 0,
        failed_accounts INTEGER DEFAULT 0,
        failed_transactions INTEGER DEFAULT 0,
        current_chunk INTEGER DEFAULT 0,
        total_chunks INTEGER DEFAULT 1,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await execute(`CREATE INDEX IF NOT EXISTS idx_migration_state_migration_id ON migration_state(migration_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_migration_state_anonymous_user_id ON migration_state(anonymous_user_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_migration_state_status ON migration_state(status)`);
  },

  async down(execute) {
    await execute(`DROP TABLE IF EXISTS migration_state`);
  },
};
