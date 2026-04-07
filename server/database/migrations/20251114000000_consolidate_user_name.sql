-- +goose Up
-- +goose StatementBegin
ALTER TABLE users ADD COLUMN name VARCHAR;

UPDATE users 
SET name = CONCAT(first_name, ' ', last_name)
WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

UPDATE users 
SET name = first_name
WHERE first_name IS NOT NULL AND last_name IS NULL;

UPDATE users 
SET name = last_name
WHERE first_name IS NULL AND last_name IS NOT NULL;

ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users ADD COLUMN first_name VARCHAR;
ALTER TABLE users ADD COLUMN last_name VARCHAR;

UPDATE users 
SET first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
        THEN SUBSTRING(name FROM LENGTH(SPLIT_PART(name, ' ', 1)) + 2)
        ELSE NULL
    END
WHERE name IS NOT NULL;

ALTER TABLE users DROP COLUMN name;
-- +goose StatementEnd
