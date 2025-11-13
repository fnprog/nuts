import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTransactionRule, UpdateTransactionRule } from "./rule.types";
import { rulesService } from "./rules.service";
import { rulesApi } from "../api";
import { rulesQueryKeys } from "./rules.keys";

export const useCreateRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionRule) => {
      const result = await rulesService.createRule(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
    },
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionRule }) => {
      const result = await rulesService.updateRule(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.detail(data.id) });
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await rulesService.deleteRule(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
    },
  });
};

export const useToggleRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingRuleResult = await rulesService.getRule(id);
      if (existingRuleResult.isErr()) throw existingRuleResult.error;

      const existingRule = existingRuleResult.value;
      if (!existingRule) throw new Error("Rule not found");

      const result = await rulesService.updateRule(id, { is_active: !existingRule.is_active });
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: rulesQueryKeys.detail(data.id) });
    },
  });
};

export const useApplyRulesToTransaction = () => {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const result = await rulesApi.applyToTransaction(transactionId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};
