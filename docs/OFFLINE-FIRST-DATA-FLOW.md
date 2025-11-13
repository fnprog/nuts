# Offline-First Data Flow Architecture

## Overview

Nuts Finance uses a dual-layer offline-first architecture that separates writes from reads for optimal performance. This document explains the complete data flow from user actions to storage and synchronization.

## Architecture Principles

### 1. Source of Truth: CRDT (Automerge)
- **Storage**: IndexedDB via `crdt-storage.ts`
- **Purpose**: Conflict-free writes, offline support, automatic merge
- **Technology**: Automerge CRDT library
- **Data Model**: Immutable document containing all user data

### 2. Query Layer: SQLite (Kysely)
- **Storage**: OPFS (Origin Private File System) via `kysely-query.service.ts`
- **Purpose**: Fast SQL queries, filtering, aggregations
- **Technology**: SQL.js + Kysely query builder
- **Data Model**: Materialized view rebuilt from CRDT

### 3. Server Sync: PostgreSQL
- **Purpose**: Cloud backup, multi-device sync, collaboration
- **Sync Strategy**: Bidirectional sync every 30 seconds (when online + authenticated)
- **Conflict Resolution**: CRDT automatic merge + last-write-wins timestamps

---

## Data Flow Diagrams

### Write Flow (Creating/Updating Data)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER ACTION (Create Transaction)                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: transactionService.createTransaction()                         │
│  Location: client/src/features/transactions/services/transaction.service.ts
│  - Validates input                                                       │
│  - Generates UUID                                                        │
│  - Applies business rules                                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: crdtService.createTransaction()                                │
│  Location: client/src/core/sync/crdt.ts                                 │
│  - Adds transaction to Automerge document                                │
│  - Returns immediately (optimistic write)                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: crdtStorage.saveDocument()                                     │
│  Location: client/src/core/sync/crdt-storage.ts                         │
│  - Persists Automerge document to IndexedDB                              │
│  - Triggers change listeners                                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: kyselyQueryService.rebuildFromCRDT()                           │
│  Location: client/src/core/sync/kysely-query.service.ts                 │
│  - Rebuilds SQLite from CRDT (batch inserts)                             │
│  - Updates materialized view                                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: Background Sync (if online + authenticated)                    │
│  Location: client/src/core/sync/sync.ts                                 │
│  - Queues changes for server                                             │
│  - Syncs every 30 seconds                                                │
│  - Handles conflicts via CRDT merge                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Read Flow (Querying Data)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USER VIEWS TRANSACTION LIST                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: useTransactionsQuery()                                          │
│  Location: client/src/features/transactions/services/transaction.queries.ts
│  - React Query hook                                                      │
│  - Manages cache, refetch, pagination                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: transactionService.getTransactions()                           │
│  Location: client/src/features/transactions/services/transaction.service.ts
│  - Builds query parameters                                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: kyselyQueryService.getTransactions()                           │
│  Location: client/src/core/sync/kysely-query.service.ts                 │
│  - Executes SQL query against SQLite                                     │
│  - Applies filters, sorting, pagination                                  │
│  - Returns results instantly (indexed queries)                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: UI Renders Results                                              │
│  Location: client/src/routes/dashboard_/transactions/                   │
│  - React components display data                                         │
│  - Real-time updates via React Query                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sync Flow (Server Synchronization)

