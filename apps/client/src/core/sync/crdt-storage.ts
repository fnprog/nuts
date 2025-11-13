import { db } from "@/core/storage/client";
import { Result, ResultAsync } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";
import { logger } from "@/lib/logger";

export class CRDTStorageService {

  async loadDocument(userId: string): Promise<Result<Uint8Array | null, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        await db.initialize();

        const result = await db.execute(
          "SELECT document_binary FROM crdt_documents WHERE user_id = ?",
          [userId]
        );

        if (!result.results || result.results.length === 0) {
          return null;
        }

        const binaryData = result.results[0].document_binary;
        if (binaryData instanceof Uint8Array) {
          return binaryData;
        }

        if (Array.isArray(binaryData)) {
          return new Uint8Array(binaryData);
        }

        logger.warn("Unexpected binary data format:", typeof binaryData);
        return null;
      })(),
      (error) => {
        logger.error("Failed to load CRDT document from database:", error);
        return ServiceError.storage("Failed to load CRDT document", error);
      }
    );
  }

  async saveDocument(userId: string, documentBinary: Uint8Array): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        await db.initialize();

        const timestamp = new Date().toISOString();
        const binaryArray = Array.from(documentBinary);

        const existing = await db.execute(
          "SELECT id FROM crdt_documents WHERE user_id = ?",
          [userId]
        );

        if (existing.results && existing.results.length > 0) {
          await db.execute(
            "UPDATE crdt_documents SET document_binary = ?, updated_at = ? WHERE user_id = ?",
            [binaryArray, timestamp, userId]
          );
        } else {
          await db.execute(
            "INSERT INTO crdt_documents (user_id, document_binary, created_at, updated_at) VALUES (?, ?, ?, ?)",
            [userId, binaryArray, timestamp, timestamp]
          );
        }

        logger.info(`CRDT document saved to database for user: ${userId}`);
      })(),
      (error) => {
        logger.error("Failed to save CRDT document to database:", error);
        return ServiceError.storage("Failed to save CRDT document", error);
      }
    );
  }

  async deleteDocument(userId: string): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        await db.initialize();

        await db.execute(
          "DELETE FROM crdt_documents WHERE user_id = ?",
          [userId]
        );

        logger.info(`CRDT document deleted from database for user: ${userId}`);
      })(),
      (error) => {
        logger.error("Failed to delete CRDT document from database:", error);
        return ServiceError.storage("Failed to delete CRDT document", error);
      }
    );
  }

  async migrateFromLocalStorage(userId: string): Promise<Result<boolean, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const MIGRATION_EXPIRY_DATE = new Date("2026-02-11");

        if (new Date() > MIGRATION_EXPIRY_DATE) {
          logger.info("localStorage migration expired, skipping");
          return false;
        }

        const localStorageKey = "nuts-crdt-document";
        const savedDoc = localStorage.getItem(localStorageKey);

        if (!savedDoc) {
          return false;
        }

        logger.info("Migrating CRDT document from localStorage to database...");

        const binaryDoc = new Uint8Array(JSON.parse(savedDoc));
        const saveResult = await this.saveDocument(userId, binaryDoc);

        if (saveResult.isErr()) {
          throw saveResult.error;
        }

        localStorage.removeItem(localStorageKey);
        logger.info("Successfully migrated CRDT document from localStorage");

        return true;
      })(),
      (error) => {
        logger.error("Failed to migrate CRDT document from localStorage:", error);
        return ServiceError.storage("Failed to migrate CRDT document", error);
      }
    );
  }
}

export const crdtStorage = new CRDTStorageService();
