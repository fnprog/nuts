package repository

import (
	"context"

	"github.com/google/uuid"
)

const createMigrationRecord = `-- name: CreateMigrationRecord :one
INSERT INTO data_migrations (
    migration_id,
    user_id,
    anonymous_user_id,
    status,
    chunk_index,
    total_chunks
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at
`

type CreateMigrationRecordParams struct {
	MigrationID     uuid.UUID `json:"migration_id"`
	UserID          uuid.UUID `json:"user_id"`
	AnonymousUserID string    `json:"anonymous_user_id"`
	Status          string    `json:"status"`
	ChunkIndex      int32     `json:"chunk_index"`
	TotalChunks     int32     `json:"total_chunks"`
}

func (q *Queries) CreateMigrationRecord(ctx context.Context, arg CreateMigrationRecordParams) (DataMigration, error) {
	row := q.db.QueryRow(ctx, createMigrationRecord,
		arg.MigrationID,
		arg.UserID,
		arg.AnonymousUserID,
		arg.Status,
		arg.ChunkIndex,
		arg.TotalChunks,
	)
	var i DataMigration
	err := row.Scan(
		&i.MigrationID,
		&i.UserID,
		&i.AnonymousUserID,
		&i.Status,
		&i.ChunkIndex,
		&i.TotalChunks,
		&i.CategoriesMigrated,
		&i.AccountsMigrated,
		&i.TransactionsMigrated,
		&i.CategoriesFailed,
		&i.AccountsFailed,
		&i.TransactionsFailed,
		&i.ErrorMessage,
		&i.CreatedAt,
		&i.CompletedAt,
	)
	return i, err
}

const getMigrationRecord = `-- name: GetMigrationRecord :one
SELECT migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at FROM data_migrations
WHERE migration_id = $1 AND chunk_index = $2
`

type GetMigrationRecordParams struct {
	MigrationID uuid.UUID `json:"migration_id"`
	ChunkIndex  int32     `json:"chunk_index"`
}

func (q *Queries) GetMigrationRecord(ctx context.Context, arg GetMigrationRecordParams) (DataMigration, error) {
	row := q.db.QueryRow(ctx, getMigrationRecord, arg.MigrationID, arg.ChunkIndex)
	var i DataMigration
	err := row.Scan(
		&i.MigrationID,
		&i.UserID,
		&i.AnonymousUserID,
		&i.Status,
		&i.ChunkIndex,
		&i.TotalChunks,
		&i.CategoriesMigrated,
		&i.AccountsMigrated,
		&i.TransactionsMigrated,
		&i.CategoriesFailed,
		&i.AccountsFailed,
		&i.TransactionsFailed,
		&i.ErrorMessage,
		&i.CreatedAt,
		&i.CompletedAt,
	)
	return i, err
}

const getMigrationsByID = `-- name: GetMigrationsByID :many
SELECT migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at FROM data_migrations
WHERE migration_id = $1
ORDER BY chunk_index
`

