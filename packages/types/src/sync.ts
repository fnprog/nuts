export type ConnectivityStatus = "online" | "offline" | "fully-offline";

export interface ConnectivityState {
  status: ConnectivityStatus;
  isOnline: boolean;
  hasServerAccess: boolean;
  lastServerCheck: Date | null;
}


export type SyncStatus = "synced" | "syncing" | "offline" | "error" | "conflict";
export type ResourceType = "transaction" | "account" | "category" | "rule"

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
  type: ResourceType;
  localVersion: any;
  serverVersion: any;
  timestamp: Date;
}
