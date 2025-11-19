import type { Migration } from "../types";

export const migration011: Migration = {
  version: 11,
  name: "add_folders_table",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        path TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
      )
    `);

    await execute(`CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path)`);
    await execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_path ON folders(user_id, path)`);

    await execute(`CREATE INDEX IF NOT EXISTS idx_file_metadata_folder_id ON file_metadata(folder_id)`);
  },

  async down(execute) {
    await execute(`DROP INDEX IF EXISTS idx_file_metadata_folder_id`);
    await execute(`DROP INDEX IF EXISTS idx_folders_user_path`);
    await execute(`DROP INDEX IF EXISTS idx_folders_path`);
    await execute(`DROP INDEX IF EXISTS idx_folders_parent_id`);
    await execute(`DROP INDEX IF EXISTS idx_folders_user_id`);
    await execute(`DROP TABLE IF EXISTS folders`);
  },
};
