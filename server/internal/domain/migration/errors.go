package migration

import "errors"

var (
	ErrMigrationNotFound    = errors.New("migration not found")
	ErrMigrationAlreadyDone = errors.New("migration already completed for this anonymous user")
	ErrInvalidMigrationData = errors.New("invalid migration data")
	ErrMigrationFailed      = errors.New("migration failed")
	ErrInvalidChunkSequence = errors.New("invalid chunk sequence")
	ErrDuplicateMigrationID = errors.New("migration with this ID already exists")
)
