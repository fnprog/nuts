import type { Migration } from "../types";

export const migration001: Migration = {
  version: 1,
  name: "initial_schema",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        password TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS currencies (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'blue',
        meta TEXT,
        is_external INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        provider_account_id TEXT,
        provider_name TEXT,
        sync_status TEXT,
        last_synced_at INTEGER,
        connection_id TEXT,
        created_by TEXT,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (currency) REFERENCES currencies(code),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        color TEXT,
        icon TEXT NOT NULL DEFAULT 'Box',
        created_by TEXT NOT NULL,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        destination_account_id TEXT,
        transaction_datetime INTEGER NOT NULL,
        description TEXT,
        details TEXT,
        is_external INTEGER NOT NULL DEFAULT 0,
        provider_transaction_id TEXT,
        created_by TEXT,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        locale TEXT NOT NULL DEFAULT 'en',
        theme TEXT NOT NULL DEFAULT 'light',
        currency TEXT NOT NULL DEFAULT 'USD',
        timezone TEXT NOT NULL DEFAULT 'UTC',
        time_format TEXT NOT NULL DEFAULT '24h',
        date_format TEXT NOT NULL DEFAULT 'dd/mm/yyyy',
        start_week_on_monday INTEGER NOT NULL DEFAULT 1,
        dark_sidebar INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (currency) REFERENCES currencies(code)
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'blue',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON accounts(created_by);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_transactions_datetime ON transactions(transaction_datetime);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
    `);

    await execute(`
      CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    `);
  },

  async down(execute) {
    await execute("DROP INDEX IF EXISTS idx_tags_user_id");
    await execute("DROP INDEX IF EXISTS idx_preferences_user_id");
    await execute("DROP INDEX IF EXISTS idx_transactions_datetime");
    await execute("DROP INDEX IF EXISTS idx_transactions_category_id");
    await execute("DROP INDEX IF EXISTS idx_transactions_account_id");
    await execute("DROP INDEX IF EXISTS idx_categories_created_by");
    await execute("DROP INDEX IF EXISTS idx_categories_parent_id");
    await execute("DROP INDEX IF EXISTS idx_accounts_created_by");
    await execute("DROP INDEX IF EXISTS idx_accounts_currency");

    await execute("DROP TABLE IF EXISTS tags");
    await execute("DROP TABLE IF EXISTS preferences");
    await execute("DROP TABLE IF EXISTS transactions");
    await execute("DROP TABLE IF EXISTS categories");
    await execute("DROP TABLE IF EXISTS accounts");
    await execute("DROP TABLE IF EXISTS currencies");
    await execute("DROP TABLE IF EXISTS users");
  },
};
