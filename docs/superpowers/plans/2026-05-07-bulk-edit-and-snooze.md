# Bulk Edit Enhancements + Snooze (Needs Review) Flag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Add `needs_review` flag to transactions so users can snooze/flag a transaction for later review; (2) Extend the bulk edit dialog to support bulk-setting tags, notes, and the `needs_review` flag.

**Architecture:** 
- `needs_review` is a new boolean field added to `CRDTTransaction` in the shared types package. It flows from the CRDT schema → SQLite `TransactionsTable` → Kysely query layer → transaction service → UI.
- Tags-on-transactions: tags are currently standalone CRDT entities with no link to transactions. We add a `tag_ids: string[]` field to `CRDTTransaction` and project it as a JSON column in the SQLite transactions table. Tags are resolved by joining against the CRDT tags collection at query time.
- The existing `BulkEditDialog` is extended with three new fields (tags multi-select, note textarea, needs_review checkbox). No new files required for the dialog.
- The edit sheet gains a "Flag for review" toggle.
- The filter dropdown gains a "Needs Review" filter option.

**Tech Stack:** TypeScript, ArkType, Automerge CRDT, Kysely, React, Shadcn UI (Badge, Checkbox, Textarea, MultiSelect pattern)

---

## File Map

| Action | File |
|--------|------|
| **Modify** | `packages/types/src/crdt-schema.ts` |
| **Modify** | `packages/types/src/storage/database.ts` |
| **Modify** | `apps/client/src/core/sync/query.ts` |
| **Modify** | `apps/client/src/features/transactions/services/transaction.service.ts` |
| **Modify** | `apps/client/src/features/transactions/services/transaction.types.ts` |
| **Modify** | `apps/client/src/features/transactions/components/bulk-edit-dialog.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/edt-records-sheet.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/transaction-filter-dropdown.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/records-table.tsx` |

---

## Task 1: Add `needs_review` and `tag_ids` to the CRDT transaction schema

**Files:**
- Modify: `packages/types/src/crdt-schema.ts`

- [ ] **Step 1: Add the two new fields to `crdtTransactionSchema`**

In `packages/types/src/crdt-schema.ts`, find `export const crdtTransactionSchema = type({` and add two new optional fields. The updated schema should include:

```typescript
export const crdtTransactionSchema = type({
  id: "string",
  amount: "number",
  transaction_datetime: "string",
  description: "string",
  "category_id?": "string | null",
  account_id: "string",
  type: "'expense' | 'income' | 'transfer'",
  "destination_account_id?": "string | null",
  "details?": crdtDetailsSchema.or("null"),
  transaction_currency: "string",
  original_amount: "number",
  is_external: "boolean",
  "needs_review?": "boolean | null",    // ← new
  "tag_ids?": "string[] | null",         // ← new
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string | null",
});
```

- [ ] **Step 2: Commit**

```bash
git add packages/types/src/crdt-schema.ts
git commit -m "feat(bulk-edit): add needs_review and tag_ids fields to CRDTTransaction schema"
```

---

## Task 2: Add `needs_review` and `tag_ids` to the SQLite `TransactionsTable`

The SQLite table is the Kysely query layer (client-side, not server Postgres). We add the two columns so the filter and query pipeline can use them.

**Files:**
- Modify: `packages/types/src/storage/database.ts`

- [ ] **Step 1: Add columns to `TransactionsTable`**

In `packages/types/src/storage/database.ts`, find `export interface TransactionsTable {` and add two fields:

```typescript
export interface TransactionsTable {
  id: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  account_id: string;
  category_id: string | null;
  destination_account_id: string | null;
  transaction_datetime: number;
  description: string;
  details: string | null;
  is_external: 0 | 1;
  is_categorized: 0 | 1;
  needs_review: 0 | 1;         // ← new
  tag_ids: string | null;       // ← new (stored as JSON string)
  transaction_currency: string;
  original_amount: number;
  shared_finance_id: string | null;
  provider_transaction_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Generated<number>;
  updated_at: Generated<number>;
  deleted_at: number | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/types/src/storage/database.ts
git commit -m "feat(bulk-edit): add needs_review and tag_ids columns to TransactionsTable type"
```

---

## Task 3: Update the SQLite client migration to add the new columns

The SQLite schema is managed by client-side migrations in `@nuts/migrations`. We need to add an ALTER TABLE migration that adds the two new columns.

**Files:**
- Find the migration file location. Run: `find /home/eva/Documents/code/nuts/packages/migrations -name "*.ts" | sort` to locate migration files.
- Add a new migration.

- [ ] **Step 1: Locate the existing migrations**

```bash
find /home/eva/Documents/code/nuts/packages/migrations -type f | sort
```

Identify the current highest migration number/name.

- [ ] **Step 2: Add a new migration**

