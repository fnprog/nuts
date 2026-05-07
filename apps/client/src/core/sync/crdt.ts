import { next as Automerge } from "@automerge/automerge";
import type { CRDTDocument, CRDTTransaction, CRDTAccount, CRDTCategory, CRDTBudget, CRDTTag, CRDTPreference, CRDTRule, CollectionKey, CollectionEntity, CRDTRecurringTransaction, CRDTNotification, CRDTPlugin } from "@nuts/types";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { Result, ok, err, ResultAsync } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";
import { logger } from "@/lib/logger";
import { crdtStorage } from "./crdt-storage";

/**
 * CRDT Service for Offline-First Architecture
 *
 * Handles Automerge document operations, persistence, and synchronization.
 * This service manages the CRDT document lifecycle and provides APIs for
 * local-first data operations.
 */



// Initial State
const makeInitialDocument = (userId: string): CRDTDocument => ({
  version: "1.0.0",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: userId,
  transactions: {},
  accounts: {},
  categories: {},
  budgets: {},
  tags: {},
  preferences: {},
  rules: {},
  recurring_transactions: {},
  notifications: {},
  plugins: {},
  plugin_data: {},
  plugin_migrations: {},
  indices: { version: 1 },
});




class CRDTService {
  private readonly CURRENT_VERSION = "1.0.0";
  private doc: Automerge.Doc<CRDTDocument> | null = null;
  private currentUserId: string | null = null;
  // Chain of promises ensures mutations are applied in order
  private operationQueue: Promise<any> = Promise.resolve();

  // Debounced persist: coalesces rapid successive mutations into a single
  // SQLite write. Mutations are always committed to the in-memory Automerge
  // doc immediately; only the disk flush is deferred.
  private pendingPersistTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly PERSIST_DEBOUNCE_MS = 300;
  private undoStack: Array<Automerge.Doc<CRDTDocument>> = [];
  private redoStack: Array<Automerge.Doc<CRDTDocument>> = [];
  private readonly MAX_UNDO_DEPTH = 50;



  // lifecycle

  private getCurrentUserId(): string {
    const authStore = useAuthStore.getState();
    return authStore.isAuthenticated && authStore.user?.id ? authStore.user.id : anonymousUserService.getUserId();
  }

  private migrateDocument(doc: Automerge.Doc<CRDTDocument>): Automerge.Doc<CRDTDocument> {
    if (doc.version === this.CURRENT_VERSION) return doc;

    logger.info(`Migrating CRDT document from version ${doc.version} to ${this.CURRENT_VERSION}`);

    let migratedDoc = doc;

    return Automerge.change(migratedDoc, (draft) => {
      draft.version = this.CURRENT_VERSION;
      draft.updated_at = new Date().toISOString();
    });
  }

  async initialize(): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const userId = this.getCurrentUserId();
        this.currentUserId = userId;

        const loadResult = await crdtStorage.loadDocument(userId);

        if (loadResult.isErr()) {
          throw loadResult.error;
        }

        if (loadResult.value) {
          this.doc = Automerge.load(loadResult.value);
          logger.info("Loaded existing CRDT document from database for user:", userId);

          this.doc = this.migrateDocument(this.doc);

          const persistResult = await this.persist();
          if (persistResult.isErr()) {
            logger.warn("Failed to persist migrated document:", persistResult.error);
          }

          return;
        }

        this.doc = Automerge.from<CRDTDocument>(makeInitialDocument(userId));
        logger.info("Created new CRDT document for user:", userId);

