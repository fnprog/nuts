import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { arktypeResolver } from '@hookform/resolvers/arktype';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { toast } from "sonner";

import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/core/components/ui/dialog";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/core/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { DatetimePicker } from "@/core/components/ui/datetime";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select";
import { TableRecordSchema } from "../services/transaction.types";
import { Account } from "@/features/accounts/services/account.types";
import { useBrandImage } from "@/features/accounts/hooks/useBrand";
import { config } from "@/lib/env";
import { Info } from "lucide-react";


import { transactionService } from "@/features/transactions/services/transaction.service";
import { useCategoriesQuery } from "@/features/categories/services/category.queries";
import { getAllAccounts } from "@/features/accounts/services/account.queries";

const bulkEditSchema = type({
  "category_id?": "string",
  "account_id?": "string",
  "transaction_datetime?": "Date",
});

type BulkEditFormData = typeof bulkEditSchema.infer;

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactions: TableRecordSchema[];
}

export function BulkEditDialog({ isOpen, onClose, selectedTransactions }: BulkEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Determine edit mode based on whether any selected transaction is external
  const hasExternalTransaction = useMemo(() => {
    return selectedTransactions.some((tx) => tx.is_external === true);
  }, [selectedTransactions]);

  const editMode = hasExternalTransaction ? "categories-only" : "full";

  const form = useForm<BulkEditFormData>({
    resolver: arktypeResolver(bulkEditSchema),
    defaultValues: {
      category_id: "",
      account_id: "",
      transaction_datetime: undefined,
    },
  });

  const { data: categories } = useCategoriesQuery();

  const { data: accounts } = useQuery({
    ...getAllAccounts(),
    enabled: editMode === "full",
  });

  const categoriesOptions: SearchableSelectOption[] = useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
      keywords: [category.name],
    }));
  }, [categories]);

  const updateMutation = useMutation({
    mutationFn: async (data: BulkEditFormData) => {
      const transactionIds = selectedTransactions.map((tx) => tx.id);

      if (editMode === "categories-only") {
        // Only category updates allowed for mixed selections with external transactions
        if (data.category_id) {
          const result = await transactionService.bulkUpdateCategories(transactionIds, data.category_id);
          if (result.isErr()) throw result.error;
          return result.value;
        }
      } else {
        // Full updates allowed for manual-only selections
        const result = await transactionService.bulkUpdateManualTransactions({
          transactionIds,
          categoryId: data.category_id || undefined,
          accountId: data.account_id || undefined,
          transactionDatetime: data.transaction_datetime,
        });
        if (result.isErr()) throw result.error;
        return result.value;
      }
    },
    onSuccess: () => {
      toast.success(`Updated ${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? "s" : ""} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred while updating transactions.");
    },
  });

  const handleSubmit = async (data: BulkEditFormData) => {
    // Validate that at least one field is being updated
    const hasChanges = data.category_id || (editMode === "full" && (data.account_id || data.transaction_datetime));

    if (!hasChanges) {
      toast.error("Please select at least one field to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {selectedTransactions.length} Transaction{selectedTransactions.length > 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>Update the selected transactions. Only fields you change will be updated.</DialogDescription>
        </DialogHeader>

        {editMode === "categories-only" && (
          <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <Info className="h-5 w-5 shrink-0" />
            <p>Your selection includes bank-synced transactions. You can only update the category for all selected transactions.</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Category Field */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={categoriesOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select category (optional)"
                      searchPlaceholder="Search category..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {editMode === "full" && (
              <>
                {/* Account Field */}
                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>{accounts?.map((account) => <AccountOption key={account.id} account={account} />)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Field */}
                <FormField
                  control={form.control}
                  name="transaction_datetime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <DatetimePicker value={field.value || null} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Transactions"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for account selection
function AccountOption({ account }: { account: Account }) {
  const { imageUrl } = useBrandImage(account.meta?.institution_name ?? "", config.VITE_BRANDFETCH_CLIENTID);

  return (
    <SelectItem value={account.id.toString()}>
      <div className="flex items-center gap-2">
        {imageUrl ? <img src={imageUrl} alt="" className="h-5 w-5 rounded-full" /> : <div className="bg-muted h-5 w-5 rounded-full" />}
        <span>{account.name}</span>
      </div>
    </SelectItem>
  );
}
