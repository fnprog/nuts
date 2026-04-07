import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringProcessorService } from "./recurring-processor.service";
import { RecurringTransaction } from "./recurring-transaction.types";
import { notificationQueryKeys } from "@/features/notifications/services/notification.keys";

interface ProcessRecurringTransactionsParams {
  recurringTransactions: RecurringTransaction[];
  lookAheadDays?: number;
  userId: string;
}

export function useProcessRecurringTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ProcessRecurringTransactionsParams) => {
      const result = await recurringProcessorService.processRecurringTransactions(
        params.recurringTransactions,
        {
          lookAheadDays: params.lookAheadDays,
          userId: params.userId,
        }
      );

      if (result.isErr()) {
        throw result.error;
      }

      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useCreateTransactionFromRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recurring,
      dueDate,
      userId,
    }: {
      recurring: RecurringTransaction;
      dueDate: Date;
      userId: string;
    }) => {
      const result = await recurringProcessorService.createTransactionFromRecurring(recurring, dueDate, userId);

      if (result.isErr()) {
        throw result.error;
      }

      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

export function useCreateDueNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recurring,
      dueDate,
      userId,
    }: {
      recurring: RecurringTransaction;
      dueDate: Date;
      userId: string;
    }) => {
      const result = await recurringProcessorService.createDueNotification(recurring, dueDate, userId);

      if (result.isErr()) {
        throw result.error;
      }

      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