        const persistResult = await this.persist();
        if (persistResult.isErr()) throw persistResult.error;
      })(),
      (error) => {
        logger.error("Failed to initialize CRDT document:", error);
        return ServiceError.initialization("Failed to initialize CRDT document", error);
      }
    );
  }


  async persist(): Promise<Result<void, ServiceError>> {
    if (!this.doc) return ok(undefined);
    const userId = this.currentUserId || this.getCurrentUserId();

    return ResultAsync.fromPromise(
      (async () => {
        const saveResult = await crdtStorage.saveDocument(userId, Automerge.save(this.doc!));
        if (saveResult.isErr()) throw saveResult.error;
      })(),
      (error) => {
        logger.error("Failed to persist CRDT document:", error);
        return ServiceError.storage("Failed to persist CRDT document", error);
      }
    );
  }

  /**
   * Schedule a deferred persist. Resets the timer on each call so that a
   * burst of mutations (e.g. seeding 60 default categories) results in a
   * single SQLite write after the quiet period instead of N writes.
   *
   * Errors from the deferred write are logged but not propagated — callers
   * that need a guaranteed flush should call flushPending() instead.
   */
  private schedulePersist(): void {
    if (this.pendingPersistTimer !== null) {
      clearTimeout(this.pendingPersistTimer);
    }
    this.pendingPersistTimer = setTimeout(() => {
      this.pendingPersistTimer = null;
      this.persist().then((result) => {
        if (result.isErr()) logger.error("Deferred persist failed:", result.error);
      });
    }, this.PERSIST_DEBOUNCE_MS);
  }

  /**
   * Cancel any pending deferred persist and flush to disk immediately.
   * Call this at synchronization boundaries — e.g. before reading from CRDT
   * to rebuild SQLite, before sync, or before closing the service.
   */
  async flushPending(): Promise<Result<void, ServiceError>> {
    if (this.pendingPersistTimer !== null) {
      clearTimeout(this.pendingPersistTimer);
      this.pendingPersistTimer = null;
    }
    return this.persist();
  }


  /**
   * Merge changes from another CRDT document (for sync)
   */
  async merge(otherDocBinary: Uint8Array): Promise<Result<void, ServiceError>> {
    if (!this.doc) return err(ServiceError.initialization("CRDT document not initialized"));

    return ResultAsync.fromPromise(
      (async () => {
        this.doc = Automerge.merge(this.doc!, Automerge.load<CRDTDocument>(otherDocBinary));
        const persistResult = await this.persist();

        if (persistResult.isErr()) throw persistResult.error;
        logger.info("Successfully merged CRDT documents");
      })(),
      (error) => {
        logger.error("Failed to merge CRDT documents:", error);
        return ServiceError.merge("Failed to merge CRDT documents", error);
      }
    );
  }

  getBinaryDocument(): Uint8Array | null {
    return this.doc ? Automerge.save(this.doc) : null;
  }

  /**
   * Get the current document state
   */
  getDocument(): CRDTDocument | null {
    if (!this.doc) return null;
    return Automerge.toJS(this.doc) as CRDTDocument;
  }


  async clear(): Promise<void> {
    // Cancel any deferred write — the document is being deleted, not saved.
    if (this.pendingPersistTimer !== null) {
      clearTimeout(this.pendingPersistTimer);
      this.pendingPersistTimer = null;
    }
    if (this.currentUserId) {
      const deleteResult = await crdtStorage.deleteDocument(this.currentUserId);
      if (deleteResult.isErr()) {
        logger.error("Failed to delete CRDT document:", deleteResult.error);
      }
    }
    this.doc = null;
    this.currentUserId = null;
  }

  async switchUser(newUserId: string): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        if (this.currentUserId === newUserId) return;

        if (this.doc && this.currentUserId) {
          const persistResult = await this.persist();
          if (persistResult.isErr()) throw persistResult.error;
        }

        this.currentUserId = newUserId;

        const loadResult = await crdtStorage.loadDocument(newUserId);
        if (loadResult.isErr()) throw loadResult.error;


        if (loadResult.value) {
          this.doc = Automerge.load(loadResult.value);
          logger.info("Switched to existing CRDT document for user: ", newUserId);
        } else {
          this.doc = Automerge.from<CRDTDocument>(makeInitialDocument(newUserId));
          logger.info("Created new CRDT document for user: ", newUserId);
          const persistResult = await this.persist();
          if (persistResult.isErr()) throw persistResult.error;
        }
      })(),
      (error) => {
        logger.error("Failed to switch user:", error);
        return ServiceError.initialization("Failed to switch user", error);
      }
    );
  }

  async migrateAnonymousToAuthenticated(anonymousUserId: string, authenticatedUserId: string): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        logger.info(`Migrating CRDT data from anonymous user ${anonymousUserId} to authenticated user ${authenticatedUserId}`);

        const loadResult = await crdtStorage.loadDocument(anonymousUserId);
        if (loadResult.isErr()) throw loadResult.error;


        if (!loadResult.value) {
          logger.info("No anonymous CRDT document to migrate");
          return;
        }

        const anonymousDoc = Automerge.load<CRDTDocument>(loadResult.value);

        const authenticatedLoadResult = await crdtStorage.loadDocument(authenticatedUserId);
        if (authenticatedLoadResult.isErr()) throw authenticatedLoadResult.error;


        let mergedDoc: Automerge.Doc<CRDTDocument> = authenticatedLoadResult.value
          ? Automerge.merge(Automerge.load<CRDTDocument>(authenticatedLoadResult.value), anonymousDoc)
          : anonymousDoc;



        mergedDoc = Automerge.change(mergedDoc, (doc) => {
          doc.user_id = authenticatedUserId;
          doc.updated_at = new Date().toISOString();
        });

        const saveResult = await crdtStorage.saveDocument(authenticatedUserId, Automerge.save(mergedDoc));
        if (saveResult.isErr()) throw saveResult.error;

        const deleteResult = await crdtStorage.deleteDocument(anonymousUserId);
        if (deleteResult.isErr()) {
          logger.warn("Failed to delete anonymous document after migration:", deleteResult.error);
        }

        this.doc = mergedDoc;
        this.currentUserId = authenticatedUserId;
        logger.info("Successfully migrated anonymous CRDT data to authenticated user");
      })(),
      (error) => {
        logger.error("Failed to migrate anonymous data:", error);
        return ServiceError.initialization("Failed to migrate anonymous data", error);
      }
    );
  }


  /**
     * Serialises all mutations through a promise chain so Automerge changes
     * are never interleaved. The `.catch(() => {})` drains a failed predecessor
     * without propagating its rejection to the current caller.
     */
  private async withMutationLock<T>(fn: () => Promise<T>): Promise<T> {
    const previousOperation = this.operationQueue;

    let resolver!: (value: T) => void;
    let rejecter!: (error: any) => void;

    this.operationQueue = new Promise<T>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    try {
      await previousOperation.catch(() => { }); // drain errors before proceeding

      // Snapshot the current doc before the mutation so it can be restored on undo.
      // Automerge docs are immutable value types — capturing the reference is safe.
      if (this.doc !== null) {
        this.undoStack.push(this.doc);
        if (this.undoStack.length > this.MAX_UNDO_DEPTH) {
          this.undoStack.shift(); // drop oldest
        }
        this.redoStack = [];
      }

      const result = await fn();
      resolver(result);
      return result;
    } catch (error) {
      // Mutation failed — pop the snapshot we just pushed so the stacks stay consistent.
      this.undoStack.pop();
      rejecter(error);
      throw error;
    }
  }


  /**
   * Creates an entity in the given collection, assigning the requested
   * timestamp fields. Pass timestampFields=["created_at"] for entities
   * without updated_at (tags), or ["installed_at","updated_at"] for plugins.
   */
  private async createEntity<K extends CollectionKey>(
    collection: K,
    entity: CollectionEntity<K> & { id: string },
    timestampFields: string[] = ["created_at", "updated_at"],
    notifyType?: string
  ): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      // Assign timestamps
      const timestamp = new Date().toISOString();
      const entityWithTimestamps = { ...entity } as any;

      for (const field of timestampFields) {
        entityWithTimestamps[field] = timestamp;
      }

      this.doc = Automerge.change(this.doc, (doc) => {
        (doc[collection] as Record<string, unknown>)[entity.id] = entityWithTimestamps;
        doc.updated_at = timestamp;
      });

      this.schedulePersist();

      if (notifyType) this.notifySyncService("create", notifyType as any, entityWithTimestamps);

      return ok(entity.id);
    });
  }

  /**
   * Generic updateEntity: works for all CRDT entities.
   * timestampFields = ["updated_at"] by default
   */
  private async updateEntity<K extends CollectionKey>(
    collection: K,
    id: string,
    updates: Partial<CollectionEntity<K>>,
    notifyType?: string
  ): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const col = doc[collection] as Record<string, CollectionEntity<K>>;
        const record = col[id];
        if (!record) return;

        for (const [key, value] of Object.entries(updates) as [keyof CollectionEntity<K>, any][]) {
          record[key] = value;
        }

        (record as any).updated_at = timestamp;
        doc.updated_at = timestamp;

      });

      this.schedulePersist();

      // fetch fresh entity after update
      if (notifyType) {
        const updated = this.getEntityById<K>(collection, id);
        if (updated) this.notifySyncService("update", notifyType as any, updated);
      }
      return ok(undefined);
    });
  }

  /**
   * Generic deleteEntity: soft delete by setting `deleted_at` (default),
   * unless `softDeleteField` is not set (for plugin, perform hard delete)
   */
  private async deleteEntity<K extends CollectionKey>(
    collection: K,
    id: string,
    hard = false,
    notifyType?: string
  ): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");
      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const col = doc[collection] as Record<string, CollectionEntity<K>>;
        const record = col[id];
        if (!record) return;

        if (hard) {
          delete col[id];
        } else {
          (record as any).deleted_at = timestamp;
        }

        (doc as CRDTDocument).updated_at = timestamp;
      });

      this.schedulePersist();

      if (notifyType) {
        this.notifySyncService("delete", notifyType as any, {
          id,
          ...(hard ? {} : { deleted_at: timestamp })
        });
      }
      return ok(undefined);
    });
  }

  /**
   * Returns all entities in a collection. When onlyActive=true (default),
   * entities with a deleted_at value are excluded. Set onlyActive=false
   * for entities that lack deleted_at (tags, budgets) or use hard deletion.
   */
  private getEntities<K extends CollectionKey>(
    collection: K,
    onlyActive = true
  ): Record<string, CollectionEntity<K>> {
    if (!this.doc) return {};

    const col = this.doc[collection] as Record<string, CollectionEntity<K>>;
    if (!onlyActive) return { ...col };

    const result: Record<string, CollectionEntity<K>> = {};
    for (const [id, entity] of Object.entries(col)) {
      if (!(entity as any).deleted_at) result[id] = entity;
    }
    return result;
  }

  private getEntityById<K extends CollectionKey>(
    collection: K,
    id: string,
    onlyActive = true
  ): CollectionEntity<K> | null {
    if (!this.doc) return null;

    const col = this.doc[collection] as Record<string, CollectionEntity<K>>;
    const entity = col?.[id];
    if (!entity) return null;
    return onlyActive && (entity as any).deleted_at ? null : entity;
  }



  // ─── Transactions ─────────────────────────────────────────────────────────

  async createTransaction(
    transaction: Omit<CRDTTransaction, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("transactions", transaction as CRDTTransaction, ["created_at", "updated_at"], "transaction");
  }

  async updateTransaction(id: string, updates: Partial<CRDTTransaction>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("transactions", id, updates, "transaction");
  }

  async deleteTransaction(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("transactions", id, false, "transaction");
  }

  getTransactions(): Record<string, CRDTTransaction> {
    return this.getEntities("transactions");
  }

  getTransaction(id: string): CRDTTransaction | null {
    return this.getEntityById("transactions", id);
  }

  // ─── Accounts ─────────────────────────────────────────────────────────────

  async createAccount(
    account: Omit<CRDTAccount, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("accounts", account as CRDTAccount, ["created_at", "updated_at"], "account");
  }

  async updateAccount(id: string, updates: Partial<CRDTAccount>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("accounts", id, updates, "account");
  }

  async deleteAccount(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("accounts", id, false, "account");
  }

  getAccounts(): Record<string, CRDTAccount> {
    return this.getEntities("accounts");
  }

  getAccount(id: string): CRDTAccount | null {
    return this.getEntityById("accounts", id);
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  async createCategory(
    category: Omit<CRDTCategory, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("categories", category as CRDTCategory, ["created_at", "updated_at"], "category");
  }

  async updateCategory(id: string, updates: Partial<CRDTCategory>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("categories", id, updates, "category");
  }

  async deleteCategory(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("categories", id, false, "category");
  }

  getCategories(): Record<string, CRDTCategory> {
    return this.getEntities("categories");
  }

  getCategory(id: string): CRDTCategory | null {
    return this.getEntityById("categories", id);
  }

  // ─── Budgets ──────────────────────────────────────────────────────────────
  // CRDTBudget has no deleted_at — use onlyActive=false.

  async createBudget(
    budget: Omit<CRDTBudget, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("budgets", budget as CRDTBudget, ["created_at", "updated_at"]);
  }

  async updateBudget(id: string, updates: Partial<CRDTBudget>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("budgets", id, updates);
  }

  async deleteBudget(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("budgets", id);
  }

  getBudgets(): Record<string, CRDTBudget> {
    return this.getEntities("budgets", false);
  }

  getBudget(id: string): CRDTBudget | null {
    return this.getEntityById("budgets", id, false);
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────
  // CRDTTag has only created_at — no updated_at, no deleted_at.

  async createTag(tag: Omit<CRDTTag, "created_at">): Promise<Result<string, ServiceError>> {
    return this.createEntity("tags", tag as CRDTTag, ["created_at"]);
  }

  getTags(): Record<string, CRDTTag> {
    return this.getEntities("tags", false);
  }

  getTag(id: string): CRDTTag | null {
    return this.getEntityById("tags", id, false);
  }

  // ─── Preferences ──────────────────────────────────────────────────────────

  async createPreference(
    preference: Omit<CRDTPreference, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("preferences", preference as CRDTPreference, ["created_at", "updated_at"]);
  }

  async updatePreference(id: string, updates: Partial<CRDTPreference>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("preferences", id, updates);
  }

  getPreferences(): Record<string, CRDTPreference> {
    return this.getEntities("preferences");
  }

  getPreference(id: string): CRDTPreference | null {
    return this.getEntityById("preferences", id);
  }

  // ─── Rules ────────────────────────────────────────────────────────────────

  async createRule(
    rule: Omit<CRDTRule, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("rules", rule as CRDTRule, ["created_at", "updated_at"], "rule");
  }

  async updateRule(id: string, updates: Partial<CRDTRule>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("rules", id, updates, "rule");
  }

  async deleteRule(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("rules", id, false, "rule");
  }

  getRules(): Record<string, CRDTRule> {
    return this.getEntities("rules");
  }

  getRule(id: string): CRDTRule | null {
    return this.getEntityById("rules", id);
  }

  // ─── Recurring Transactions ───────────────────────────────────────────────

  async createRecurringTransaction(
    recurring: Omit<CRDTRecurringTransaction, "created_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity(
      "recurring_transactions",
      recurring as CRDTRecurringTransaction,
      ["created_at", "updated_at"],
      "transaction"
    );
  }

  async updateRecurringTransaction(
    id: string,
    updates: Partial<CRDTRecurringTransaction>
  ): Promise<Result<void, ServiceError>> {
    return this.updateEntity("recurring_transactions", id, updates, "transaction");
  }

  async deleteRecurringTransaction(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("recurring_transactions", id, false, "transaction");
  }

  getRecurringTransactions(): Record<string, CRDTRecurringTransaction> {
    return this.getEntities("recurring_transactions");
  }

  getRecurringTransaction(id: string): CRDTRecurringTransaction | null {
    return this.getEntityById("recurring_transactions", id);
  }

  // ─── Notifications ────────────────────────────────────────────────────────
  // CRDTNotification only stamps created_at on creation.

  async createNotification(
    notification: Omit<CRDTNotification, "created_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("notifications", notification as CRDTNotification, ["created_at"]);
  }

  async updateNotification(id: string, updates: Partial<CRDTNotification>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("notifications", id, updates);
  }

  async deleteNotification(id: string): Promise<Result<void, ServiceError>> {
    return this.deleteEntity("notifications", id);
  }

  getNotifications(): Record<string, CRDTNotification> {
    return this.getEntities("notifications");
  }

  getNotification(id: string): CRDTNotification | null {
    return this.getEntityById("notifications", id);
  }

  // ─── Plugins ──────────────────────────────────────────────────────────────
  // Plugins use installed_at instead of created_at, are hard-deleted, and
  // deletion must also sweep plugin_data and plugin_migrations — too
  // multi-collection for the generic deleteEntity.

  async createPlugin(
    plugin: Omit<CRDTPlugin, "installed_at" | "updated_at">
  ): Promise<Result<string, ServiceError>> {
    return this.createEntity("plugins", plugin as CRDTPlugin, ["installed_at", "updated_at"]);
  }

  async updatePlugin(id: string, updates: Partial<CRDTPlugin>): Promise<Result<void, ServiceError>> {
    return this.updateEntity("plugins", id, updates);
  }

  async deletePlugin(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        delete (doc.plugins as Record<string, unknown>)[id];
        delete (doc.plugin_data as Record<string, unknown>)[id];
        delete (doc.plugin_migrations as Record<string, unknown>)[id];
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist plugin deletion:", persistResult.error);
        return err(persistResult.error);
      }
      return ok(undefined);
    });
  }

  getPlugins(): Record<string, CRDTPlugin> {
    return this.getEntities("plugins", false); // hard-deleted, no deleted_at to filter
  }

  getPlugin(id: string): CRDTPlugin | null {
    return this.getEntityById("plugins", id, false);
  }

  // ─── Plugin Data ──────────────────────────────────────────────────────────
  // Nested structure (plugin_id → collection → record) is distinct enough
  // from entity collections that it warrants its own implementation.

  getPluginData<T = unknown>(pluginId: string, collection: string): Record<string, T> {
    if (!this.doc) return {};

    const pluginData = (this.doc.plugin_data as Record<string, Record<string, unknown>>)[pluginId] || {};
    return JSON.parse(JSON.stringify(pluginData[collection] || {}));
  }

  async setPluginData<T = unknown>(
    pluginId: string,
    collection: string,
    data: Record<string, T>
  ): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const serialized = JSON.parse(JSON.stringify(data));

      this.doc = Automerge.change(this.doc, (doc) => {
        const pd = doc.plugin_data as Record<string, Record<string, unknown>>;
        if (!pd[pluginId]) pd[pluginId] = {};
        pd[pluginId][collection] = serialized;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist plugin data:", persistResult.error);
        return err(persistResult.error);
      }
      return ok(undefined);
    });
  }

  async createPluginRecord<T = unknown>(
    pluginId: string,
    collection: string,
    id: string,
    record: T
  ): Promise<Result<void, ServiceError>> {
    const col = this.getPluginData<T>(pluginId, collection);
    col[id] = record;
    return this.setPluginData(pluginId, collection, col);
  }

  async updatePluginRecord<T = unknown>(
    pluginId: string,
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<Result<void, ServiceError>> {
    const col = this.getPluginData<T>(pluginId, collection);
    const existing = col[id];
    if (!existing) return err(ServiceError.notFound("plugin record", id));
    col[id] = { ...existing, ...updates };
    return this.setPluginData(pluginId, collection, col);
  }

  async deletePluginRecord(
    pluginId: string,
    collection: string,
    id: string
  ): Promise<Result<void, ServiceError>> {
    const col = this.getPluginData(pluginId, collection);
    delete col[id];
    return this.setPluginData(pluginId, collection, col);
  }

  async initializePluginData(pluginId: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      this.doc = Automerge.change(this.doc, (doc) => {
        const pd = doc.plugin_data as Record<string, Record<string, unknown>>;
        if (!pd[pluginId]) pd[pluginId] = {};
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to initialize plugin data:", persistResult.error);
        return err(persistResult.error);
      }
      return ok(undefined);
    });
  }

  async deletePluginData(pluginId: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      this.doc = Automerge.change(this.doc, (doc) => {
        delete (doc.plugin_data as Record<string, unknown>)[pluginId];
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to delete plugin data:", persistResult.error);
        return err(persistResult.error);
      }
      return ok(undefined);
    });
  }

  // ─── Undo / Redo ──────────────────────────────────────────────────────────

  /**
   * Undo the most recent mutation. Returns false when the undo stack is empty.
   * Callers should call rebuildFromCRDT() (in the transaction service) after this
   * to re-sync the SQLite query layer.
   */
  async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) return false;
    const snapshot = this.undoStack.pop()!;
    if (this.doc !== null) {
      this.redoStack.push(this.doc);
    }
    this.doc = snapshot;
    this.schedulePersist();
    return true;
  }

  /**
   * Redo the most recently undone mutation. Returns false when the redo stack is empty.
   * Callers should call rebuildFromCRDT() (in the transaction service) after this.
   */
  async redo(): Promise<boolean> {
    if (this.redoStack.length === 0) return false;
    const snapshot = this.redoStack.pop()!;
    if (this.doc !== null) {
      this.undoStack.push(this.doc);
      if (this.undoStack.length > this.MAX_UNDO_DEPTH) {
        this.undoStack.shift();
      }
    }
    this.doc = snapshot;
    this.schedulePersist();
    return true;
  }

  /** How many steps are available for undo/redo (used by the UI to enable buttons). */
  getUndoRedoDepth(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  // ─── Sync Notification ────────────────────────────────────────────────────

  /**
   * Lazy dynamic import breaks the circular dependency crdt → sync → crdt.
   * If the import fails, changes are persisted locally but won't be queued
   * for server sync until the service restarts.
   */
  private notifySyncService(
    operation: "create" | "update" | "delete",
    type: "transaction" | "account" | "category" | "rule",
    data: any
  ): void {
    import("./sync")
      .then(({ syncService }) => syncService.addToSyncQueue({ operation, type, data }))
      .catch((error) => logger.error("[CRDT] Failed to notify sync service:", error));
  }
}

// Export singleton instance
export const crdtService = new CRDTService();
