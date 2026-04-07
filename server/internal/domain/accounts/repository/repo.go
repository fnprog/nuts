package repository

import (
	"context"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Account interface {
	WithTx(tx pgx.Tx) Account

	GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error)
	GetAccountsSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]repository.GetAccountsSinceRow, error)
	GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error)
	CreateAccount(ctx context.Context, args repository.CreateAccountParams) (repository.Account, error)

	UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error)
	DeleteAccount(ctx context.Context, id uuid.UUID) error
	UpdateAccountBalance(ctx context.Context, params repository.UpdateAccountBalanceParams) error

	// Connection management
	CreateConnection(ctx context.Context, params repository.CreateConnectionParams) (repository.UserFinancialConnection, error)
	GetConnectionByID(ctx context.Context, id uuid.UUID) (repository.UserFinancialConnection, error)
	GetConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]repository.UserFinancialConnection, error)
	GetConnectionByProviderItemID(ctx context.Context, params repository.GetConnectionByProviderItemIDParams) (repository.UserFinancialConnection, error)
	UpdateConnection(ctx context.Context, params repository.UpdateConnectionParams) (repository.UserFinancialConnection, error)
	DeleteConnection(ctx context.Context, params repository.DeleteConnectionParams) error
	SetConnectionSyncStatus(ctx context.Context, params repository.SetConnectionSyncStatusParams) (repository.UserFinancialConnection, error)
	SetConnectionErrorStatus(ctx context.Context, params repository.SetConnectionErrorStatusParams) (repository.UserFinancialConnection, error)
	ListConnections(ctx context.Context, params repository.ListConnectionsParams) ([]repository.UserFinancialConnection, error)

	// Sync job management
	// CreateSyncJob(ctx context.Context, job FinancialSyncJob) (*FinancialSyncJob, error)
	// UpdateSyncJob(ctx context.Context, jobID uuid.UUID, updates map[string]interface{}) error
	// GetUserSyncJobs(ctx context.Context, userID uuid.UUID, limit int) ([]FinancialSyncJob, error)
}

type repo struct {
	queries *repository.Queries
	db      *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Account {
	queries := repository.New(db)

	return &repo{
		queries: queries,
		db:      db,
	}
}

func (r *repo) WithTx(tx pgx.Tx) Account {
	return &repo{queries: r.queries.WithTx(tx)}
}

func (r *repo) GetAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error) {
	return r.queries.GetAccounts(ctx, &userID)
}

func (r *repo) GetAccountsSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]repository.GetAccountsSinceRow, error) {
	return r.queries.GetAccountsSince(ctx, repository.GetAccountsSinceParams{
		UserID: &userID,
		Since: pgtype.Timestamptz{
			Time:  since,
			Valid: true,
		},
	})
}

func (r *repo) GetAccountByID(ctx context.Context, id uuid.UUID) (repository.GetAccountByIdRow, error) {
	return r.queries.GetAccountById(ctx, id)
}

func (r *repo) CreateAccount(ctx context.Context, args repository.CreateAccountParams) (repository.Account, error) {
	return r.queries.CreateAccount(ctx, args)
}

func (r *repo) UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error) {
	return r.queries.UpdateAccount(ctx, account)
}

func (r *repo) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAccount(ctx, id)
}

func (r *repo) UpdateAccountBalance(ctx context.Context, params repository.UpdateAccountBalanceParams) error {
	return r.queries.UpdateAccountBalance(ctx, params)
}

func (r *repo) CreateConnection(ctx context.Context, params repository.CreateConnectionParams) (repository.UserFinancialConnection, error) {
	return r.queries.CreateConnection(ctx, params)
}

func (r *repo) GetConnectionByID(ctx context.Context, id uuid.UUID) (repository.UserFinancialConnection, error) {
	return r.queries.GetConnectionByID(ctx, id)
}

func (r *repo) GetConnectionsByUserID(ctx context.Context, userID uuid.UUID) ([]repository.UserFinancialConnection, error) {
	return r.queries.GetConnectionsByUserID(ctx, userID)
}

func (r *repo) GetConnectionByProviderItemID(ctx context.Context, params repository.GetConnectionByProviderItemIDParams) (repository.UserFinancialConnection, error) {
	return r.queries.GetConnectionByProviderItemID(ctx, params)
}

func (r *repo) UpdateConnection(ctx context.Context, params repository.UpdateConnectionParams) (repository.UserFinancialConnection, error) {
	return r.queries.UpdateConnection(ctx, params)
}

func (r *repo) DeleteConnection(ctx context.Context, params repository.DeleteConnectionParams) error {
	return r.queries.DeleteConnection(ctx, params)
}

func (r *repo) SetConnectionSyncStatus(ctx context.Context, params repository.SetConnectionSyncStatusParams) (repository.UserFinancialConnection, error) {
	return r.queries.SetConnectionSyncStatus(ctx, params)
}

func (r *repo) SetConnectionErrorStatus(ctx context.Context, params repository.SetConnectionErrorStatusParams) (repository.UserFinancialConnection, error) {
	return r.queries.SetConnectionErrorStatus(ctx, params)
}

func (r *repo) ListConnections(ctx context.Context, params repository.ListConnectionsParams) ([]repository.UserFinancialConnection, error) {
	return r.queries.ListConnections(ctx, params)
}
