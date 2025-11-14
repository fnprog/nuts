import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { transactionService } from "./transaction.service";
import { transactionQueryKeys } from "./transaction.keys";
import { GetTransactionsParams } from "../api/transaction.api";

export const useTransactions = (params: GetTransactionsParams) => {
  return useQuery({
    queryKey: transactionQueryKeys.list(params),
    queryFn: async () => {
      const result = await transactionService.getTransactions(params);
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useTransactionsSuspense = (params: GetTransactionsParams) => {
  return useSuspenseQuery({
    queryKey: transactionQueryKeys.list(params),
    queryFn: async () => {
      const result = await transactionService.getTransactions(params);
      if (result.isErr()) throw result.error;
      return result.value;
    },
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
