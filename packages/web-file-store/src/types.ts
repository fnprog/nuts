export type SyncStatus = "pending" | "synced" | "error";

export type FileEntityType = "transaction" | "account" | "receipt" | "budget" | "document";

export interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  checksum: string;
  thumbnailPath?: string;
  relatedEntityType?: FileEntityType;
  relatedEntityId?: string;
  syncError?: string;
  userId: string;
  folderId?: string;
}

export interface FolderMetadata {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  path: string;
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  parentId?: string;
  thumbnailPath?: string;
  syncStatus?: SyncStatus;
}

export interface StoreOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  enableThumbnails?: boolean;
  thumbnailMaxWidth?: number;
  thumbnailMaxHeight?: number;
  thumbnailQuality?: number;
  enableCompression?: boolean;
  compressionQuality?: number;
}

export interface StorageUsage {
  used: number;
  available: number;
  quota: number;
  usage: number;
}

export interface FileFilter {
  relatedEntityType?: FileEntityType;
  relatedEntityId?: string;
  syncStatus?: SyncStatus;
  mimeType?: string;
  userId?: string;
  folderId?: string;
}

export interface FolderFilter {
  parentId?: string;
  userId?: string;
}

export interface FileBlob {
  blob: Blob;
  metadata: FileMetadata;
}

export const DEFAULT_OPTIONS: Required<StoreOptions> = {
  maxFileSize: 100 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/csv",
    "text/plain",
    "application/json",
  ],
  enableThumbnails: true,
  thumbnailMaxWidth: 300,
  thumbnailMaxHeight: 300,
  thumbnailQuality: 0.85,
  enableCompression: false,
  compressionQuality: 0.85,
};
