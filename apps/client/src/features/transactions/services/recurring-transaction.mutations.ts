import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RecurringTransactionCreate, RecurringTransactionUpdate, ProcessRecurringTransaction } from "./recurring-transaction.types";
import { recurringTransactionService } from "./recurring-transaction.service";
import { recurringTransactionQueryKeys } from "./recurring-transaction.keys";

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecurringTransactionCreate) => {
      const result = await recurringTransactionService.create(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.all });
    },
  });
};

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecurringTransactionUpdate }) => {
      const result = await recurringTransactionService.update(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (recurringTransaction) => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.detail(recurringTransaction.id) });
    },
  });
};

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await recurringTransactionService.delete(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.all });
    },
  });
};

export const usePauseRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPaused }: { id: string; isPaused: boolean }) => {
      const result = await recurringTransactionService.pause(id, isPaused);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (recurringTransaction) => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.detail(recurringTransaction.id) });
    },
  });
};

export const useProcessRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: ProcessRecurringTransaction }) => {
      const result = await recurringTransactionService.process(id, action);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringTransactionQueryKeys.all });
    },
  });
};
