import { useMutation } from "@tanstack/react-query";
import { accountService } from "./account.ts";
import { AccountFormSchema } from "./account.types.ts";

export const useCreateAccount = () => {

  return useMutation({
    mutationFn: async (account: AccountFormSchema) => {
      const result = await accountService.createAccount(account);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (_x, _y, _z, context) => {
      context.client.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useUpdateAccount = () => {

  return useMutation({
    mutationFn: async ({ id, account }: { id: string; account: AccountFormSchema }) => {
      const result = await accountService.updateAccount(id, account);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (_x, _y, _z, context) => {
      context.client.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useDeleteAccount = () => {

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await accountService.deleteAccount(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (_x, _y, _z, context) => {
      context.client.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};
