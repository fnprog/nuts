package migration

type MigrationItems struct {
	Categories   []CategoryItem    `json:"categories"`
	Accounts     []AccountItem     `json:"accounts"`
	Transactions []TransactionItem `json:"transactions"`
}

type MigrateDataRequest struct {
	MigrationID     string         `json:"migration_id" validate:"required,uuid"`
	AnonymousUserID string         `json:"anonymous_user_id" validate:"required"`
	ChunkIndex      *int32         `json:"chunk_index,omitempty"`
	TotalChunks     *int32         `json:"total_chunks,omitempty"`
	Items           MigrationItems `json:"items" validate:"required"`
}

type GetMigrationStatusRequest struct {
	MigrationID string `json:"migration_id" validate:"required,uuid"`
}