In the migrations package, create a new migration entry (follow the existing pattern — look at how previous migrations are structured). The migration SQL to apply:

```sql
ALTER TABLE transactions ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN tag_ids TEXT;
```

The exact file to create/modify depends on the migration pattern found in Step 1. It will either be adding a new object to an array of migrations, or creating a new numbered `.ts` file. Follow the existing pattern exactly.

- [ ] **Step 3: Commit**

```bash
git add packages/migrations/
git commit -m "feat(bulk-edit): add SQLite migration for needs_review and tag_ids columns"
```

---

## Task 4: Update `rebuildFromCRDT` to project the new fields

**Files:**
- Modify: `apps/client/src/core/sync/query.ts`

- [ ] **Step 1: Update the transactions batch mapping in `rebuildFromCRDT`**

In `apps/client/src/core/sync/query.ts`, find the batch mapping inside `rebuildFromCRDT` — specifically the block that builds the transaction rows. It currently maps fields like `is_external: t.is_external ? 1 : 0`. Add the two new fields:

```typescript
const batch = transactionsArray.slice(i, i + BATCH_SIZE).map((t) => ({
  id: t.id,
  amount: t.amount,
  transaction_datetime: toUnixMs(t.transaction_datetime) ?? Date.now(),
  description: t.description,
  category_id: t.category_id ?? null,
  account_id: t.account_id,
  type: t.type,
  destination_account_id: t.destination_account_id ?? null,
  is_external: t.is_external ? 1 : 0,
  is_categorized: t.category_id ? 1 : 0,
  needs_review: t.needs_review ? 1 : 0,          // ← new
  tag_ids: t.tag_ids ? JSON.stringify(t.tag_ids) : null,  // ← new
  transaction_currency: t.transaction_currency,
  original_amount: t.original_amount,
  details: t.details ? JSON.stringify(t.details) : null,
  created_at: toUnixMs(t.created_at) ?? Date.now(),
  updated_at: toUnixMs(t.updated_at) ?? Date.now(),
  deleted_at: toUnixMs(t.deleted_at),
}));
```

- [ ] **Step 2: Add `needs_review` and `tag_ids` to `TransactionRow` and the `queryTransactions` select/map**

At the top of `query.ts`, find `export interface TransactionRow {` and add:

```typescript
export interface TransactionRow {
  // ... existing fields ...
  needs_review: boolean;       // ← new
  tag_ids: string[] | null;    // ← new
}
```

In `queryTransactions`, add the two fields to the `.select([...])` array:

```typescript
"t.needs_review",
"t.tag_ids",
```

And in the `data` mapping at the end of `queryTransactions`, add:

```typescript
needs_review: Boolean(tx.needs_review),
tag_ids: parseJsonSafe<string[] | null>(tx.tag_ids, null),
```

Also add a `needs_review` filter parameter. In `queryTransactions`, after the `endDate` filter block, add:

```typescript
if (params.needs_review !== undefined) {
  query = query.where("t.needs_review", "=", params.needs_review ? 1 : 0);
}
```

- [ ] **Step 3: Add `needs_review` to `GetTransactionsParams`**

Find `export interface GetTransactionsParams` (or the equivalent type used in `queryTransactions` — it may be imported from `transaction.api.ts`). In whichever file defines it, add:

```typescript
needs_review?: boolean;
```

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/core/sync/query.ts
git commit -m "feat(bulk-edit): project needs_review and tag_ids through Kysely query layer"
```

---

## Task 5: Update the transaction service

**Files:**
- Modify: `apps/client/src/features/transactions/services/transaction.service.ts`

- [ ] **Step 1: Add `bulkUpdateExtras` service method**

In `transaction.service.ts`, add the following method before the `return` statement:

```typescript
const bulkUpdateExtras = async (params: {
  transactionIds: string[];
  tagIds?: string[];
  note?: string;
  needsReview?: boolean;
}): Promise<Result<void, ServiceError>> => {
  const initResult = await ensureInitialized();
  if (initResult.isErr()) return err(initResult.error);

  for (const id of params.transactionIds) {
    const updates: Partial<CRDTTransaction> = {};
    if (params.tagIds !== undefined) updates.tag_ids = params.tagIds;
    if (params.note !== undefined) {
      // Merge note into the existing details object
      const existing = crdtService.getTransaction(id);
      updates.details = {
        ...(existing?.details ?? {}),
        note: params.note,
      };
    }
    if (params.needsReview !== undefined) updates.needs_review = params.needsReview;

    const updateResult = await crdtService.updateTransaction(id, updates);
    if (updateResult.isErr()) return err(updateResult.error);
  }

  const rebuildResult = await rebuildFromCRDT();
  if (rebuildResult.isErr()) return err(rebuildResult.error);

  return ok(undefined);
};
```

Add `CRDTTransaction` to the imports at the top of the file if not already there.

- [ ] **Step 2: Export `bulkUpdateExtras`**

Add `bulkUpdateExtras` to the returned object:

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
  exportTransactions,       // if present from csv-export plan
  undoTransaction,          // if present from undo-redo plan
  redoTransaction,          // if present from undo-redo plan
  bulkUpdateExtras,         // ← add
};
```

