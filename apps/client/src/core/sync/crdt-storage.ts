import { db } from "@/core/storage/client";
import { Result, ResultAsync } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";
import { logger } from "@/lib/logger";

export class CRDTStorageService {
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await db.initialize();
    this.initialized = true;
  }

  async loadDocument(userId: string): Promise<Result<Uint8Array | null, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        await this.ensureInitialized();

        const result = await db.execute("SELECT document_binary FROM crdt_documents WHERE user_id = ?", [userId]);

        if (!result.results || result.results.length === 0) return null;

        const binaryData = result.results[0].document_binary;

        if (binaryData instanceof Uint8Array) return binaryData;
        if (Array.isArray(binaryData)) return new Uint8Array(binaryData);

        logger.warn("Unexpected binary data format for CRDT document:", typeof binaryData);
        return null;
      })(),
      (error) => {
        logger.error("Failed to load CRDT document:", error);
        return ServiceError.storage("Failed to load CRDT document", error);
      }
    );
  }

  async saveDocument(userId: string, documentBinary: Uint8Array): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        await this.ensureInitialized();

        const timestamp = new Date().toISOString();

        // ON CONFLICT eliminates the SELECT → INSERT/UPDATE TOCTOU race.
        // If user_id already exists the row is updated in place; otherwise inserted.
        // The binary is passed as-is — the wa-sqlite driver accepts Uint8Array directly,
        // avoiding the expensive Array.from() conversion on every persist() call.
        await db.execute(
          `INSERT INTO crdt_documents (user_id, document_binary, created_at, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             document_binary = excluded.document_binary,
             updated_at      = excluded.updated_at`,
          [userId, documentBinary, timestamp, timestamp]
        );

        logger.info(`CRDT document saved for user: ${userId}`);
      })(),
      (error) => {
        logger.error("Failed to save CRDT document:", error);
        return ServiceError.storage("Failed to save CRDT document", error);
      }
    );
  }

  async deleteDocument(userId: string): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        await this.ensureInitialized();
        await db.execute("DELETE FROM crdt_documents WHERE user_id = ?", [userId]);
        logger.info(`CRDT document deleted for user: ${userId}`);
      })(),
      (error) => {
        logger.error("Failed to delete CRDT document:", error);
        return ServiceError.storage("Failed to delete CRDT document", error);
      }
    );
  }
}

export const crdtStorage = new CRDTStorageService();
