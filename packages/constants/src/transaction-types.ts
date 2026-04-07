import type { TransactionType } from "@nuts/types";

export const TRANSACTION_TYPES: Array<{ value: TransactionType; label: string }> = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];
