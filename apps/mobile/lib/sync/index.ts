import { CRDTService } from './services/crdt.service';
import { KyselyQueryService } from './services/kysely-query.service';
import { SyncService } from './services/sync.service';
import { LocalDatabaseClient } from '@/lib/storage/client';
import { useAuthStore } from '@/stores/auth.store';

let crdtService: CRDTService | null = null;
let kyselyQueryService: KyselyQueryService | null = null;
let syncService: SyncService | null = null;
let dbClient: LocalDatabaseClient | null = null;

export function getCRDTService(): CRDTService {
  if (!crdtService) {
    const { user } = useAuthStore.getState();
    const userId = user?.id || 'anonymous';
    crdtService = new CRDTService(userId);
  }
  return crdtService;
}

export function getKyselyQueryService(): KyselyQueryService {
  if (!kyselyQueryService) {
    if (!dbClient) {
      dbClient = LocalDatabaseClient.getInstance();
    }
    kyselyQueryService = new KyselyQueryService(dbClient.getKysely());
  }
  return kyselyQueryService;
}

export function getSyncService(): SyncService {
  if (!syncService) {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    syncService = new SyncService(apiBaseUrl);
  }
  return syncService;
}

export async function initializeSyncServices(): Promise<void> {
  await CRDTService.initializeWasm();

  if (!dbClient) {
    dbClient = LocalDatabaseClient.getInstance();
  }

  await dbClient.initialize();

  const crdt = getCRDTService();
  await crdt.initialize();

  const { user, token } = useAuthStore.getState();

  if (user && token) {
    const sync = getSyncService();
    await sync.initialize(user.id, token);
  }

  console.log('✅ Sync services initialized');
}

export function updateSyncServiceAuth(token: string | null): void {
  if (syncService && token) {
    syncService.updateAccessToken(token);
  }
}

export function resetSyncServices(): void {
  crdtService = null;
  kyselyQueryService = null;
  syncService = null;
  console.log('🔄 Sync services reset');
}

export { CRDTService, KyselyQueryService, SyncService };
