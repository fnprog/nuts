export interface CRDTDocument {
  version: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  transactions: Record<string, CRDTTransaction>;
  accounts: Record<string, CRDTAccount>;
  categories: Record<string, CRDTCategory>;
  budgets: Record<string, CRDTBudget>;
  tags: Record<string, CRDTTag>;
  preferences: Record<string, CRDTPreference>;
  rules: Record<string, CRDTRule>;
  indices: {
    last_rebuilt?: string;
    version: number;
  };
}

export interface CRDTTransaction {
  id: string;
  amount: number;
  transaction_datetime: string;
  description: string;
  category_id?: string;
  account_id: string;
  type: 'expense' | 'income' | 'transfer';
  destination_account_id?: string;
  details?: {
    payment_medium?: string;
    location?: string;
    note?: string;
    payment_status?: string;
  };
  transaction_currency: string;
  original_amount: number;
  is_external: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CRDTAccount {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  currency: string;
  balance: number;
  meta?: {
    notes?: string;
    institution?: string;
    institution_name?: string;
    logo?: string;
  } | null;
  is_active: boolean;
  is_external: boolean;
  provider_account_id?: string;
  provider_name?: string;
  sync_status?: string;
  last_synced_at?: string;
  connection_id?: string;
  shared_finance_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CRDTCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CRDTBudget {
  id: string;
  category_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  frequency: string;
  name?: string;
  shared_finance_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CRDTTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CRDTPreference {
  id: string;
  locale: string;
  theme: string;
  currency: string;
  timezone: string;
  time_format: string;
  date_format: string;
  start_week_on_monday: boolean;
  dark_sidebar: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CRDTRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  conditions: {
    type: 'description' | 'amount' | 'account' | 'direction' | 'type' | 'category';
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'starts_with'
      | 'ends_with'
      | 'greater_than'
      | 'greater_equal'
      | 'less_than'
      | 'less_equal';
    value: string | number | boolean;
    logic_gate?: 'AND' | 'OR';
  }[];
  actions: {
    type: 'set_category' | 'set_description' | 'set_tags' | 'set_note';
    value: string | number | boolean | string[];
  }[];
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
