import { type } from "@nuts/validation";

export const conditionTypeSchema = type("'description' | 'amount' | 'account' | 'direction' | 'type' | 'category'");

export const conditionOperatorSchema = type(
  "'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'greater_equal' | 'less_than' | 'less_equal'"
);

export const actionTypeSchema = type("'set_category' | 'set_description' | 'set_tags' | 'set_note'");

export const ruleConditionSchema = type({
  type: conditionTypeSchema,
  operator: conditionOperatorSchema,
  value: "string | number | boolean",
  "logic_gate?": "'AND' | 'OR'",
});

export const ruleActionSchema = type({
  type: actionTypeSchema,
  value: "string | number | boolean | string[]",
});

export const transactionRuleSchema = type({
  id: "string",
  name: "string",
  is_active: "boolean",
  priority: "number",
  conditions: type([ruleConditionSchema, "[]"]),
  actions: type([ruleActionSchema, "[]"]),
  created_by: "string",
  "updated_by?": "string",
  created_at: "Date | string.date",
  updated_at: "Date | string.date",
  "deleted_at?": "Date | string.date",
});

export const createTransactionRuleSchema = type({
  name: "string>=1",
  is_active: "boolean = true",
  priority: "number.integer>=0 = 0",
  conditions: type([ruleConditionSchema, "[]"]),
  actions: type([ruleActionSchema, "[]"]),
}).narrow((data, ctx) => {
  if (data.conditions.length < 1) {
    return ctx.reject({ path: ["conditions"], message: "At least one condition is required" });
  }
  if (data.actions.length < 1) {
    return ctx.reject({ path: ["actions"], message: "At least one action is required" });
  }
  return true;
});

export const updateTransactionRuleSchema = type({
  "name?": "string>=1",
  "is_active?": "boolean",
  "priority?": "number.integer>=0",
  "conditions?": type([ruleConditionSchema, "[]"]),
  "actions?": type([ruleActionSchema, "[]"]),
}).narrow((data, ctx) => {
  if (data.conditions && data.conditions.length < 1) {
    return ctx.reject({ path: ["conditions"], message: "At least one condition is required" });
  }
  if (data.actions && data.actions.length < 1) {
    return ctx.reject({ path: ["actions"], message: "At least one action is required" });
  }
  return true;
});

export const ruleMatchSchema = type({
  rule_id: "string",
  rule_name: "string",
  rule_priority: "number",
  actions: type([ruleActionSchema, "[]"]),
  applied: "boolean",
  "error?": "string",
});

export type ConditionType = typeof conditionTypeSchema.infer;
export type ConditionOperator = typeof conditionOperatorSchema.infer;
export type ActionType = typeof actionTypeSchema.infer;
export type RuleCondition = typeof ruleConditionSchema.infer;
export type RuleAction = typeof ruleActionSchema.infer;
export type TransactionRule = typeof transactionRuleSchema.infer;
export type CreateTransactionRule = typeof createTransactionRuleSchema.infer;
export type UpdateTransactionRule = typeof updateTransactionRuleSchema.infer;
export type RuleMatch = typeof ruleMatchSchema.infer;

// Helper constants for UI
export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  description: "Description",
  amount: "Amount",
  account: "Account",
  direction: "Direction",
  type: "Type",
  category: "Category",
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "Equals",
  not_equals: "Does not equal",
  contains: "Contains",
  not_contains: "Does not contain",
  starts_with: "Starts with",
  ends_with: "Ends with",
  greater_than: "Greater than",
  greater_equal: "Greater than or equal",
  less_than: "Less than",
  less_equal: "Less than or equal",
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  set_category: "Set Category",
  set_description: "Set Description",
  set_tags: "Set Tags",
  set_note: "Set Note",
};

export const DIRECTION_OPTIONS = [
  { value: "incoming", label: "Incoming" },
  { value: "outgoing", label: "Outgoing" },
  { value: "internal", label: "Internal" },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

// Get operators for a specific condition type
export const getOperatorsForConditionType = (type: ConditionType): ConditionOperator[] => {
  switch (type) {
    case "description":
      return ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with"];
    case "amount":
      return ["equals", "not_equals", "greater_than", "greater_equal", "less_than", "less_equal"];
    case "account":
    case "category":
      return ["equals", "not_equals"];
    case "direction":
    case "type":
      return ["equals", "not_equals"];
    default:
      return ["equals", "not_equals"];
  }
};
