import { nanoid } from "nanoid";
import {
  FileMetadata,
  FolderMetadata,
  FileSystemItem,
  StoreOptions,
  DEFAULT_OPTIONS,
  StorageUsage,
  FileFilter,
  FolderFilter,
  FileBlob,
} from "./types";
import { OPFSManager, OPFSError } from "./opfs";
import { calculateChecksum, verifyChecksum } from "./checksum";
import { generateThumbnail, shouldGenerateThumbnail } from "./thumbnail";

export interface DatabaseAdapter {
  execute(sql: string, params: any[]): Promise<{ results: any[] }>;
}

export class WebFileStoreError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "WebFileStoreError";
  }
}

export class WebFileStore {
  private opfs: OPFSManager;
  private options: Required<StoreOptions>;
  private db: DatabaseAdapter;
  private initialized = false;
  private userId: string;

  constructor(
    db: DatabaseAdapter,
    userId: string,
    options: StoreOptions = {}
  ) {
    this.db = db;
    this.userId = userId;
    this.opfs = new OPFSManager();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.opfs.initialize();
      this.initialized = true;
    } catch (error) {
      if (error instanceof OPFSError) {
        throw new WebFileStoreError(
          `Failed to initialize file store: ${error.message}`,
          "INIT_ERROR",
          error
        );
      }
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new WebFileStoreError(
        "WebFileStore not initialized. Call initialize() first",
        "NOT_INITIALIZED"
      );
    }
  }

  private validateFile(file: File): void {
    if (file.size > this.options.maxFileSize) {
      throw new WebFileStoreError(
        `File size ${file.size} exceeds maximum allowed size ${this.options.maxFileSize}`,
        "FILE_TOO_LARGE"
      );
    }

    if (
      this.options.allowedMimeTypes.length > 0 &&
      !this.options.allowedMimeTypes.includes(file.type)
    ) {
      throw new WebFileStoreError(
        `File type ${file.type} is not allowed`,
        "INVALID_MIME_TYPE"
      );
    }
  }

  async put(
    file: File,
    metadata: Partial<FileMetadata> = {}
  ): Promise<FileMetadata> {
    this.ensureInitialized();
    this.validateFile(file);

    const id = nanoid();
    const timestamp = new Date().toISOString();

    try {
      const checksum = await calculateChecksum(file);

      await this.opfs.writeFile(id, file);

      let thumbnailPath: string | undefined;
      if (
        this.options.enableThumbnails &&
        shouldGenerateThumbnail(file.type)
      ) {
        try {
          const thumbnail = await generateThumbnail(file, {
            maxWidth: this.options.thumbnailMaxWidth,
            maxHeight: this.options.thumbnailMaxHeight,
            quality: this.options.thumbnailQuality,
          });

          if (thumbnail) {
            await this.opfs.writeThumbnail(id, thumbnail);
            thumbnailPath = `${id}/thumbnail`;
          }
        } catch (error) {
          console.warn(`Failed to generate thumbnail for ${id}:`, error);
        }
      }

      const fileMetadata: FileMetadata = {
        id,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: timestamp,
        updatedAt: timestamp,
        syncStatus: "pending",
        checksum,
        thumbnailPath,
        userId: this.userId,
        ...metadata,
      };

      await this.saveMetadata(fileMetadata);

      return fileMetadata;
    } catch (error) {
      try {
        await this.opfs.deleteFile(id);
      } catch {}

      if (error instanceof WebFileStoreError) {
        throw error;
      }

      throw new WebFileStoreError(
        `Failed to store file: ${file.name}`,
        "PUT_ERROR",
        error
      );
    }
  }

  async get(id: string): Promise<File | null> {
    this.ensureInitialized();

    try {
      return await this.opfs.readFile(id);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to retrieve file: ${id}`,
        "GET_ERROR",
        error
      );
    }
  }

  async getBlob(id: string): Promise<Blob | null> {
    this.ensureInitialized();

    try {
      return await this.opfs.readBlob(id);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to retrieve blob: ${id}`,
        "GET_BLOB_ERROR",
        error
      );
    }
  }

  async getWithMetadata(id: string): Promise<FileBlob | null> {
    this.ensureInitialized();

    const [blob, metadata] = await Promise.all([
      this.getBlob(id),
      this.getMetadata(id),
    ]);

    if (!blob || !metadata) {
      return null;
    }

    return { blob, metadata };
  }

  async getThumbnail(id: string): Promise<Blob | null> {
    this.ensureInitialized();

    try {
      return await this.opfs.readThumbnail(id);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to retrieve thumbnail: ${id}`,
        "GET_THUMBNAIL_ERROR",
        error
      );
    }
  }

  async getMetadata(id: string): Promise<FileMetadata | null> {
    this.ensureInitialized();

    try {
      const result = await this.db.execute(
        "SELECT * FROM file_metadata WHERE id = ? AND user_id = ?",
        [id, this.userId]
      );

      if (!result.results || result.results.length === 0) {
        return null;
      }

      return this.mapRowToMetadata(result.results[0]);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to retrieve metadata: ${id}`,
        "GET_METADATA_ERROR",
        error
      );
    }
  }

  async delete(id: string): Promise<void> {
    this.ensureInitialized();

    try {
      await Promise.all([
        this.opfs.deleteFile(id),
        this.db.execute("DELETE FROM file_metadata WHERE id = ? AND user_id = ?", [
          id,
          this.userId,
        ]),
      ]);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to delete file: ${id}`,
        "DELETE_ERROR",
        error
      );
    }
  }

  async list(filter: FileFilter = {}): Promise<FileMetadata[]> {
    this.ensureInitialized();

    try {
      let sql = "SELECT * FROM file_metadata WHERE user_id = ?";
      const params: any[] = [this.userId];

      if (filter.relatedEntityType) {
        sql += " AND related_entity_type = ?";
        params.push(filter.relatedEntityType);
      }

      if (filter.relatedEntityId) {
        sql += " AND related_entity_id = ?";
        params.push(filter.relatedEntityId);
      }

      if (filter.syncStatus) {
        sql += " AND sync_status = ?";
        params.push(filter.syncStatus);
      }

      if (filter.mimeType) {
        sql += " AND mime_type = ?";
        params.push(filter.mimeType);
      }

      sql += " ORDER BY created_at DESC";

      const result = await this.db.execute(sql, params);

      return result.results.map((row) => this.mapRowToMetadata(row));
    } catch (error) {
      throw new WebFileStoreError(
        "Failed to list files",
        "LIST_ERROR",
        error
      );
    }
  }

  async getPendingSync(): Promise<FileMetadata[]> {
    return this.list({ syncStatus: "pending" });
  }

  async markAsSynced(id: string): Promise<void> {
    this.ensureInitialized();

    try {
      const timestamp = new Date().toISOString();
      await this.db.execute(
        "UPDATE file_metadata SET sync_status = ?, updated_at = ?, sync_error = NULL WHERE id = ? AND user_id = ?",
        ["synced", timestamp, id, this.userId]
      );
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to mark file as synced: ${id}`,
        "MARK_SYNCED_ERROR",
        error
      );
    }
  }

  async markAsError(id: string, errorMessage: string): Promise<void> {
    this.ensureInitialized();

    try {
      const timestamp = new Date().toISOString();
      await this.db.execute(
        "UPDATE file_metadata SET sync_status = ?, sync_error = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        ["error", errorMessage, timestamp, id, this.userId]
      );
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to mark file as error: ${id}`,
        "MARK_ERROR_ERROR",
        error
      );
    }
  }

  async verifyIntegrity(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const [blob, metadata] = await Promise.all([
        this.getBlob(id),
        this.getMetadata(id),
      ]);

      if (!blob || !metadata) {
        return false;
      }

      return await verifyChecksum(blob, metadata.checksum);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to verify integrity: ${id}`,
        "VERIFY_ERROR",
        error
      );
    }
  }

  async getStorageUsage(): Promise<StorageUsage> {
    this.ensureInitialized();

    try {
      const estimate = await this.opfs.getStorageEstimate();

      const available = estimate.quota - estimate.usage;
      const usagePercentage = estimate.quota > 0
        ? (estimate.usage / estimate.quota) * 100
        : 0;

      return {
        used: estimate.usage,
        available,
        quota: estimate.quota,
        usage: usagePercentage,
      };
    } catch (error) {
      throw new WebFileStoreError(
        "Failed to get storage usage",
        "STORAGE_USAGE_ERROR",
        error
      );
    }
  }

  async cleanup(olderThan?: Date): Promise<number> {
    this.ensureInitialized();

    try {
      let sql = "SELECT id FROM file_metadata WHERE user_id = ? AND sync_status = ?";
      const params: any[] = [this.userId, "synced"];

      if (olderThan) {
        sql += " AND created_at < ?";
        params.push(olderThan.toISOString());
      }

      const result = await this.db.execute(sql, params);
      const fileIds = result.results.map((row) => row.id);

      await Promise.all(fileIds.map((id) => this.delete(id)));

      return fileIds.length;
    } catch (error) {
      throw new WebFileStoreError(
        "Failed to cleanup files",
        "CLEANUP_ERROR",
        error
      );
    }
  }

  private async saveMetadata(metadata: FileMetadata): Promise<void> {
    await this.db.execute(
      `INSERT INTO file_metadata (
        id, name, mime_type, size, created_at, updated_at,
        sync_status, checksum, thumbnail_path, related_entity_type,
        related_entity_id, sync_error, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.id,
        metadata.name,
        metadata.mimeType,
        metadata.size,
        metadata.createdAt,
        metadata.updatedAt,
        metadata.syncStatus,
        metadata.checksum,
        metadata.thumbnailPath || null,
        metadata.relatedEntityType || null,
        metadata.relatedEntityId || null,
        metadata.syncError || null,
        metadata.userId,
      ]
    );
  }

  private mapRowToMetadata(row: any): FileMetadata {
    return {
      id: row.id,
      name: row.name,
      mimeType: row.mime_type,
      size: row.size,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: row.sync_status,
      checksum: row.checksum,
      thumbnailPath: row.thumbnail_path || undefined,
      relatedEntityType: row.related_entity_type || undefined,
      relatedEntityId: row.related_entity_id || undefined,
      syncError: row.sync_error || undefined,
      userId: row.user_id,
      folderId: row.folder_id || undefined,
    };
  }

  async createFolder(
    name: string,
    parentId?: string
  ): Promise<FolderMetadata> {
    this.ensureInitialized();

    const id = nanoid();
    const timestamp = new Date().toISOString();

    try {
      let path = `/${name}`;
      if (parentId) {
        const parent = await this.getFolder(parentId);
        if (!parent) {
          throw new WebFileStoreError(
            `Parent folder not found: ${parentId}`,
            "PARENT_NOT_FOUND"
          );
        }
        path = `${parent.path}/${name}`;
      }

      const folder: FolderMetadata = {
        id,
        name,
        parentId,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId: this.userId,
        path,
      };

      await this.db.execute(
        `INSERT INTO folders (id, name, parent_id, created_at, updated_at, user_id, path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, parentId || null, timestamp, timestamp, this.userId, path]
      );

      return folder;
    } catch (error) {
      if (error instanceof WebFileStoreError) {
        throw error;
      }
      throw new WebFileStoreError(
        `Failed to create folder: ${name}`,
        "CREATE_FOLDER_ERROR",
        error
      );
    }
  }

  async getFolder(id: string): Promise<FolderMetadata | null> {
    this.ensureInitialized();

    try {
      const result = await this.db.execute(
        "SELECT * FROM folders WHERE id = ? AND user_id = ?",
        [id, this.userId]
      );

      if (!result.results || result.results.length === 0) {
        return null;
      }

      return this.mapRowToFolder(result.results[0]);
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to get folder: ${id}`,
        "GET_FOLDER_ERROR",
        error
      );
    }
  }

  async listFolders(filter: FolderFilter = {}): Promise<FolderMetadata[]> {
    this.ensureInitialized();

    try {
      let sql = "SELECT * FROM folders WHERE user_id = ?";
      const params: any[] = [this.userId];

      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          sql += " AND parent_id IS NULL";
        } else {
          sql += " AND parent_id = ?";
          params.push(filter.parentId);
        }
      }

      sql += " ORDER BY name ASC";

      const result = await this.db.execute(sql, params);
      return result.results.map((row) => this.mapRowToFolder(row));
    } catch (error) {
      throw new WebFileStoreError(
        "Failed to list folders",
        "LIST_FOLDERS_ERROR",
        error
      );
    }
  }

  async listFolderContents(folderId?: string): Promise<FileSystemItem[]> {
    this.ensureInitialized();

    try {
      const [folders, files] = await Promise.all([
        this.listFolders({ parentId: folderId || null }),
        this.list({ folderId: folderId || null }),
      ]);

      const items: FileSystemItem[] = [
        ...folders.map((folder): FileSystemItem => ({
          id: folder.id,
          name: folder.name,
          type: "folder" as const,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          parentId: folder.parentId,
        })),
        ...files.map((file): FileSystemItem => ({
          id: file.id,
          name: file.name,
          type: "file" as const,
          size: file.size,
          mimeType: file.mimeType,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          folderId: file.folderId,
          thumbnailPath: file.thumbnailPath,
          syncStatus: file.syncStatus,
        })),
      ];

      return items;
    } catch (error) {
      throw new WebFileStoreError(
        `Failed to list folder contents: ${folderId}`,
        "LIST_CONTENTS_ERROR",
        error
      );
    }
  }

  async renameFolder(id: string, newName: string): Promise<void> {
    this.ensureInitialized();

    try {
      const folder = await this.getFolder(id);
      if (!folder) {
        throw new WebFileStoreError(
          `Folder not found: ${id}`,
          "FOLDER_NOT_FOUND"
        );
      }

      const timestamp = new Date().toISOString();
      const oldPath = folder.path;
      const newPath = folder.parentId
        ? `${oldPath.substring(0, oldPath.lastIndexOf("/"))}/${newName}`
        : `/${newName}`;

      await this.db.execute(
        "UPDATE folders SET name = ?, path = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        [newName, newPath, timestamp, id, this.userId]
      );

      const subfolders = await this.db.execute(
        "SELECT * FROM folders WHERE path LIKE ? AND user_id = ?",
        [`${oldPath}/%`, this.userId]
      );

      for (const subfolder of subfolders.results) {
        const updatedPath = subfolder.path.replace(oldPath, newPath);
        await this.db.execute(
          "UPDATE folders SET path = ?, updated_at = ? WHERE id = ?",
          [updatedPath, timestamp, subfolder.id]
        );
      }
    } catch (error) {
      if (error instanceof WebFileStoreError) {
        throw error;
      }
      throw new WebFileStoreError(
        `Failed to rename folder: ${id}`,
        "RENAME_FOLDER_ERROR",
        error
      );
    }
  }

  async deleteFolder(id: string, recursive: boolean = false): Promise<void> {
    this.ensureInitialized();

    try {
      const folder = await this.getFolder(id);
      if (!folder) {
        throw new WebFileStoreError(
          `Folder not found: ${id}`,
          "FOLDER_NOT_FOUND"
        );
      }

      const contents = await this.listFolderContents(id);
      if (contents.length > 0 && !recursive) {
        throw new WebFileStoreError(
          "Folder is not empty. Use recursive=true to delete",
          "FOLDER_NOT_EMPTY"
        );
      }

      if (recursive) {
        for (const item of contents) {
          if (item.type === "folder") {
            await this.deleteFolder(item.id, true);
          } else {
            await this.delete(item.id);
          }
        }
      }

      await this.db.execute(
        "DELETE FROM folders WHERE id = ? AND user_id = ?",
        [id, this.userId]
      );
    } catch (error) {
      if (error instanceof WebFileStoreError) {
        throw error;
      }
      throw new WebFileStoreError(
        `Failed to delete folder: ${id}`,
        "DELETE_FOLDER_ERROR",
        error
      );
    }
  }

  async moveFile(fileId: string, targetFolderId?: string): Promise<void> {
    this.ensureInitialized();

    try {
      if (targetFolderId) {
        const folder = await this.getFolder(targetFolderId);
        if (!folder) {
          throw new WebFileStoreError(
            `Target folder not found: ${targetFolderId}`,
            "FOLDER_NOT_FOUND"
          );
        }
      }

      const timestamp = new Date().toISOString();
      await this.db.execute(
        "UPDATE file_metadata SET folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        [targetFolderId || null, timestamp, fileId, this.userId]
      );
    } catch (error) {
      if (error instanceof WebFileStoreError) {
        throw error;
      }
      throw new WebFileStoreError(
        `Failed to move file: ${fileId}`,
        "MOVE_FILE_ERROR",
        error
      );
    }
  }

  async moveFolder(
    folderId: string,
    targetParentId?: string
  ): Promise<void> {
    this.ensureInitialized();

    try {
      const folder = await this.getFolder(folderId);
      if (!folder) {
        throw new WebFileStoreError(
          `Folder not found: ${folderId}`,
          "FOLDER_NOT_FOUND"
        );
      }

      if (targetParentId) {
        const targetParent = await this.getFolder(targetParentId);
        if (!targetParent) {
          throw new WebFileStoreError(
            `Target parent folder not found: ${targetParentId}`,
            "FOLDER_NOT_FOUND"
          );
        }

        if (targetParent.path.startsWith(folder.path)) {
          throw new WebFileStoreError(
            "Cannot move folder into its own subfolder",
            "INVALID_MOVE"
          );
        }
      }

      const timestamp = new Date().toISOString();
      const oldPath = folder.path;
      const newPath = targetParentId
        ? `${(await this.getFolder(targetParentId))!.path}/${folder.name}`
        : `/${folder.name}`;

      await this.db.execute(
        "UPDATE folders SET parent_id = ?, path = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        [targetParentId || null, newPath, timestamp, folderId, this.userId]
      );

      const subfolders = await this.db.execute(
        "SELECT * FROM folders WHERE path LIKE ? AND user_id = ?",
        [`${oldPath}/%`, this.userId]
      );

      for (const subfolder of subfolders.results) {
        const updatedPath = subfolder.path.replace(oldPath, newPath);
        await this.db.execute(
          "UPDATE folders SET path = ?, updated_at = ? WHERE id = ?",
          [updatedPath, timestamp, subfolder.id]
        );
      }
    } catch (error) {
      if (error instanceof WebFileStoreError) {
        throw error;
      }
      throw new WebFileStoreError(
        `Failed to move folder: ${folderId}`,
        "MOVE_FOLDER_ERROR",
        error
      );
    }
  }

  private mapRowToFolder(row: any): FolderMetadata {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userId: row.user_id,
      path: row.path,
    };
  }
}
