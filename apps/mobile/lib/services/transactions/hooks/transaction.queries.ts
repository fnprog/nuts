import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../transaction.service';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const result = await transactionService.getTransactions();
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: async () => {
      const result = await transactionService.getTransactionById(id);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    enabled: !!id,
  });
}

export function useRecentTransactions(limit: number = 50) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async () => {
      const result = await transactionService.getRecentTransactions(limit);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
  });
}