func (q *Queries) GetMigrationsByID(ctx context.Context, migrationID uuid.UUID) ([]DataMigration, error) {
	rows, err := q.db.Query(ctx, getMigrationsByID, migrationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []DataMigration
	for rows.Next() {
		var i DataMigration
		if err := rows.Scan(
			&i.MigrationID,
			&i.UserID,
			&i.AnonymousUserID,
			&i.Status,
			&i.ChunkIndex,
			&i.TotalChunks,
			&i.CategoriesMigrated,
			&i.AccountsMigrated,
			&i.TransactionsMigrated,
			&i.CategoriesFailed,
			&i.AccountsFailed,
			&i.TransactionsFailed,
			&i.ErrorMessage,
			&i.CreatedAt,
			&i.CompletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateMigrationSuccess = `-- name: UpdateMigrationSuccess :one
UPDATE data_migrations
SET 
    status = 'completed',
    categories_migrated = $2,
    accounts_migrated = $3,
    transactions_migrated = $4,
    completed_at = NOW()
WHERE migration_id = $1 AND chunk_index = $5
RETURNING migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at
`

type UpdateMigrationSuccessParams struct {
	MigrationID          uuid.UUID `json:"migration_id"`
	CategoriesMigrated   int32     `json:"categories_migrated"`
	AccountsMigrated     int32     `json:"accounts_migrated"`
	TransactionsMigrated int32     `json:"transactions_migrated"`
	ChunkIndex           int32     `json:"chunk_index"`
}

func (q *Queries) UpdateMigrationSuccess(ctx context.Context, arg UpdateMigrationSuccessParams) (DataMigration, error) {
	row := q.db.QueryRow(ctx, updateMigrationSuccess,
		arg.MigrationID,
		arg.CategoriesMigrated,
		arg.AccountsMigrated,
		arg.TransactionsMigrated,
		arg.ChunkIndex,
	)
	var i DataMigration
	err := row.Scan(
		&i.MigrationID,
		&i.UserID,
		&i.AnonymousUserID,
		&i.Status,
		&i.ChunkIndex,
		&i.TotalChunks,
		&i.CategoriesMigrated,
		&i.AccountsMigrated,
		&i.TransactionsMigrated,
		&i.CategoriesFailed,
		&i.AccountsFailed,
		&i.TransactionsFailed,
		&i.ErrorMessage,
		&i.CreatedAt,
		&i.CompletedAt,
	)
	return i, err
}

const updateMigrationFailure = `-- name: UpdateMigrationFailure :one
UPDATE data_migrations
SET 
    status = 'failed',
    error_message = $2,
    completed_at = NOW()
WHERE migration_id = $1 AND chunk_index = $3
RETURNING migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at
`

type UpdateMigrationFailureParams struct {
	MigrationID  uuid.UUID `json:"migration_id"`
	ErrorMessage *string   `json:"error_message"`
	ChunkIndex   int32     `json:"chunk_index"`
}

func (q *Queries) UpdateMigrationFailure(ctx context.Context, arg UpdateMigrationFailureParams) (DataMigration, error) {
	row := q.db.QueryRow(ctx, updateMigrationFailure, arg.MigrationID, arg.ErrorMessage, arg.ChunkIndex)
	var i DataMigration
	err := row.Scan(
		&i.MigrationID,
		&i.UserID,
		&i.AnonymousUserID,
		&i.Status,
		&i.ChunkIndex,
		&i.TotalChunks,
		&i.CategoriesMigrated,
		&i.AccountsMigrated,
		&i.TransactionsMigrated,
		&i.CategoriesFailed,
		&i.AccountsFailed,
		&i.TransactionsFailed,
		&i.ErrorMessage,
		&i.CreatedAt,
		&i.CompletedAt,
	)
	return i, err
}

const updateMigrationPartial = `-- name: UpdateMigrationPartial :one
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
RETURNING migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at
`

type UpdateMigrationPartialParams struct {
	MigrationID          uuid.UUID `json:"migration_id"`
	CategoriesMigrated   int32     `json:"categories_migrated"`
	AccountsMigrated     int32     `json:"accounts_migrated"`
	TransactionsMigrated int32     `json:"transactions_migrated"`
	CategoriesFailed     int32     `json:"categories_failed"`
	AccountsFailed       int32     `json:"accounts_failed"`
	TransactionsFailed   int32     `json:"transactions_failed"`
	ErrorMessage         *string   `json:"error_message"`
	ChunkIndex           int32     `json:"chunk_index"`
}

func (q *Queries) UpdateMigrationPartial(ctx context.Context, arg UpdateMigrationPartialParams) (DataMigration, error) {
	row := q.db.QueryRow(ctx, updateMigrationPartial,
		arg.MigrationID,
		arg.CategoriesMigrated,
		arg.AccountsMigrated,
		arg.TransactionsMigrated,
		arg.CategoriesFailed,
		arg.AccountsFailed,
		arg.TransactionsFailed,
		arg.ErrorMessage,
		arg.ChunkIndex,
	)
	var i DataMigration
	err := row.Scan(
		&i.MigrationID,
		&i.UserID,
		&i.AnonymousUserID,
		&i.Status,
		&i.ChunkIndex,
		&i.TotalChunks,
		&i.CategoriesMigrated,
		&i.AccountsMigrated,
		&i.TransactionsMigrated,
		&i.CategoriesFailed,
		&i.AccountsFailed,
		&i.TransactionsFailed,
		&i.ErrorMessage,
		&i.CreatedAt,
		&i.CompletedAt,
	)
	return i, err
}

const getUserMigrations = `-- name: GetUserMigrations :many
SELECT migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at FROM data_migrations
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2
`

type GetUserMigrationsParams struct {
	UserID uuid.UUID `json:"user_id"`
	Limit  int32     `json:"limit"`
}

func (q *Queries) GetUserMigrations(ctx context.Context, arg GetUserMigrationsParams) ([]DataMigration, error) {
	rows, err := q.db.Query(ctx, getUserMigrations, arg.UserID, arg.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []DataMigration
	for rows.Next() {
		var i DataMigration
		if err := rows.Scan(
			&i.MigrationID,
			&i.UserID,
			&i.AnonymousUserID,
			&i.Status,
			&i.ChunkIndex,
			&i.TotalChunks,
			&i.CategoriesMigrated,
			&i.AccountsMigrated,
			&i.TransactionsMigrated,
			&i.CategoriesFailed,
			&i.AccountsFailed,
			&i.TransactionsFailed,
			&i.ErrorMessage,
			&i.CreatedAt,
			&i.CompletedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getCompletedMigrationsByAnonymousUser = `-- name: GetCompletedMigrationsByAnonymousUser :one
SELECT migration_id, user_id, anonymous_user_id, status, chunk_index, total_chunks, categories_migrated, accounts_migrated, transactions_migrated, categories_failed, accounts_failed, transactions_failed, error_message, created_at, completed_at FROM data_migrations
WHERE anonymous_user_id = $1 
AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1
`

func (q *Queries) GetCompletedMigrationsByAnonymousUser(ctx context.Context, anonymousUserID string) (DataMigration, error) {
	row := q.db.QueryRow(ctx, getCompletedMigrationsByAnonymousUser, anonymousUserID)
	var i DataMigration
	err := row.Scan(
		&i.MigrationID,
		&i.UserID,
		&i.AnonymousUserID,
		&i.Status,
		&i.ChunkIndex,
		&i.TotalChunks,
		&i.CategoriesMigrated,
		&i.AccountsMigrated,
		&i.TransactionsMigrated,
		&i.CategoriesFailed,
		&i.AccountsFailed,
		&i.TransactionsFailed,
		&i.ErrorMessage,
		&i.CreatedAt,
		&i.CompletedAt,
	)
	return i, err
}
