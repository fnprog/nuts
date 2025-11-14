import { GetTransactionsParams } from "../api/transaction.api";

export const transactionQueryKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionQueryKeys.all, "list"] as const,
  list: (filters?: Partial<GetTransactionsParams>) => [...transactionQueryKeys.lists(), filters] as const,
  details: () => [...transactionQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionQueryKeys.details(), id] as const,
};
