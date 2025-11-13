-- name: CreateMigrationRecord :one
INSERT INTO data_migrations (
    migration_id,
    user_id,
    anonymous_user_id,
    status,
    chunk_index,
    total_chunks
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetMigrationRecord :one
SELECT * FROM data_migrations
WHERE migration_id = $1 AND chunk_index = $2;

-- name: GetMigrationsByID :many
SELECT * FROM data_migrations
WHERE migration_id = $1
ORDER BY chunk_index;

-- name: UpdateMigrationSuccess :one
UPDATE data_migrations
SET 
    status = 'completed',
    categories_migrated = $2,
    accounts_migrated = $3,
    transactions_migrated = $4,
    completed_at = NOW()
WHERE migration_id = $1 AND chunk_index = $5
RETURNING *;

-- name: UpdateMigrationFailure :one
UPDATE data_migrations
SET 
    status = 'failed',
    error_message = $2,
    completed_at = NOW()
WHERE migration_id = $1 AND chunk_index = $3
RETURNING *;

-- name: UpdateMigrationPartial :one
UPDATE data_migrations
SET 
    status = 'partial',
    categories_migrated = $2,
    accounts_migrated = $3,
    transactions_migrated = $4,
    categories_failed = $5,
    accounts_failed = $6,
    transactions_failed = $7,
    error_message = $8,
    completed_at = NOW()
WHERE migration_id = $1 AND chunk_index = $9
RETURNING *;

-- name: GetUserMigrations :many
SELECT * FROM data_migrations
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: GetCompletedMigrationsByAnonymousUser :one
SELECT * FROM data_migrations
WHERE anonymous_user_id = $1 
AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
