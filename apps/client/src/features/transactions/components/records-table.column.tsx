import { TableRecordSchema } from "@/features/transactions/services/transaction.types";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { renderIcon } from "@/core/components/ui/icon-picker/index.helper";
import { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTransactionStatus, getTransactionStyles } from "../utils/transaction-status";
import { transactionService } from "../services/transaction.service";
import { useCategoriesQuery } from "@/features/categories/services/category.queries";

type TransactionRowData = TableRecordSchema & {
  groupId?: string;
  groupDate?: Date;
  groupTotal?: number;
};

interface ActionColumnHandlers {
  onEdit: (transactionId: TableRecordSchema) => void;
}

// Memoized components to prevent unnecessary re-renders
const TransactionCell = memo(({
  transaction,
  onEdit
}: {
  transaction: TableRecordSchema;
  onEdit: (transaction: TableRecordSchema) => void;
}) => {
  const status = getTransactionStatus(transaction);
  const styles = getTransactionStyles(transaction);

  return (
    <div className={`flex items-center space-x-3 ${styles.containerClass}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-[#595959] text-background">
          {transaction.account.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onEdit(transaction) }}
            className={`text-left hover:underline font-medium ${styles.textClass}`}
          >
            {transaction.description}
          </button>
          {status.statusLabel && (
            <Badge variant={status.badgeVariant} className="text-xs">
              {status.statusLabel}
            </Badge>
          )}
        </div>
        <Link
          to="/dashboard/accounts/$id"
          params={{ id: transaction.account.id }}
          className={`text-xs hover:underline ${styles.textClass || "text-muted-foreground"}`}
        >
          {transaction.account.name}
        </Link>
        {transaction.template_name && (
          <span className="text-xs text-muted-foreground">
            Template: {transaction.template_name}
          </span>
        )}
      </div>
    </div>
  );
});

const CategoryCell = memo(({ transaction }: { transaction: TableRecordSchema }) => {
  const queryClient = useQueryClient();

  const { data: categories } = useCategoriesQuery();

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ transactionIds, categoryId }: { transactionIds: string[]; categoryId: string }) => {
      const result = await transactionService.bulkUpdateCategories(transactionIds, categoryId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      toast.success("Category updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category.");
    },
  });

  const categoriesOptions: SearchableSelectOption[] = useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
      keywords: [category.name],
      icon: renderIcon(category.icon || ""),
    }));
  }, [categories]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId && categoryId !== transaction.category?.id) {
      updateCategoryMutation.mutate({ transactionIds: [transaction.id], categoryId });
    }
  };

  return (
    <div className="inline-flex">
      <SearchableSelect
        options={categoriesOptions}
        value={transaction.category?.id || ""}
        onChange={handleCategoryChange}
        placeholder="No category"
        searchPlaceholder="Search categories..."
        isLoading={updateCategoryMutation.isPending}
        disabled={updateCategoryMutation.isPending}
        renderSelectedItem={(option) => (
          <>
            {option.icon} {option.label}
          </>
        )}
        popoverProps={{
          className: "w-80"
        }}
        className="[&>button]:h-auto [&>button]:rounded-full [&>button]:px-2 [&>button]:py-1 [&>button]:text-md [&>button]:border-input [&>button]:bg-background [&>button]:hover:bg-accent [&>button]:hover:text-accent-foreground [&>button]:transition-colors [&>button>span>svg]:size-4 [&>button>svg]:hidden"
      />
    </div>
  );
});

const AmountCell = memo(({ amount }: { amount: number }) => {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  return <div className="pr-4 text-right font-medium">{formatted}</div>;
});

export const getRecordsTableColumns = ({ onEdit }: ActionColumnHandlers): ColumnDef<TransactionRowData>[] => [
  {
    id: "select",
    size: 10,
    maxSize: 10,
    minSize: 10,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="translate-y-[2px]" />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "Transaction",
    size: 300,
    cell: ({ row }) => <TransactionCell transaction={row.original} onEdit={onEdit} />,
  },
  {
    accessorFn: (row) => row.category?.name,
    id: "category.name",
    header: "Category",
    size: 150,
    cell: ({ row }) => {
      return <CategoryCell transaction={row.original} />;
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    size: 120,
    cell: ({ row }) => <AmountCell amount={Number.parseFloat(row.getValue("amount"))} />,
    enableSorting: true,
    sortingFn: "basic",
  },
];
