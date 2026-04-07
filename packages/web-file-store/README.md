# @nuts/web-file-store

Local-first file storage abstraction over OPFS (Origin Private File System) with sync capabilities.

## Features

- **Local-First Storage**: Files stored securely in OPFS, accessible offline
- **Automatic Thumbnails**: Generate image thumbnails for preview
- **Integrity Checking**: SHA-256 checksums for file verification
- **Sync Management**: Track sync status (pending/synced/error) for server sync
- **Type-Safe**: Full TypeScript support
- **Storage Quotas**: Monitor storage usage and quotas
- **Entity Relations**: Associate files with transactions, accounts, receipts, etc.
- **Flexible Filtering**: Query files by entity, mime type, sync status

## Installation

```bash
pnpm add @nuts/web-file-store
```

## Usage

### Initialize the Store

```typescript
import { WebFileStore } from "@nuts/web-file-store";
import { db } from "@/core/storage/client";

const fileStore = new WebFileStore(
  db.getRaw(),
  userId,
  {
    maxFileSize: 50 * 1024 * 1024,
    enableThumbnails: true,
    thumbnailMaxWidth: 300,
    thumbnailMaxHeight: 300,
  }
);

await fileStore.initialize();
```

### Store a File

```typescript
const file = event.target.files[0];

const metadata = await fileStore.put(file, {
  relatedEntityType: "transaction",
  relatedEntityId: transactionId,
});

console.log("File stored:", metadata.id);
```

### Retrieve a File

```typescript
const file = await fileStore.get(fileId);
const blob = await fileStore.getBlob(fileId);
const metadata = await fileStore.getMetadata(fileId);
const thumbnail = await fileStore.getThumbnail(fileId);
```

### List Files

```typescript
const allFiles = await fileStore.list();

const transactionFiles = await fileStore.list({
  relatedEntityType: "transaction",
  relatedEntityId: "txn_123",
});

const pendingSync = await fileStore.getPendingSync();
```

### Sync Management

```typescript
const pending = await fileStore.getPendingSync();

for (const file of pending) {
  try {
    const blob = await fileStore.getBlob(file.id);
    await uploadToServer(blob);
    await fileStore.markAsSynced(file.id);
  } catch (error) {
    await fileStore.markAsError(file.id, error.message);
  }
}
```

### Delete a File

```typescript
await fileStore.delete(fileId);
```

### Storage Management

```typescript
const usage = await fileStore.getStorageUsage();
console.log(`Used: ${usage.used} bytes`);
console.log(`Available: ${usage.available} bytes`);
console.log(`Usage: ${usage.usage}%`);

const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
const deletedCount = await fileStore.cleanup(oneMonthAgo);
console.log(`Cleaned up ${deletedCount} files`);
```

### Verify File Integrity

```typescript
const isValid = await fileStore.verifyIntegrity(fileId);
if (!isValid) {
  console.error("File corrupted!");
}
```

## API Reference

### `WebFileStore`

#### Constructor

```typescript
constructor(
  db: DatabaseAdapter,
  userId: string,
  options?: StoreOptions
)
```

#### Methods

- `initialize(): Promise<void>` - Initialize the store
- `put(file: File, metadata?: Partial<FileMetadata>): Promise<FileMetadata>` - Store a file
- `get(id: string): Promise<File | null>` - Retrieve a file
- `getBlob(id: string): Promise<Blob | null>` - Retrieve file as blob
- `getMetadata(id: string): Promise<FileMetadata | null>` - Get file metadata
- `getThumbnail(id: string): Promise<Blob | null>` - Get thumbnail
- `delete(id: string): Promise<void>` - Delete a file
- `list(filter?: FileFilter): Promise<FileMetadata[]>` - List files
- `getPendingSync(): Promise<FileMetadata[]>` - Get files pending sync
- `markAsSynced(id: string): Promise<void>` - Mark file as synced
- `markAsError(id: string, error: string): Promise<void>` - Mark sync error
- `verifyIntegrity(id: string): Promise<boolean>` - Verify file integrity
- `getStorageUsage(): Promise<StorageUsage>` - Get storage usage stats
- `cleanup(olderThan?: Date): Promise<number>` - Clean up synced files

### Types

```typescript
interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: "pending" | "synced" | "error";
  checksum: string;
  thumbnailPath?: string;
  relatedEntityType?: "transaction" | "account" | "receipt" | "budget" | "document";
  relatedEntityId?: string;
  syncError?: string;
  userId: string;
}

interface StoreOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  enableThumbnails?: boolean;
  thumbnailMaxWidth?: number;
  thumbnailMaxHeight?: number;
  thumbnailQuality?: number;
}

interface StorageUsage {
  used: number;
  available: number;
  quota: number;
  usage: number;
}
```

## Security

- Files stored in OPFS are origin-private (not accessible by other origins)
- SHA-256 checksums ensure file integrity
- User ID scoped - users can only access their own files
- File type validation via allowedMimeTypes

## Browser Support

Requires browsers with OPFS support:
- Chrome 86+
- Edge 86+
- Opera 72+
- Safari 15.2+
- Firefox (behind flag)

## Architecture

```
WebFileStore
├── OPFS (File Blobs)
│   └── /files/{id}/
│       ├── data (actual file)
│       └── thumbnail (optional)
└── SQLite (Metadata)
    └── file_metadata table
```

## License

MIT
