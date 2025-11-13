import { api } from "@/lib/axios";
import { ResultAsync, ServiceError } from "@/lib/result";
import { TransactionRule, CreateTransactionRule, UpdateTransactionRule, RuleMatch, transactionRuleSchema, ruleMatchSchema } from "../services/rule.types";
import { type, validateOrThrow } from "@nuts/validation";

export const rulesApi = {
  list() {
    return ResultAsync.fromPromise(
      api.get("/transactions/rules").then((res) => validateOrThrow(res.data, type([transactionRuleSchema, "[]"]))),
      ServiceError.fromAxiosError
    );
  },

  get(id: string) {
    return ResultAsync.fromPromise(
      api.get(`/transactions/rules/${id}`).then((res) => validateOrThrow(res.data, transactionRuleSchema)),
      ServiceError.fromAxiosError
    );
  },

  create(data: CreateTransactionRule) {
    return ResultAsync.fromPromise(
      api.post("/transactions/rules", data).then((res) => validateOrThrow(res.data, transactionRuleSchema)),
      ServiceError.fromAxiosError
    );
  },

  update(id: string, data: UpdateTransactionRule) {
    return ResultAsync.fromPromise(
      api.put(`/transactions/rules/${id}`, data).then((res) => validateOrThrow(res.data, transactionRuleSchema)),
      ServiceError.fromAxiosError
    );
  },

  delete(id: string) {
    return ResultAsync.fromPromise(api.delete(`/transactions/rules/${id}`), ServiceError.fromAxiosError);
  },

  toggle(id: string) {
    return ResultAsync.fromPromise(
      api.post(`/transactions/rules/toggle/${id}`).then((res) => validateOrThrow(res.data, transactionRuleSchema)),
      ServiceError.fromAxiosError
    );
  },

  applyToTransaction(transactionId: string) {
    return ResultAsync.fromPromise(
      api.post(`/transactions/rules/apply/${transactionId}`).then((res) => validateOrThrow(res.data, type([ruleMatchSchema, "[]"]))),
      ServiceError.fromAxiosError
    );
  },
};
