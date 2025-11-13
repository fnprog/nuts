package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/accounts"
	accRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/repository"
	ctgRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/repository"
	trcRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/types"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/Fantasy-Programming/nuts/server/pkg/jobs"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

const (
	maxAccounts          = 1000
	maxBatchSize         = 100
	dbTimeoutMs          = 5000
	externalAPITimeoutMs = 30000
)

type Account interface {
	ListAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error)
	ListAccountsSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]repository.GetAccountsSinceRow, error)
	GetAccount(ctx context.Context, accountID uuid.UUID) (repository.GetAccountByIdRow, error)
	CreateAccount(ctx context.Context, hasBalance bool, account repository.CreateAccountParams) (repository.Account, error)

	UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error)
	DeleteAccount(ctx context.Context, id uuid.UUID) error

	GetAccountsBalanceTimeline(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error)
	GetAccountBalanceTimeline(ctx context.Context, userID uuid.UUID, accountID uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error)
	GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]accounts.AccountWithTrend, error)

	// Linking
	LinkTeller(ctx context.Context, userID uuid.UUID, req accounts.TellerConnectRequest) error
	LinkMono(ctx context.Context, userID uuid.UUID, req accounts.MonoConnectRequest) error

	// Sync job management
	// CreateSyncJob(ctx context.Context, job FinancialSyncJob) (*FinancialSyncJob, error)
	// UpdateSyncJob(ctx context.Context, jobID uuid.UUID, updates map[string]interface{}) error
	// GetUserSyncJobs(ctx context.Context, userID uuid.UUID, limit int) ([]FinancialSyncJob, error)
}

type AccountService struct {
	repo               accRepo.Account
	trcRepo            trcRepo.Transactions
	ctgRepo            ctgRepo.Category
	db                 *pgxpool.Pool
	encrypt            *encrypt.Encrypter
	openFinanceManager *finance.ProviderManager
	scheduler          *jobs.Service
	logger             *zerolog.Logger
}

func New(db *pgxpool.Pool, encrypt *encrypt.Encrypter, opfn *finance.ProviderManager, scheduler *jobs.Service, repo accRepo.Account, trcRepo trcRepo.Transactions, ctgRepo ctgRepo.Category, logger *zerolog.Logger) *AccountService {
	return &AccountService{
		repo:               repo,
		trcRepo:            trcRepo,
		ctgRepo:            ctgRepo,
		db:                 db,
		encrypt:            encrypt,
		openFinanceManager: opfn,
		scheduler:          scheduler,
		logger:             logger,
	}
}

func (a *AccountService) ListAccounts(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsRow, error) {
	return a.repo.GetAccounts(ctx, userID)
}

func (a *AccountService) ListAccountsSince(ctx context.Context, userID uuid.UUID, since time.Time) ([]repository.GetAccountsSinceRow, error) {
	return a.repo.GetAccountsSince(ctx, userID, since)
}

func (a *AccountService) GetAccount(ctx context.Context, accountID uuid.UUID) (repository.GetAccountByIdRow, error) {
	return a.repo.GetAccountByID(ctx, accountID)
}

