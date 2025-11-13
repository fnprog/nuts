package repository

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Migration interface {
	WithTx(tx pgx.Tx) Migration

	CreateMigrationRecord(ctx context.Context, params repository.CreateMigrationRecordParams) (repository.DataMigration, error)
	GetMigrationRecord(ctx context.Context, migrationID uuid.UUID, chunkIndex int32) (repository.DataMigration, error)
	GetMigrationsByID(ctx context.Context, migrationID uuid.UUID) ([]repository.DataMigration, error)
	UpdateMigrationSuccess(ctx context.Context, params repository.UpdateMigrationSuccessParams) (repository.DataMigration, error)
	UpdateMigrationFailure(ctx context.Context, params repository.UpdateMigrationFailureParams) (repository.DataMigration, error)
	UpdateMigrationPartial(ctx context.Context, params repository.UpdateMigrationPartialParams) (repository.DataMigration, error)
	GetUserMigrations(ctx context.Context, userID uuid.UUID, limit int32) ([]repository.DataMigration, error)
	GetCompletedMigrationsByAnonymousUser(ctx context.Context, anonymousUserID string) (repository.DataMigration, error)
}

type repo struct {
	queries *repository.Queries
	db      *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Migration {
	queries := repository.New(db)
	return &repo{
		queries: queries,
		db:      db,
	}
}

func (r *repo) WithTx(tx pgx.Tx) Migration {
	return &repo{queries: r.queries.WithTx(tx)}
}

func (r *repo) CreateMigrationRecord(ctx context.Context, params repository.CreateMigrationRecordParams) (repository.DataMigration, error) {
	return r.queries.CreateMigrationRecord(ctx, params)
}

func (r *repo) GetMigrationRecord(ctx context.Context, migrationID uuid.UUID, chunkIndex int32) (repository.DataMigration, error) {
	return r.queries.GetMigrationRecord(ctx, repository.GetMigrationRecordParams{
		MigrationID: migrationID,
		ChunkIndex:  chunkIndex,
	})
}

func (r *repo) GetMigrationsByID(ctx context.Context, migrationID uuid.UUID) ([]repository.DataMigration, error) {
	return r.queries.GetMigrationsByID(ctx, migrationID)
}

func (r *repo) UpdateMigrationSuccess(ctx context.Context, params repository.UpdateMigrationSuccessParams) (repository.DataMigration, error) {
	return r.queries.UpdateMigrationSuccess(ctx, params)
}

func (r *repo) UpdateMigrationFailure(ctx context.Context, params repository.UpdateMigrationFailureParams) (repository.DataMigration, error) {
	return r.queries.UpdateMigrationFailure(ctx, params)
}

func (r *repo) UpdateMigrationPartial(ctx context.Context, params repository.UpdateMigrationPartialParams) (repository.DataMigration, error) {
	return r.queries.UpdateMigrationPartial(ctx, params)
}

func (r *repo) GetUserMigrations(ctx context.Context, userID uuid.UUID, limit int32) ([]repository.DataMigration, error) {
	return r.queries.GetUserMigrations(ctx, repository.GetUserMigrationsParams{
		UserID: userID,
		Limit:  limit,
	})
}

func (r *repo) GetCompletedMigrationsByAnonymousUser(ctx context.Context, anonymousUserID string) (repository.DataMigration, error) {
	return r.queries.GetCompletedMigrationsByAnonymousUser(ctx, anonymousUserID)
}
