import { useEffect } from "react";
import { useProcessRecurringTransactions } from "./recurring-processor.mutations";
import { RecurringTransaction } from "./recurring-transaction.types";

interface UseAutoProcessRecurringOptions {
  recurringTransactions: RecurringTransaction[];
  userId: string;
  lookAheadDays?: number;
  enabled?: boolean;
  onSuccess?: (result: {
    notificationsCreated: number;
    transactionsCreated: number;
    errors: string[];
  }) => void;
  onError?: (error: Error) => void;
}

export function useAutoProcessRecurring(options: UseAutoProcessRecurringOptions) {
  const {
    recurringTransactions,
    userId,
    lookAheadDays = 7,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const { mutate, isPending, isSuccess, isError, error, data } = useProcessRecurringTransactions();

  useEffect(() => {
    if (!enabled || !userId || recurringTransactions.length === 0) {
      return;
    }

    mutate(
      {
        recurringTransactions,
        userId,
        lookAheadDays,
      },
      {
        onSuccess: (result) => {
          if (result.errors.length > 0) {
            console.warn("Some recurring transactions failed to process:", result.errors);
          }
          onSuccess?.(result);
        },
        onError: (err) => {
          console.error("Failed to process recurring transactions:", err);
          onError?.(err as Error);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isProcessing: isPending,
    isSuccess,
    isError,
    error,
    result: data,
  };
}