func (a *AccountService) CreateAccount(ctx context.Context, hasBalance bool, params repository.CreateAccountParams) (repository.Account, error) {
	ctx, cancel := context.WithTimeout(ctx, dbTimeoutMs*time.Millisecond)
	defer cancel()

	tx, err := a.db.Begin(ctx)
	if err != nil {
		return repository.Account{}, err
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				fmt.Println("Failed to do things")
			}
		}
	}()

	actx := a.repo.WithTx(tx)
	tscx := a.trcRepo.WithTx(tx)
	ctgx := a.ctgRepo.WithTx(tx)

	if params.CreatedBy == nil || *params.CreatedBy == uuid.Nil {
		panic("createdBy invariant violated")
	}

	account, err := actx.CreateAccount(ctx, params)
	if err != nil {
		return repository.Account{}, err
	}

	if account.ID == uuid.Nil {
		panic("account ID invariant violated")
	}

	if !hasBalance {
		if err = tx.Commit(ctx); err != nil {
			return repository.Account{}, err
		}
		return account, nil
	}

	// Category is set to income
	category, err := ctgx.GetCategoryByName(ctx, "Income")
	if err != nil {
		return repository.Account{}, err
	}

	description := "Initial Balance"
	medium := ""
	note := ""
	status := ""
	location := ""
	external := false

	// Create the initial transaction
	_, err = tscx.CreateTransaction(ctx, repository.CreateTransactionParams{
		Amount:              types.NullDecimalToDecimal(params.Balance),
		Type:                "income",
		AccountID:           account.ID,
		Description:         &description,
		CategoryID:          &category.ID,
		TransactionCurrency: account.Currency,
		IsExternal:          &external,
		OriginalAmount:      types.NullDecimalToDecimal(params.Balance),
		TransactionDatetime: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		Details: &dto.Details{
			PaymentMedium: &medium,
			Location:      &location,
			Note:          &note,
			PaymentStatus: &status,
		},
		CreatedBy: account.CreatedBy,
	})
	if err != nil {
		return repository.Account{}, err
	}

	if err = tx.Commit(ctx); err != nil {
		return repository.Account{}, err
	}

	if account.ID == uuid.Nil {
		panic("post-commit: account ID invariant violated")
	}

	return account, nil
}

func (a *AccountService) GetAccountsBalanceTimeline(ctx context.Context, userID uuid.UUID) ([]repository.GetAccountsBalanceTimelineRow, error) {
	return a.repo.GetAccountsBTimeline(ctx, userID)
}

func (a *AccountService) GetAccountBalanceTimeline(ctx context.Context, userID uuid.UUID, accountID uuid.UUID) ([]repository.GetAccountBalanceTimelineRow, error) {
	return a.repo.GetAccountBTimeline(ctx, userID, accountID)
}

func (a *AccountService) GetAccountsTrends(ctx context.Context, userID *uuid.UUID, startTime time.Time, endTime time.Time) ([]accounts.AccountWithTrend, error) {
	return a.repo.GetAccountsTrends(ctx, userID, startTime, endTime)
}

func (a *AccountService) LinkTeller(ctx context.Context, userID uuid.UUID, req accounts.TellerConnectRequest) error {
	ctx, cancel := context.WithTimeout(ctx, externalAPITimeoutMs*time.Millisecond)
	defer cancel()

	if userID == uuid.Nil {
		panic("userID invariant violated")
	}

	provider, err := a.openFinanceManager.GetProvider("teller")
	if err != nil {
		return err
	}

	accounts, err := provider.GetAccounts(ctx, req.AccessToken)
	if err != nil {
		return err
	}

	if len(accounts) > maxAccounts {
		panic(fmt.Sprintf("account count %d exceeds max %d", len(accounts), maxAccounts))
	}

	connection, err := a.createTellerConnection(ctx, userID, req, accounts, provider)
	if err != nil {
		return err
	}

	accountCreationErrors := a.createAccountsFromProvider(ctx, userID, req, accounts, connection, provider.GetProviderName())

	if len(accountCreationErrors) > 0 {
		a.logger.Warn().Errs("errors", accountCreationErrors).Msg("Some accounts could not be created from Teller")
	}

	if err = a.scheduler.EnqueueBankSync(ctx, userID, connection.ID, "full"); err != nil {
		a.logger.Error().Err(err).Msg("Failed to schedule bank sync")
	}

	return err
}

