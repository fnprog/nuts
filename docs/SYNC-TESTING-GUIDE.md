# Unified Sync Endpoint Testing Guide

## Overview
This guide covers how to test the unified `/sync` endpoint that was implemented to consolidate 6 resource types (transactions, accounts, categories, budgets, tags, preferences) into a single API call.

## Implementation Summary

### Server Side
- **Endpoint**: `GET /api/sync`
- **Location**: `server/internal/domain/sync/handlers/handlers.go`
- **Route Registration**: `server/internal/server/domain.go` (line 115-119)
- **Required Query Parameter**: `since` (RFC3339 timestamp)
- **Response Format**:
```json
{
  "accounts": [...],
  "categories": [...],
  "transactions": [...],
  "budgets": [...],
  "tags": [...],
  "preferences": [...],
  "server_timestamp": "2024-11-03T10:30:00Z"
}
```

### Client Side
- **Service**: `client/src/core/sync/services/sync.service.ts`
- **Method**: `performSync()` (line 238-269)
- **CRDT Schema**: `client/src/core/sync/types/crdt-schema.ts`
- **CRDT Operations**: `client/src/core/sync/services/crdt.service.ts`

## Prerequisites

### 1. Database Setup
Ensure PostgreSQL is running with the schema migrated:
```bash
cd server
task migrate
```

### 2. Environment Configuration
Verify `server/.env.server` has:
- Database connection details (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)
- JWT signing keys (AUTH_SIGNINGKEY, AUTH_REFRESHKEY)

### 3. Test User & Data
Create a test user and some sample data:
```sql
-- Create test user
INSERT INTO users(id, email, password, first_name, last_name)
VALUES('00000000-0000-0000-0000-000000000001', 'test@nuts.dev', 'hashed_password', 'Test', 'User');

-- Create test account
INSERT INTO accounts(id, user_id, name, type, currency, balance, created_at, updated_at)
VALUES('acc-1', '00000000-0000-0000-0000-000000000001', 'Test Account', 'checking', 'USD', 1000.00, NOW(), NOW());

-- Create test category
INSERT INTO categories(id, user_id, name, type, color, icon, created_at, updated_at)
VALUES('cat-1', '00000000-0000-0000-0000-000000000001', 'Groceries', 'expense', '#FF5733', 'cart', NOW(), NOW());

-- Create test transaction
INSERT INTO transactions(id, user_id, account_id, category_id, amount, type, description, transaction_datetime, created_at, updated_at)
VALUES('txn-1', '00000000-0000-0000-0000-000000000001', 'acc-1', 'cat-1', -50.00, 'expense', 'Test transaction', NOW(), NOW(), NOW());
```

## Manual Testing

### Test 1: Initial Sync (Full Sync)
**Purpose**: Verify all resources are returned when client has never synced

```bash
# Start server
cd server && task dev

# Get JWT token (login first)
TOKEN=$(curl -X POST http://localhost:3080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nuts.dev","password":"your_password"}' | jq -r '.access_token')

# Call sync endpoint with old timestamp (e.g., 1 week ago)
curl -X GET "http://localhost:3080/api/sync?since=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Expected Result**:
- All existing accounts, categories, transactions, budgets, tags, preferences returned
- `server_timestamp` present in response

### Test 2: Incremental Sync
**Purpose**: Verify only changed resources since last sync are returned

```bash
# Save server_timestamp from previous sync
LAST_SYNC="2024-11-03T10:00:00Z"

# Create new transaction
curl -X POST http://localhost:3080/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "acc-1",
    "category_id": "cat-1",
    "amount": -25.00,
    "type": "expense",
    "description": "New transaction",
    "transaction_datetime": "2024-11-03T11:00:00Z"
  }'

# Sync again with last_sync timestamp
curl -X GET "http://localhost:3080/api/sync?since=$LAST_SYNC" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Expected Result**:
- Only the new transaction appears in `transactions` array
- Other arrays may be empty if no changes
- New `server_timestamp` returned

