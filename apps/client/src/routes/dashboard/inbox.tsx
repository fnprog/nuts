import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTransactions } from "@/features/transactions/services/transaction.queries";
import { TableRecordSchema } from "@/features/transactions/services/transaction.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { H2, P } from "@/core/components/ui/typography";
import { Inbox, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatting";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { Skeleton } from "@/core/components/ui/skeleton";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select";
import { useCategoriesQuery } from "@/features/categories/services/category.queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/inbox")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  
  const { data, isLoading } = useTransactions({
    page: 1,
    limit: 100,
  });

  const uncategorizedTransactions = data?.data.flatMap(group => 
    group.transactions.filter(t => !t.category)
  ) || [];

  const selectedTransaction = uncategorizedTransactions.find(t => t.id === selectedTransactionId);

  return (
    <div className="space-y-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-2">
          <H2>Inbox</H2>
          {!isLoading && uncategorizedTransactions.length > 0 && (
            <Badge variant="secondary">
              {uncategorizedTransactions.length} to review
            </Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Inbox className="h-6 w-6" />
              <CardTitle>Transactions to Review</CardTitle>
            </div>
            <CardDescription>Select a transaction to categorize</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : uncategorizedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <P variant="muted">No transactions to process</P>
                <P variant="muted" className="text-sm">
                  All transactions are categorized
                </P>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
                  {uncategorizedTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={transaction.id === selectedTransactionId}
                      onSelect={() => setSelectedTransactionId(transaction.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Review and assign a category</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {selectedTransaction ? (
              <TransactionDetails
                transaction={selectedTransaction}
                onCategorized={() => setSelectedTransactionId(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <P variant="muted">Select a transaction from the list to view details</P>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransactionItem({
  transaction,
  isSelected,
  onSelect,
}: {
  transaction: TableRecordSchema;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const amount = Math.abs(transaction.amount);
  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.type === "transfer";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg border transition-colors text-left",
        "hover:bg-accent/50",
        isSelected && "bg-accent border-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-[#595959] text-background">
              {transaction.account.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="font-medium truncate">{transaction.description}</div>
            <div className="text-xs text-muted-foreground">
              {transaction.account.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(transaction.transaction_datetime)}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              "font-semibold",
              isExpense && "text-red-600",
              !isExpense && !isTransfer && "text-green-600"
            )}
          >
            {isExpense && "-"}
            {!isExpense && !isTransfer && "+"}
            {amount.toFixed(2)} {transaction.account.currency}
          </div>
          {isTransfer && transaction.type === "transfer" && transaction.destination_account && (
            <div className="text-xs text-muted-foreground">
              → {transaction.destination_account.name}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function TransactionDetails({
  transaction,
  onCategorized,
}: {
  transaction: TableRecordSchema;
  onCategorized: () => void;
}) {
  const { data: categories } = useCategoriesQuery();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ transactionIds, categoryId }: { transactionIds: string[]; categoryId: string }) => {
      const result = await transactionService.bulkUpdateCategories(transactionIds, categoryId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      toast.success("Category assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onCategorized();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign category.");
    },
  });

  const categoryOptions: SearchableSelectOption[] = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon,
  })) || [];

  const handleAssignCategory = () => {
    if (selectedCategoryId) {
      updateCategoryMutation.mutate({
        transactionIds: [transaction.id],
        categoryId: selectedCategoryId,
      });
    }
  };

  const amount = Math.abs(transaction.amount);
  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.type === "transfer";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Description</label>
          <p className="text-lg font-semibold mt-1">{transaction.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <p
              className={cn(
                "text-xl font-bold mt-1",
                isExpense && "text-red-600",
                !isExpense && !isTransfer && "text-green-600"
              )}
            >
              {isExpense && "-"}
              {!isExpense && !isTransfer && "+"}
              {amount.toFixed(2)} {transaction.account.currency}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <p className="text-lg font-medium mt-1">
              {formatDate(transaction.transaction_datetime)}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Account</label>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-[#595959] text-background text-xs">
                {transaction.account.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-base">{transaction.account.name}</p>
          </div>
        </div>

        {isTransfer && transaction.type === "transfer" && transaction.destination_account && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Destination Account</label>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-[#595959] text-background text-xs">
                  {transaction.destination_account.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-base">{transaction.destination_account.name}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-muted-foreground">Type</label>
          <Badge variant="outline" className="mt-1">
            {transaction.type}
          </Badge>
        </div>
      </div>

      {!isTransfer && (
        <div className="space-y-3 pt-6 border-t">
          <label className="text-sm font-medium">Assign Category</label>
          <SearchableSelect
            options={categoryOptions}
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            placeholder="Select a category..."
            emptyMessage="No categories found"
          />
          <button
            onClick={handleAssignCategory}
            disabled={!selectedCategoryId || updateCategoryMutation.isPending}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <Check className="h-4 w-4" />
            {updateCategoryMutation.isPending ? "Assigning..." : "Assign Category"}
          </button>
        </div>
      )}
    </div>
  );
}
