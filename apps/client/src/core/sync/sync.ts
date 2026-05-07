import { next as Automerge } from "@automerge/automerge";
import { crdtService } from "./crdt";
import { kyselyQueryService } from "./query";
import { connectivityService } from "./connectivity";
import { authService } from "@/features/auth/services/auth.service";
import { db } from "@/core/storage/client";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { ResourceType, SyncConflict, SyncState } from "@nuts/types";
import { Result, ok, err } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";
import type { CRDTTransaction, CRDTAccount, CRDTCategory, CRDTBudget, CRDTTag, CRDTPreference } from "@nuts/types";

/**
 * Synchronization Service for Offline-First Architecture
 *
 * Handles bidirectional sync between local CRDT documents and the server.
 * Manages conflict resolution, offline queue, and background sync.
 *
 * Conflict detection uses Automerge heads saved at last sync time so we
 * can tell whether the local document was genuinely modified since the
 * last successful pull — not just whether timestamps differ.
 */

// ─── Backoff ──────────────────────────────────────────────────────────────────

const SYNC_INTERVAL_BASE_MS = 30_000;
const SYNC_INTERVAL_MAX_MS = 5 * 60_000; // 5 minutes
const SYNC_INTERVAL_BACKOFF_FACTOR = 2;

// ─── Server response shapes ───────────────────────────────────────────────────

