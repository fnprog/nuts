import type { Migration } from "../types";

export const migration010: Migration = {
  version: 10,
  name: "add_file_metadata_table",

  async up(execute) {
    await execute(`
      CREATE TABLE IF NOT EXISTS file_metadata (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced', 'error')),
        checksum TEXT NOT NULL,
        thumbnail_path TEXT,
        related_entity_type TEXT CHECK (related_entity_type IN ('transaction', 'account', 'receipt', 'budget', 'document')),
        related_entity_id TEXT,
        sync_error TEXT,
        user_id TEXT NOT NULL,
        folder_id TEXT
      )
    `);

    await execute(`CREATE INDEX IF NOT EXISTS idx_file_metadata_user_id ON file_metadata(user_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_file_metadata_sync_status ON file_metadata(sync_status)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_file_metadata_related_entity ON file_metadata(related_entity_type, related_entity_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at)`);
  },

  async down(execute) {
    await execute(`DROP INDEX IF EXISTS idx_file_metadata_created_at`);
    await execute(`DROP INDEX IF EXISTS idx_file_metadata_related_entity`);
    await execute(`DROP INDEX IF EXISTS idx_file_metadata_sync_status`);
    await execute(`DROP INDEX IF EXISTS idx_file_metadata_user_id`);
    await execute(`DROP TABLE IF EXISTS file_metadata`);
  },
};
