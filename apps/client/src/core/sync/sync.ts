import { crdtService } from "./crdt";
import { kyselyQueryService } from "./query";
import { connectivityService } from "./connectivity";
import { authService } from "@/features/auth/services/auth.service";
import { api as axios } from "@/lib/axios";
import { logger } from "@/lib/logger";
import { ResourceType, SyncConflict, SyncState } from "@nuts/types";
import { Result, ok, err } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";


/**
 * Synchronization Service for Offline-First Architecture
 *
 * Handles bidirectional sync between local CRDT documents and the server.
 * Manages conflict resolution, offline queue, and background sync.
 */

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

  private conflicts: SyncConflict[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor() {
    this.setupOnlineStatusListener();
    this.loadSyncQueue();
    this.loadConflicts();
  }

  /**
   * Initialize the sync service
   */
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

  /**
   * Start background sync process
   */
  async startBackgroundSync(): Promise<Result<void, ServiceError>> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const syncResult = await this.performSync();
    if (syncResult.isErr()) {
      return err(syncResult.error);
    }

    this.syncInterval = setInterval(async () => {
      if (authService.canSync()) {
        await this.performSync();
      }
    }, 30000);

    return ok(undefined);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform a complete sync cycle
   */
  async performSync(): Promise<Result<void, ServiceError>> {

    if (this.syncState.status === "syncing") {
      return ok(undefined);
    }

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
      this.updateSyncState({
        status: "error",
        error: "Failed to get valid access token for sync",
      });
      return err(ServiceError.sync("Failed to get valid access token"));
    }

    const pushResult = await this.pushLocalChanges();

    if (pushResult.isErr()) {
      logger.error("Sync failed:", pushResult.error);

      const axiosError = pushResult.error.cause as { response?: { status?: number } };
      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        this.updateSyncState({
          status: "error",
          error: "Authentication failed during sync - please re-authenticate",
          hasValidAuth: false,
        });
      } else {
        this.updateSyncState({
          status: "error",
          error: `Sync failed: ${pushResult.error.message}`,
        });
      }
      return err(pushResult.error);
    }

    const pullResult = await this.pullServerChanges();

    if (pullResult.isErr()) {
      logger.error("Sync failed:", pullResult.error);

      const axiosError = pullResult.error.cause as { response?: { status?: number } };

      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        this.updateSyncState({
          status: "error",
          error: "Authentication failed during sync - please re-authenticate",
          hasValidAuth: false,
        });
      } else {
        this.updateSyncState({
          status: "error",
          error: `Sync failed: ${pullResult.error.message}`,
        });
      }
      return err(pullResult.error);
    }

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

  /**
   * Push local changes to server
   * TODO: Add retries with exponential backofff (max retry or an error queue)
   */

  private async pushLocalChanges(): Promise<Result<void, ServiceError>> {
    const queueCopy = [...this.syncQueue];
    const successfulOperations: string[] = [];

    for (const operation of queueCopy) {
      const result = await this.pushOperation(operation);
      if (result.isOk()) {
        successfulOperations.push(operation.id);
      } else {
        logger.error("Failed to push operation:", operation, result.error);
      }
    }

    this.syncQueue = this.syncQueue.filter((op) => !successfulOperations.includes(op.id));
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    this.persistSyncQueue();

    return ok(undefined);
  }

  /**
   * Push a single operation to server
   */
  private async pushOperation(operation: any): Promise<Result<void, ServiceError>> {
    const endpoint = this.getEndpointForOperation(operation);

    try {
      switch (operation.operation) {
        case "create":
          await axios.post(endpoint, operation.data);
          break;
        case "update":
          await axios.put(`${endpoint}/${operation.data.id}`, operation.data);
          break;
        case "delete":
          await axios.delete(`${endpoint}/${operation.data.id}`);
          break;
      }
      return ok(undefined);
    } catch (error) {
      return err(ServiceError.fromAxiosError(error));
    }
  }

  /**
   * Pull server changes and merge with local CRDT
   */
  private async pullServerChanges(): Promise<Result<void, ServiceError>> {
    try {
      const lastSync = this.syncState.lastSyncAt?.toISOString() || new Date(0).toISOString();

      const syncResponse = await axios.get("/sync", {
        params: { since: lastSync },
        validateStatus: (status) => status < 400,
      });

      const data = syncResponse.data;

      if (!data || typeof data !== "object") {
        logger.error("Invalid sync response:", data);
        return err(ServiceError.sync("Invalid sync response format"));
      }

      const transactionsData = Array.isArray(data.transactions) ? data.transactions : [];
      const accountsData = Array.isArray(data.accounts) ? data.accounts : [];
      const categoriesData = Array.isArray(data.categories) ? data.categories : [];
      const budgetsData = Array.isArray(data.budgets) ? data.budgets : [];
      const tagsData = Array.isArray(data.tags) ? data.tags : [];
      const preferencesData = Array.isArray(data.preferences) ? data.preferences : [];

      const mergeResult = await this.mergeServerChanges({
        transactions: transactionsData,
        accounts: accountsData,
        categories: categoriesData,
        budgets: budgetsData,
        tags: tagsData,
        preferences: preferencesData,
      });

      if (mergeResult.isErr()) {
        return err(mergeResult.error);
      }

      const serverTimestamp = data.server_timestamp || new Date().toISOString();
      this.syncState.lastSyncAt = new Date(serverTimestamp);
      return ok(undefined);
    } catch (error) {
      logger.warn("Unified sync endpoint not available, performing full sync fallback:", error);
      return await this.performFullSync();
    }
  }

  /**
   * Perform full data sync (fallback when incremental sync isn't available)
   */
  private async performFullSync(): Promise<Result<void, ServiceError>> {
    try {
      const [transactionsResponse, accountsResponse, categoriesResponse] = await Promise.all([
        axios.get("/transactions"),
        axios.get("/accounts"),
        axios.get("/categories"),
      ]);

      const extractData = (response: any) => {
        if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else {
          logger.warn("Unexpected server response format:", response.data);
          return [];
        }
      };

      const serverData = {
        transactions: this.convertServerDataToCRDT(extractData(transactionsResponse)),
        accounts: this.convertServerDataToCRDT(extractData(accountsResponse)),
        categories: this.convertServerDataToCRDT(extractData(categoriesResponse)),
      };

      return await this.mergeServerChanges(serverData);
    } catch (error) {
      logger.error("Full sync failed:", error);
      return err(ServiceError.fromAxiosError(error));
    }
  }

  /**
   * Merge server changes into local CRDT
   */
  private async mergeServerChanges(serverData: {
    transactions: any[];
    accounts: any[];
    categories: any[];
    budgets?: any[];
    tags?: any[];
    preferences?: any[];
  }): Promise<Result<void, ServiceError>> {
    if (!Array.isArray(serverData.transactions)) {
      logger.error("Server transactions data is not an array:", serverData.transactions);
      serverData.transactions = [];
    }
    if (!Array.isArray(serverData.accounts)) {
      logger.error("Server accounts data is not an array:", serverData.accounts);
      serverData.accounts = [];
    }
    if (!Array.isArray(serverData.categories)) {
      logger.error("Server categories data is not an array:", serverData.categories);
      serverData.categories = [];
    }

    const localTransactions = crdtService.getTransactions();
    const localAccounts = crdtService.getAccounts();
    const localCategories = crdtService.getCategories();

    for (const serverTx of serverData.transactions) {
      if (!serverTx.id) {
        logger.warn("Skipping transaction without ID:", serverTx);
        continue;
      }

      const localTx = localTransactions[serverTx.id];

      if (!localTx) {
        const createResult = await crdtService.createTransaction(serverTx);
        if (createResult.isErr()) {
          logger.error("Failed to create transaction from server:", createResult.error);
        }
      } else if (new Date(serverTx.updated_at) > new Date(localTx.updated_at)) {
        if (this.hasLocalModifications(localTx, serverTx)) {
          this.addConflict({
            id: serverTx.id,
            type: "transaction",
            localVersion: localTx,
            serverVersion: serverTx,
            timestamp: new Date(),
          });
        } else {
          const updateResult = await crdtService.updateTransaction(serverTx.id, serverTx);
          if (updateResult.isErr()) {
            logger.error("Failed to update transaction from server:", updateResult.error);
          }
        }
      }
    }

    for (const serverAccount of serverData.accounts) {
      if (!serverAccount.id) {
        logger.warn("Skipping account without ID:", serverAccount);
        continue;
      }

      const localAccount = localAccounts[serverAccount.id];

      if (!localAccount) {
        const createResult = await crdtService.createAccount(serverAccount);
        if (createResult.isErr()) {
          logger.error("Failed to create account from server:", createResult.error);
        }
      } else if (new Date(serverAccount.updated_at) > new Date(localAccount.updated_at)) {
        if (this.hasLocalModifications(localAccount, serverAccount)) {
          this.addConflict({
            id: serverAccount.id,
            type: "account",
            localVersion: localAccount,
            serverVersion: serverAccount,
            timestamp: new Date(),
          });
        } else {
          const updateResult = await crdtService.updateAccount(serverAccount.id, serverAccount);
          if (updateResult.isErr()) {
            logger.error("Failed to update account from server:", updateResult.error);
          }
        }
      }
    }

    for (const serverCategory of serverData.categories) {
      if (!serverCategory.id) {
        logger.warn("Skipping category without ID:", serverCategory);
        continue;
      }

      const localCategory = localCategories[serverCategory.id];

      if (!localCategory) {
        const createResult = await crdtService.createCategory(serverCategory);
        if (createResult.isErr()) {
          logger.error("Failed to create category from server:", createResult.error);
        }
      } else if (new Date(serverCategory.updated_at) > new Date(localCategory.updated_at)) {
        if (this.hasLocalModifications(localCategory, serverCategory)) {
          this.addConflict({
            id: serverCategory.id,
            type: "category",
            localVersion: localCategory,
            serverVersion: serverCategory,
            timestamp: new Date(),
          });
        } else {
          const updateResult = await crdtService.updateCategory(serverCategory.id, serverCategory);
          if (updateResult.isErr()) {
            logger.error("Failed to update category from server:", updateResult.error);
          }
        }
      }
    }

    for (const serverBudget of serverData.budgets || []) {
      if (!serverBudget.id) {
        logger.warn("Skipping budget without ID:", serverBudget);
        continue;
      }

      const localBudgets = crdtService.getBudgets();
      const localBudget = localBudgets[serverBudget.id];

      if (!localBudget) {
        const createResult = await crdtService.createBudget(serverBudget);
        if (createResult.isErr()) {
          logger.error("Failed to create budget from server:", createResult.error);
        }
      } else if (new Date(serverBudget.updated_at) > new Date(localBudget.updated_at)) {
        const updateResult = await crdtService.updateBudget(serverBudget.id, serverBudget);
        if (updateResult.isErr()) {
          logger.error("Failed to update budget from server:", updateResult.error);
        }
      }
    }

    for (const serverTag of serverData.tags || []) {
      if (!serverTag.id) {
        logger.warn("Skipping tag without ID:", serverTag);
        continue;
      }

      const localTags = crdtService.getTags();
      const localTag = localTags[serverTag.id];

      if (!localTag) {
        const createResult = await crdtService.createTag(serverTag);
        if (createResult.isErr()) {
          logger.error("Failed to create tag from server:", createResult.error);
        }
      }
    }

    for (const serverPreference of serverData.preferences || []) {
      if (!serverPreference.id) {
        logger.warn("Skipping preference without ID:", serverPreference);
        continue;
      }

      const localPreferences = crdtService.getPreferences();
      const localPreference = localPreferences[serverPreference.id];

      if (!localPreference) {
        const createResult = await crdtService.createPreference(serverPreference);
        if (createResult.isErr()) {
          logger.error("Failed to create preference from server:", createResult.error);
        }
      } else if (new Date(serverPreference.updated_at) > new Date(localPreference.updated_at)) {
        const updateResult = await crdtService.updatePreference(serverPreference.id, serverPreference);
        if (updateResult.isErr()) {
          logger.error("Failed to update preference from server:", updateResult.error);
        }
      }
    }

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
   * Check if local data has modifications that conflict with server
   * NOTE: This may be inneficient we must consider 
   * Deep equality check for actual data changes
   * Vector clocks or Lamport timestamps for proper CRDT conflict detection
   * Hash-based comparison for performance
   */

  private hasLocalModifications(local: any, server: any): boolean {
    // Simple conflict detection - in reality, this would be more sophisticated
    return local.updated_at !== server.updated_at;
  }

  /**
   * Add an operation to the sync queue
   */
  addToSyncQueue(operation: { operation: "create" | "update" | "delete"; type: "transaction" | "account" | "category" | "rule"; data: any }): void {
    const queueItem = {
      ...operation,
      id: `${operation.type}_${operation.data.id}_${Date.now()}`,
      timestamp: new Date(),
    };

    this.syncQueue.push(queueItem);
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    this.persistSyncQueue();

    // Trigger immediate sync if we can sync
    if (authService.canSync()) {
      this.performSync().catch(logger.error);
    }
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(conflictId: string, resolution: "local" | "server" | "merge"): Promise<Result<void, ServiceError>> {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      return err(ServiceError.notFound("Conflict", conflictId));
    }

    switch (resolution) {
      case "local":
        this.addToSyncQueue({
          operation: "update",
          type: conflict.type,
          data: conflict.localVersion,
        });
        break;

      case "server":
        if (conflict.type === "transaction") {
          const updateResult = await crdtService.updateTransaction(conflict.id, conflict.serverVersion);
          if (updateResult.isErr()) {
            logger.error("Failed to resolve conflict with server version:", updateResult.error);
            return err(updateResult.error);
          }
        }
        break;

      case "merge":
        if (conflict.type === "transaction") {
          const updateResult = await crdtService.updateTransaction(conflict.id, conflict.serverVersion);
          if (updateResult.isErr()) {
            logger.error("Failed to resolve conflict with merge:", updateResult.error);
            return err(updateResult.error);
          }
        }
        break;
    }

    this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
    this.persistConflicts();

    this.updateSyncState({
      status: this.conflicts.length > 0 ? "conflict" : "synced",
    });

    return ok(undefined);
  }

  /**
   * Get current sync state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current conflicts
   */
  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  /**
   * Force a manual sync
   */
  async forceSync(): Promise<Result<void, ServiceError>> {
    return await this.performSync();
  }

  // Private helper methods

  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach((listener) => listener(this.getSyncState()));
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener("online", () => {
      this.updateSyncState({ isOnline: true });
      this.performSync().catch(logger.error);
    });

    window.addEventListener("offline", () => {
      this.updateSyncState({ isOnline: false, status: "offline" });
    });
  }

  private getEndpointForOperation(operation: any): string {
    switch (operation.type) {
      case "transaction":
        return "/transactions";
      case "account":
        return "/accounts";
      case "category":
        return "/categories";
      case "rule":
        return "/rules";
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private convertServerDataToCRDT(data: any[]): any[] {
    if (!Array.isArray(data)) {
      logger.warn("Expected array data for CRDT conversion, got:", typeof data);
      return [];
    }

    return data.map((item) => {
      // Ensure all required CRDT fields are present with proper fallbacks
      const converted = {
        ...item,
        id: item.id || crypto.randomUUID(),
        created_at: item.created_at || item.createdAt || new Date().toISOString(),
        updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
        deleted_at: item.deleted_at || item.deletedAt || null,
      };

      // Handle transaction-specific fields
      if (item.transaction_datetime || item.transactionDatetime) {
        converted.transaction_datetime = item.transaction_datetime || item.transactionDatetime;
      }

      // Handle numeric fields that might come as objects from PostgreSQL
      if (item.amount && typeof item.amount === "object") {
        converted.amount = parseFloat(item.amount.String || item.amount.value || item.amount) || 0;
      }

      if (item.original_amount && typeof item.original_amount === "object") {
        converted.original_amount = parseFloat(item.original_amount.String || item.original_amount.value || item.original_amount) || 0;
      }

      if (item.balance && typeof item.balance === "object") {
        converted.balance = parseFloat(item.balance.String || item.balance.value || item.balance) || 0;
      }

      if (item.exchange_rate && typeof item.exchange_rate === "object") {
        converted.exchange_rate = parseFloat(item.exchange_rate.String || item.exchange_rate.value || item.exchange_rate) || 1.0;
      }

      // Ensure boolean fields are properly converted
      converted.is_external = Boolean(item.is_external);
      converted.is_active = Boolean(item.is_active !== false); // Default to true if not specified
      converted.is_categorized = Boolean(item.is_categorized);

      // Handle optional UUID fields
      converted.category_id = item.category_id || null;
      converted.destination_account_id = item.destination_account_id || null;
      converted.parent_id = item.parent_id || null;
      converted.account_id = item.account_id || null;
      converted.created_by = item.created_by || null;
      converted.updated_by = item.updated_by || null;

      // Ensure required string fields have fallback values
      converted.type = item.type || "expense";
      converted.description = item.description || "";
      converted.transaction_currency = item.transaction_currency || "USD";
      converted.name = item.name || "";
      converted.currency = item.currency || "USD";
      converted.color = item.color || "#000000";
      converted.icon = item.icon || "Box";

      // Handle account and category embedded data from server joins
      // For transactions: extract embedded account and category data
      if (item.account_id && item.account_name) {
        // This is transaction data with embedded account info
        converted.account_name = item.account_name;
        converted.account_type = item.account_type;
        converted.account_currency = item.account_currency;
        converted.account_balance = item.account_balance;
      }

      if (item.category_id && item.category_name) {
        // This is transaction data with embedded category info
        converted.category_name = item.category_name;
        converted.category_color = item.category_color;
        converted.category_icon = item.category_icon;
      }

      if (item.destination_account_name) {
        // This is transaction data with embedded destination account info
        converted.destination_account_name = item.destination_account_name;
        converted.destination_account_type = item.destination_account_type;
        converted.destination_account_currency = item.destination_account_currency;
      }

      // Handle JSONB fields
      if (item.details && typeof item.details === "string") {
        try {
          converted.details = JSON.parse(item.details);
        } catch {
          converted.details = item.details;
        }
      } else {
        converted.details = item.details || {};
      }

      if (item.meta && typeof item.meta === "string") {
        try {
          converted.meta = JSON.parse(item.meta);
        } catch {
          converted.meta = item.meta;
        }
      } else {
        converted.meta = item.meta || {};
      }

      // Handle date fields
      if (item.exchange_rate_date) {
        converted.exchange_rate_date = item.exchange_rate_date;
      }

      // Handle provider-specific fields
      converted.provider_transaction_id = item.provider_transaction_id || null;

      return converted;
    });
  }

  private addConflict(conflict: SyncConflict): void {
    this.conflicts.push(conflict);
    this.persistConflicts();
  }

  private persistSyncQueue(): void {
    try {
      localStorage.setItem("nuts-sync-queue", JSON.stringify(this.syncQueue));
    } catch (error) {
      logger.error("Failed to persist sync queue:", error);
    }
  }


  //NOTE: Should this be in local-storage or in our sqlite db. what is most secure and what makes since
  private loadSyncQueue(): void {

    const result = Result.fromThrowable(() => {
      const stored = localStorage.getItem("nuts-sync-queue");
      if (!stored) return null;
      return JSON.parse(stored);
    })();

    result
      .map((parsed) => {
        if (Array.isArray(parsed)) {
          this.syncQueue = parsed;
          this.updateSyncState({ pendingOperations: this.syncQueue.length });
        } else {
          logger.warn("Invalid sync queue format, resetting");
          this.syncQueue = [];
        }
      })
      .mapErr((error) => {
        logger.error("Failed to load sync queue:", error);
        this.syncQueue = [];
      });

  }

  private persistConflicts(): void {
    try {
      localStorage.setItem("nuts-sync-conflicts", JSON.stringify(this.conflicts));
    } catch (error) {
      logger.error("Failed to persist conflicts:", error);
    }
  }

  private loadConflicts(): void {
    try {
      const stored = localStorage.getItem("nuts-sync-conflicts");
      if (stored) {
        this.conflicts = JSON.parse(stored);
      }
    } catch (error) {
      logger.error("Failed to load conflicts:", error);
    }
  }

  /**
   * Clear all sync data (for logout/reset)
   */
  async clear(): Promise<void> {
    this.stopBackgroundSync();
    this.syncQueue = [];
    this.conflicts = [];
    localStorage.removeItem("nuts-sync-queue");
    localStorage.removeItem("nuts-sync-conflicts");
    this.updateSyncState({
      status: "offline",
      lastSyncAt: null,
      pendingOperations: 0,
      error: null,
    });
  }
}

export const syncService = new SyncService();
export type { SyncConflict, SyncState };
