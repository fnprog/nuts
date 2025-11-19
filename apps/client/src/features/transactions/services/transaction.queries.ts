import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { transactionService } from "./transaction.service";
import { transactionQueryKeys } from "./transaction.keys";
import { GetTransactionsParams } from "../api/transaction.api";

export const useTransactions = (params: GetTransactionsParams & { enabled?: boolean }) => {
  const { enabled, ...queryParams } = params;
  return useQuery({
    queryKey: transactionQueryKeys.list(queryParams),
    queryFn: async () => {
      const result = await transactionService.getTransactions(queryParams);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: enabled !== false,
  });
};

export const useTransactionsSuspense = (params: GetTransactionsParams & { enabled?: boolean }) => {
  const { enabled, ...queryParams } = params;
  return useSuspenseQuery({
    queryKey: transactionQueryKeys.list(queryParams),
    queryFn: async () => {
      const result = await transactionService.getTransactions(queryParams);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: enabled !== false,
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: transactionQueryKeys.detail(id),
    queryFn: async () => {
      const result = await transactionService.getTransaction(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: !!id,
  });
};
