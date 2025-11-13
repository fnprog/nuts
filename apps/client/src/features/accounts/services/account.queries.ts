import { queryOptions } from "@tanstack/react-query";
import { accountService } from "./account.ts";

export const getAllAccounts = () =>
  queryOptions({
    queryKey: ["accounts"],
    queryFn: async () => {
      const result = await accountService.getAccounts();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });

export const getAllAccountsWithTrends = () =>
  queryOptions({
    queryKey: ["accounts", "trends"],
    queryFn: async () => {
      const result = await accountService.getAccountsWTrends();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });

export const getAllAccountsBalanceTimeline = () =>
  queryOptions({
    queryKey: ["accounts", "timeline"],
    queryFn: async () => {
      const result = await accountService.getAccountsBalanceTimeline();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
