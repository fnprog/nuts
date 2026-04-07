export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  date: string;
  created_at: string;
  updated_at: string;
}