interface ServerSyncResponse {
  transactions?: unknown[];
  accounts?: unknown[];
  categories?: unknown[];
  budgets?: unknown[];
  tags?: unknown[];
  preferences?: unknown[];
  server_timestamp?: string;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
//
// Each function coerces a raw server payload into the expected CRDT shape.
// Keeping them separate means a change to the server response for accounts
// can't accidentally corrupt transaction data, and type errors are caught
// at the boundary rather than silently downstream.

function normalizeTransaction(raw: any): CRDTTransaction {
  return {
    id: raw.id,
    amount: coerceNumeric(raw.amount, 0),
    transaction_datetime: raw.transaction_datetime || raw.transactionDatetime || new Date().toISOString(),
    description: raw.description ?? "",
    category_id: raw.category_id ?? null,
    account_id: raw.account_id ?? "",
    type: raw.type ?? "expense",
    destination_account_id: raw.destination_account_id ?? null,
    transaction_currency: raw.transaction_currency ?? "USD",
    original_amount: coerceNumeric(raw.original_amount ?? raw.amount, 0),
    is_external: Boolean(raw.is_external),
    details: parseJsonField(raw.details, {}),
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    deleted_at: raw.deleted_at || raw.deletedAt || undefined,
  };
}

function normalizeAccount(raw: any): CRDTAccount {
  return {
    id: raw.id,
    name: raw.name ?? "",
    type: raw.type ?? "checking",
    subtype: raw.subtype ?? undefined,
    currency: raw.currency ?? "USD",
    balance: coerceNumeric(raw.balance, 0),
    meta: parseJsonField(raw.meta, null),
    is_active: raw.is_active !== false,
    is_external: Boolean(raw.is_external),
    provider_account_id: raw.provider_account_id ?? undefined,
    provider_name: raw.provider_name ?? undefined,
    sync_status: raw.sync_status ?? undefined,
    last_synced_at: raw.last_synced_at ?? undefined,
    connection_id: raw.connection_id ?? undefined,
    created_by: raw.created_by ?? undefined,
    updated_by: raw.updated_by ?? undefined,
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    deleted_at: raw.deleted_at || raw.deletedAt || undefined,
  };
}

function normalizeCategory(raw: any): CRDTCategory {
  return {
    id: raw.id,
    name: raw.name ?? "",
    type: raw.type ?? "expense",
    color: raw.color ?? "#000000",
    icon: raw.icon ?? undefined,
    parent_id: raw.parent_id ?? undefined,
    plugin_id: raw.plugin_id ?? undefined,
    is_active: raw.is_active !== false,
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    deleted_at: raw.deleted_at || raw.deletedAt || undefined,
  };
}

function normalizeBudget(raw: any): CRDTBudget {
  return {
    id: raw.id,
    category_id: raw.category_id ?? "",
    amount: coerceNumeric(raw.amount, 0),
    start_date: raw.start_date ?? "",
    end_date: raw.end_date ?? "",
    frequency: raw.frequency ?? "monthly",
    name: raw.name ?? undefined,
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

function normalizeTag(raw: any): CRDTTag {
  return {
    id: raw.id,
    name: raw.name ?? "",
    color: raw.color ?? "#000000",
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

function normalizePreference(raw: any): CRDTPreference {
  return {
    id: raw.id,
    locale: raw.locale ?? "en",
    theme: raw.theme ?? "light",
    currency: raw.currency ?? "USD",
    timezone: raw.timezone ?? "UTC",
    time_format: raw.time_format ?? "24h",
    date_format: raw.date_format ?? "YYYY-MM-DD",
    start_week_on_monday: Boolean(raw.start_week_on_monday),
    dark_sidebar: Boolean(raw.dark_sidebar),
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    deleted_at: raw.deleted_at || raw.deletedAt || undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function coerceNumeric(value: unknown, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null) {
    const v = value as any;
    return parseFloat(v.String ?? v.value ?? fallback) || fallback;
  }
  return fallback;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function extractHttpStatus(error: unknown): number | null {
  const e = error as any;
  return e?.response?.status ?? e?.status ?? null;
}

class SyncService {
  private syncState: SyncState = {
    status: "offline",
    lastSyncAt: null,
    pendingOperations: 0,
    error: null,
    isOnline: navigator.onLine,
    hasValidAuth: false,
  };

  private syncQueue: Array<{
    id: string;
    operation: "create" | "update" | "delete";
    type: ResourceType;
    data: any;
    timestamp: Date;
  }> = [];

  // Serializes concurrent persistSyncQueue calls so DELETE+INSERT sequences
  // never interleave. Each call chains onto the previous one; the last snapshot
  // always reflects the current in-memory queue.
  private persistSyncQueuePromise: Promise<void> | null = null;

  // Items are added to the queue while pushLocalChanges is running. This flag
  // marks the index boundary so new arrivals during a push cycle are deferred
  // to the next cycle rather than silently dropped or double-processed.
  private pushCursorIndex = 0;

  private conflicts: SyncConflict[] = [];
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentBackoffMs = SYNC_INTERVAL_BASE_MS;
  private consecutiveFailures = 0;

  // Automerge heads saved at the end of each successful pull. Used by
  // hasLocalModifications to detect genuine local edits vs. server-newer records.
  private lastSyncHeads: Map<string, Automerge.Heads> = new Map();

  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor() {
    this.setupOnlineStatusListener();
    this.loadSyncQueue();
    this.loadConflicts();
  }

  async initialize(): Promise<Result<void, ServiceError>> {
    if (authService.canSync()) {
      const result = await this.startBackgroundSync();

      if (result.isErr()) {
        logger.error("Failed to initialize sync service:", result.error);
        this.updateSyncState({
          status: "error",
          error: "Failed to initialize sync - will retry when connectivity and auth are restored",
        });

        return err(result.error);
      }

      logger.info("Sync service initialized with background sync enabled");
      return ok(undefined);
    }

    const hasConnectivity = connectivityService.hasServerAccess();
    const hasAuth = authService.isAuthenticated();

    logger.info(`Sync service initialized in offline mode - ${!hasConnectivity ? "no connectivity" : "no valid auth"}`);
    this.updateSyncState({
      status: "offline",
      isOnline: hasConnectivity,
      hasValidAuth: hasAuth,
      error: !hasConnectivity ? "No server connectivity - sync will resume when online" : "No valid authentication - sync requires valid auth tokens",
    });
    return ok(undefined);
  }

  async startBackgroundSync(): Promise<Result<void, ServiceError>> {
    this.stopBackgroundSync();

    const syncResult = await this.performSync();
    if (syncResult.isErr()) return err(syncResult.error);

    this.scheduleNextSync();
    return ok(undefined);
  }

  stopBackgroundSync(): void {
    if (this.syncTimeout !== null) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  async performSync(): Promise<Result<void, ServiceError>> {
    if (this.syncState.status === "syncing") return ok(undefined);

    if (!authService.canSync()) {
      const hasConnectivity = connectivityService.hasServerAccess();
      const hasAuth = authService.isAuthenticated();
      this.updateSyncState({
        status: "offline",
        isOnline: hasConnectivity,
        hasValidAuth: hasAuth,
        error: !hasConnectivity ? "No server connectivity" : "No valid authentication for sync",
      });

      return err(ServiceError.unavailable("Sync"));
    }

    this.updateSyncState({ status: "syncing" });

    const accessToken = await authService.getAccessTokenForSync();

    if (!accessToken) {
      this.updateSyncState({ status: "error", error: "Failed to get valid access token for sync" });
      return err(ServiceError.sync("Failed to get valid access token"));
    }

    const pushResult = await this.pushLocalChanges();

    if (pushResult.isErr()) {
      this.handleSyncError(pushResult.error);
      return err(pushResult.error);
    }

    const pullResult = await this.pullServerChanges();

    if (pullResult.isErr()) {
      this.handleSyncError(pullResult.error);
      return err(pullResult.error);
    }

    this.consecutiveFailures = 0;
    this.currentBackoffMs = SYNC_INTERVAL_BASE_MS;

    this.updateSyncState({
      status: this.conflicts.length > 0 ? "conflict" : "synced",
      lastSyncAt: new Date(),
      error: null,
      isOnline: true,
      hasValidAuth: true,
    });

    logger.info("Sync completed successfully");
    return ok(undefined);
  }

  addToSyncQueue(operation: { operation: "create" | "update" | "delete"; type: "transaction" | "account" | "category" | "rule"; data: any }): void {
    const queueItem = {
      ...operation,
      id: `${operation.type}_${operation.data.id}_${Date.now()}`,
      timestamp: new Date(),
    };

    this.syncQueue.push(queueItem);
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    this.persistSyncQueue();

    if (authService.canSync()) {
      this.performSync().catch((e) => logger.error("Sync error:", e));
    }
  }

  async resolveConflict(conflictId: string, resolution: "local" | "server" | "merge"): Promise<Result<void, ServiceError>> {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return err(ServiceError.notFound("Conflict", conflictId));

    switch (resolution) {
      case "local":
        // Re-queue the local version to be pushed to the server.
        this.addToSyncQueue({ operation: "update", type: conflict.type, data: conflict.localVersion });
        break;

      case "server":
        // Overwrite local with the server version via CRDT update.
        if (conflict.type === "transaction") {
          const result = await crdtService.updateTransaction(conflict.id, conflict.serverVersion);
          if (result.isErr()) return err(result.error);
        } else if (conflict.type === "account") {
          const result = await crdtService.updateAccount(conflict.id, conflict.serverVersion);
          if (result.isErr()) return err(result.error);
        } else if (conflict.type === "category") {
          const result = await crdtService.updateCategory(conflict.id, conflict.serverVersion);
          if (result.isErr()) return err(result.error);
        }
        break;

      case "merge":
        // Field-level merge: server wins on conflict, local-only fields are preserved.
        // This is a last-write-wins merge per field, not a semantic merge.
        if (conflict.type === "transaction") {
          const merged = { ...conflict.localVersion, ...conflict.serverVersion };
          const result = await crdtService.updateTransaction(conflict.id, merged);
          if (result.isErr()) return err(result.error);
        } else if (conflict.type === "account") {
          const merged = { ...conflict.localVersion, ...conflict.serverVersion };
          const result = await crdtService.updateAccount(conflict.id, merged);
          if (result.isErr()) return err(result.error);
        } else if (conflict.type === "category") {
          const merged = { ...conflict.localVersion, ...conflict.serverVersion };
          const result = await crdtService.updateCategory(conflict.id, merged);
          if (result.isErr()) return err(result.error);
        }
        break;
    }

    this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
    await this.persistConflicts();

    this.updateSyncState({ status: this.conflicts.length > 0 ? "conflict" : "synced" });
    return ok(undefined);
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  async forceSync(): Promise<Result<void, ServiceError>> {
    return this.performSync();
  }

  async clear(): Promise<void> {
    this.stopBackgroundSync();
    this.syncQueue = [];
    this.conflicts = [];
    this.lastSyncHeads.clear();
    await this.persistSyncQueue();
    await this.persistConflicts();
    this.updateSyncState({
      status: "offline",
      lastSyncAt: null,
      pendingOperations: 0,
      error: null,
    });
  }

  // ─── Scheduling ─────────────────────────────────────────────────────────────

  /**
   * Uses setTimeout rather than setInterval so each sync fires only after
   * the previous one completes. The interval grows exponentially on failure
   * and resets on success, avoiding hammering a down server.
   */
  private scheduleNextSync(): void {
    this.syncTimeout = setTimeout(async () => {
      if (authService.canSync()) {
        await this.performSync();
      }
      this.scheduleNextSync();
    }, this.currentBackoffMs);
  }

  private handleSyncError(error: ServiceError): void {
    this.consecutiveFailures++;
    this.currentBackoffMs = Math.min(SYNC_INTERVAL_BASE_MS * Math.pow(SYNC_INTERVAL_BACKOFF_FACTOR, this.consecutiveFailures), SYNC_INTERVAL_MAX_MS);

    const httpStatus = extractHttpStatus(error.cause);
    if (httpStatus === 401 || httpStatus === 403) {
      this.updateSyncState({
        status: "error",
        error: "Authentication failed during sync - please re-authenticate",
        hasValidAuth: false,
      });
    } else {
      this.updateSyncState({
        status: "error",
        error: `Sync failed: ${error.message}`,
      });
    }

    logger.warn(`Sync failed (attempt ${this.consecutiveFailures}), next retry in ${this.currentBackoffMs}ms:`, error);
  }

  // ─── Push ────────────────────────────────────────────────────────────────────

  private async pushLocalChanges(): Promise<Result<void, ServiceError>> {
    // Snapshot the current end-of-queue index. Items appended by addToSyncQueue
    // during this push cycle are beyond this boundary and will be picked up in
    // the next sync, preventing them from being silently dropped.
    const snapshotEnd = this.syncQueue.length;
    this.pushCursorIndex = snapshotEnd;

    const batch = this.syncQueue.slice(0, snapshotEnd);
    const successIds = new Set<string>();

    for (const operation of batch) {
      const result = await this.pushOperation(operation);
      if (result.isOk()) {
        successIds.add(operation.id);
      } else {
        logger.error("Failed to push operation:", operation.id, result.error);
      }
    }

    // Remove only the successfully pushed items; leave failures for retry.
    this.syncQueue = this.syncQueue.filter((op) => !successIds.has(op.id));
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    await this.persistSyncQueue();

    return ok(undefined);
  }

  private async pushOperation(operation: (typeof this.syncQueue)[number]): Promise<Result<void, ServiceError>> {
    const endpoint = this.getEndpointForOperation(operation);
    try {
      switch (operation.operation) {
        case "create":
          await api.post(endpoint, { json: operation.data });
          break;
        case "update":
          await api.put(`${endpoint}/${operation.data.id}`, { json: operation.data });
          break;
        case "delete":
          await api.delete(`${endpoint}/${operation.data.id}`);
          break;
      }
      return ok(undefined);
    } catch (error) {
      return err(ServiceError.fromKyError(error));
    }
  }

  // ─── Pull ────────────────────────────────────────────────────────────────────

  private async pullServerChanges(): Promise<Result<void, ServiceError>> {
    try {
      const lastSync = this.syncState.lastSyncAt?.toISOString() ?? new Date(0).toISOString();
      const response = await api.get(`/sync?since=${encodeURIComponent(lastSync)}`);
      const data = (await response.json()) as ServerSyncResponse;

      if (!data || typeof data !== "object") {
        logger.error("Invalid sync response:", data);
        return err(ServiceError.sync("Invalid sync response format"));
      }

      const mergeResult = await this.mergeServerChanges(data);
      if (mergeResult.isErr()) return err(mergeResult.error);

      this.syncState.lastSyncAt = new Date(data.server_timestamp ?? Date.now());
      return ok(undefined);
    } catch (error) {
      logger.warn("Unified sync endpoint unavailable, falling back to full sync:", error);
      return this.performFullSync();
    }
  }

  private async performFullSync(): Promise<Result<void, ServiceError>> {
    try {
      const [transactionsRaw, accountsRaw, categoriesRaw] = await Promise.all([
        api.get("/transactions").then((r) => r.json()),
        api.get("/accounts").then((r) => r.json()),
        api.get("/categories").then((r) => r.json()),
      ]);

      const extract = (response: any): unknown[] => {
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response)) return response;
        logger.warn("Unexpected server response format:", response);
        return [];
      };

      return this.mergeServerChanges({
        transactions: extract(transactionsRaw),
        accounts: extract(accountsRaw),
        categories: extract(categoriesRaw),
      });
    } catch (error) {
      logger.error("Full sync failed:", error);
      return err(ServiceError.fromKyError(error));
    }
  }

  // ─── Merge ───────────────────────────────────────────────────────────────────

  private async mergeServerChanges(serverData: ServerSyncResponse): Promise<Result<void, ServiceError>> {
    const localTransactions = crdtService.getTransactions();
    const localAccounts = crdtService.getAccounts();
    const localCategories = crdtService.getCategories();
    const localBudgets = crdtService.getBudgets();
    const localTags = crdtService.getTags();
    const localPreferences = crdtService.getPreferences();

    await this.mergeCollection(
      safeArray(serverData.transactions),
      localTransactions,
      normalizeTransaction,
      "transaction",
      (item) => crdtService.createTransaction(item),
      (id, item) => crdtService.updateTransaction(id, item)
    );

    await this.mergeCollection(
      safeArray(serverData.accounts),
      localAccounts,
      normalizeAccount,
      "account",
      (item) => crdtService.createAccount(item),
      (id, item) => crdtService.updateAccount(id, item)
    );

    await this.mergeCollection(
      safeArray(serverData.categories),
      localCategories,
      normalizeCategory,
      "category",
      (item) => crdtService.createCategory(item),
      (id, item) => crdtService.updateCategory(id, item)
    );

    await this.mergeCollection(
      safeArray(serverData.budgets),
      localBudgets,
      normalizeBudget,
      null, // no conflict tracking for budgets
      (item) => crdtService.createBudget(item),
      (id, item) => crdtService.updateBudget(id, item)
    );

    await this.mergeCollection(
      safeArray(serverData.tags),
      localTags,
      normalizeTag,
      null,
      (item) => crdtService.createTag(item),
      null // tags are append-only from server
    );

    await this.mergeCollection(
      safeArray(serverData.preferences),
      localPreferences,
      normalizePreference,
      null,
      (item) => crdtService.createPreference(item),
      (id, item) => crdtService.updatePreference(id, item)
    );

    // Snapshot Automerge heads for all known entity IDs after a successful pull.
    // These are used by hasLocalModifications to detect real local edits.
    this.snapshotHeads();

    const rebuildResult = await kyselyQueryService.rebuildFromCRDT(
      crdtService.getTransactions(),
      crdtService.getAccounts(),
      crdtService.getCategories(),
      crdtService.getRules()
    );

    if (rebuildResult.isErr()) {
      logger.error("Failed to rebuild SQLite indices:", rebuildResult.error);
      return err(ServiceError.sync(`Failed to rebuild search indices: ${rebuildResult.error.message}`));
    }

    return ok(undefined);
  }

  /**
   * Generic merge loop for a single entity collection.
   *
   * For each server item:
   * - If it doesn't exist locally → create it.
   * - If the server version is newer:
   *   - If a conflictType is provided and local modifications exist → record a conflict.
   *   - Otherwise → apply the server version.
   */
  private async mergeCollection<T extends { id: string; updated_at?: string }>(
    serverItems: unknown[],
    localItems: Record<string, T>,
    normalize: (raw: any) => T,
    conflictType: string | null,
    onCreate: (item: Omit<T, "created_at" | "updated_at">) => Promise<Result<string, ServiceError>>,
    onUpdate: ((id: string, item: Partial<T>) => Promise<Result<void, ServiceError>>) | null
  ): Promise<void> {
    for (const raw of serverItems) {
      const serverItem = raw as any;
      if (!serverItem?.id) {
        logger.warn("Skipping item without ID in merge:", serverItem);
        continue;
      }

      let normalized: T;
      try {
        normalized = normalize(serverItem);
      } catch (e) {
        logger.error("Failed to normalize server item:", serverItem, e);
        continue;
      }

      const localItem = localItems[normalized.id];

      if (!localItem) {
        const result = await onCreate(normalized as any);
        if (result.isErr()) {
          logger.error(`Failed to create ${normalized.id} from server:`, result.error);
        }
        continue;
      }

      const serverNewer = normalized.updated_at && localItem.updated_at && new Date(normalized.updated_at) > new Date(localItem.updated_at);

      if (!serverNewer) continue;

      if (conflictType && this.hasLocalModifications(normalized.id)) {
        this.addConflict({
          id: normalized.id,
          type: conflictType as any,
          localVersion: localItem,
          serverVersion: normalized,
          timestamp: new Date(),
        });
      } else if (onUpdate) {
        const result = await onUpdate(normalized.id, normalized);
        if (result.isErr()) {
          logger.error(`Failed to update ${normalized.id} from server:`, result.error);
        }
      }
    }
  }

  // ─── Conflict Detection ───────────────────────────────────────────────────────

  /**
   * Determines whether an entity has been locally modified since the last
   * successful sync by comparing the current Automerge document heads against
   * the heads that were snapshotted at sync time.
   *
   * This is the correct way to detect local changes in an Automerge-backed
   * system — not timestamp comparison, which can't distinguish "server updated
   * the record" from "we applied the server update locally".
   */
  private hasLocalModifications(entityId: string): boolean {
    const savedHeads = this.lastSyncHeads.get(entityId);
    if (!savedHeads) {
      // No snapshot means we've never synced this entity — treat as modified
      // only if the local version actually exists (it was created offline).
      return true;
    }

    const binaryDoc = crdtService.getBinaryDocument();
    if (!binaryDoc) return false;

    const liveDoc = Automerge.load(binaryDoc);
    const currentHeads = Automerge.getHeads(liveDoc);

    // If heads are identical, no changes have been made since last sync.
    if (currentHeads.length === savedHeads.length && currentHeads.every((h, i) => h === savedHeads[i])) {
      return false;
    }

    // Diff the document between saved heads and current heads.
    // A patch touching this entity's path means it was locally modified.
    const patches = Automerge.diff(liveDoc, savedHeads, currentHeads);

    return patches.some((patch) => {
      const path = (patch as any).path as string[] | undefined;
      // Paths look like: ["transactions", entityId, "amount"]
      return Array.isArray(path) && path.length >= 2 && path[1] === entityId;
    });
  }

  /**
   * Saves the current Automerge heads for every known entity after a
   * successful pull. Called once per sync cycle, not per entity.
   */
  private snapshotHeads(): void {
    const binaryDoc = crdtService.getBinaryDocument();
    if (!binaryDoc) return;

    const liveDoc = Automerge.load(binaryDoc);
    const heads = Automerge.getHeads(liveDoc);

    // We snapshot at document level — same heads for all entities in this doc.
    // Per-entity granularity would require separate Automerge docs per entity.
    const allIds = [...Object.keys(crdtService.getTransactions()), ...Object.keys(crdtService.getAccounts()), ...Object.keys(crdtService.getCategories())];

    for (const id of allIds) {
      this.lastSyncHeads.set(id, heads);
    }
  }

  // ─── Persistence (SQLite) ─────────────────────────────────────────────────────
  //
  // The sync queue and conflicts are stored in SQLite rather than localStorage.
  // localStorage is synchronous, origin-shared, capped at ~5MB, and not
  // transactional — all problems for a queue that may contain many large
  // transaction payloads and must survive mid-write crashes cleanly.

  private persistSyncQueue(): void {
    // Chain onto any in-flight persist; a late snapshot always wins.
    this.persistSyncQueuePromise = (this.persistSyncQueuePromise ?? Promise.resolve()).then(() => this._doPersistSyncQueue()).catch(() => {}); // errors are logged inside _doPersistSyncQueue
  }

  private async _doPersistSyncQueue(): Promise<void> {
    try {
      await db.initialize();
      await db.execute("DELETE FROM sync_queue", []);
      for (const item of this.syncQueue) {
        await db.execute("INSERT INTO sync_queue (id, operation, type, data, timestamp) VALUES (?, ?, ?, ?, ?)", [
          item.id,
          item.operation,
          item.type,
          JSON.stringify(item.data),
          item.timestamp.toISOString(),
        ]);
      }
    } catch (error) {
      logger.error("Failed to persist sync queue:", error);
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      await db.initialize();
      const result = await db.execute("SELECT * FROM sync_queue ORDER BY timestamp ASC", []);
      this.syncQueue = (result.results || []).map((row: any) => ({
        id: row.id,
        operation: row.operation,
        type: row.type,
        data: JSON.parse(row.data),
        timestamp: new Date(row.timestamp),
      }));
      this.updateSyncState({ pendingOperations: this.syncQueue.length });
    } catch (error) {
      logger.error("Failed to load sync queue:", error);
      this.syncQueue = [];
    }
  }

  private async persistConflicts(): Promise<void> {
    try {
      await db.initialize();
      await db.execute("DELETE FROM sync_conflicts", []);
      for (const conflict of this.conflicts) {
        await db.execute("INSERT INTO sync_conflicts (id, type, local_version, server_version, timestamp) VALUES (?, ?, ?, ?, ?)", [
          conflict.id,
          conflict.type,
          JSON.stringify(conflict.localVersion),
          JSON.stringify(conflict.serverVersion),
          conflict.timestamp.toISOString(),
        ]);
      }
    } catch (error) {
      logger.error("Failed to persist conflicts:", error);
    }
  }

  private loadConflicts(): void {
    db.initialize()
      .then(() => db.execute("SELECT * FROM sync_conflicts ORDER BY timestamp ASC", []))
      .then((result) => {
        this.conflicts = (result.results || []).map((row: any) => ({
          id: row.id,
          type: row.type,
          localVersion: JSON.parse(row.local_version),
          serverVersion: JSON.parse(row.server_version),
          timestamp: new Date(row.timestamp),
        }));
      })
      .catch((error) => {
        logger.error("Failed to load conflicts:", error);
        this.conflicts = [];
      });
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach((listener) => listener(this.getSyncState()));
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener("online", () => {
      this.updateSyncState({ isOnline: true });
      this.performSync().catch((e) => logger.error("Sync error on reconnect:", e));
    });

    window.addEventListener("offline", () => {
      this.updateSyncState({ isOnline: false, status: "offline" });
    });
  }

  private getEndpointForOperation(operation: { type: ResourceType }): string {
    const endpoints: Record<string, string> = {
      transaction: "/transactions",
      account: "/accounts",
      category: "/categories",
      rule: "/rules",
    };
    const endpoint = endpoints[operation.type as string];
    if (!endpoint) throw new Error(`Unknown operation type: ${operation.type}`);
    return endpoint;
  }

  private addConflict(conflict: SyncConflict): void {
    // Deduplicate — a second sync cycle might re-detect the same conflict.
    if (!this.conflicts.find((c) => c.id === conflict.id)) {
      this.conflicts.push(conflict);
      this.persistConflicts();
    }
  }
}

export const syncService = new SyncService();
export type { SyncConflict, SyncState };
