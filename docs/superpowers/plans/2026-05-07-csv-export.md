# CSV Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to export transactions matching the current search/filter state to a CSV file.

**Architecture:** Client-side only. The `kyselyQueryService.queryTransactions()` method already supports all filter params; export fetches all pages (no pagination cap), serialises to CSV using the already-installed `papaparse` library, then triggers a browser download. No backend changes required.

**Tech Stack:** React, PapaParse (`Papa.unparse`), TanStack Query, existing `transactionService`, Shadcn UI (Dialog, Button, Checkbox)

---

## File Map

| Action | File |
|--------|------|
| **Modify** | `apps/client/src/features/transactions/services/transaction.service.ts` |
| **Modify** | `apps/client/src/core/sync/query.ts` |
| **Create** | `apps/client/src/features/transactions/components/export-transactions-dialog.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/records-table.tsx` |

---

## Task 1: Add `exportTransactions` to the query service

The Kysely query service needs a method that fetches **all** transactions matching the current filter params (no pagination limit).

**Files:**
- Modify: `apps/client/src/core/sync/query.ts`

- [ ] **Step 1: Add `exportTransactions` method to `KyselyQueryService`**

Open `apps/client/src/core/sync/query.ts`. Add the following method to the `KyselyQueryService` class, right after `queryTransactions`:

```typescript
async exportTransactions(
  params: Omit<GetTransactionsParams, "page" | "limit">
): Promise<Result<TransactionRow[], ServiceError>> {
  const initResult = await this.ensureInitialized();
  if (initResult.isErr()) return err(initResult.error);

  try {
    const database = db.db;
    const {
      q: search,
      account_id: accountId,
      category_id: categoryId,
      type,
      start_date: startDate,
      end_date: endDate,
    } = params;

    let query = database
      .selectFrom("transactions as t")
      .leftJoin("accounts as a", "a.id", "t.account_id")
      .leftJoin("categories as c", "c.id", "t.category_id")
      .where("t.deleted_at", "is", null)
      .select([
        "t.id",
        "t.amount",
        "t.type",
        "t.account_id",
        "t.category_id",
        "t.destination_account_id",
        "t.transaction_datetime",
        "t.description",
        "t.details",
        "t.is_external",
        "t.provider_transaction_id",
        "t.created_at",
        "t.updated_at",
        "a.name as account_name",
        "a.type as account_type",
        "a.currency as account_currency",
        "c.name as category_name",
        "c.icon as category_icon",
        "c.color as category_color",
      ]);

    if (search) query = query.where("t.description", "like", `%${search}%`);
    if (accountId) query = query.where("t.account_id", "=", accountId);
    if (categoryId) query = query.where("t.category_id", "=", categoryId);
    if (type) query = query.where("t.type", "=", type as any);
    if (startDate) query = query.where(sql`DATE(t.transaction_datetime / 1000, 'unixepoch')`, ">=", startDate);
    if (endDate) query = query.where(sql`DATE(t.transaction_datetime / 1000, 'unixepoch')`, "<=", endDate);

    const rows = await query
      .orderBy("t.transaction_datetime", "desc")
      .execute();

    const data: TransactionRow[] = rows.map((tx: any) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      account_id: tx.account_id,
      category_id: tx.category_id,
      destination_account_id: tx.destination_account_id,
      transaction_datetime: tx.transaction_datetime,
      description: tx.description,
      details: parseJsonSafe<Record<string, unknown>>(tx.details, {}),
      is_external: Boolean(tx.is_external),
      provider_transaction_id: tx.provider_transaction_id,
      created_at: tx.created_at,
      updated_at: tx.updated_at,
      date_only: new Date(tx.transaction_datetime).toISOString().split("T")[0],
      account_name: tx.account_name,
      account_type: tx.account_type,
      account_currency: tx.account_currency,
      category_name: tx.category_name,
      category_icon: tx.category_icon,
      category_color: tx.category_color,
    }));

    return ok(data);
  } catch (error) {
    logger.error("[KYSELY] exportTransactions failed:", error);
    return err(ServiceError.database("Failed to export transactions", error));
  }
}
```

- [ ] **Step 2: Add `exportTransactions` to the transaction service**

Open `apps/client/src/features/transactions/services/transaction.service.ts`. Add the following method to the service factory, before the `return` statement at the bottom:

```typescript
const exportTransactions = async (
  params: Omit<GetTransactionsParams, "page" | "limit">
): Promise<Result<import("@/core/sync/query").TransactionRow[], ServiceError>> => {
  const initResult = await ensureInitialized();
  if (initResult.isErr()) return err(initResult.error);
  return kyselyQueryService.exportTransactions(params);
};
```

Then add `exportTransactions` to the returned object:

```typescript
return {
  initialize,
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransactions,
  bulkDeleteTransactions,
  bulkUpdateCategories,
  bulkUpdateManualTransactions,
  exportTransactions,           // ← add this
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/core/sync/query.ts apps/client/src/features/transactions/services/transaction.service.ts
git commit -m "feat(export): add exportTransactions to query and transaction services"
```

---

## Task 2: Create the Export Dialog component

