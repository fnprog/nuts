import { RuleCondition, RuleAction, TransactionRule, RuleMatch, ConditionOperator } from "../services/rule.types";

export interface TransactionData {
  id: string;
  description: string | null;
  amount: number;
  account_id: string;
  account_name: string;
  type: "income" | "expense" | "transfer";
  category_id: string | null;
  category_name: string;
  is_external: boolean;
  destination_account_id?: string | null;
}

export class RuleEvaluator {
  evaluateRule(rule: TransactionRule, transaction: TransactionData): RuleMatch {
    if (!rule.is_active) {
      return {
        rule_id: rule.id,
        rule_name: rule.name,
        rule_priority: rule.priority,
        actions: rule.actions,
        applied: false,
        error: "Rule is not active",
      };
    }

    const conditionResults: boolean[] = [];
    for (let i = 0; i < rule.conditions.length; i++) {
      try {
        const result = this.evaluateCondition(rule.conditions[i], transaction);
        conditionResults.push(result);
      } catch (error) {
        return {
          rule_id: rule.id,
          rule_name: rule.name,
          rule_priority: rule.priority,
          actions: rule.actions,
          applied: false,
          error: `Error evaluating condition ${i}: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    const finalResult = this.combineConditionResults(conditionResults, rule.conditions);

    return {
      rule_id: rule.id,
      rule_name: rule.name,
      rule_priority: rule.priority,
      actions: rule.actions,
      applied: finalResult,
    };
  }

  private evaluateCondition(condition: RuleCondition, transaction: TransactionData): boolean {
    switch (condition.type) {
      case "description":
        return this.evaluateStringCondition(condition, transaction.description);
      case "amount":
        return this.evaluateAmountCondition(condition, transaction.amount);
      case "account":
        return this.evaluateAccountCondition(condition, transaction.account_id, transaction.account_name);
      case "direction":
        return this.evaluateDirectionCondition(condition, transaction.type, transaction.is_external);
      case "type":
        return this.evaluateTypeCondition(condition, transaction.type);
      case "category":
        return this.evaluateCategoryCondition(condition, transaction.category_id, transaction.category_name);
      default:
        throw new Error(`Unsupported condition type: ${condition.type}`);
    }
  }

  private evaluateStringCondition(condition: RuleCondition, value: string | null): boolean {
    if (value === null) {
      return false;
    }

    if (typeof condition.value !== "string") {
      throw new Error("Condition value must be a string");
    }

    const valueStr = value.toLowerCase();
    const conditionStr = condition.value.toLowerCase();

    switch (condition.operator) {
      case "equals":
        return valueStr === conditionStr;
      case "not_equals":
        return valueStr !== conditionStr;
      case "contains":
        return valueStr.includes(conditionStr);
      case "not_contains":
        return !valueStr.includes(conditionStr);
      case "starts_with":
        return valueStr.startsWith(conditionStr);
      case "ends_with":
        return valueStr.endsWith(conditionStr);
      default:
        throw new Error(`Unsupported operator for string condition: ${condition.operator}`);
    }
  }

  private evaluateAmountCondition(condition: RuleCondition, amount: number): boolean {
    let conditionAmount: number;

    if (typeof condition.value === "string") {
      conditionAmount = parseFloat(condition.value);
      if (isNaN(conditionAmount)) {
        throw new Error(`Invalid amount value: ${condition.value}`);
      }
    } else if (typeof condition.value === "number") {
      conditionAmount = condition.value;
    } else {
      throw new Error(`Unsupported amount value type: ${typeof condition.value}`);
    }

    switch (condition.operator) {
      case "equals":
        return Math.abs(amount - conditionAmount) < 0.01;
      case "not_equals":
        return Math.abs(amount - conditionAmount) >= 0.01;
      case "greater_than":
        return amount > conditionAmount;
      case "greater_equal":
        return amount >= conditionAmount;
      case "less_than":
        return amount < conditionAmount;
      case "less_equal":
        return amount <= conditionAmount;
      default:
        throw new Error(`Unsupported operator for amount condition: ${condition.operator}`);
    }
  }

  private evaluateAccountCondition(condition: RuleCondition, accountId: string, accountName: string): boolean {
    if (typeof condition.value !== "string") {
      throw new Error(`Unsupported account value type: ${typeof condition.value}`);
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(condition.value);

    if (isUUID) {
      switch (condition.operator) {
        case "equals":
          return accountId === condition.value;
        case "not_equals":
          return accountId !== condition.value;
        default:
          throw new Error(`Unsupported operator for account ID condition: ${condition.operator}`);
      }
    } else {
      return this.evaluateStringCondition(condition, accountName);
    }
  }

  private evaluateDirectionCondition(condition: RuleCondition, transactionType: string, isExternal: boolean): boolean {
    if (typeof condition.value !== "string") {
      throw new Error("Condition value must be a string");
    }

    let direction: string;
    switch (transactionType) {
      case "income":
        direction = "incoming";
        break;
      case "expense":
        direction = "outgoing";
        break;
      case "transfer":
        direction = isExternal ? "outgoing" : "internal";
        break;
      default:
        direction = "unknown";
    }

    switch (condition.operator) {
      case "equals":
        return direction === condition.value;
      case "not_equals":
        return direction !== condition.value;
      default:
        throw new Error(`Unsupported operator for direction condition: ${condition.operator}`);
    }
  }

  private evaluateTypeCondition(condition: RuleCondition, transactionType: string): boolean {
    if (typeof condition.value !== "string") {
      throw new Error("Condition value must be a string");
    }

    switch (condition.operator) {
      case "equals":
        return transactionType === condition.value;
      case "not_equals":
        return transactionType !== condition.value;
      default:
        throw new Error(`Unsupported operator for type condition: ${condition.operator}`);
    }
  }

  private evaluateCategoryCondition(condition: RuleCondition, categoryId: string | null, categoryName: string): boolean {
    if (typeof condition.value !== "string") {
      throw new Error(`Unsupported category value type: ${typeof condition.value}`);
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(condition.value);

    if (isUUID) {
      switch (condition.operator) {
        case "equals":
          return categoryId !== null && categoryId === condition.value;
        case "not_equals":
          return categoryId === null || categoryId !== condition.value;
        default:
          throw new Error(`Unsupported operator for category ID condition: ${condition.operator}`);
      }
    } else {
      return this.evaluateStringCondition(condition, categoryName);
    }
  }

  private combineConditionResults(results: boolean[], conditions: RuleCondition[]): boolean {
    if (results.length === 0) {
      return false;
    }

    if (results.length === 1) {
      return results[0];
    }

    let finalResult = results[0];

    for (let i = 1; i < results.length; i++) {
      const logicGate = (conditions[i - 1].logic_gate || "AND").toUpperCase();

      switch (logicGate) {
        case "AND":
          finalResult = finalResult && results[i];
          break;
        case "OR":
          finalResult = finalResult || results[i];
          break;
        default:
          finalResult = finalResult && results[i];
      }
    }

    return finalResult;
  }

  evaluateRules(rules: TransactionRule[], transaction: TransactionData): RuleMatch[] {
    const matches: RuleMatch[] = [];

    for (const rule of rules) {
      const match = this.evaluateRule(rule, transaction);
      if (match.applied) {
        matches.push(match);
      }
    }

    return matches.sort((a, b) => b.rule_priority - a.rule_priority);
  }
}

export const ruleEvaluator = new RuleEvaluator();

export function applyRulesToTransaction(rules: TransactionRule[], transaction: TransactionData): RuleMatch[] {
  return ruleEvaluator.evaluateRules(rules, transaction);
}
