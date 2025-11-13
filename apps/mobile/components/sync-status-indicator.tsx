import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { getSyncService } from '@/lib/sync';
import type { SyncState } from '@/lib/sync/services/sync.service';

export function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState<SyncState | null>(null);

  useEffect(() => {
    const syncService = getSyncService();
    const unsubscribe = syncService.subscribe(setSyncState);

    setSyncState(syncService.getSyncState());

    return () => unsubscribe();
  }, []);

  if (!syncState) return null;

  const getStatusColor = () => {
    switch (syncState.status) {
      case 'synced':
        return 'text-green-600';
      case 'syncing':
        return 'text-blue-600';
      case 'offline':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      case 'conflict':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'synced':
        return '✓';
      case 'syncing':
        return '↻';
      case 'offline':
        return '⚠';
      case 'error':
        return '✗';
      case 'conflict':
        return '!';
      default:
        return '';
    }
  };

  const getStatusText = () => {
    if (syncState.status === 'offline') {
      if (!syncState.isOnline) {
        return 'Offline';
      }
      if (!syncState.hasValidAuth) {
        return 'Not authenticated';
      }
    }
    return syncState.status.charAt(0).toUpperCase() + syncState.status.slice(1);
  };

  return (
    <View className="flex-row items-center gap-2 px-4 py-2">
      <Text className={`text-sm ${getStatusColor()}`}>
        {getStatusIcon()} {getStatusText()}
      </Text>
      {syncState.pendingOperations > 0 && (
        <Text className="text-xs text-gray-500">({syncState.pendingOperations} pending)</Text>
      )}
    </View>
  );
}
