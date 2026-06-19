package database

import (
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

func TestConfigurePoolWithTracing(t *testing.T) {
	logger := zerolog.Nop()

	config, err := pgxpool.ParseConfig("postgres://user:pass@localhost/testdb")
	if err != nil {
		t.Fatalf("Failed to parse config: %v", err)
	}

	t.Run("TracingEnabled", func(t *testing.T) {
		ConfigurePoolWithTracing(config, &logger, true)

		if config.ConnConfig.Tracer == nil {
			t.Error("Expected tracer to be set when tracing is enabled")
		}

		if config.BeforeAcquire == nil {
			t.Error("Expected BeforeAcquire to be set")
		}
		if config.AfterRelease == nil {
			t.Error("Expected AfterRelease to be set")
		}
	})

	t.Run("TracingDisabled", func(t *testing.T) {
		// Reset config
		config, _ = pgxpool.ParseConfig("postgres://user:pass@localhost/testdb")
		ConfigurePoolWithTracing(config, &logger, false)

		if config.ConnConfig.Tracer != nil {
			t.Error("Expected tracer to be nil when tracing is disabled")
		}

		if config.BeforeAcquire == nil {
			t.Error("Expected BeforeAcquire to be set even when tracing is disabled")
		}
		if config.AfterRelease == nil {
			t.Error("Expected AfterRelease to be set even when tracing is disabled")
		}
	})
}

