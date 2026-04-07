import { WebFileStore } from "@nuts/web-file-store";
import type { FileMetadata } from "@nuts/web-file-store";
import { db } from "@/core/storage/client";
import { useAuthStore } from "@/features/auth/stores/auth.store";

let fileStoreInstance: WebFileStore | null = null;

export async function getFileStore(): Promise<WebFileStore> {
  if (fileStoreInstance) {
    return fileStoreInstance;
  }

  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error("User not authenticated");
  }

  fileStoreInstance = new WebFileStore(
    {
      execute: async (sql: string, params: any[]) => {
        return await db.execute(sql, params);
      },
    },
    userId,
    {
      maxFileSize: 50 * 1024 * 1024,
      enableThumbnails: true,
      thumbnailMaxWidth: 300,
      thumbnailMaxHeight: 300,
      thumbnailQuality: 0.85,
    }
  );

  await fileStoreInstance.initialize();

  return fileStoreInstance;
}

export async function uploadFile(
  file: File,
  entityType: FileMetadata["relatedEntityType"],
  entityId: string
): Promise<FileMetadata> {
  const store = await getFileStore();
  return await store.put(file, {
    relatedEntityType: entityType,
    relatedEntityId: entityId,
  });
}

export async function getFile(fileId: string): Promise<Blob | null> {
  const store = await getFileStore();
  return await store.getBlob(fileId);
}

export async function getFileThumbnail(fileId: string): Promise<Blob | null> {
  const store = await getFileStore();
  return await store.getThumbnail(fileId);
}

export async function listEntityFiles(
  entityType: FileMetadata["relatedEntityType"],
  entityId: string
): Promise<FileMetadata[]> {
  const store = await getFileStore();
  return await store.list({
    relatedEntityType: entityType,
    relatedEntityId: entityId,
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  const store = await getFileStore();
  await store.delete(fileId);
}

export async function syncPendingFiles(
  uploadFn: (blob: Blob, metadata: FileMetadata) => Promise<void>
): Promise<void> {
  const store = await getFileStore();
  const pending = await store.getPendingSync();

  for (const metadata of pending) {
    try {
      const blob = await store.getBlob(metadata.id);
      if (!blob) {
        await store.markAsError(metadata.id, "File not found in storage");
        continue;
      }

      await uploadFn(blob, metadata);
      await store.markAsSynced(metadata.id);
    } catch (error: any) {
      await store.markAsError(metadata.id, error.message || "Upload failed");
    }
  }
}
