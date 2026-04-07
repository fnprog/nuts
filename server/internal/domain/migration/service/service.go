package service

import (
	"context"
	"errors"
	"fmt"

	accRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/accounts/repository"
	ctgRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/categories/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/migration"
	migRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/migration/repository"
	trcRepo "github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

type Migration interface {
	MigrateData(ctx context.Context, userID uuid.UUID, req migration.MigrateDataRequest) (*migration.MigrationResult, error)
	GetMigrationStatus(ctx context.Context, userID uuid.UUID, migrationID uuid.UUID) (*migration.MigrationRecord, error)
	GetUserMigrations(ctx context.Context, userID uuid.UUID, limit int32) ([]migration.MigrationRecord, error)
}

type MigrationService struct {
	repo    migRepo.Migration
	accRepo accRepo.Account
	ctgRepo ctgRepo.Category
	trcRepo trcRepo.Transactions
	db      *pgxpool.Pool
	logger  *zerolog.Logger
}

func New(db *pgxpool.Pool, repo migRepo.Migration, accRepo accRepo.Account, ctgRepo ctgRepo.Category, trcRepo trcRepo.Transactions, logger *zerolog.Logger) *MigrationService {
	return &MigrationService{
		repo:    repo,
		accRepo: accRepo,
		ctgRepo: ctgRepo,
		trcRepo: trcRepo,
		db:      db,
		logger:  logger,
	}
}

func (s *MigrationService) MigrateData(ctx context.Context, userID uuid.UUID, req migration.MigrateDataRequest) (*migration.MigrationResult, error) {
	migrationID, err := uuid.Parse(req.MigrationID)
	if err != nil {
		return nil, migration.ErrInvalidMigrationData
	}

	chunkIndex := int32(0)
	totalChunks := int32(1)
	if req.ChunkIndex != nil {
		chunkIndex = *req.ChunkIndex
	}
	if req.TotalChunks != nil {
		totalChunks = *req.TotalChunks
	}

	existingMigration, err := s.repo.GetCompletedMigrationsByAnonymousUser(ctx, req.AnonymousUserID)
	if err == nil && existingMigration.Status == string(migration.MigrationStatusCompleted) {
		return nil, migration.ErrMigrationAlreadyDone
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil && !errors.Is(rbErr, pgx.ErrTxClosed) {
				s.logger.Error().Err(rbErr).Msg("Failed to rollback transaction")
			}
		}
	}()

	migRepoTx := s.repo.WithTx(tx)
	accRepoTx := s.accRepo.WithTx(tx)
	ctgRepoTx := s.ctgRepo.WithTx(tx)
	trcRepoTx := s.trcRepo.WithTx(tx)

	_, err = migRepoTx.CreateMigrationRecord(ctx, repository.CreateMigrationRecordParams{
		MigrationID:     migrationID,
		UserID:          userID,
		AnonymousUserID: req.AnonymousUserID,
		Status:          string(migration.MigrationStatusProcessing),
		ChunkIndex:      chunkIndex,
		TotalChunks:     totalChunks,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create migration record: %w", err)
	}

	categoryMap := make(map[string]uuid.UUID)
	categoriesMigrated := int32(0)
	categoriesFailed := int32(0)

	for _, cat := range req.Items.Categories {
		isDefault := false
		categoryType := "expense"
		if cat.Type != nil {
			categoryType = *cat.Type
		}

		catParams := repository.CreateCategoryParams{
			Name:      cat.Name,
			Icon:      cat.Icon,
			Color:     &cat.Color,
			IsDefault: &isDefault,
			Type:      categoryType,
			CreatedBy: userID,
		}

		category, catErr := ctgRepoTx.CreateCategory(ctx, catParams)
		if catErr != nil {
			s.logger.Warn().Err(catErr).Str("name", cat.Name).Msg("Failed to create category")
			categoriesFailed++
			continue
		}

		categoryMap[cat.Name] = category.ID
		categoriesMigrated++
	}

	accountMap := make(map[string]uuid.UUID)
	accountsMigrated := int32(0)
	accountsFailed := int32(0)

	for _, acc := range req.Items.Accounts {
		balanceDecimal := decimal.NewFromFloat(acc.Balance)
		isExternal := false

		accParams := repository.CreateAccountParams{
			CreatedBy:  &userID,
			Name:       acc.Name,
			Type:       acc.Type,
			Subtype:    acc.Subtype,
			Balance:    decimal.NullDecimal{Decimal: balanceDecimal, Valid: true},
			Currency:   acc.Currency,
			IsExternal: &isExternal,
		}

		account, accErr := accRepoTx.CreateAccount(ctx, accParams)
		if accErr != nil {
			s.logger.Warn().Err(accErr).Str("name", acc.Name).Msg("Failed to create account")
			accountsFailed++
			continue
		}

		accountMap[acc.Name] = account.ID
		accountsMigrated++
	}

	transactionsMigrated := int32(0)
	transactionsFailed := int32(0)

	for _, txn := range req.Items.Transactions {
		accountID, accountExists := accountMap[txn.AccountName]
		if !accountExists {
			s.logger.Warn().Str("account_name", txn.AccountName).Msg("Account not found for transaction")
			transactionsFailed++
			continue
		}

		categoryID, categoryExists := categoryMap[txn.CategoryName]
		if !categoryExists {
			s.logger.Warn().Str("category_name", txn.CategoryName).Msg("Category not found for transaction")
			transactionsFailed++
			continue
		}

		amountDecimal := decimal.NewFromFloat(txn.Amount)
		originalAmountDecimal := amountDecimal
		if txn.OriginalAmount != nil {
			originalAmountDecimal = decimal.NewFromFloat(*txn.OriginalAmount)
		}

		var details *dto.Details
		if txn.Details != nil {
			details = &dto.Details{
				Note:          txn.Details.Note,
				Location:      txn.Details.Location,
				PaymentMedium: txn.Details.PaymentMedium,
			}
		}

		isExternal := false
		txnParams := repository.CreateTransactionParams{
			Amount:              amountDecimal,
			Type:                txn.Type,
			AccountID:           accountID,
			CategoryID:          &categoryID,
			Description:         txn.Description,
			TransactionDatetime: pgtype.Timestamptz{Time: txn.TransactionDatetime, Valid: true},
			TransactionCurrency: txn.TransactionCurrency,
			OriginalAmount:      originalAmountDecimal,
			Details:             details,
			IsExternal:          &isExternal,
			CreatedBy:           &userID,
		}

		_, txnErr := trcRepoTx.CreateTransaction(ctx, txnParams)
		if txnErr != nil {
			s.logger.Warn().Err(txnErr).Str("description", stringOrEmpty(txn.Description)).Msg("Failed to create transaction")
			transactionsFailed++
			continue
		}

		transactionsMigrated++
	}

	var finalRecord repository.DataMigration
	totalFailed := categoriesFailed + accountsFailed + transactionsFailed

	if totalFailed == 0 {
		finalRecord, err = migRepoTx.UpdateMigrationSuccess(ctx, repository.UpdateMigrationSuccessParams{
			MigrationID:          migrationID,
			CategoriesMigrated:   categoriesMigrated,
			AccountsMigrated:     accountsMigrated,
			TransactionsMigrated: transactionsMigrated,
			ChunkIndex:           chunkIndex,
		})
	} else if categoriesMigrated > 0 || accountsMigrated > 0 || transactionsMigrated > 0 {
		errorMsg := fmt.Sprintf("Partial migration: %d items failed", totalFailed)
		finalRecord, err = migRepoTx.UpdateMigrationPartial(ctx, repository.UpdateMigrationPartialParams{
			MigrationID:          migrationID,
			CategoriesMigrated:   categoriesMigrated,
			AccountsMigrated:     accountsMigrated,
			TransactionsMigrated: transactionsMigrated,
			CategoriesFailed:     categoriesFailed,
			AccountsFailed:       accountsFailed,
			TransactionsFailed:   transactionsFailed,
			ErrorMessage:         &errorMsg,
			ChunkIndex:           chunkIndex,
		})
	} else {
		errorMsg := "All items failed to migrate"
		finalRecord, err = migRepoTx.UpdateMigrationFailure(ctx, repository.UpdateMigrationFailureParams{
			MigrationID:  migrationID,
			ErrorMessage: &errorMsg,
			ChunkIndex:   chunkIndex,
		})
	}

	if err != nil {
		return nil, fmt.Errorf("failed to update migration record: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	result := &migration.MigrationResult{
		MigrationID:          finalRecord.MigrationID,
		Status:               migration.MigrationStatus(finalRecord.Status),
		CategoriesMigrated:   finalRecord.CategoriesMigrated,
		AccountsMigrated:     finalRecord.AccountsMigrated,
		TransactionsMigrated: finalRecord.TransactionsMigrated,
		CategoriesFailed:     finalRecord.CategoriesFailed,
		AccountsFailed:       finalRecord.AccountsFailed,
		TransactionsFailed:   finalRecord.TransactionsFailed,
		ErrorMessage:         finalRecord.ErrorMessage,
		CompletedAt:          finalRecord.CompletedAt,
	}

	return result, nil
}

func (s *MigrationService) GetMigrationStatus(ctx context.Context, userID uuid.UUID, migrationID uuid.UUID) (*migration.MigrationRecord, error) {
	records, err := s.repo.GetMigrationsByID(ctx, migrationID)
	if err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return nil, migration.ErrMigrationNotFound
	}

	latestRecord := records[len(records)-1]

	if latestRecord.UserID != userID {
		return nil, migration.ErrMigrationNotFound
	}

	record := &migration.MigrationRecord{
		MigrationID:          latestRecord.MigrationID,
		UserID:               latestRecord.UserID,
		AnonymousUserID:      latestRecord.AnonymousUserID,
		Status:               migration.MigrationStatus(latestRecord.Status),
		ChunkIndex:           latestRecord.ChunkIndex,
		TotalChunks:          latestRecord.TotalChunks,
		CategoriesMigrated:   latestRecord.CategoriesMigrated,
		AccountsMigrated:     latestRecord.AccountsMigrated,
		TransactionsMigrated: latestRecord.TransactionsMigrated,
		CategoriesFailed:     latestRecord.CategoriesFailed,
		AccountsFailed:       latestRecord.AccountsFailed,
		TransactionsFailed:   latestRecord.TransactionsFailed,
		ErrorMessage:         latestRecord.ErrorMessage,
		CreatedAt:            latestRecord.CreatedAt,
		CompletedAt:          latestRecord.CompletedAt,
	}

	return record, nil
}

func (s *MigrationService) GetUserMigrations(ctx context.Context, userID uuid.UUID, limit int32) ([]migration.MigrationRecord, error) {
	records, err := s.repo.GetUserMigrations(ctx, userID, limit)
	if err != nil {
		return nil, err
	}

	result := make([]migration.MigrationRecord, len(records))
	for i, rec := range records {
		result[i] = migration.MigrationRecord{
			MigrationID:          rec.MigrationID,
			UserID:               rec.UserID,
			AnonymousUserID:      rec.AnonymousUserID,
			Status:               migration.MigrationStatus(rec.Status),
			ChunkIndex:           rec.ChunkIndex,
			TotalChunks:          rec.TotalChunks,
			CategoriesMigrated:   rec.CategoriesMigrated,
			AccountsMigrated:     rec.AccountsMigrated,
			TransactionsMigrated: rec.TransactionsMigrated,
			CategoriesFailed:     rec.CategoriesFailed,
			AccountsFailed:       rec.AccountsFailed,
			TransactionsFailed:   rec.TransactionsFailed,
			ErrorMessage:         rec.ErrorMessage,
			CreatedAt:            rec.CreatedAt,
			CompletedAt:          rec.CompletedAt,
		}
	}

	return result, nil
}

func stringOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
