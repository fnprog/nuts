# wa-sqlite Worker Integration - Local-First Database Architecture

This document describes the implementation of wa-sqlite with Web Worker integration for the offline-first architecture, providing non-blocking database operations with persistent OPFS storage.

## Overview

The wa-sqlite worker integration provides:

- **Non-blocking operations** using Web Workers for database access
- **Persistent storage** with Origin Private File System (OPFS) VFS
- **High performance** through dedicated worker thread execution
- **Type-safe operations** with raw SQL and proper error handling
- **Automatic persistence** without manual save operations

## Architecture

### File Structure

```
client/src/core/database/
├── index.ts                    # Main exports
├── client.ts                   # Database client with worker communication
├── sqlite.worker.js            # Web Worker running wa-sqlite with OPFS
├── types.ts                    # Common types and utilities
└── schema/
    ├── index.ts                # Schema exports
    ├── users.ts                # User table schema
    ├── currencies.ts           # Currency table schema + seed data
    ├── accounts.ts             # Account table schema
    ├── categories.ts           # Category table schema
    ├── transactions.ts         # Transaction table schema
    ├── preferences.ts          # Preferences table schema
    └── tags.ts                 # Tags table schema
```

### Core Components

#### 1. LocalDatabaseClient (`client.ts`)

- Manages Web Worker initialization and communication
- Provides async API for database operations
- Handles schema creation and data seeding
- Manages worker lifecycle and error handling

#### 2. SQLite Worker (`sqlite.worker.js`)

- Runs wa-sqlite in dedicated worker thread
- Uses OPFSCoopSyncVFS for persistent storage
- Handles all database operations asynchronously
- Provides message-based communication interface

#### 3. Database Schemas (`schema/`)

- Table definitions for type safety and documentation
- Default values and validation rules
- Support for relationships and foreign keys

#### 4. DrizzleQueryService (`services/drizzle-query.service.ts`)

- Provides high-level query methods using raw SQL
- Handles CRDT data synchronization
- Optimized query performance with proper SQL

## Migration from sql.js

### Before (sql.js - Blocking)

```typescript
// Blocking main thread operations
const db = new SQL.Database();
db.run("INSERT INTO transactions VALUES (?, ?, ?)", [id, amount, type]);
const result = db.exec("SELECT * FROM transactions");
```

### After (wa-sqlite Worker - Non-blocking)

```typescript
// Async, non-blocking operations
await localDb.initialize();
const result = await localDb.execute("INSERT INTO transactions VALUES (?, ?, ?)", [id, amount, type]);
const data = await localDb.execute("SELECT * FROM transactions");
```

## Schema Design

### Core Principles

1. **Backend Compatibility**: Schemas mirror backend PostgreSQL tables
2. **Type Safety**: Full TypeScript integration with proper typing
3. **Validation**: Built-in data validation and constraints
4. **Performance**: Proper indexing for common query patterns

### Key Features

- **Audit Fields**: `created_at`, `updated_at`, `deleted_at` for all tables
- **Soft Deletes**: Using `deleted_at` field instead of hard deletes
- **Foreign Keys**: Proper relationships between tables
- **JSON Fields**: Support for flexible metadata storage

## Usage Examples

### Initialize Database

```typescript
import { localDb } from "@/core/database";

await localDb.initialize();
```

### Execute Queries

```typescript
// Insert data
await localDb.execute("INSERT INTO transactions (id, amount, type, account_id, category_id) VALUES (?, ?, ?, ?, ?)", [id, amount, type, accountId, categoryId]);

// Query data
const result = await localDb.execute("SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY transaction_datetime DESC");
console.log(result.results); // Array of transaction objects
```

### CRDT Integration

```typescript
import { drizzleQueryService } from "@/core/offline-first";

// Rebuild database from CRDT data
await drizzleQueryService.rebuildFromCRDT(transactions, accounts, categories);
```

## Performance Optimizations

### Worker Thread Benefits

- **Non-blocking UI**: Database operations don't freeze the interface
- **Dedicated Resources**: Worker has its own memory and CPU allocation
- **Concurrent Operations**: Multiple queries can run simultaneously
- **Persistent Storage**: OPFS provides fast, persistent file access

### Indexing Strategy

- **Primary Keys**: All tables have UUID primary keys
- **Foreign Keys**: Indexed for join performance
- **Query Patterns**: Indexes on commonly filtered fields
- **Date Ranges**: Optimized for transaction date filtering

## OPFS Storage

### Benefits

- **Persistence**: Data survives browser restarts and updates
- **Performance**: Direct file system access, faster than IndexedDB
- **Storage Quota**: Access to larger storage allocations
- **Security**: Isolated storage per origin

### Implementation

```javascript
// Worker automatically uses OPFS
const vfs = new OPFSCoopSyncVFS();
await vfs.mount();
this.sqlite3.vfs_register(vfs, false);
this.db = await this.sqlite3.open_v2("nuts.db", undefined, "OPFSCoopSyncVFS");
```

## Testing

### Browser Console Testing

```javascript
// Test worker initialization
await localDb.initialize();

// Test basic operations
const result = await localDb.execute("SELECT COUNT(*) as count FROM transactions");
console.log("Transaction count:", result.results[0].count);

// Test service integration
const stats = await drizzleQueryService.getStats();
console.log("Database stats:", stats);
```

### Validation Tests

- Worker initialization and OPFS mounting
- Database operations and persistence
- Query performance and correctness
- Data integrity across sessions

## Benefits Over sql.js

### Performance

- **Non-blocking**: Main thread remains responsive during DB operations
- **Worker Isolation**: Database work doesn't compete with UI rendering
- **OPFS Speed**: Faster storage access than IndexedDB
- **Concurrent Queries**: Multiple operations can run in parallel

### Reliability

- **Persistence**: Data survives page refreshes and browser crashes
- **Storage Quota**: Access to larger storage allocations
- **Error Isolation**: Worker errors don't crash the main application
- **Memory Management**: Worker manages its own memory usage

### Developer Experience

- **Async API**: Modern promise-based interface
- **Error Handling**: Proper error propagation from worker
- **Debugging**: Worker console logging and debugging
- **Type Safety**: TypeScript integration with schema definitions

## Future Enhancements

### Planned Features

1. **Query Caching**: Intelligent result caching in worker
2. **Compression**: Data compression for storage efficiency
3. **Backup/Restore**: Database backup and restore functionality
4. **Migration System**: Automated schema migrations

### Performance Improvements

1. **Batch Operations**: Optimized bulk data operations
2. **Query Optimization**: Advanced query planning
3. **Connection Pooling**: Multiple worker instances for high load
4. **Real-time Updates**: Live query subscriptions

## Migration Guide

### For Existing Code

1. Replace synchronous `db.run()` calls with async `localDb.execute()`
2. Update `db.exec()` calls to use `localDb.execute()` with proper result handling
3. Replace manual persistence calls with automatic OPFS handling
4. Update error handling for async operations

### Breaking Changes

- All database operations are now asynchronous
- Result format changed from sql.js arrays to objects
- Manual persistence calls are no longer needed
- Worker communication requires proper error handling

## Troubleshooting

### Common Issues

1. **Worker Initialization**: Check browser support for Web Workers and OPFS
2. **OPFS Access**: Ensure HTTPS and proper browser permissions
3. **Storage Quota**: Monitor storage usage and handle quota exceeded errors
4. **Async Errors**: Ensure proper await usage and error handling

### Debug Tools

- Browser DevTools Application tab for OPFS inspection
- Worker console logging for database operation debugging
- Performance monitoring for worker thread usage
- Storage quota monitoring and management