### Test 3: Soft Delete Sync
**Purpose**: Verify deleted resources are synced with `deleted_at` timestamp

```bash
# Soft delete a transaction
curl -X DELETE http://localhost:3080/api/transactions/txn-1 \
  -H "Authorization: Bearer $TOKEN"

# Sync
curl -X GET "http://localhost:3080/api/sync?since=$LAST_SYNC" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Expected Result**:
- Deleted transaction appears with `deleted_at` field set
- Accounts, categories, preferences also support `deleted_at`
- Budgets and tags do NOT have `deleted_at` (per schema limitations)

### Test 4: Missing `since` Parameter
**Purpose**: Verify error handling

```bash
curl -X GET "http://localhost:3080/api/sync" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
```

**Expected Result**:
- HTTP 400 Bad Request
- Error message about missing 'since' parameter

### Test 5: Unauthorized Access
**Purpose**: Verify JWT authentication

```bash
curl -X GET "http://localhost:3080/api/sync?since=2024-01-01T00:00:00Z" \
  | jq .
```

**Expected Result**:
- HTTP 401 Unauthorized

## Client Testing

### Test 6: Client Sync Service
**Purpose**: Verify client correctly calls unified endpoint and merges data

```bash
# Start client dev server
cd client && pnpm dev

# Open browser console (http://localhost:3000)
# Trigger sync (login required first)
```

**In Browser Console**:
```javascript
// Inspect sync service
const syncService = window.__syncService; // if exposed for debugging
await syncService.performSync();

// Check CRDT state
const crdt = window.__crdtService; // if exposed for debugging
console.log(crdt.getTransactions());
console.log(crdt.getAccounts());
console.log(crdt.getCategories());
console.log(crdt.getBudgets());
console.log(crdt.getTags());
console.log(crdt.getPreferences());
```

**Expected Result**:
- Client calls `GET /sync?since=<lastSyncAt>`
- All 6 resource types merged into CRDT
- SQLite indices updated (for transactions, accounts, categories)
- `lastSyncAt` updated to `server_timestamp`

## Known Limitations

### Server Database Schema
1. **Tags**: Only `created_at` filter (no `updated_at` or `deleted_at` columns)
   - Tags are immutable after creation
   - Sync query: `WHERE created_at > $since`

2. **Budgets**: Only `updated_at` filter (no `deleted_at` column)
   - Budgets cannot be soft-deleted, only hard-deleted
   - Sync query: `WHERE updated_at > $since`

3. **Others**: Full support with `updated_at > $since OR deleted_at > $since`

### Client CRDT Behavior
1. **SQLite Indices**: Only transactions, accounts, categories indexed
   - Budgets, tags, preferences queried directly from CRDT (no complex queries needed)

2. **Conflict Resolution**: Last-write-wins based on `updated_at` timestamp

## Troubleshooting

### Issue: Empty sync response
- **Check**: User has data in database
- **Check**: `since` parameter is not in the future
- **Check**: User ID in JWT matches data ownership

### Issue: Client sync fails
- **Check**: CORS settings in `server/.env.server`
- **Check**: Client API URL matches server (VITE_API_URL)
- **Check**: JWT token is valid and not expired

### Issue: Type errors in client
- **Check**: CRDT schema matches server response types
- **Check**: Run `cd client && pnpm type-check`

## Next Steps

Once manual testing is complete:

1. **Performance Testing**
   - Test with large datasets (1000+ transactions)
   - Measure sync response time
   - Consider pagination if needed

2. **Edge Case Testing**
   - Concurrent sync operations
   - Network failures & retry logic
   - Very old `since` timestamps (e.g., Unix epoch)

3. **Integration Testing**
   - Automated tests with testcontainers
   - E2E tests with Playwright/Cypress

4. **Documentation**
   - Update API documentation
   - Add sync flow diagrams
   - Document migration guide for clients
