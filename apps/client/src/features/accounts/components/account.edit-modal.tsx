import { useCallback, useId, useEffect, useRef, useState } from "react";
import { arktypeResolver } from "@/lib/arktype-resolver";
import { useForm } from "react-hook-form";
import { accountTypeOptions } from "./account.constants";

import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { SearchableSelect } from "@/core/components/ui/search-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { AccountWTrend, accountFormSchema, AccountFormSchema } from "../services/account.types";
import { AccountUpdate } from "../services/account.types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/core/components/ui/form";
import { getCurrencySymbol } from "@/lib/formatting";

const useDynamicCurrencyWidth = (currency: string) => {
  const [width, setWidth] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      const symbol = getCurrencySymbol(currency);
      spanRef.current.textContent = symbol;
      setWidth(spanRef.current.offsetWidth);
    }
  }, [currency]);

  return { width, spanRef };
};

export default function EditAccountModal({
  isOpen,
  onClose,
  account,
  onUpdateAccount,
}: {
  isOpen: boolean;
  onClose: () => void;
  account: AccountWTrend;
  onUpdateAccount: AccountUpdate;
}) {
  const typeFieldId = useId();
  const { width: currencyWidth, spanRef } = useDynamicCurrencyWidth(account.currency);

  const form = useForm<AccountFormSchema>({
    resolver: arktypeResolver(accountFormSchema),
    defaultValues: {
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      meta: account.meta,
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        // Call reset with the new account's data
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: account.balance,
        meta: account.meta,
      });
    }
  }, [account, form]);

  const handleSubmit = useCallback(
    (values: AccountFormSchema) => {
      if (account?.id) {
        onUpdateAccount(account.id, values);
      }
      onClose();
    },
    [onUpdateAccount, form, onClose, account?.id]
  );

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Update your account information and settings.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-4" id="updateAccount">
            {account.is_external && (
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <Avatar className="h-10 w-10 rounded-md">
                  <AvatarImage src={account?.meta?.logo} alt={account?.meta?.institution_name} />
                  <AvatarFallback className="bg-primary/10 text-primary rounded-md">{account?.meta?.institution?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{account?.meta?.institution}</div>
                  <div className="text-muted-foreground text-sm">Bank-linked account</div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input disabled={account.is_external} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor={typeFieldId}>Account Type</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          id={typeFieldId}
                          disabled={account.is_external}
                          options={accountTypeOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select account type"
                          searchPlaceholder="Search account type..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Balance</FormLabel>
                      <FormControl>
                        <>
                          <span ref={spanRef} className="sr-only" aria-hidden="true" />
                          <div className="relative">
                            <span 
                              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center justify-center text-sm peer-disabled:opacity-50"
                            >
                              {getCurrencySymbol(account.currency)}
                            </span>
                            <Input
                              type="number"
                              disabled={account.is_external}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="peer"
                              style={{ paddingLeft: `${currencyWidth + 24}px` }}
                              {...field}
                              onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                            />
                          </div>

                          {account.is_external && <p className="text-muted-foreground mt-1 text-xs">Balance is automatically updated from your bank.</p>}
                        </>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="updateAccount" disabled={form.formState.isSubmitting}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
