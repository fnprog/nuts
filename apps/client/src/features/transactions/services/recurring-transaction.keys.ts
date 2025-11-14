import { RecurringTransactionFilters, RecurringInstancesRequest } from "./recurring-transaction.types";

export const recurringTransactionQueryKeys = {
  all: ["recurring-transactions"] as const,
  lists: () => [...recurringTransactionQueryKeys.all, "list"] as const,
  list: (filters?: RecurringTransactionFilters) => [...recurringTransactionQueryKeys.lists(), filters] as const,
  details: () => [...recurringTransactionQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...recurringTransactionQueryKeys.details(), id] as const,
  stats: () => [...recurringTransactionQueryKeys.all, "stats"] as const,
  instances: () => [...recurringTransactionQueryKeys.all, "instances"] as const,
  instancesRange: (request: RecurringInstancesRequest) => [...recurringTransactionQueryKeys.instances(), request] as const,
  recurringInstances: (id: string) => [...recurringTransactionQueryKeys.instances(), "recurring", id] as const,
};
