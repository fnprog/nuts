package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	accRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/repository"
	trscRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/Fantasy-Programming/nuts/server/pkg/jobs"
	"github.com/Fantasy-Programming/nuts/server/pkg/llm"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

const (
	dbTimeoutMs = 5000
)

type Transactions interface {
	ListTransactionsSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]repository.GetTransactionsSinceRow, error)

	CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error)
	UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error)
	DeleteTransaction(ctx context.Context, id uuid.UUID) error

	// AI
	ParseTransactions(ctx context.Context, req llm.NeuralInputRequest) (*llm.NeuralInputResponse, error)
}

type TransactionService struct {
	trscRepo   trscRepo.Transactions
	accRepo    accRepo.Account
	llmService llm.Service
	jobs       *jobs.Service
	db         *pgxpool.Pool
	logger     *zerolog.Logger
}

func New(db *pgxpool.Pool, trscRepo trscRepo.Transactions, accRepo accRepo.Account, llm llm.Service, jobs *jobs.Service, logger *zerolog.Logger) *TransactionService {
	return &TransactionService{
		trscRepo:   trscRepo,
		accRepo:    accRepo,
		llmService: llm,
		jobs:       jobs,
		db:         db,
		logger:     logger,
	}
}

func (t *TransactionService) ListTransactionsSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]repository.GetTransactionsSinceRow, error) {
	return t.trscRepo.GetTransactionsSince(ctx, userID, since)
}

func (t *TransactionService) CreateTransaction(ctx context.Context, params repository.CreateTransactionParams) (repository.Transaction, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeoutMs*time.Millisecond)
	defer cancel()

	tx, err := t.db.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to rollback")
			}
		}
	}()

	trxRepo := t.trscRepo.WithTx(tx)
	accRepo := t.accRepo.WithTx(tx)

	transaction, err := trxRepo.CreateTransaction(ctx, params)
	if err != nil {
		return repository.Transaction{}, err
	}

	if transaction.ID == uuid.Nil {
		panic("transaction ID invariant violated")
	}

	err = accRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      params.AccountID,
		Balance: decimal.NewNullDecimal(params.Amount),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	if err = tx.Commit(ctx); err != nil {
		return repository.Transaction{}, err
	}

	if transaction.ID == uuid.Nil {
		panic("post-commit: transaction ID invariant violated")
	}

	return transaction, nil
}

func (t *TransactionService) UpdateTransaction(ctx context.Context, params repository.UpdateTransactionParams) (repository.Transaction, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeoutMs*time.Millisecond)
	defer cancel()

	tx, err := t.db.Begin(ctx)
	if err != nil {
		return repository.Transaction{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to rollback")
			}
		}
	}()

	trxRepo := t.trscRepo.WithTx(tx)
	acxRepo := t.accRepo.WithTx(tx)

	// Get the original transaction
	originalTx, err := trxRepo.GetTransaction(ctx, params.ID)
	if err != nil {
		return repository.Transaction{}, err
	}

	// Reverse the original transaction amount on the original account
	reversalAmount := types.PgtypeNumericToDecimal(originalTx.Amount)

	err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      originalTx.AccountID,
		Balance: decimal.NewNullDecimal(reversalAmount.Neg()),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// Update the transaction with the new details
	updatedTx, err := trxRepo.UpdateTransaction(ctx, params)
	if err != nil {
		return repository.Transaction{}, err
	}

	// Apply the new transaction amount to the new account
	newAmount := types.PgtypeNumericToDecimal(updatedTx.Amount)

	err = acxRepo.UpdateAccountBalance(ctx, repository.UpdateAccountBalanceParams{
		ID:      updatedTx.AccountID,
		Balance: decimal.NewNullDecimal(newAmount),
	})
	if err != nil {
		return repository.Transaction{}, err
	}

	// If it's a new transfer, apply the amount to the new destination account
	if err := tx.Commit(ctx); err != nil {
		return repository.Transaction{}, err
	}

	if updatedTx.ID == uuid.Nil {
		panic("post-commit: transaction ID invariant violated")
	}

	return updatedTx, nil
}

func (r *TransactionService) DeleteTransaction(ctx context.Context, id uuid.UUID) error {
	return r.trscRepo.DeleteTransaction(ctx, id)
}

func (r *TransactionService) ParseTransactions(ctx context.Context, req llm.NeuralInputRequest) (*llm.NeuralInputResponse, error) {
	return r.llmService.ParseTransactions(ctx, req)
}
