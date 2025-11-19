-- +goose Up
CREATE TYPE budget_style_enum AS ENUM (
    'traditional',
    'flex_bucket',
    'global_limit',
    'zero_based',
    'percentage_based'
);

ALTER TABLE preferences
ADD COLUMN budget_style budget_style_enum DEFAULT NULL;

-- +goose Down
ALTER TABLE preferences
DROP COLUMN IF EXISTS budget_style;

DROP TYPE IF EXISTS budget_style_enum;
