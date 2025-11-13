import type { Migration } from "../types";

export const migration004: Migration = {
  version: 4,
  name: "add_rules_table",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        priority INTEGER NOT NULL DEFAULT 0,
        conditions TEXT NOT NULL,
        actions TEXT NOT NULL,
        created_by TEXT NOT NULL,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        CHECK (is_active IN (0, 1))
      );
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_rules_is_active ON rules(is_active);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_rules_priority ON rules(priority);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_rules_created_by ON rules(created_by);
    `);
  },

  async down(execute) {
    await execute("DROP INDEX IF EXISTS idx_rules_created_by");
    await execute("DROP INDEX IF EXISTS idx_rules_priority");
    await execute("DROP INDEX IF EXISTS idx_rules_is_active");
    await execute("DROP TABLE IF EXISTS rules");
  },
};
