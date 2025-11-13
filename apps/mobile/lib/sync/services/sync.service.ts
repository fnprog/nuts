import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { CRDTService } from './crdt.service';
import { KyselyQueryService } from './kysely-query.service';
import { LocalDatabaseClient } from '../../storage/client';
import type { CRDTTransaction, CRDTAccount, CRDTCategory } from '@nuts/types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'conflict';

export interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  pendingOperations: number;
  error: string | null;
  isOnline: boolean;
  hasValidAuth: boolean;
}

export interface SyncConflict {
  id: string;
  type: 'transaction' | 'account' | 'category' | 'budget' | 'tag' | 'preference' | 'rule';
  localVersion: any;
  serverVersion: any;
  timestamp: Date;
}

type Collection =
  | 'transactions'
  | 'accounts'
  | 'categories'
  | 'budgets'
  | 'tags'
  | 'preferences'
  | 'rules';

const SYNC_QUEUE_KEY = '@nuts-sync-queue';
const SYNC_CONFLICTS_KEY = '@nuts-sync-conflicts';
const SYNC_STATE_KEY = '@nuts-sync-state';

export class SyncService {
  private syncState: SyncState = {
    status: 'offline',
    lastSyncAt: null,
    pendingOperations: 0,
    error: null,
    isOnline: false,
    hasValidAuth: false,
  };

  private syncQueue: {
    id: string;
    operation: 'create' | 'update' | 'delete';
    type: Collection;
    data: any;
    timestamp: Date;
  }[] = [];

