import { type } from "arktype";

const crdtIndicesSchema = type({
  "last_rebuilt?": "string",
  version: "number",
});

export const crdtPluginSchema = type({
  id: "string",
  name: "string",
  version: "string",
  status: "'installed' | 'enabled' | 'disabled' | 'uninstalling'",
  installed_at: "string",
  updated_at: "string",
  "config?": "Record<string, unknown>",
  "migration_version?": "number",
});

const crdtPluginMigrationStateSchema = type({
  plugin_id: "string",
  version: "number",
  applied_at: "string",
});

export const crdtDocumentSchema = type({
  version: "string",
  created_at: "string",
  updated_at: "string",
  user_id: "string",
  transactions: "Record<string, unknown>",
  accounts: "Record<string, unknown>",
  categories: "Record<string, unknown>",
  budgets: "Record<string, unknown>",
  tags: "Record<string, unknown>",
  preferences: "Record<string, unknown>",
  rules: "Record<string, unknown>",
  recurring_transactions: "Record<string, unknown>",
  notifications: "Record<string, unknown>",
  plugins: "Record<string, unknown>",
  plugin_data: "Record<string, Record<string, unknown>>",
  plugin_migrations: "Record<string, unknown>",
  indices: crdtIndicesSchema,
});

const crdtDetailsSchema = type({
  "payment_medium?": "string",
  "location?": "string",
  "note?": "string",
  "payment_status?": "string",
});

export const crdtTransactionSchema = type({
  id: "string",
  amount: "number",
  transaction_datetime: "string",
  description: "string",
  "category_id?": "string",
  account_id: "string",
  type: "'expense' | 'income' | 'transfer'",
  "destination_account_id?": "string",
  "details?": crdtDetailsSchema,
  transaction_currency: "string",
  original_amount: "number",
  is_external: "boolean",
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string",
});

const crdtAccountMetaSchema = type({
  "notes?": "string",
  "institution?": "string",
  "institution_name?": "string",
  "logo?": "string",
});

export const crdtAccountSchema = type({
  id: "string",
  name: "string",
  type: "string",
  "subtype?": "string",
  currency: "string",
  balance: "number",
  "meta?": crdtAccountMetaSchema.or("null"),
  is_active: "boolean",
  is_external: "boolean",
  "provider_account_id?": "string",
  "provider_name?": "string",
  "sync_status?": "string",
  "last_synced_at?": "string",
  "connection_id?": "string",
  "shared_finance_id?": "string",
  "created_by?": "string",
  "updated_by?": "string",
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string",
});

export const crdtCategorySchema = type({
  id: "string",
  name: "string",
  type: "'income' | 'expense'",
  color: "string",
  "icon?": "string",
  "parent_id?": "string",
  "plugin_id?": "string",
  is_active: "boolean",
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string",
});

export const crdtBudgetSchema = type({
  id: "string",
  category_id: "string",
  amount: "number",
  start_date: "string",
  end_date: "string",
  frequency: "string",
  "name?": "string",
  "shared_finance_id?": "string",
  created_at: "string",
  updated_at: "string",
});

export const crdtTagSchema = type({
  id: "string",
  name: "string",
  color: "string",
  created_at: "string",
});

export const crdtPreferenceSchema = type({
  id: "string",
  locale: "string",
  theme: "string",
  currency: "string",
  timezone: "string",
  time_format: "string",
  date_format: "string",
  start_week_on_monday: "boolean",
  dark_sidebar: "boolean",
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string",
});

const crdtRuleConditionSchema = type({
  type: "'description' | 'amount' | 'account' | 'direction' | 'type' | 'category'",
  operator:
    "'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'greater_equal' | 'less_than' | 'less_equal'",
  value: "string | number | boolean",
  "logic_gate?": "'AND' | 'OR'",
});

const crdtRuleActionSchema = type({
  type: "'set_category' | 'set_description' | 'set_tags' | 'set_note'",
  value: "string | number | boolean | string[]",
});

export const crdtRuleSchema = type({
  id: "string",
  name: "string",
  is_active: "boolean",
  priority: "number",
  conditions: type([crdtRuleConditionSchema, "[]"]),
  actions: type([crdtRuleActionSchema, "[]"]),
  created_by: "string",
  "updated_by?": "string",
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string",
});

const crdtFrequencyDataSchema = type({
  "day_of_week?": "number",
  "day_of_month?": "number",
  "week_of_month?": "number",
  "month_of_year?": "number",
  "week_days?": "number[]",
  "specific_dates?": "number[]",
  "pattern?": "string",
});

export const crdtRecurringTransactionSchema = type({
  id: "string",
  user_id: "string",
  account_id: "string",
  "category_id?": "string",
  "destination_account_id?": "string",
  amount: "number",
  type: "'income' | 'expense' | 'transfer'",
  "description?": "string",
  "details?": crdtDetailsSchema,
  frequency: "'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'",
  frequency_interval: "number",
  "frequency_data?": crdtFrequencyDataSchema,
  start_date: "string",
  "end_date?": "string",
  "last_generated_date?": "string",
  next_due_date: "string",
  auto_post: "boolean",
  is_paused: "boolean",
  "max_occurrences?": "number",
  occurrences_count: "number",
  "template_name?": "string",
  "tags?": "string[]",
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string",
});

export const crdtNotificationSchema = type({
  id: "string",
  user_id: "string",
  type: "'recurring_transaction_due' | 'recurring_transaction_failed' | 'transaction_needs_review' | 'budget_warning' | 'budget_exceeded' | 'system_announcement' | 'account_sync_failed'",
  status: "'unread' | 'read' | 'archived' | 'actioned'",
  priority: "'low' | 'medium' | 'high' | 'urgent'",
  title: "string",
  "message?": "string",
  "data?": "Record<string, unknown> | null",
  "action_url?": "string",
  "action_label?": "string",
  "action_taken_at?": "string",
  "related_transaction_id?": "string",
  "related_recurring_id?": "string",
  "related_account_id?": "string",
  created_at: "string",
  "read_at?": "string",
  "archived_at?": "string",
  "expires_at?": "string",
  hlc: "number",
  node_id: "string",
  "deleted_at?": "string",
});

export type CRDTDocument = typeof crdtDocumentSchema.infer;
export type CRDTTransaction = typeof crdtTransactionSchema.infer;
export type CRDTAccount = typeof crdtAccountSchema.infer;
export type CRDTCategory = typeof crdtCategorySchema.infer;
export type CRDTBudget = typeof crdtBudgetSchema.infer;
export type CRDTTag = typeof crdtTagSchema.infer;
export type CRDTPreference = typeof crdtPreferenceSchema.infer;
export type CRDTRule = typeof crdtRuleSchema.infer;
export type CRDTRecurringTransaction = typeof crdtRecurringTransactionSchema.infer;
export type CRDTNotification = typeof crdtNotificationSchema.infer;
export type CRDTPlugin = typeof crdtPluginSchema.infer;
export type CRDTPluginMigrationState = typeof crdtPluginMigrationStateSchema.infer;

export interface CRDTOperation {
  type: "create" | "update" | "delete";
  collection: "transactions" | "accounts" | "categories" | "budgets" | "tags" | "preferences" | "rules" | "recurring_transactions" | "notifications" | "plugins";
  id: string;
  data?: any;
  timestamp: string;
}
