import { useQuery } from "@tanstack/react-query";
import { rulesService } from "./rules.service";
import { rulesQueryKeys } from "./rules.keys";

export const useRules = () => {
  return useQuery({
    queryKey: rulesQueryKeys.list(),
    queryFn: async () => {
      const result = await rulesService.getRules();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useRule = (id: string) => {
  return useQuery({
    queryKey: rulesQueryKeys.detail(id),
    queryFn: async () => {
      const result = await rulesService.getRule(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: !!id,
  });
};
