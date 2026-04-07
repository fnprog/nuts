import type { Migration } from "../types";

export const migration003: Migration = {
  version: 3,
  name: "sync_schema_alignment",

  async up(execute) {
    await execute(`
      ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense'));
    `);

    await execute(`
      ALTER TABLE transactions ADD COLUMN is_categorized INTEGER NOT NULL DEFAULT 0;
    `);

    await execute(`
      ALTER TABLE transactions ADD COLUMN transaction_currency TEXT;
    `);

    await execute(`
      ALTER TABLE transactions ADD COLUMN original_amount REAL;
    `);

    await execute(`
      ALTER TABLE transactions ADD COLUMN shared_finance_id TEXT;
    `);

    await execute(`
      UPDATE transactions 
      SET 
        transaction_currency = (SELECT currency FROM accounts WHERE accounts.id = transactions.account_id),
        original_amount = amount,
        is_categorized = CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END
      WHERE transaction_currency IS NULL;
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        amount REAL NOT NULL,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        frequency TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE (user_id, category_id, start_date)
      );
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_transactions_shared_finance ON transactions(shared_finance_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(transaction_currency);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
    `);
  },

  async down(execute) {
    await execute("DROP INDEX IF EXISTS idx_categories_type");
    await execute("DROP INDEX IF EXISTS idx_transactions_currency");
    await execute("DROP INDEX IF EXISTS idx_transactions_shared_finance");
    await execute("DROP INDEX IF EXISTS idx_budgets_dates");
    await execute("DROP INDEX IF EXISTS idx_budgets_category_id");
    await execute("DROP INDEX IF EXISTS idx_budgets_user_id");

    await execute("DROP TABLE IF EXISTS budgets");

    await execute("ALTER TABLE transactions DROP COLUMN shared_finance_id");
    await execute("ALTER TABLE transactions DROP COLUMN original_amount");
    await execute("ALTER TABLE transactions DROP COLUMN transaction_currency");
    await execute("ALTER TABLE transactions DROP COLUMN is_categorized");

    await execute("ALTER TABLE categories DROP COLUMN type");
  },
};
