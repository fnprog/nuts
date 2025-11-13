-- +goose Up
CREATE TABLE IF NOT EXISTS data_migrations (
    migration_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anonymous_user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
    chunk_index INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 1,
    categories_migrated INTEGER DEFAULT 0,
    accounts_migrated INTEGER DEFAULT 0,
    transactions_migrated INTEGER DEFAULT 0,
    categories_failed INTEGER DEFAULT 0,
    accounts_failed INTEGER DEFAULT 0,
    transactions_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(migration_id, chunk_index)
);

CREATE INDEX idx_data_migrations_user_id ON data_migrations(user_id);
CREATE INDEX idx_data_migrations_anonymous_user_id ON data_migrations(anonymous_user_id);
CREATE INDEX idx_data_migrations_status ON data_migrations(status);
CREATE INDEX idx_data_migrations_created_at ON data_migrations(created_at);

-- +goose Down
DROP TABLE IF EXISTS data_migrations;
