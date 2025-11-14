import { useQuery } from "@tanstack/react-query";
import { recurringTransactionService } from "./recurring-transaction.service";
import { recurringTransactionQueryKeys } from "./recurring-transaction.keys";
import { RecurringTransactionFilters, RecurringInstancesRequest } from "./recurring-transaction.types";

export const useRecurringTransactions = (filters?: RecurringTransactionFilters) => {
  return useQuery({
    queryKey: recurringTransactionQueryKeys.list(filters),
    queryFn: async () => {
      const result = await recurringTransactionService.getAll(filters);
      if (result.isErr()) throw result.error;
      return result.value.filter((rt) => !rt.deleted_at);
    },
  });
};

export const useRecurringTransaction = (id: string) => {
  return useQuery({
    queryKey: recurringTransactionQueryKeys.detail(id),
    queryFn: async () => {
      const result = await recurringTransactionService.getById(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: !!id,
  });
};

export const useRecurringTransactionStats = () => {
  return useQuery({
    queryKey: recurringTransactionQueryKeys.stats(),
    queryFn: async () => {
      const result = await recurringTransactionService.getStats();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useRecurringInstances = (request: RecurringInstancesRequest) => {
  return useQuery({
    queryKey: recurringTransactionQueryKeys.instancesRange(request),
    queryFn: async () => {
      const result = await recurringTransactionService.getInstances(request);
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useRecurringTransactionInstances = (id: string) => {
  return useQuery({
    queryKey: recurringTransactionQueryKeys.recurringInstances(id),
    queryFn: async () => {
      const result = await recurringTransactionService.getRecurringInstances(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: !!id,
  });
};
