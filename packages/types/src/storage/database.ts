import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface UsersTable {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  password: string;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface CurrenciesTable {
  code: string;
  name: string;
}

export interface AccountsTable {
  id: string;
  name: string;
  type: "cash" | "momo" | "credit" | "investment" | "checking" | "savings" | "loan" | "other";
  subtype: string | null;
  balance: number;
  currency: string;
  meta: string | null;
  is_external: 0 | 1;
  is_active: 0 | 1;
  provider_account_id: string | null;
  provider_name: string | null;
  sync_status: string | null;
  last_synced_at: number | null;
  connection_id: string | null;
  shared_finance_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface CategoriesTable {
  id: string;
  name: string;
  type: "income" | "expense";
  parent_id: string | null;
  is_default: 0 | 1;
  is_active: 0 | 1;
  color: string | null;
  icon: string;
  created_by: string;
  updated_by: string | null;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface TransactionsTable {
  id: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  account_id: string;
  category_id: string | null;
  destination_account_id: string | null;
  transaction_datetime: number;
  description: string;
  details: string | null;
  is_external: 0 | 1;
  is_categorized: 0 | 1;
  transaction_currency: string;
  original_amount: number;
  shared_finance_id: string | null;
  provider_transaction_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface PreferencesTable {
  id: string;
  user_id: string;
  locale: string;
  theme: string;
  currency: string;
  timezone: string;
  time_format: string;
  date_format: string;
  start_week_on_monday: 0 | 1;
  dark_sidebar: 0 | 1;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface TagsTable {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: Generated<number>;
}

export interface BudgetsTable {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  start_date: number;
  end_date: number;
  frequency: string;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface RulesTable {
  id: string;
  name: string;
  is_active: 0 | 1;
  priority: number;
  conditions: string;
  actions: string;
  created_by: string;
  updated_by: string | null;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}

export interface CRDTDocumentsTable {
  id: Generated<number>;
  user_id: string;
  document_binary: Uint8Array;
  created_at: string;
  updated_at: string;
}

export interface CRDTBackupsTable {
  id: Generated<number>;
  backup_id: string;
  document_binary: Uint8Array;
  created_at: string;
}

export interface MigrationStateTable {
  id: Generated<number>;
  migration_id: string;
  anonymous_user_id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";
  stage: "started" | "uploading" | "completed" | "error";
  progress: number;
  total_items: number;
  migrated_categories: number;
  migrated_accounts: number;
  migrated_transactions: number;
  failed_categories: number;
  failed_accounts: number;
  failed_transactions: number;
  current_chunk: number;
  total_chunks: number;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  users: UsersTable;
  currencies: CurrenciesTable;
  accounts: AccountsTable;
  categories: CategoriesTable;
  transactions: TransactionsTable;
  preferences: PreferencesTable;
  tags: TagsTable;
  budgets: BudgetsTable;
  rules: RulesTable;
  crdt_documents: CRDTDocumentsTable;
  crdt_backups: CRDTBackupsTable;
  migration_state: MigrationStateTable;
}

export type DBUser = Selectable<UsersTable>;
export type DBNewUser = Insertable<UsersTable>;
export type DBUserUpdate = Updateable<UsersTable>;

export type DBCurrency = Selectable<CurrenciesTable>;
export type DBNewCurrency = Insertable<CurrenciesTable>;

export type DBAccount = Selectable<AccountsTable>;
export type DBNewAccount = Insertable<AccountsTable>;
export type DBAccountUpdate = Updateable<AccountsTable>;

export type DBCategory = Selectable<CategoriesTable>;
export type DBNewCategory = Insertable<CategoriesTable>;
export type DBCategoryUpdate = Updateable<CategoriesTable>;

export type DBTransaction = Selectable<TransactionsTable>;
export type DBNewTransaction = Insertable<TransactionsTable>;
export type DBTransactionUpdate = Updateable<TransactionsTable>;

export type DBPreference = Selectable<PreferencesTable>;
export type DBNewPreference = Insertable<PreferencesTable>;
export type DBPreferenceUpdate = Updateable<PreferencesTable>;

export type DBTag = Selectable<TagsTable>;
export type DBNewTag = Insertable<TagsTable>;
export type DBTagUpdate = Updateable<TagsTable>;

export type DBBudget = Selectable<BudgetsTable>;
export type DBNewBudget = Insertable<BudgetsTable>;
export type DBBudgetUpdate = Updateable<BudgetsTable>;

export type DBRule = Selectable<RulesTable>;
export type DBNewRule = Insertable<RulesTable>;
export type DBRuleUpdate = Updateable<RulesTable>;


export type DatabaseRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type UserRecord = DatabaseRecord & {
  createdBy?: string | null;
  updatedBy?: string | null;
};

// Query parameters for filtering and pagination
export interface QueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filters?: Record<string, any>;
}

// Database operation results
export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}
