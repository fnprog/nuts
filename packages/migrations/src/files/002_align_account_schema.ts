import type { Migration } from "../types";

export const migration002: Migration = {
  version: 2,
  name: "align_account_schema",

  async up(execute) {
    await execute(`
      ALTER TABLE accounts ADD COLUMN subtype TEXT;
    `);

    await execute(`
      ALTER TABLE accounts ADD COLUMN shared_finance_id TEXT;
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_accounts_subtype ON accounts(subtype);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_accounts_shared_finance ON accounts(shared_finance_id);
    `);
  },

  async down(execute) {
    await execute("DROP INDEX IF EXISTS idx_accounts_shared_finance");
    await execute("DROP INDEX IF EXISTS idx_accounts_subtype");
    await execute("ALTER TABLE accounts DROP COLUMN shared_finance_id");
    await execute("ALTER TABLE accounts DROP COLUMN subtype");
  },
};