  private conflicts: SyncConflict[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private crdtService: CRDTService | null = null;
  private queryService: KyselyQueryService | null = null;
  private userId: string | null = null;
  private accessToken: string | null = null;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async initialize(userId: string, accessToken: string): Promise<void> {
    this.userId = userId;
    this.accessToken = accessToken;

    this.crdtService = new CRDTService(userId);
    const initResult = await this.crdtService.initialize();
    
    if (initResult.isErr()) {
      throw new Error(`Failed to initialize CRDT service: ${initResult.error.message}`);
    }

    const dbClient = LocalDatabaseClient.getInstance();
    this.queryService = new KyselyQueryService(dbClient.getKysely());

    await this.loadSyncQueue();
    await this.loadConflicts();
    await this.loadSyncState();

    this.setupNetworkListener();

    const networkState = await NetInfo.fetch();
    this.updateSyncState({
      isOnline: networkState.isConnected || false,
      hasValidAuth: !!accessToken,
    });

    if (networkState.isConnected && accessToken) {
      await this.startBackgroundSync();
    }
  }

  async startBackgroundSync(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    await this.performSync();

    this.syncInterval = setInterval(async () => {
      if (this.canSync()) {
        await this.performSync();
      }
    }, 30000);
  }

  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async performSync(): Promise<void> {
    if (!this.canSync()) {
      this.updateSyncState({
        status: 'offline',
        error: this.syncState.isOnline ? 'No valid authentication' : 'No network connection',
      });
      return;
    }

    this.updateSyncState({ status: 'syncing', error: null });

    try {
      await this.pushLocalChanges();
      await this.pullServerChanges();

      this.updateSyncState({
        status: this.conflicts.length > 0 ? 'conflict' : 'synced',
        lastSyncAt: new Date(),
        error: null,
      });

      await this.persistSyncState();
    } catch (error) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 401 || err.response?.status === 403) {
        this.updateSyncState({
          status: 'error',
          error: 'Authentication failed - please re-login',
          hasValidAuth: false,
        });
      } else {
        this.updateSyncState({
          status: 'error',
          error: `Sync failed: ${err.message || 'Unknown error'}`,
        });
      }
    }
  }

  private async pushLocalChanges(): Promise<void> {
    const queueCopy = [...this.syncQueue];
    const successfulOperations: string[] = [];

    for (const operation of queueCopy) {
      try {
        await this.pushOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error('Failed to push operation:', operation, error);
      }
    }

    this.syncQueue = this.syncQueue.filter((op) => !successfulOperations.includes(op.id));
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    await this.persistSyncQueue();
  }

  private async pushOperation(operation: any): Promise<void> {
    const endpoint = this.getEndpointForOperation(operation);
    const url = `${this.apiBaseUrl}${endpoint}`;

    const config = {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    switch (operation.operation) {
      case 'create':
        await axios.post(url, operation.data, config);
        break;
      case 'update':
        await axios.put(`${url}/${operation.data.id}`, operation.data, config);
        break;
      case 'delete':
        await axios.delete(`${url}/${operation.data.id}`, config);
        break;
    }
  }

  private async pullServerChanges(): Promise<void> {
    try {
      const lastSync = this.syncState.lastSyncAt?.toISOString() || new Date(0).toISOString();

      const response = await axios.get(`${this.apiBaseUrl}/sync`, {
        params: { since: lastSync },
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        validateStatus: (status) => status < 400,
      });

      const data = response.data;

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid sync response format');
      }

      await this.mergeServerChanges({
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        budgets: Array.isArray(data.budgets) ? data.budgets : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        preferences: Array.isArray(data.preferences) ? data.preferences : [],
        rules: Array.isArray(data.rules) ? data.rules : [],
      });
    } catch (error) {
      console.warn('Unified sync endpoint failed, trying full sync:', error);
      await this.performFullSync();
    }
  }

  private async performFullSync(): Promise<void> {
    const config = {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    const [
      transactionsResponse,
      accountsResponse,
      categoriesResponse,
      budgetsResponse,
      tagsResponse,
      preferencesResponse,
      rulesResponse,
    ] = await Promise.all([
      axios.get(`${this.apiBaseUrl}/transactions`, config),
      axios.get(`${this.apiBaseUrl}/accounts`, config),
      axios.get(`${this.apiBaseUrl}/categories`, config),
      axios.get(`${this.apiBaseUrl}/budgets`, config).catch(() => ({ data: [] })),
      axios.get(`${this.apiBaseUrl}/tags`, config).catch(() => ({ data: [] })),
      axios.get(`${this.apiBaseUrl}/preferences`, config).catch(() => ({ data: [] })),
      axios.get(`${this.apiBaseUrl}/rules`, config).catch(() => ({ data: [] })),
    ]);

    const extractData = (response: any) => {
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    };

    await this.mergeServerChanges({
      transactions: extractData(transactionsResponse),
      accounts: extractData(accountsResponse),
      categories: extractData(categoriesResponse),
      budgets: extractData(budgetsResponse),
      tags: extractData(tagsResponse),
      preferences: extractData(preferencesResponse),
      rules: extractData(rulesResponse),
    });
  }

  private async mergeServerChanges(serverData: {
    transactions: any[];
    accounts: any[];
    categories: any[];
    budgets?: any[];
    tags?: any[];
    preferences?: any[];
    rules?: any[];
  }): Promise<void> {
    if (!this.crdtService || !this.queryService) return;

    const localDoc = this.crdtService.getDocument();
    if (!localDoc) return;

    await this.mergeCollection('transactions', serverData.transactions, localDoc.transactions);
    await this.mergeCollection('accounts', serverData.accounts, localDoc.accounts);
    await this.mergeCollection('categories', serverData.categories, localDoc.categories);
    await this.mergeCollection('budgets', serverData.budgets || [], localDoc.budgets);
    await this.mergeCollection('tags', serverData.tags || [], localDoc.tags);
    await this.mergeCollection('preferences', serverData.preferences || [], localDoc.preferences);
    await this.mergeCollection('rules', serverData.rules || [], localDoc.rules);

    await this.rebuildSQLiteIndices();
  }

  private async mergeCollection(
    collection: Collection,
    serverItems: any[],
    localItems: Record<string, any>
  ): Promise<void> {
    if (!this.crdtService) return;

    for (const serverItem of serverItems) {
      if (!serverItem.id) {
        console.warn(`Skipping ${collection} without ID:`, serverItem);
        continue;
      }

      const localItem = localItems[serverItem.id];

      if (!localItem) {
        const createResult = await this.crdtService.create(collection, serverItem.id, serverItem);
        if (createResult.isErr()) {
          console.error(`Failed to create ${collection} item ${serverItem.id}:`, createResult.error);
        }
      } else {
        const serverUpdated = new Date(serverItem.updated_at);
        const localUpdated = new Date(localItem.updated_at);

        if (serverUpdated > localUpdated) {
          if (this.hasLocalModifications(localItem, serverItem)) {
            this.addConflict({
              id: serverItem.id,
              type: collection as any,
              localVersion: localItem,
              serverVersion: serverItem,
              timestamp: new Date(),
            });
          } else {
            const updateResult = await this.crdtService.update(collection, serverItem.id, serverItem);
            if (updateResult.isErr()) {
              console.error(`Failed to update ${collection} item ${serverItem.id}:`, updateResult.error);
            }
          }
        }
      }
    }
  }

  private async rebuildSQLiteIndices(): Promise<void> {
    if (!this.crdtService || !this.queryService) return;

    const doc = this.crdtService.getDocument();
    if (!doc) return;

    await this.queryService.clearAllTables();

    for (const account of Object.values(doc.accounts)) {
      const accountData = account as CRDTAccount;
      if (!accountData.deleted_at) {
        await this.queryService.insertAccount({
          id: accountData.id,
          name: accountData.name,
          type: accountData.type as any,
          subtype: accountData.subtype || null,
          balance: accountData.balance,
          currency: accountData.currency,
          meta: accountData.meta ? JSON.stringify(accountData.meta) : null,
          is_external: accountData.is_external ? 1 : 0,
          is_active: accountData.is_active ? 1 : 0,
          provider_account_id: accountData.provider_account_id || null,
          provider_name: accountData.provider_name || null,
          sync_status: accountData.sync_status || null,
          last_synced_at: accountData.last_synced_at
            ? new Date(accountData.last_synced_at).getTime()
            : null,
          connection_id: accountData.connection_id || null,
          shared_finance_id: accountData.shared_finance_id || null,
          created_by: accountData.created_by || null,
          updated_by: accountData.updated_by || null,
          created_at: new Date(accountData.created_at).getTime(),
          updated_at: new Date(accountData.updated_at).getTime(),
          deleted_at: accountData.deleted_at ? new Date(accountData.deleted_at).getTime() : null,
        });
      }
    }

    for (const category of Object.values(doc.categories)) {
      const categoryData = category as CRDTCategory;
      if (!categoryData.deleted_at) {
        await this.queryService.insertCategory({
          id: categoryData.id,
          name: categoryData.name,
          type: categoryData.type,
          parent_id: categoryData.parent_id || null,
          is_default: 0,
          is_active: categoryData.is_active ? 1 : 0,
          color: categoryData.color || null,
          icon: categoryData.icon || 'Box',
          created_by: this.userId || '',
          updated_by: null,
          created_at: new Date(categoryData.created_at).getTime(),
          updated_at: new Date(categoryData.updated_at).getTime(),
          deleted_at: categoryData.deleted_at ? new Date(categoryData.deleted_at).getTime() : null,
        });
      }
    }

    for (const transaction of Object.values(doc.transactions)) {
      const txData = transaction as CRDTTransaction;
      if (!txData.deleted_at) {
        await this.queryService.insertTransaction({
          id: txData.id,
          amount: txData.amount,
          type: txData.type,
          account_id: txData.account_id,
          category_id: txData.category_id || null,
          destination_account_id: txData.destination_account_id || null,
          transaction_datetime: new Date(txData.transaction_datetime).getTime(),
          description: txData.description,
          details: txData.details ? JSON.stringify(txData.details) : null,
          is_external: txData.is_external ? 1 : 0,
          is_categorized: txData.category_id ? 1 : 0,
          transaction_currency: txData.transaction_currency,
          original_amount: txData.original_amount,
          shared_finance_id: null,
          provider_transaction_id: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(txData.created_at).getTime(),
          updated_at: new Date(txData.updated_at).getTime(),
          deleted_at: txData.deleted_at ? new Date(txData.deleted_at).getTime() : null,
        });
      }
    }
  }

  private hasLocalModifications(local: any, server: any): boolean {
    return local.updated_at !== server.updated_at;
  }

  addToSyncQueue(operation: {
    operation: 'create' | 'update' | 'delete';
    type: Collection;
    data: any;
  }): void {
    const queueItem = {
      ...operation,
      id: `${operation.type}_${operation.data.id}_${Date.now()}`,
      timestamp: new Date(),
    };

    this.syncQueue.push(queueItem);
    this.updateSyncState({ pendingOperations: this.syncQueue.length });
    this.persistSyncQueue();

    if (this.canSync()) {
      this.performSync().catch(console.error);
    }
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'merge'
  ): Promise<void> {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict || !this.crdtService) return;

    try {
      switch (resolution) {
        case 'local':
          this.addToSyncQueue({
            operation: 'update',
            type: conflict.type as Collection,
            data: conflict.localVersion,
          });
          break;

        case 'server': {
          const serverUpdateResult = await this.crdtService.update(
            conflict.type as Collection,
            conflict.id,
            conflict.serverVersion
          );
          if (serverUpdateResult.isErr()) {
            console.error('Failed to resolve conflict with server version:', serverUpdateResult.error);
            throw new Error(serverUpdateResult.error.message);
          }
          break;
        }

        case 'merge': {
          const mergeUpdateResult = await this.crdtService.update(
            conflict.type as Collection,
            conflict.id,
            conflict.serverVersion
          );
          if (mergeUpdateResult.isErr()) {
            console.error('Failed to resolve conflict with merge:', mergeUpdateResult.error);
            throw new Error(mergeUpdateResult.error.message);
          }
          break;
        }
      }

      this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
      await this.persistConflicts();

      this.updateSyncState({
        status: this.conflicts.length > 0 ? 'conflict' : 'synced',
      });
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
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

  async forceSync(): Promise<void> {
    await this.performSync();
  }

  private canSync(): boolean {
    return this.syncState.isOnline && this.syncState.hasValidAuth;
  }

  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.listeners.forEach((listener) => listener(this.getSyncState()));
  }

  private setupNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.syncState.isOnline;
      const isOnline = state.isConnected || false;

      this.updateSyncState({ isOnline });

      if (!wasOnline && isOnline && this.syncState.hasValidAuth) {
        this.performSync().catch(console.error);
      }

      if (!isOnline) {
        this.updateSyncState({ status: 'offline' });
      }
    });
  }

  private getEndpointForOperation(operation: any): string {
    switch (operation.type) {
      case 'transactions':
        return '/transactions';
      case 'accounts':
        return '/accounts';
      case 'categories':
        return '/categories';
      case 'budgets':
        return '/budgets';
      case 'tags':
        return '/tags';
      case 'preferences':
        return '/preferences';
      case 'rules':
        return '/rules';
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private addConflict(conflict: SyncConflict): void {
    this.conflicts.push(conflict);
    this.persistConflicts();
  }

  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        this.updateSyncState({ pendingOperations: this.syncQueue.length });
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async persistConflicts(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_CONFLICTS_KEY, JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Failed to persist conflicts:', error);
    }
  }

  private async loadConflicts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_CONFLICTS_KEY);
      if (stored) {
        this.conflicts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  private async persistSyncState(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SYNC_STATE_KEY,
        JSON.stringify({
          lastSyncAt: this.syncState.lastSyncAt?.toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to persist sync state:', error);
    }
  }

  private async loadSyncState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_STATE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        if (state.lastSyncAt) {
          this.syncState.lastSyncAt = new Date(state.lastSyncAt);
        }
      }
    } catch (error) {
      console.error('Failed to load sync state:', error);
    }
  }

  async clear(): Promise<void> {
    this.stopBackgroundSync();
    this.syncQueue = [];
    this.conflicts = [];
    await AsyncStorage.multiRemove([SYNC_QUEUE_KEY, SYNC_CONFLICTS_KEY, SYNC_STATE_KEY]);
    this.updateSyncState({
      status: 'offline',
      lastSyncAt: null,
      pendingOperations: 0,
      error: null,
    });
  }

  updateAccessToken(token: string): void {
    this.accessToken = token;
    this.updateSyncState({ hasValidAuth: true });
  }
}
