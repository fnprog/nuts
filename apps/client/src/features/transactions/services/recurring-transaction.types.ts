import { type } from "@nuts/validation";

export const frequencyDataSchema = type({
  "day_of_week?": "0 <= number <= 6 | string.numeric.parse",
  "day_of_month?": "1 <= number <= 31 | string.numeric.parse",
  "week_of_month?": "-1 <= number <= 5 | string.numeric.parse",
  "month_of_year?": "1 <= number <= 12 | string.numeric.parse",
  "week_days?": "(0 <= number <= 6)[]",
  "specific_dates?": "(1 <= number <= 31)[]",
  "pattern?": "string",
});

const recurringDetailsSchema = type({
  "payment_medium?": "string",
  "location?": "string",
  "note?": "string",
  "payment_status?": "string",
});

export const baseRecurringTransactionSchema = type({
  id: "string",
  user_id: "string",
  account_id: "string",
  "category_id?": "string",
  "destination_account_id?": "string",
  amount: "number > 0",
  type: "'income' | 'expense' | 'transfer'",
  "description?": "string",
  "details?": recurringDetailsSchema,
  frequency: "'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'",
  "frequency_interval?": "number >= 1",
  "frequency_data?": frequencyDataSchema,
  start_date: "Date | string.date.parse",
  "end_date?": "Date | string.date.parse",
  "last_generated_date?": "Date | string.date.parse",
  next_due_date: "Date | string.date.parse",
  "auto_post?": "boolean",
  "is_paused?": "boolean",
  "max_occurrences?": "number > 0",
  "occurrences_count?": "number >= 0",
  "template_name?": "string",
  "tags?": "string[]",
  created_at: "Date | string.date.parse",
  updated_at: "Date | string.date.parse",
  "deleted_at?": "Date | string.date.parse",
});

export const recurringTransactionCreateSchema = type({
  account_id: "string",
  "category_id?": "string",
  "destination_account_id?": "string",
  amount: "number > 0",
  type: "'income' | 'expense' | 'transfer'",
  "description?": "string",
  "details?": recurringDetailsSchema,
  frequency: "'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'",
  "frequency_interval?": "number >= 1",
  "frequency_data?": frequencyDataSchema,
  start_date: "Date | string.date.parse",
  "end_date?": "Date | string.date.parse",
  "auto_post?": "boolean",
  "is_paused?": "boolean",
  "max_occurrences?": "number > 0",
  "template_name?": "string",
  "tags?": "string[]",
});

export const recurringTransactionUpdateSchema = type({
  "account_id?": "string",
  "category_id?": "string",
  "destination_account_id?": "string",
  "amount?": "number > 0",
  "type?": "'income' | 'expense' | 'transfer'",
  "description?": "string",
  "details?": recurringDetailsSchema,
  "frequency?": "'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'",
  "frequency_interval?": "number >= 1",
  "frequency_data?": frequencyDataSchema,
  "start_date?": "Date | string.date.parse",
  "end_date?": "Date | string.date.parse",
  "auto_post?": "boolean",
  "is_paused?": "boolean",
  "max_occurrences?": "number > 0",
  "template_name?": "string",
  "tags?": "string[]",
  "update_mode?": "'future_only' | 'next_only' | 'split_series'",
});

export const recurringInstanceSchema = type({
  due_date: "Date | string.date.parse",
  amount: "number",
  "description?": "string",
  "transaction_id?": "string",
  status: "'pending' | 'posted' | 'skipped' | 'failed'",
  is_projected: "boolean",
  can_modify: "boolean",
});

export const recurringTransactionStatsSchema = type({
  total_count: "number",
  active_count: "number",
  paused_count: "number",
  due_count: "number",
});

export const recurringTransactionFiltersSchema = type({
  "account_id?": "string",
  "category_id?": "string",
  "frequency?": "string",
  "is_paused?": "boolean",
  "auto_post?": "boolean",
  "template_name?": "string",
  "start_date?": "Date | string.date.parse",
  "end_date?": "Date | string.date.parse",
});

export const recurringInstancesRequestSchema = type({
  start_date: "Date | string.date.parse",
  end_date: "Date | string.date.parse",
  "include_projected?": "boolean",
});

export const recurringInstancesResponseSchema = type({
  instances: type([recurringInstanceSchema, "[]"]),
  summary: type({
    total_count: "number",
    pending_count: "number",
    posted_count: "number",
    skipped_count: "number",
    total_amount: "number",
  }),
});

export const processRecurringTransactionSchema = type({
  action: "'post' | 'skip' | 'modify'",
  "transaction_request?": type({
    "amount?": "number",
    "description?": "string",
    "category_id?": "string",
    "transaction_datetime?": "Date | string.date.parse",
  }),
});

export type FrequencyData = typeof frequencyDataSchema.infer;
export type RecurringTransaction = typeof baseRecurringTransactionSchema.infer;
export type RecurringTransactionCreate = typeof recurringTransactionCreateSchema.infer;
export type RecurringTransactionUpdate = typeof recurringTransactionUpdateSchema.infer;
export type RecurringInstance = typeof recurringInstanceSchema.infer;
export type RecurringTransactionStats = typeof recurringTransactionStatsSchema.infer;
export type RecurringTransactionFilters = typeof recurringTransactionFiltersSchema.infer;
export type RecurringInstancesRequest = typeof recurringInstancesRequestSchema.infer;
export type RecurringInstancesResponse = typeof recurringInstancesResponseSchema.infer;
export type ProcessRecurringTransaction = typeof processRecurringTransactionSchema.infer;

// Common frequency options for UI
export const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
] as const;

// Common custom frequency patterns
export const customFrequencyPatterns = [
  { value: "first_monday", label: "First Monday of the month" },
  { value: "last_weekday", label: "Last weekday of the month" },
  { value: "first_and_fifteenth", label: "1st and 15th of the month" },
  { value: "last_day", label: "Last day of the month" },
  { value: "weekdays_only", label: "Weekdays only" },
] as const;

// Status color mapping for UI
export const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  posted: "bg-green-100 text-green-800",
  skipped: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
} as const;

// Frequency description helpers
export const getFrequencyDescription = (
  frequency: string,
  interval: number,
  frequencyData?: FrequencyData
): string => {
  switch (frequency) {
    case "daily":
      return interval === 1 ? "Daily" : `Every ${interval} days`;
    case "weekly":
      return interval === 1 ? "Weekly" : `Every ${interval} weeks`;
    case "biweekly":
      return "Bi-weekly";
    case "monthly":
      return interval === 1 ? "Monthly" : `Every ${interval} months`;
    case "yearly":
      return interval === 1 ? "Yearly" : `Every ${interval} years`;
    case "custom":
      if (frequencyData?.pattern) {
        return frequencyData.pattern;
      }
      return "Custom frequency";
    default:
      return "Unknown frequency";
  }
};