import { type } from 'arktype';

const crdtIndicesSchema = type({
  'last_rebuilt?': 'string',
  version: 'number',
});

export const crdtDocumentSchema = type({
  version: 'string',
  created_at: 'string',
  updated_at: 'string',
  user_id: 'string',
  transactions: 'Record<string, unknown>',
  accounts: 'Record<string, unknown>',
  categories: 'Record<string, unknown>',
  budgets: 'Record<string, unknown>',
  tags: 'Record<string, unknown>',
  preferences: 'Record<string, unknown>',
  rules: 'Record<string, unknown>',
  indices: crdtIndicesSchema,
});

const crdtDetailsSchema = type({
  'payment_medium?': 'string',
  'location?': 'string',
  'note?': 'string',
  'payment_status?': 'string',
});

export const crdtTransactionSchema = type({
  id: 'string',
  amount: 'number',
  transaction_datetime: 'string',
  description: 'string',
  'category_id?': 'string',
  account_id: 'string',
  type: "'expense' | 'income' | 'transfer'",
  'destination_account_id?': 'string',
  'details?': crdtDetailsSchema,
  transaction_currency: 'string',
  original_amount: 'number',
  is_external: 'boolean',
  created_at: 'string',
  updated_at: 'string',
  'deleted_at?': 'string',
});

const crdtAccountMetaSchema = type({
  'notes?': 'string',
  'institution?': 'string',
  'institution_name?': 'string',
  'logo?': 'string',
});

export const crdtAccountSchema = type({
  id: 'string',
  name: 'string',
  type: 'string',
  'subtype?': 'string',
  currency: 'string',
  balance: 'number',
  'meta?': crdtAccountMetaSchema.or('null'),
  is_active: 'boolean',
  is_external: 'boolean',
  'provider_account_id?': 'string',
  'provider_name?': 'string',
  'sync_status?': 'string',
  'last_synced_at?': 'string',
  'connection_id?': 'string',
  'shared_finance_id?': 'string',
  'created_by?': 'string',
  'updated_by?': 'string',
  created_at: 'string',
  updated_at: 'string',
  'deleted_at?': 'string',
});

export const crdtCategorySchema = type({
  id: 'string',
  name: 'string',
  type: "'income' | 'expense'",
  color: 'string',
  'icon?': 'string',
  'parent_id?': 'string',
  is_active: 'boolean',
  created_at: 'string',
  updated_at: 'string',
  'deleted_at?': 'string',
});

export const crdtBudgetSchema = type({
  id: 'string',
  category_id: 'string',
  amount: 'number',
  start_date: 'string',
  end_date: 'string',
  frequency: 'string',
  'name?': 'string',
  'shared_finance_id?': 'string',
  created_at: 'string',
  updated_at: 'string',
});

export const crdtTagSchema = type({
  id: 'string',
  name: 'string',
  color: 'string',
  created_at: 'string',
});

export const crdtPreferenceSchema = type({
  id: 'string',
  locale: 'string',
  theme: 'string',
  currency: 'string',
  timezone: 'string',
  time_format: 'string',
  date_format: 'string',
  start_week_on_monday: 'boolean',
  dark_sidebar: 'boolean',
  created_at: 'string',
  updated_at: 'string',
  'deleted_at?': 'string',
});

const crdtRuleConditionSchema = type({
  type: "'description' | 'amount' | 'account' | 'direction' | 'type' | 'category'",
  operator:
    "'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'greater_equal' | 'less_than' | 'less_equal'",
  value: 'string | number | boolean',
  'logic_gate?': "'AND' | 'OR'",
});

const crdtRuleActionSchema = type({
  type: "'set_category' | 'set_description' | 'set_tags' | 'set_note'",
  value: 'string | number | boolean | string[]',
});

export const crdtRuleSchema = type({
  id: 'string',
  name: 'string',
  is_active: 'boolean',
  priority: 'number',
  conditions: type([crdtRuleConditionSchema, '[]']),
  actions: type([crdtRuleActionSchema, '[]']),
  created_by: 'string',
  'updated_by?': 'string',
  created_at: 'string',
  updated_at: 'string',
  'deleted_at?': 'string',
});

export type CRDTDocument = typeof crdtDocumentSchema.infer;
export type CRDTTransaction = typeof crdtTransactionSchema.infer;
export type CRDTAccount = typeof crdtAccountSchema.infer;
export type CRDTCategory = typeof crdtCategorySchema.infer;
export type CRDTBudget = typeof crdtBudgetSchema.infer;
export type CRDTTag = typeof crdtTagSchema.infer;
export type CRDTPreference = typeof crdtPreferenceSchema.infer;
export type CRDTRule = typeof crdtRuleSchema.infer;

export interface CRDTOperation {
  type: 'create' | 'update' | 'delete';
  collection:
    | 'transactions'
    | 'accounts'
    | 'categories'
    | 'budgets'
    | 'tags'
    | 'preferences'
    | 'rules';
  id: string;
  data?: any;
  timestamp: string;
}