- [ ] **Step 3: Add `needs_review` forwarding to `getTransactions`**

In the `getTransactions` method, pass `needs_review` to `kyselyQueryService.queryTransactions`. Find the block that builds the query params object and add:

```typescript
if (params.needs_review !== undefined) {
  queryParams.needs_review = params.needs_review;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/features/transactions/services/transaction.service.ts
git commit -m "feat(bulk-edit): add bulkUpdateExtras and needs_review filter to transaction service"
```

---

## Task 6: Add mutation hook for `bulkUpdateExtras`

**Files:**
- Modify: `apps/client/src/features/transactions/services/transaction.mutations.ts`

- [ ] **Step 1: Add the hook**

In `transaction.mutations.ts`, add at the end of the file:

```typescript
export const useBulkUpdateExtras = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      transactionIds: string[];
      tagIds?: string[];
      note?: string;
      needsReview?: boolean;
    }) => {
      const result = await transactionService.bulkUpdateExtras(params);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Transactions updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update transactions", {
        description: error.message,
      });
    },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/features/transactions/services/transaction.mutations.ts
git commit -m "feat(bulk-edit): add useBulkUpdateExtras mutation hook"
```

---

## Task 7: Extend `BulkEditDialog` with tags, note, and needs_review

**Files:**
- Modify: `apps/client/src/features/transactions/components/bulk-edit-dialog.tsx`

- [ ] **Step 1: Add imports**

At the top of `bulk-edit-dialog.tsx`, add or extend the import list:

```tsx
import { Checkbox } from "@/core/components/ui/checkbox";
import { Textarea } from "@/core/components/ui/textarea";
import { Badge } from "@/core/components/ui/badge";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tagsService } from "@/features/tags/services/tags.service";
import { useBulkUpdateExtras } from "../services/transaction.mutations";
```

- [ ] **Step 2: Extend the schema**

Find `const bulkEditSchema = type({` and extend it:

```typescript
const bulkEditSchema = type({
  "category_id?": "string",
  "account_id?": "string",
  "transaction_datetime?": "Date",
  "tag_ids?": "string[]",
  "note?": "string",
  "needs_review?": "boolean",
});
```

Update the TypeScript type inference if it's used anywhere: `type BulkEditSchema = typeof bulkEditSchema.infer;`

- [ ] **Step 3: Add tags query and state inside the component**

Inside `BulkEditDialog`, add:

```tsx
const { data: availableTags = [] } = useQuery({
  queryKey: ["tags"],
  queryFn: async () => {
    const result = await tagsService.getTags();
    if (result.isErr()) throw result.error;
    return result.value;
  },
});

const bulkUpdateExtrasMutation = useBulkUpdateExtras();
```

- [ ] **Step 4: Add the new form fields to the form JSX**

After the existing Category/Account/Date fields in the form, add the following three sections:

```tsx
{/* Tags */}
<FormField
  control={form.control}
  name="tag_ids"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tags</FormLabel>
      <FormControl>
        <div className="space-y-2">
          {/* Selected tags */}
          <div className="flex flex-wrap gap-1 min-h-8">
            {(field.value ?? []).map((tagId) => {
              const tag = availableTags.find((t) => t.id === tagId);
              if (!tag) return null;
              return (
                <Badge key={tagId} variant="secondary" className="gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <button
                    type="button"
                    onClick={() =>
                      field.onChange((field.value ?? []).filter((id) => id !== tagId))
                    }
                    className="hover:text-destructive ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
          {/* Tag selector */}
          <Select
            onValueChange={(tagId) => {
              if (!(field.value ?? []).includes(tagId)) {
                field.onChange([...(field.value ?? []), tagId]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add a tag…" />
            </SelectTrigger>
            <SelectContent>
              {availableTags
                .filter((t) => !(field.value ?? []).includes(t.id))
                .map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Note */}
<FormField
  control={form.control}
  name="note"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Note</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Add a note to all selected transactions…"
          className="resize-none"
          rows={2}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{/* Needs Review */}
<FormField
  control={form.control}
  name="needs_review"
  render={({ field }) => (
    <FormItem className="flex items-center gap-2 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <FormLabel className="cursor-pointer">Flag for review</FormLabel>
    </FormItem>
  )}
/>
```

- [ ] **Step 5: Call `bulkUpdateExtras` on submit alongside the existing calls**

Find the `onSubmit` handler in `BulkEditDialog`. After the existing category/account/date update calls, add:

