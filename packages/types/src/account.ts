export type AccountType = "checking" | "savings" | "credit" | "investment" | "loan" | "other";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institution_name?: string;
  created_at: string;
  updated_at: string;
}
