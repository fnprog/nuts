export class OPFSError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "OPFSError";
  }
}

export class OPFSManager {
  private root: FileSystemDirectoryHandle | null = null;
  private filesDir: FileSystemDirectoryHandle | null = null;

  async initialize(): Promise<void> {
    try {
      if (!("storage" in navigator) || !("getDirectory" in navigator.storage)) {
        throw new OPFSError(
          "OPFS is not supported in this browser",
          "initialize"
        );
      }

      this.root = await navigator.storage.getDirectory();
      this.filesDir = await this.root.getDirectoryHandle("files", {
        create: true,
      });
    } catch (error) {
      throw new OPFSError(
        "Failed to initialize OPFS",
        "initialize",
        error
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.filesDir) {
      throw new OPFSError(
        "OPFS not initialized. Call initialize() first",
        "ensureInitialized"
      );
    }
  }

  async writeFile(id: string, blob: Blob): Promise<void> {
    this.ensureInitialized();

    try {
      const fileDir = await this.filesDir!.getDirectoryHandle(id, {
        create: true,
      });
      const fileHandle = await fileDir.getFileHandle("data", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      throw new OPFSError(
        `Failed to write file: ${id}`,
        "writeFile",
        error
      );
    }
  }

  async readFile(id: string): Promise<File | null> {
    this.ensureInitialized();

    try {
      const fileDir = await this.filesDir!.getDirectoryHandle(id, {
        create: false,
      });
      const fileHandle = await fileDir.getFileHandle("data", { create: false });
      return await fileHandle.getFile();
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return null;
      }
      throw new OPFSError(
        `Failed to read file: ${id}`,
        "readFile",
        error
      );
    }
  }

  async readBlob(id: string): Promise<Blob | null> {
    const file = await this.readFile(id);
    return file;
  }

  async writeThumbnail(id: string, blob: Blob): Promise<void> {
    this.ensureInitialized();

    try {
      const fileDir = await this.filesDir!.getDirectoryHandle(id, {
        create: true,
      });
      const thumbnailHandle = await fileDir.getFileHandle("thumbnail", {
        create: true,
      });
      const writable = await thumbnailHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      throw new OPFSError(
        `Failed to write thumbnail: ${id}`,
        "writeThumbnail",
        error
      );
    }
  }

  async readThumbnail(id: string): Promise<Blob | null> {
    this.ensureInitialized();

    try {
      const fileDir = await this.filesDir!.getDirectoryHandle(id, {
        create: false,
      });
      const thumbnailHandle = await fileDir.getFileHandle("thumbnail", {
        create: false,
      });
      const file = await thumbnailHandle.getFile();
      return file;
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return null;
      }
      throw new OPFSError(
        `Failed to read thumbnail: ${id}`,
        "readThumbnail",
        error
      );
    }
  }

  async deleteFile(id: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.filesDir!.removeEntry(id, { recursive: true });
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return;
      }
      throw new OPFSError(
        `Failed to delete file: ${id}`,
        "deleteFile",
        error
      );
    }
  }

  async fileExists(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.filesDir!.getDirectoryHandle(id, { create: false });
      return true;
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return false;
      }
      throw new OPFSError(
        `Failed to check file existence: ${id}`,
        "fileExists",
        error
      );
    }
  }

  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
  }> {
    try {
      if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
        return { usage: 0, quota: 0 };
      }

      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      throw new OPFSError(
        "Failed to get storage estimate",
        "getStorageEstimate",
        error
      );
    }
  }

  async listFiles(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const fileIds: string[] = [];
      for await (const [name, entry] of (this.filesDir as any).entries()) {
        if (entry.kind === "directory") {
          fileIds.push(name);
        }
      }
      return fileIds;
    } catch (error) {
      throw new OPFSError(
        "Failed to list files",
        "listFiles",
        error
      );
    }
  }
}
