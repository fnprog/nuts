import { type } from "@nuts/validation";
import { categorySchema } from "@/features/categories/services/category.types";
import { accountSchema } from "@/features/accounts/services/account.types";

const recurringFrequency = type("'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'");

const recurringFrequencyData = type({
  "day_of_week?": "number | string.numeric.parse", // min 0 max 6 
  "day_of_month?": "number | string.numeric.parse", // min 1 max 31 
  "week_of_month?": "number | string.numeric.parse", // min -1 max 5 
  "month_of_year?": "number | string.numeric.parse", // min 1 max 12 
  "week_days?": "number[]", // for the num min0 max 6 
  "specific_dates?": "number[]", // for the num min1 max 31
  "pattern?": "string",
});

const recurringConfigSchema = type({
  frequency: recurringFrequency,
  frequency_interval: "number | string.numeric.parse", // Add min 1 max 999
  "frequency_data?": recurringFrequencyData,
  start_date: "Date | string.date.parse",
  "end_date?": "Date | string.date.parse",
  auto_post: "boolean",
  "max_occurrences?": "number | string.numeric.parse", // min(1)
  "template_name?": "string",
  "tags?": "string[]"
});


const recordDetailsSchema = type({
  "payment_medium?": "string",
  "location?": "string",
  "note?": "string",
  "payment_status?": "string",
});

const recordStandardSchema = type({
  id: "string",
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category_id?": "string>=1",
  account_id: "string>=1",
  "details?": recordDetailsSchema,
  updated_at: "Date | string.date.parse",
  is_external: "boolean",
  transaction_currency: "string",
  original_amount: "number",
  "is_recurring?": "boolean",
  "recurring_config?": recurringConfigSchema,
  "auto_post?": "boolean",
  "template_name?": "boolean",
  type: "'expense' | 'income'",
});

const recordTransferSchema = type({
  id: "string",
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category_id?": "string>=1",
  account_id: "string>=1",
  "details?": recordDetailsSchema,
  updated_at: "Date | string.date.parse",
  is_external: "boolean",
  transaction_currency: "string",
  original_amount: "number",
  type: "'transfer'",
  destination_account_id: "string>=1",
});

const extendedRecordStandardSchema = type({
  id: "string",
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category?": categorySchema,
  account: accountSchema,

  "is_recurring?": "boolean", // also nullable
  "recurring_config?": recurringConfigSchema, //also nullable
  "auto_post?": "boolean", //also nullable
  "template_name?": "boolean", // also nullable

  "details?": recordDetailsSchema,
  updated_at: "Date | string.date.parse",
  is_external: "boolean",
  transaction_currency: "string",
  original_amount: "number",
  type: "'expense' | 'income'",
});

const extendedRecordTransferSchema = type({
  id: "string",
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category?": categorySchema,
  account: accountSchema,
  "details?": recordDetailsSchema,
  updated_at: "Date | string.date.parse",
  is_external: "boolean",
  transaction_currency: "string",
  original_amount: "number",
  type: "'transfer'",
  destination_account: accountSchema,
});

export const recordSchema = recordStandardSchema.or(recordTransferSchema);
export const extendedRecordSchema = extendedRecordStandardSchema.or(extendedRecordTransferSchema);

export const recordsSchema = type([recordSchema, "[]"]);
export const extendedRecordsSchema = type([extendedRecordSchema, "[]"]);

const tableRecordStandardSchema = type({
  id: "string",
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category?": categorySchema,
  account: accountSchema,
  is_external: "boolean",
  type: "'expense' | 'income'",
});

const tableRecordTransferSchema = type({
  id: "string",
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category?": categorySchema,
  account: accountSchema,
  is_external: "boolean",
  type: "'transfer'",
  destination_account: accountSchema,
});

export const tableRecordSchema = tableRecordStandardSchema.or(tableRecordTransferSchema).pipe((record) => ({
  ...record,
  amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
}));

export const tableRecordsSchema = type({
  id: "string",
  date: "Date | string.date.parse",
  total: "number",
  transactions: type([tableRecordSchema, "[]"]),
});

export const tableRecordsArraySchema = type([tableRecordsSchema, "[]"]);

export const paginationSchema = type({
  total_items: "number",
  total_pages: "number",
  page: "number",
  limit: "number",
});

export const transactionsResponseSchema = type({
  data: tableRecordsArraySchema,
  pagination: paginationSchema,
});

const recordCreateStandardSchema = type({
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category_id?": "string>=1",
  account_id: "string>=1",
  "details?": recordDetailsSchema,
  type: "'expense' | 'income'",
});

const recordCreateTransferSchema = type({
  amount: "number | string.numeric.parse",
  transaction_datetime: "Date | string.date.parse",
  description: "string>=1",
  "category_id?": "string>=1",
  account_id: "string>=1",
  "details?": recordDetailsSchema,
  type: "'transfer'",
  destination_account_id: "string>=1",
});

export const recordCreateSchema = recordCreateStandardSchema.or(recordCreateTransferSchema).pipe((record) => ({
  ...record,
  amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
}));

export const recordUpdateSchema = recordCreateStandardSchema.or(recordCreateTransferSchema).pipe((record) => ({
  ...record,
  amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
}));

export type RecordSchema = typeof recordSchema.infer;
export type ExtendedRecordSchema = typeof extendedRecordSchema.infer;
export type TableRecordSchema = typeof tableRecordSchema.infer;
export type TableRecordsSchema = typeof tableRecordsSchema.infer;
export type TableRecordsArraySchema = typeof tableRecordsArraySchema.infer;
export type Pagination = typeof paginationSchema.infer;
export type TransactionsResponse = typeof transactionsResponseSchema.infer;
export type RecurringConfigSchema = typeof recurringConfigSchema.infer;

// recordStandardSchema.omit({
//   id: true,
//   is_external: true,
//   updated_at: true,
//   transaction_currency: true,
//   original_amount: true,
// })
//   ])
//   .transform((record) => ({
//   ...record,
//   amount: record.type === "expense" && record.amount > 0 ? -record.amount : record.amount,
// }));


export type RecordCreateSchema = typeof recordCreateSchema.infer;
export type RecordUpdateSchema = typeof recordUpdateSchema.infer;
export type RecordsSubmit = (values: RecordCreateSchema) => void;