**Files:**
- Create: `apps/client/src/features/transactions/components/export-transactions-dialog.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import Papa from "papaparse";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Label } from "@/core/components/ui/label";
import { transactionService } from "../services/transaction.service";
import type { TransactionFilterState } from "./transaction-filter-dropdown";

// The columns the user can choose to include in the CSV.
const AVAILABLE_COLUMNS: { key: string; label: string; getValue: (tx: any) => string | number }[] = [
  {
    key: "date",
    label: "Date",
    getValue: (tx) => new Date(tx.transaction_datetime).toISOString().split("T")[0],
  },
  { key: "description", label: "Description", getValue: (tx) => tx.description },
  {
    key: "amount",
    label: "Amount",
    getValue: (tx) => {
      // Expenses are stored as positive numbers — negate them for export
      if (tx.type === "expense") return -Math.abs(tx.amount);
      return tx.amount;
    },
  },
  { key: "type", label: "Type", getValue: (tx) => tx.type },
  { key: "account", label: "Account", getValue: (tx) => tx.account_name ?? tx.account_id },
  { key: "category", label: "Category", getValue: (tx) => tx.category_name ?? "" },
  { key: "currency", label: "Currency", getValue: (tx) => tx.account_currency ?? "" },
  { key: "note", label: "Note", getValue: (tx) => (tx.details as any)?.note ?? "" },
  { key: "is_external", label: "Bank Import", getValue: (tx) => (tx.is_external ? "yes" : "no") },
  { key: "id", label: "ID", getValue: (tx) => tx.id },
];

const DEFAULT_SELECTED = new Set(["date", "description", "amount", "type", "account", "category"]);

interface ExportTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current filter state from the RecordsTable — scopes what gets exported */
  filters: TransactionFilterState;
  search: string;
}

export function ExportTransactionsDialog({
  isOpen,
  onClose,
  filters,
  search,
}: ExportTransactionsDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(DEFAULT_SELECTED));
  const [isExporting, setIsExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      toast.error("Select at least one column to export.");
      return;
    }

    setIsExporting(true);

    try {
      const result = await transactionService.exportTransactions({
        q: search || undefined,
        account_id: filters.account_id,
        category_id: filters.category_id,
        type: filters.type,
        start_date: filters.start_date?.toISOString().split("T")[0],
        end_date: filters.end_date?.toISOString().split("T")[0],
      });

      if (result.isErr()) {
        toast.error("Export failed", { description: result.error.message });
        return;
      }

      const columns = AVAILABLE_COLUMNS.filter((col) => selectedColumns.has(col.key));

      const rows = result.value.map((tx) => {
        const row: Record<string, string | number> = {};
        for (const col of columns) {
          row[col.label] = col.getValue(tx);
        }
        return row;
      });

      const csv = Papa.unparse(rows, { header: true });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      anchor.href = url;
      anchor.download = `transactions-${date}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${result.value.length} transactions`);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Choose which columns to include in your CSV export. The export will
            include all transactions matching your current filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {AVAILABLE_COLUMNS.map((col) => (
            <div key={col.key} className="flex items-center gap-2">
              <Checkbox
                id={`col-${col.key}`}
                checked={selectedColumns.has(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <Label htmlFor={`col-${col.key}`} className="cursor-pointer">
                {col.label}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedColumns.size === 0}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/features/transactions/components/export-transactions-dialog.tsx
git commit -m "feat(export): add ExportTransactionsDialog component"
```

---

## Task 3: Wire the Export button into RecordsTable

**Files:**
- Modify: `apps/client/src/features/transactions/components/records-table.tsx`

- [ ] **Step 1: Add import and state**

At the top of `records-table.tsx`, add the import:

```tsx
import { ExportTransactionsDialog } from "./export-transactions-dialog";
```

Inside the `RecordsTable` component, alongside the other `useState` declarations (near `isBulkEditDialogOpen`), add:

```tsx
const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
```

- [ ] **Step 2: Add the Export button to the toolbar**

In `records-table.tsx`, find the toolbar section where the Import and Filter buttons live. It will look similar to:

```tsx
<ImportTransactionsDialog ... />
<TransactionFilterDropdown ... />
```

Add the Export button directly after the Import button (or after the filter button — whichever is more visually consistent with the layout):

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setIsExportDialogOpen(true)}
>
  <Download className="mr-2 h-4 w-4" />
  Export
</Button>
```

Make sure `Download` is imported from `lucide-react` (it likely already is; if not, add it to the existing lucide import).

- [ ] **Step 3: Render the dialog**

Near the bottom of the `RecordsTable` return statement, alongside the other dialogs (`DeleteTransactionDialog`, `BulkEditDialog`, etc.), add:

```tsx
<ExportTransactionsDialog
  isOpen={isExportDialogOpen}
  onClose={() => setIsExportDialogOpen(false)}
  filters={filters}
  search={search}
/>
```

- [ ] **Step 4: Verify it builds**

```bash
cd apps/client && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/features/transactions/components/records-table.tsx
git commit -m "feat(export): wire Export button and dialog into RecordsTable"
```
