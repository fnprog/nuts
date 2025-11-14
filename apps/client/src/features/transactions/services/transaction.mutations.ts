import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "./transaction.service";
import { transactionQueryKeys } from "./transaction.keys";
import { RecordCreateSchema, RecordUpdateSchema } from "./transaction.types";
import { toast } from "sonner";

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: RecordCreateSchema) => {
      const result = await transactionService.createTransaction(transaction);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create transaction", {
        description: error.message,
      });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RecordUpdateSchema }) => {
      const result = await transactionService.updateTransaction(id, updates);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.detail(variables.id) });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update transaction", {
        description: error.message,
      });
    },
  });
};

export const useDeleteTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[] | string) => {
      const result = await transactionService.deleteTransactions(ids);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Transaction(s) deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete transaction(s)", {
        description: error.message,
      });
    },
  });
};

export const useBulkDeleteTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const result = await transactionService.bulkDeleteTransactions(transactionIds);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Transactions deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete transactions", {
        description: error.message,
      });
    },
  });
};

export const useBulkUpdateCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionIds, categoryId }: { transactionIds: string[]; categoryId: string }) => {
      const result = await transactionService.bulkUpdateCategories(transactionIds, categoryId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Categories updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update categories", {
        description: error.message,
      });
    },
  });
};

export const useBulkUpdateManualTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      transactionIds: string[];
      categoryId?: string;
      accountId?: string;
      transactionDatetime?: Date;
    }) => {
      const result = await transactionService.bulkUpdateManualTransactions(params);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Transactions updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update transactions", {
        description: error.message,
      });
    },
  });
};
