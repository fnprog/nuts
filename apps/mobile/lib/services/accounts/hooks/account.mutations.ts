import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../account.service';
import { getSyncService } from '@/lib/sync';
import type { AccountCreate } from '../account.types';

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const syncService = getSyncService();

  return useMutation({
    mutationFn: async (accountData: AccountCreate) => {
      const result = await accountService.createAccount(accountData);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      syncService.addToSyncQueue({
        operation: 'create',
        type: 'accounts',
        data,
      });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const syncService = getSyncService();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AccountCreate }) => {
      const result = await accountService.updateAccount(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      syncService.addToSyncQueue({
        operation: 'update',
        type: 'accounts',
        data,
      });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const syncService = getSyncService();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await accountService.deleteAccount(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      syncService.addToSyncQueue({
        operation: 'delete',
        type: 'accounts',
        data: { id },
      });
    },
  });
}
