-- +goose Up
-- Create notifications table for user inbox/notifications
CREATE TYPE notification_type AS ENUM (
    'recurring_transaction_due',
    'recurring_transaction_failed',
    'transaction_needs_review',
    'budget_warning',
    'budget_exceeded',
    'system_announcement',
    'account_sync_failed'
);

CREATE TYPE notification_status AS ENUM (
    'unread',
    'read',
    'archived',
    'actioned'
);

CREATE TYPE notification_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT (uuid_generate_v4()),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification metadata
    type notification_type NOT NULL,
    status notification_status NOT NULL DEFAULT 'unread',
    priority notification_priority NOT NULL DEFAULT 'medium',
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB, -- Type-specific data (e.g., recurring_transaction_id, transaction_id)
    
    -- Action tracking
    action_url VARCHAR(500), -- URL/route to navigate to
    action_label VARCHAR(100), -- Label for action button (e.g., "Review Transaction")
    action_taken_at TIMESTAMPTZ, -- When user took action
    
    -- Related entities (for easy filtering and cleanup)
    related_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    related_recurring_id UUID REFERENCES recurring_transactions(id) ON DELETE CASCADE,
    related_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Optional expiration for time-sensitive notifications
    
    -- Sync fields for offline-first
    hlc BIGINT NOT NULL DEFAULT 0,
    node_id VARCHAR(255) NOT NULL DEFAULT '',
    deleted_at TIMESTAMPTZ
);

-- Add status column to transactions for review workflow
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'posted' 
    CHECK (status IN ('draft', 'pending', 'posted', 'reconciled'));

-- Create indexes for efficient querying
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE status = 'unread' AND deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_notifications_related_recurring ON notifications(related_recurring_id) WHERE related_recurring_id IS NOT NULL;
CREATE INDEX idx_notifications_hlc ON notifications(hlc, node_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_status ON transactions(status) WHERE deleted_at IS NULL;

-- Create trigger for updating updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- +goose Down
-- Remove trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- Remove indexes
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_user_status;
DROP INDEX IF EXISTS idx_notifications_user_type;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_expires_at;
DROP INDEX IF EXISTS idx_notifications_related_recurring;
DROP INDEX IF EXISTS idx_notifications_hlc;
DROP INDEX IF EXISTS idx_transactions_status;

-- Remove status column from transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS status;

-- Drop notifications table
DROP TABLE IF EXISTS notifications;

-- Drop notification types
DROP TYPE IF EXISTS notification_priority;
DROP TYPE IF EXISTS notification_status;
DROP TYPE IF EXISTS notification_type;
