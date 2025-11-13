package migration

import (
	"time"

	"github.com/google/uuid"
)

type MigrationStatus string

const (
	MigrationStatusProcessing MigrationStatus = "processing"
	MigrationStatusCompleted  MigrationStatus = "completed"
	MigrationStatusFailed     MigrationStatus = "failed"
	MigrationStatusPartial    MigrationStatus = "partial"
)

type MigrationRecord struct {
	MigrationID          uuid.UUID       `json:"migration_id"`
	UserID               uuid.UUID       `json:"user_id"`
	AnonymousUserID      string          `json:"anonymous_user_id"`
	Status               MigrationStatus `json:"status"`
	ChunkIndex           int32           `json:"chunk_index"`
	TotalChunks          int32           `json:"total_chunks"`
	CategoriesMigrated   int32           `json:"categories_migrated"`
	AccountsMigrated     int32           `json:"accounts_migrated"`
	TransactionsMigrated int32           `json:"transactions_migrated"`
	CategoriesFailed     int32           `json:"categories_failed"`
	AccountsFailed       int32           `json:"accounts_failed"`
	TransactionsFailed   int32           `json:"transactions_failed"`
	ErrorMessage         *string         `json:"error_message,omitempty"`
	CreatedAt            time.Time       `json:"created_at"`
	CompletedAt          *time.Time      `json:"completed_at,omitempty"`
}

type MigrationResult struct {
	MigrationID          uuid.UUID       `json:"migration_id"`
	Status               MigrationStatus `json:"status"`
	CategoriesMigrated   int32           `json:"categories_migrated"`
	AccountsMigrated     int32           `json:"accounts_migrated"`
	TransactionsMigrated int32           `json:"transactions_migrated"`
	CategoriesFailed     int32           `json:"categories_failed"`
	AccountsFailed       int32           `json:"accounts_failed"`
	TransactionsFailed   int32           `json:"transactions_failed"`
	ErrorMessage         *string         `json:"error_message,omitempty"`
	CompletedAt          *time.Time      `json:"completed_at,omitempty"`
}

type CategoryItem struct {
	Name  string  `json:"name"`
	Icon  string  `json:"icon"`
	Color string  `json:"color"`
	Type  *string `json:"type,omitempty"`
}

type AccountItem struct {
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	Subtype  *string `json:"subtype,omitempty"`
	Balance  float64 `json:"balance"`
	Currency string  `json:"currency"`
}

type TransactionItem struct {
	Amount              float64    `json:"amount"`
	Type                string     `json:"type"`
	AccountName         string     `json:"account_name"`
	CategoryName        string     `json:"category_name"`
	Description         *string    `json:"description,omitempty"`
	TransactionDatetime time.Time  `json:"transaction_datetime"`
	TransactionCurrency string     `json:"transaction_currency"`
	OriginalAmount      *float64   `json:"original_amount,omitempty"`
	Details             *DetailsDB `json:"details,omitempty"`
}

type DetailsDB struct {
	Note          *string `json:"note,omitempty"`
	Location      *string `json:"location,omitempty"`
	PaymentMedium *string `json:"payment_medium,omitempty"`
}