```
┌─────────────────────────────────────────────────────────────────────────┐
│         Background Sync Timer (Every 30 seconds when online)             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: syncService.performSync()                                       │
│  Location: client/src/core/sync/sync.ts                                 │
│  - Checks connectivity and auth                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: Push Local Changes to Server                                   │
│  - Reads CRDT document                                                   │
│  - Extracts changed entities                                             │
│  - POST to /api/sync endpoint                                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: Pull Server Changes                                             │
│  - GET from /api/sync endpoint                                           │
│  - Receives server updates since last sync                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: Merge Server Changes into CRDT                                 │
│  - Automerge automatic conflict resolution                               │
│  - Last-write-wins for simple conflicts                                  │
│  - Preserves both versions for complex conflicts                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: Rebuild SQLite from Updated CRDT                                │
│  - kyselyQueryService.rebuildFromCRDT()                                  │
│  - Clears all tables                                                     │
│  - Batch inserts (100 per batch)                                         │
│  - Logs performance timing                                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 6: React Query Cache Invalidation                                 │
│  - All queries automatically refetch                                     │
│  - UI updates with merged data                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Initialization Flow (App Startup)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APP STARTS                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: offlineFirstInitService.initialize()                           │
│  Location: client/src/core/sync/init.service.ts                         │
│  - Orchestrates all service initialization                               │
│  - Handles retries and timeouts                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: anonymousUserService.initialize()                              │
│  - Creates/loads anonymous user ID                                       │
│  - Enables offline usage before login                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: authService.initialize()                                        │
│  - Loads auth tokens from localStorage                                   │
│  - Validates session                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: crdtService.initialize()                                        │
│  Location: client/src/core/sync/crdt.ts                                 │
│  - Loads Automerge document from IndexedDB                               │
│  - Creates new document if none exists                                   │
│  - Runs migrations if needed                                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: kyselyQueryService.initialize()                                │
│  Location: client/src/core/sync/kysely-query.service.ts                 │
│  - Initializes SQL.js WASM module                                        │
│  - Opens SQLite database in OPFS                                         │
│  - Runs migrations (client-side schema)                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 6: Load Default Categories (if new user)                          │
│  - Inserts default expense/income categories                             │
│  - Adds to both CRDT and SQLite                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 7: Rebuild SQLite from CRDT                                        │
│  - kyselyQueryService.rebuildFromCRDT()                                  │
│  - Ensures SQLite matches CRDT state                                     │
│  - Includes: transactions, accounts, categories, rules                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 8: syncService.initialize()                                        │
│  Location: client/src/core/sync/sync.ts                                 │
│  - Starts background sync (if online + authenticated)                    │
│  - Sets up 30-second interval                                            │
│  - Handles offline mode gracefully                                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         APP READY                                        │
│  - User can interact immediately                                         │
│  - All data operations work offline                                      │
│  - Background sync runs automatically                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Services

### Core Sync Services

| Service | File | Purpose |
|---------|------|---------|
| `crdtService` | `client/src/core/sync/crdt.ts` | Manages Automerge CRDT document lifecycle |
| `crdtStorage` | `client/src/core/sync/crdt-storage.ts` | Persists CRDT to IndexedDB |
| `kyselyQueryService` | `client/src/core/sync/kysely-query.service.ts` | SQL query layer on SQLite |
| `syncService` | `client/src/core/sync/sync.ts` | Bidirectional server sync |
| `offlineFirstInitService` | `client/src/core/sync/init.service.ts` | Orchestrates initialization |
| `connectivityService` | `client/src/core/sync/connectivity.ts` | Monitors network status |

### Feature Services

| Service | File | Purpose |
|---------|------|---------|
| `transactionService` | `client/src/features/transactions/services/transaction.service.ts` | Transaction business logic |
| `accountService` | `client/src/features/accounts/services/account.ts` | Account management |
| `categoryService` | `client/src/features/categories/services/category.service.ts` | Category management |
| `dataMigrationService` | `client/src/core/sync/data-migration.ts` | Migrate anonymous → authenticated |

---

## Storage Locations

### 1. CRDT Storage (IndexedDB)
- **Database**: `nuts-crdt-storage`
- **Object Store**: `documents`
- **Key**: `{userId}`
- **Value**: Automerge binary document
- **Size**: Compact (CRDT compression)

### 2. SQLite Storage (OPFS)
- **Location**: `/.sqlite/nuts.db` (Origin Private File System)
- **Format**: SQLite3 database
- **Access**: Web Worker via SQL.js
- **Size**: ~10-100MB for typical usage

### 3. Server Storage (PostgreSQL)
- **Location**: Cloud server
- **Tables**: `transactions`, `accounts`, `categories`, `rules`, etc.
- **Purpose**: Multi-device sync, backup, collaboration

---

## Why Two Local Databases?

### CRDT (IndexedDB) - Write Optimized
- ✅ Instant writes (no schema validation)
- ✅ Automatic conflict resolution
- ✅ Perfect for offline-first
- ✅ Immutable history (great for undo/redo)
- ❌ Slow queries (O(n) scans)
- ❌ No SQL (filtering/aggregation requires full scan)

### SQLite (OPFS) - Read Optimized
- ✅ Blazing fast queries (indexed)
- ✅ Full SQL support (joins, aggregations, filters)
- ✅ Efficient for complex queries
- ✅ Great for reporting/analytics
- ❌ Slower writes (schema validation)
- ❌ No automatic conflict resolution

### Combined Benefits
- **Writes**: Instant CRDT writes + async SQLite rebuild
- **Reads**: Fast SQLite queries with indexes
- **Sync**: CRDT automatic merge handles conflicts
- **Offline**: Both work offline, sync when online

---

## Migrations

### ⚠️ IMPORTANT: Two Separate Migration Systems

#### Client-Side Migrations (SQLite)
- **Location**: `client/src/core/storage/client.ts` (embedded in code)
- **Purpose**: SQLite schema changes for the query layer
- **When**: Run on app startup if schema version changes
- **Example**: Adding indexes, new columns, table structure changes
- **Storage**: Schema version in SQLite `_meta` table

#### Server-Side Migrations (PostgreSQL)
- **Location**: `server/database/migrations/*.sql`
- **Purpose**: PostgreSQL schema changes on the server
- **When**: Run via migration tool before deployment
- **Example**: Adding tables, columns, constraints on server DB
- **Storage**: Migration history in PostgreSQL

**These are COMPLETELY INDEPENDENT systems:**
- Client migrations = SQLite structure (materialized view)
- Server migrations = PostgreSQL structure (source of truth for server)
- CRDT has NO schema (schema-less document store)

---

## Performance Characteristics

### Write Performance
- **CRDT Write**: < 10ms (in-memory change)
- **IndexedDB Persist**: < 50ms (async, non-blocking)
- **SQLite Rebuild**: 
  - Small dataset (<100 transactions): < 100ms
  - Medium dataset (1,000 transactions): ~500ms
  - Large dataset (10,000 transactions): ~2-5s
- **Optimization**: Batch inserts (100 per batch) for 50-100x speedup

### Read Performance
- **SQLite Query**: < 10ms (with indexes)
- **React Query Cache**: < 1ms (in-memory)
- **Network Fetch**: 100-500ms (only when cache misses)

### Sync Performance
- **Background Sync**: Every 30 seconds (when online)
- **Sync Duration**: 
  - Few changes: < 500ms
  - Many changes: 1-3s
- **Conflict Resolution**: Automatic via Automerge CRDT

---

## Offline Scenarios

### Scenario 1: Complete Offline (No Network)
1. User creates transaction
2. Write to CRDT (instant)
3. Rebuild SQLite (async)
4. Sync queued for later
5. User sees transaction immediately
6. When online: Auto-sync to server

### Scenario 2: No Authentication (Guest Mode)
1. User uses app without login
2. Anonymous user ID generated
3. All data stored locally (CRDT + SQLite)
4. No server sync
5. When user logs in: `dataMigrationService` merges guest data

### Scenario 3: Server Down (Network Available)
1. App detects server unavailable
2. Operates in offline mode
3. All writes to CRDT
4. Sync retries with exponential backoff
5. When server returns: Auto-sync queued changes

---

## Debugging Tips

### View CRDT State
```javascript
// In browser console
const doc = await crdtService.getDocument();
console.log(doc);
```

### View SQLite Data
```javascript
// In browser console
const db = kyselyQueryService.getDb();
const transactions = await db.selectFrom('transactions').selectAll().execute();
console.log(transactions);
```

### Monitor Sync Status
```javascript
// In browser console
syncService.subscribeSyncState((state) => {
  console.log('Sync status:', state);
});
```

### Check Rebuild Performance
- Look for `[KYSELY]` logs in console
- Shows timing: "Database rebuilt from CRDT data in 2.34s"
- Shows counts: "accounts, transactions, categories, rules"

---

## Recent Changes (2025-11-11)

### Removed Redundant SQLite System
- **Before**: Two separate SQLite systems (`sqlite-index.ts` + `kysely-query.service.ts`)
- **After**: Single unified system (`kysely-query.service.ts`)
- **Impact**: 
  - Removed 543 lines of duplicate code
  - Simplified architecture
  - Fixed bug: Rules now included in rebuild (previously missing)

### Added Batch Inserts
- **Before**: Individual inserts (1 per transaction)
- **After**: Batch inserts (100 per batch)
- **Impact**: 50-100x performance improvement for large datasets
- **Logging**: Progress indicators for >1000 transactions

### Performance Monitoring
- Added timing logs for rebuild operations
- Shows duration in seconds with 2 decimal precision
- Logs entity counts for debugging

---

## Future Improvements

### Short Term
- Add progress callbacks for rebuild (for loading UI)
- Transaction wrapping for atomic rebuilds
- Telemetry/metrics for rebuild performance
- Better conflict UI (show user when conflicts occur)

### Long Term
- Incremental SQLite updates (instead of full rebuild)
- CRDT subscriptions for real-time updates
- Background Web Worker for SQLite rebuild
- Compression for large CRDT documents
- Multi-user collaboration with CRDT sync

---

## References

- [Automerge CRDT Documentation](https://automerge.org/)
- [Kysely Query Builder](https://kysely.dev/)
- [Origin Private File System (OPFS)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [React Query](https://tanstack.com/query/latest)