func (a *AccountService) createTellerConnection(ctx context.Context, userID uuid.UUID, req accounts.TellerConnectRequest, accounts []finance.Account, provider finance.Provider) (repository.UserFinancialConnection, error) {
	encryptedAccessToken, err := a.encrypt.Encrypt([]byte(req.AccessToken))
	if err != nil {
		return repository.UserFinancialConnection{}, err
	}

	var institutionID, institutionName *string

	if len(accounts) > 0 {
		if accounts[0].InstitutionID == "" || accounts[0].InstitutionName == "" {
			panic("institution data invariant violated")
		}
		institutionID = &accounts[0].InstitutionID
		institutionName = &accounts[0].InstitutionName
	}

	status := "active"

	connParams := repository.CreateConnectionParams{
		UserID:               userID,
		ProviderName:         provider.GetProviderName(),
		AccessTokenEncrypted: encryptedAccessToken,
		ItemID:               nil,
		InstitutionID:        institutionID,
		InstitutionName:      institutionName,
		Status:               &status,
		LastSyncAt:           pgtype.Timestamptz{Time: time.Now(), Valid: true},
		ExpiresAt:            pgtype.Timestamptz{Valid: false},
	}

	return a.repo.CreateConnection(ctx, connParams)
}

func (a *AccountService) createAccountsFromProvider(ctx context.Context, userID uuid.UUID, req accounts.TellerConnectRequest, accounts []finance.Account, connection repository.UserFinancialConnection, providerName string) []error {
	var accountCreationErrors []error
	isExternal := true

	for i, providerAccount := range accounts {
		if i >= maxBatchSize {
			a.logger.Warn().Int("totalAccounts", len(accounts)).Msg("Batch size limit reached")
			break
		}

		balance := decimal.NullDecimal{
			Decimal: decimal.NewFromFloat(providerAccount.Balance),
			Valid:   true,
		}

		_, err := a.repo.CreateAccount(ctx, repository.CreateAccountParams{
			CreatedBy:         &userID,
			Name:              providerAccount.Name,
			Type:              providerAccount.Type,
			Balance:           balance,
			ProviderAccountID: &providerAccount.ProviderAccountID,
			ProviderName:      &providerName,
			IsExternal:        &isExternal,
			Currency:          providerAccount.Currency,
			ConnectionID:      &connection.ID,
			Meta: dto.AccountMeta{
				InstitutionName: req.Enrollment.Institution.Name,
			},
		})
		if err != nil {
			accountCreationErrors = append(accountCreationErrors, fmt.Errorf("account %s (%s): %w", providerAccount.Name, providerAccount.ID, err))
		}
	}

	return accountCreationErrors
}

func (a *AccountService) LinkMono(ctx context.Context, userID uuid.UUID, req accounts.MonoConnectRequest) error {
	ctx, cancel := context.WithTimeout(ctx, externalAPITimeoutMs*time.Millisecond)
	defer cancel()

	provider, err := a.openFinanceManager.GetProvider("mono")
	if err != nil {
		return err
	}

	exchangeResp, err := provider.ExchangePublicToken(ctx, finance.ExchangeTokenRequest{
		PublicToken: req.Code,
	})
	if err != nil {
		return err
	}

	monoItemID := exchangeResp.AccessToken
	providerName := "mono"
	status := "pending" // webhook will do

	encryptedMonoIdentifier, err := a.encrypt.Encrypt([]byte(monoItemID))
	if err != nil {
		return err
	}

	connParams := repository.CreateConnectionParams{
		UserID:               userID,
		ProviderName:         providerName,
		AccessTokenEncrypted: encryptedMonoIdentifier,
		ItemID:               nil,
		InstitutionID:        &req.InstitutionID,
		InstitutionName:      &req.Institution,
		Status:               &status,
		LastSyncAt:           pgtype.Timestamptz{Valid: false},
		ExpiresAt:            pgtype.Timestamptz{Valid: false},
	}

	_, err = a.repo.CreateConnection(ctx, connParams)

	return err
}

func (r *AccountService) UpdateAccount(ctx context.Context, account repository.UpdateAccountParams) (repository.Account, error) {
	return r.repo.UpdateAccount(ctx, account)
}

func (r *AccountService) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return r.repo.DeleteAccount(ctx, id)
}
