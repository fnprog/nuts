import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../transaction.service';
import type { TransactionCreate } from '../transaction.types';

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionCreate) => {
      const result = await transactionService.createTransaction(data);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TransactionCreate }) => {
      const result = await transactionService.updateTransaction(id, data);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await transactionService.deleteTransaction(id);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