```typescript
const hasExtras = values.tag_ids !== undefined || values.note !== undefined || values.needs_review !== undefined;

if (hasExtras) {
  await bulkUpdateExtrasMutation.mutateAsync({
    transactionIds,
    tagIds: values.tag_ids,
    note: values.note,
    needsReview: values.needs_review,
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/client/src/features/transactions/components/bulk-edit-dialog.tsx
git commit -m "feat(bulk-edit): add tags, note, and needs_review fields to BulkEditDialog"
```

---

## Task 8: Add "Flag for review" toggle to the Edit Transaction Sheet

**Files:**
- Modify: `apps/client/src/features/transactions/components/edt-records-sheet.tsx`

- [ ] **Step 1: Add the toggle to the form**

In `edt-records-sheet.tsx`, add an import for `Checkbox` (already likely imported) and add the following field anywhere in the form body, after the `details.note` textarea:

```tsx
{/* Needs Review toggle */}
<div className="flex items-center gap-2">
  <Checkbox
    id="needs_review"
    checked={Boolean(transaction?.needs_review)}
    onCheckedChange={async (checked) => {
      const result = await transactionService.updateTransaction(transactionId!, {
        ...form.getValues(),
        needs_review: Boolean(checked),
      } as any);
      if (result.isErr()) {
        toast.error("Failed to update flag");
      } else {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      }
    }}
  />
  <label
    htmlFor="needs_review"
    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    Flag for review
  </label>
</div>
```

Note: `needs_review` is not part of the `RecordUpdateSchema` (that schema drives the auto-save debounce). The flag toggle fires an immediate explicit update outside the form's auto-save debounce, so it does not need to be in the schema.

- [ ] **Step 2: Commit**

```bash
git add apps/client/src/features/transactions/components/edt-records-sheet.tsx
git commit -m "feat(snooze): add Flag for Review toggle to EditTransactionSheet"
```

---

## Task 9: Add "Needs Review" filter to the filter dropdown

**Files:**
- Modify: `apps/client/src/features/transactions/components/transaction-filter-dropdown.tsx`

- [ ] **Step 1: Add `needs_review` to `TransactionFilterState`**

Find `export interface TransactionFilterState {` and add:

```typescript
export interface TransactionFilterState {
  account_id?: string;
  category_id?: string;
  type?: "income" | "expense" | "transfer";
  start_date?: Date;
  end_date?: Date;
  currency?: string;
  is_recurring?: boolean;
  is_pending?: boolean;
  needs_review?: boolean;    // ← new
}
```

- [ ] **Step 2: Add a filter menu item for "Needs Review"**

In the `filterMenuItems` array, add:

```typescript
{
  key: "needs_review",
  label: "Needs Review",
  icon: "🔖",
  hasSubmenu: false,   // direct toggle, no submenu
},
```

- [ ] **Step 3: Handle the click as a direct toggle (no submenu)**

In the button's `onClick` inside the filter menu items map, add special handling for `needs_review`:

```tsx
onClick={() => {
  if (item.key === "needs_review") {
    updateFilter("needs_review", filters.needs_review ? undefined : true);
    return;
  }
  setActiveSubmenu(activeSubmenu === item.key ? null : item.key);
}}
```

- [ ] **Step 4: Add the label in `getFilterLabel`**

In the `getFilterLabel` helper switch, add:

```typescript
case "needs_review":
  return "Needs Review";
```

- [ ] **Step 5: Forward `needs_review` through `RecordsTable` → service**

In `records-table.tsx`, in the `queryParams` memo, add:

```typescript
if (debouncedFilters.needs_review !== undefined) {
  params.needs_review = debouncedFilters.needs_review;
}
```

And in the `GetTransactionsParams` interface (in `transaction.api.ts` or wherever it's defined), add:

```typescript
needs_review?: boolean;
```

- [ ] **Step 6: Add a visual indicator on flagged rows in RecordsTable**

In `records-table.tsx`, in the `MemoizedTransactionCard` component (mobile) and in the table row cells (desktop), add a small flag icon when `needs_review` is true. Find where `status.statusLabel` and `status.badgeVariant` are used to render `<Badge>` elements and add:

```tsx
{(transaction as any).needs_review && (
  <Badge variant="outline" className="text-xs gap-1">
    <Flag className="h-3 w-3" />
    Review
  </Badge>
)}
```

Import `Flag` from `lucide-react`.

- [ ] **Step 7: Verify it builds**

```bash
cd apps/client && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/client/src/features/transactions/components/transaction-filter-dropdown.tsx apps/client/src/features/transactions/components/records-table.tsx apps/client/src/features/transactions/api/transaction.api.ts
git commit -m "feat(snooze): add Needs Review filter, visual indicator, and wire through query params"
```
