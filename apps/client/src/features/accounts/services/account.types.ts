import { type } from "@nuts/validation";

const accountType = type("'cash' | 'momo' | 'credit' | 'investment' | 'checking' | 'savings' | 'loan' | 'other'");

const accountMeta = type({
  "notes?": "string",
  "institution?": "string",
  "institution_name?": "string",
  "logo?": "string",
});

export const accountSchema = type({
  id: "string",
  name: "string>=1",
  type: accountType,
  "subtype?": "string",
  "meta?": accountMeta.or("null"),
  balance: "number",
  is_external: "boolean",
  currency: "string>=1",
  updated_at: "string",
});

const balanceTimeseriesItem = type({
  date: "Date",
  balance: "number",
});

export const accountWTrendSchema = type({
  id: "string",
  name: "string>=1",
  type: accountType,
  "subtype?": "string",
  "meta?": accountMeta.or("null"),
  balance: "number",
  is_external: "boolean",
  currency: "string>=1",
  updated_at: "string",
  trend: "number",
  balance_timeseries: type([balanceTimeseriesItem, "[]"]),
});

export const accountBalanceTimelineSchema = type({
  balance: "number",
  month: "Date | string.date",
});

export const accountCreateSchema = type({
  name: "string>=1",
  type: accountType,
  "subtype?": "string",
  "meta?": accountMeta.or("null"),
  balance: "number",
  currency: "string>=1",
});

export const accountFormSchema = accountCreateSchema;

export const groupedAccountSchema = type({
  type: accountType,
  total: "number",
  trend: "number",
  accounts: type([accountWTrendSchema, "[]"]),
});

export type Account = typeof accountSchema.infer;
export type AccountWTrend = typeof accountWTrendSchema.infer;
export type GroupedAccount = typeof groupedAccountSchema.infer;
export type AccountBalanceTimeline = typeof accountBalanceTimelineSchema.infer;
export type AccountCreate = typeof accountCreateSchema.infer;
export type AccountFormSchema = typeof accountFormSchema.infer;
export type AccountSubmit = (values: AccountFormSchema) => void;
export type AccountUpdate = (id: string, values: AccountFormSchema) => void;
export type AccountDelete = (id: string) => void;
