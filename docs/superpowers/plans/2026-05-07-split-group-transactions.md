# Split & Group Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to split a single transaction into multiple category/amount allocations (splits), and group multiple transactions together under a shared group ID.

**Architecture:**
Split transactions are implemented end-to-end: a `transaction_splits` table is added to Postgres, a `split_transaction_group_id` column is added to `transactions`, sqlc queries are added, Go service/handler methods are wired, and on the client side `splits` and `split_group_id` fields are added to `CRDTTransaction`. The SQLite projection (`rebuildFromCRDT`) is extended to persist splits as a JSON column. A `SplitTransactionDialog` component lets the user define N split rows summing to the parent's total amount. Grouping sets a shared UUID on selected transactions.

**Tech Stack:** Go (sqlc, pgx, chi), PostgreSQL, TypeScript, ArkType, Automerge CRDT, Kysely, React, Shadcn UI (Dialog, Input, Button, Badge)

---

## File Map

### Backend (Go + Postgres)
| Action | File |
|--------|------|
| **Create** | `server/database/migrations/20260507000000_transaction_splits.sql` |
| **Modify** | `server/database/queries/transactions.sql` |
| **Run** | `sqlc generate` (regenerates `server/internal/repository/*.go`) |
| **Modify** | `server/internal/domain/transactions/models.go` |
| **Modify** | `server/internal/domain/transactions/request.go` |
| **Create** | `server/internal/domain/transactions/service/splits.go` |
| **Create** | `server/internal/domain/transactions/handlers/splits.go` |
| **Modify** | `server/internal/domain/transactions/handlers/routes.go` (or wherever routes are registered) |

### Frontend (TypeScript + React)
| Action | File |
|--------|------|
| **Modify** | `packages/types/src/crdt-schema.ts` |
| **Modify** | `packages/types/src/storage/database.ts` |
| **Modify** | `apps/client/src/core/sync/query.ts` |
| **Modify** | `apps/client/src/features/transactions/services/transaction.service.ts` |
| **Modify** | `apps/client/src/features/transactions/services/transaction.types.ts` |
| **Create** | `apps/client/src/features/transactions/components/split-transaction-dialog.tsx` |
| **Create** | `apps/client/src/features/transactions/components/group-transactions-dialog.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/edt-records-sheet.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/records-table.tsx` |
| **Modify** | `apps/client/src/features/transactions/components/floating-records-bar.tsx` |

---

## Task 1: Postgres migration — add `transaction_splits` table and `split_transaction_group_id` column

**Files:**
- Create: `server/database/migrations/20260507000000_transaction_splits.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- +goose Up

-- Column on the parent transaction that links all splits in a group
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS split_transaction_group_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Each row is one allocation of a split transaction
CREATE TABLE IF NOT EXISTS transaction_splits (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    category_id          UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount               DECIMAL(19, 4) NOT NULL,
    description          TEXT,
    percentage           DECIMAL(7, 4),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_splits_parent
    ON transaction_splits (parent_transaction_id);

-- +goose Down

DROP INDEX IF EXISTS idx_transaction_splits_parent;
DROP TABLE IF EXISTS transaction_splits;
ALTER TABLE transactions DROP COLUMN IF EXISTS split_transaction_group_id;
```

- [ ] **Step 2: Apply the migration in the dev environment**

```bash
cd server
# If using goose CLI directly:
goose -dir database/migrations postgres "$DATABASE_URL" up
# Or if the server runs migrations on startup, just restart it.
```

Verify: connect to the database and confirm `transaction_splits` table exists and `transactions.split_transaction_group_id` column exists.

- [ ] **Step 3: Commit**

```bash
git add server/database/migrations/20260507000000_transaction_splits.sql
git commit -m "feat(split): add transaction_splits table and split_transaction_group_id column migration"
```

---

## Task 2: Add sqlc queries for splits

**Files:**
- Modify: `server/database/queries/transactions.sql`

- [ ] **Step 1: Add queries at the end of the file**

Append the following to `server/database/queries/transactions.sql`:

```sql
-- name: CreateTransactionSplit :one
INSERT INTO transaction_splits (
    parent_transaction_id,
    category_id,
    amount,
    description,
    percentage
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: ListSplitsByTransaction :many
SELECT *
FROM transaction_splits
WHERE parent_transaction_id = sqlc.arg('parent_transaction_id')
ORDER BY created_at ASC;

-- name: DeleteSplitsByTransaction :exec
DELETE FROM transaction_splits
WHERE parent_transaction_id = sqlc.arg('parent_transaction_id');

-- name: SetSplitGroupID :exec
UPDATE transactions
SET split_transaction_group_id = sqlc.narg('split_transaction_group_id')
WHERE id = ANY(sqlc.arg('ids')::uuid[])
  AND created_by = sqlc.arg('user_id')
  AND deleted_at IS NULL;
```

- [ ] **Step 2: Run sqlc to regenerate Go code**

```bash
cd server
sqlc generate
```

Expected: `server/internal/repository/` gains new generated functions: `CreateTransactionSplit`, `ListSplitsByTransaction`, `DeleteSplitsByTransaction`, `SetSplitGroupID`.

- [ ] **Step 3: Commit**

```bash
git add server/database/queries/transactions.sql server/internal/repository/
git commit -m "feat(split): add sqlc queries for transaction splits and group ID"
```

---

## Task 3: Add split service methods in Go

**Files:**
- Create: `server/internal/domain/transactions/service/splits.go`

First, look at the existing service file at `server/internal/domain/transactions/service/` to understand the service interface and constructor pattern, then add splits.

- [ ] **Step 1: Read the existing service interface**

```bash
cat server/internal/domain/transactions/service/*.go | head -80
```

Identify: the service struct name, how the repository is accessed, and the Go module path.

- [ ] **Step 2: Create `splits.go`**

Use the module path found above. The pattern follows the accounts handler (structs `Handler`, methods that call `h.service.*`):

```go
package service

import (
	"context"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// SplitInput defines one row of a split.
type SplitInput struct {
	CategoryID  *uuid.UUID
	Amount      decimal.Decimal
	Description *string
	Percentage  *decimal.Decimal
}

// ReplaceSplits atomically deletes all existing splits for a transaction and
// inserts the new set. Validates that split amounts sum to the parent total.
func (s *Service) ReplaceSplits(ctx context.Context, parentID uuid.UUID, userID uuid.UUID, splits []SplitInput) error {
	// Verify the parent transaction belongs to this user.
	parent, err := s.repo.GetTransactionById(ctx, parentID)
	if err != nil {
		return err
	}
	_ = parent // ownership is implicitly enforced by the GetTransactionById query

	// Validate that amounts sum to parent total (allow ±0.01 rounding tolerance).
	var total decimal.Decimal
	for _, sp := range splits {
		total = total.Add(sp.Amount)
	}
	// (validation only when splits are non-empty)
	if len(splits) > 0 {
		diff := total.Sub(parent.Amount).Abs()
		if diff.GreaterThan(decimal.NewFromFloat(0.01)) {
			return ErrSplitAmountMismatch
		}
	}

	// Delete existing splits.
	if err := s.repo.DeleteSplitsByTransaction(ctx, parentID); err != nil {
		return err
	}

	// Insert new splits.
	for _, sp := range splits {
		_, err := s.repo.CreateTransactionSplit(ctx, repository.CreateTransactionSplitParams{
			ParentTransactionID: parentID,
			CategoryID:          sp.CategoryID,
			Amount:              sp.Amount,
			Description:         sp.Description,
			Percentage:          sp.Percentage,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

// GetSplits returns all splits for a transaction.
func (s *Service) GetSplits(ctx context.Context, parentID uuid.UUID) ([]repository.TransactionSplit, error) {
	return s.repo.ListSplitsByTransaction(ctx, parentID)
}

// SetGroupID assigns or clears a shared group UUID for multiple transactions.
func (s *Service) SetGroupID(ctx context.Context, ids []uuid.UUID, userID uuid.UUID, groupID *uuid.UUID) error {
	return s.repo.SetSplitGroupID(ctx, repository.SetSplitGroupIDParams{
		SplitTransactionGroupID: groupID,
		Ids:                     ids,
		UserID:                  userID,
	})
}
```

Add the error sentinel to the package-level `errors.go` file:

```go
var ErrSplitAmountMismatch = errors.New("split amounts do not sum to parent transaction total")
```

- [ ] **Step 3: Commit**

```bash
git add server/internal/domain/transactions/service/splits.go server/internal/domain/transactions/errors.go
git commit -m "feat(split): add ReplaceSplits, GetSplits, SetGroupID service methods"
```

---

## Task 4: Add HTTP handlers for splits

**Files:**
- Create: `server/internal/domain/transactions/handlers/splits.go`

- [ ] **Step 1: Create the handler file**

```go
package handlers

import (
	"net/http"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/service"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/request"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/respond"
	"github.com/Fantasy-Programming/nuts/server/pkg/jwt"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// ReplaceSplits handles PUT /transactions/{id}/splits
// Body: { splits: [{ category_id?, amount, description?, percentage? }] }
func (h *Handler) ReplaceSplits(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	parentID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
			ClientErr: message.ErrBadRequest, ActualErr: err, Logger: h.logger})
		return
	}

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError,
			ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger})
		return
	}

	var body struct {
		Splits []struct {
			CategoryID  *uuid.UUID       `json:"category_id"`
			Amount      decimal.Decimal  `json:"amount"`
			Description *string          `json:"description"`
			Percentage  *decimal.Decimal `json:"percentage"`
		} `json:"splits"`
	}

	valErr, err := h.validator.ParseAndValidate(ctx, r, &body)
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
			ClientErr: message.ErrBadRequest, ActualErr: err, Logger: h.logger, Details: r.Body})
		return
	}
	if valErr != nil {
		respond.Errors(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
			ClientErr: message.ErrValidation, ActualErr: valErr, Logger: h.logger})
		return
	}

	var splits []service.SplitInput
	for _, s := range body.Splits {
		splits = append(splits, service.SplitInput{
			CategoryID:  s.CategoryID,
			Amount:      s.Amount,
			Description: s.Description,
			Percentage:  s.Percentage,
		})
	}

	if err := h.service.ReplaceSplits(ctx, parentID, userID, splits); err != nil {
		if err == transactions.ErrSplitAmountMismatch {
			respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
				ClientErr: transactions.ErrSplitAmountMismatch, ActualErr: err, Logger: h.logger})
			return
		}
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError,
			ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger})
		return
	}

	respond.Status(w, http.StatusOK)
}

// GetSplits handles GET /transactions/{id}/splits
func (h *Handler) GetSplits(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	parentID, err := request.ParseUUID(r, "id")
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
			ClientErr: message.ErrBadRequest, ActualErr: err, Logger: h.logger})
		return
	}

	splits, err := h.service.GetSplits(ctx, parentID)
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError,
			ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger})
		return
	}

	respond.Json(w, http.StatusOK, splits, h.logger)
}

// SetGroupID handles PATCH /transactions/group
// Body: { transaction_ids: ["uuid1", ...], group_id: "uuid" | null }
func (h *Handler) SetGroupID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := jwt.GetUserID(r)
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError,
			ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger})
		return
	}

	var body struct {
		TransactionIDs []uuid.UUID `json:"transaction_ids"`
		GroupID        *uuid.UUID  `json:"group_id"`
	}

	valErr, err := h.validator.ParseAndValidate(ctx, r, &body)
	if err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
			ClientErr: message.ErrBadRequest, ActualErr: err, Logger: h.logger, Details: r.Body})
		return
	}
	if valErr != nil {
		respond.Errors(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusBadRequest,
			ClientErr: message.ErrValidation, ActualErr: valErr, Logger: h.logger})
		return
	}

	if err := h.service.SetGroupID(ctx, body.TransactionIDs, userID, body.GroupID); err != nil {
		respond.Error(respond.ErrorOptions{W: w, R: r, StatusCode: http.StatusInternalServerError,
			ClientErr: message.ErrInternalError, ActualErr: err, Logger: h.logger})
		return
	}

	respond.Status(w, http.StatusOK)
}
```

- [ ] **Step 2: Register the routes**

Find the `RegisterHTTPHandlers` function in the transactions handlers package (look for `handlers/routes.go` or the file that contains `RegisterHTTPHandlers`). Add the three new routes:

```go
r.Get("/{id}/splits", h.GetSplits)
r.Put("/{id}/splits", h.ReplaceSplits)
r.Patch("/group", h.SetGroupID)
```

Place these within the authenticated route group, alongside the existing transaction routes.

- [ ] **Step 3: Verify the server compiles**

```bash
cd server && go build ./...
```

Expected: No compilation errors.

- [ ] **Step 4: Commit**

```bash
git add server/internal/domain/transactions/handlers/splits.go server/internal/domain/transactions/handlers/
git commit -m "feat(split): add HTTP handlers and routes for splits and group ID"
```

---

## Task 5: Add `splits` and `split_group_id` to the CRDT transaction schema

**Files:**
- Modify: `packages/types/src/crdt-schema.ts`

- [ ] **Step 1: Add the split sub-schema and new fields**

In `packages/types/src/crdt-schema.ts`, add a new schema for a split row before `crdtTransactionSchema`:

```typescript
const crdtTransactionSplitSchema = type({
  id: "string",
  category_id: "string | null",
  amount: "number",
  "description?": "string | null",
  "percentage?": "number | null",
});
```

Then in `crdtTransactionSchema`, add two optional fields:

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
  "needs_review?": "boolean | null",
  "tag_ids?": "string[] | null",
  "split_group_id?": "string | null",              // ← new: shared group UUID
  "splits?": type([crdtTransactionSplitSchema, "[]"]).or("null"),  // ← new: split rows
  created_at: "string",
  updated_at: "string",
  "deleted_at?": "string | null",
});
```

Also export the new split type:

```typescript
export type CRDTTransactionSplit = typeof crdtTransactionSplitSchema.infer;
```

- [ ] **Step 2: Commit**

```bash
git add packages/types/src/crdt-schema.ts
git commit -m "feat(split): add splits and split_group_id fields to CRDTTransaction schema"
```

---

## Task 6: Add `splits` and `split_group_id` to the SQLite `TransactionsTable`

**Files:**
- Modify: `packages/types/src/storage/database.ts`

- [ ] **Step 1: Add columns to `TransactionsTable`**

```typescript
export interface TransactionsTable {
  // ... all existing fields ...
  needs_review: 0 | 1;
  tag_ids: string | null;
  split_group_id: string | null;    // ← new
  splits: string | null;            // ← new (stored as JSON)
  // ... rest of fields ...
}
```

- [ ] **Step 2: Add a client-side SQLite migration**

Follow the same pattern used in Task 3 of the bulk-edit plan (find the migrations package, add a new migration):

SQL to apply:
```sql
ALTER TABLE transactions ADD COLUMN split_group_id TEXT;
ALTER TABLE transactions ADD COLUMN splits TEXT;
```

- [ ] **Step 3: Commit**

```bash
git add packages/types/src/storage/database.ts packages/migrations/
git commit -m "feat(split): add split_group_id and splits columns to SQLite TransactionsTable"
```

---

## Task 7: Update `rebuildFromCRDT` to project splits

**Files:**
- Modify: `apps/client/src/core/sync/query.ts`

- [ ] **Step 1: Update the transaction batch mapping in `rebuildFromCRDT`**

Add the two new fields to the batch rows:

```typescript
split_group_id: t.split_group_id ?? null,
splits: t.splits ? JSON.stringify(t.splits) : null,
```

- [ ] **Step 2: Add to `TransactionRow` interface**

```typescript
export interface TransactionRow {
  // ... existing fields ...
  split_group_id: string | null;
  splits: Array<{ id: string; category_id: string | null; amount: number; description?: string; percentage?: number }> | null;
}
```

- [ ] **Step 3: Add to select and map in `queryTransactions`**

In the `.select([...])` array, add:
```typescript
"t.split_group_id",
"t.splits",
```

In the `data` mapping:
```typescript
split_group_id: tx.split_group_id,
splits: parseJsonSafe(tx.splits, null),
```

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/core/sync/query.ts
git commit -m "feat(split): project splits and split_group_id through Kysely query layer"
```

---

## Task 8: Add split/group methods to the transaction service

**Files:**
- Modify: `apps/client/src/features/transactions/services/transaction.service.ts`

- [ ] **Step 1: Add `saveSplits` service method**

```typescript
const saveSplits = async (
  parentId: string,
  splits: Array<{ category_id: string | null; amount: number; description?: string; percentage?: number }>
): Promise<Result<void, ServiceError>> => {
  const initResult = await ensureInitialized();
  if (initResult.isErr()) return err(initResult.error);

  // Assign temporary IDs to each split (CRDT needs IDs).
  const { uuidV7 } = await import("@nuts/utils");
  const splitsWithIds = splits.map((s) => ({ id: uuidV7(), ...s }));

  const updateResult = await crdtService.updateTransaction(parentId, { splits: splitsWithIds });
  if (updateResult.isErr()) return err(updateResult.error);

  const rebuildResult = await rebuildFromCRDT();
  if (rebuildResult.isErr()) return err(rebuildResult.error);

  return ok(undefined);
};

const setGroupID = async (
  transactionIds: string[],
  groupId: string | null
): Promise<Result<void, ServiceError>> => {
  const initResult = await ensureInitialized();
  if (initResult.isErr()) return err(initResult.error);

  for (const id of transactionIds) {
    const updateResult = await crdtService.updateTransaction(id, { split_group_id: groupId });
    if (updateResult.isErr()) return err(updateResult.error);
  }

  const rebuildResult = await rebuildFromCRDT();
  if (rebuildResult.isErr()) return err(rebuildResult.error);

  return ok(undefined);
};
```

- [ ] **Step 2: Export the new methods**

```typescript
return {
  // ... existing exports ...
  saveSplits,
  setGroupID,
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/client/src/features/transactions/services/transaction.service.ts
git commit -m "feat(split): add saveSplits and setGroupID to transaction service"
```

---

## Task 9: Create the Split Transaction Dialog

**Files:**
- Create: `apps/client/src/features/transactions/components/split-transaction-dialog.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { SearchableSelect, SearchableSelectOption } from "@/core/components/ui/search-select";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/features/categories/services/category.service";
import { transactionService } from "../services/transaction.service";
import { transactionQueryKeys } from "../services/transaction.keys";

interface SplitRow {
  tempId: string;
  category_id: string | null;
  amount: string;
  description: string;
}

interface SplitTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  totalAmount: number;
  existingSplits?: Array<{ id: string; category_id: string | null; amount: number; description?: string }>;
}

export function SplitTransactionDialog({
  isOpen,
  onClose,
  transactionId,
  totalAmount,
  existingSplits,
}: SplitTransactionDialogProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const absTotal = Math.abs(totalAmount);

  const [rows, setRows] = useState<SplitRow[]>(() => {
    if (existingSplits && existingSplits.length > 0) {
      return existingSplits.map((s, i) => ({
        tempId: `existing-${i}`,
        category_id: s.category_id,
        amount: String(Math.abs(s.amount)),
        description: s.description ?? "",
      }));
    }
    return [
      { tempId: "row-0", category_id: null, amount: String(absTotal), description: "" },
      { tempId: "row-1", category_id: null, amount: "0", description: "" },
    ];
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await categoryService.getCategories();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });

  const categoryOptions: SearchableSelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { tempId: `row-${Date.now()}`, category_id: null, amount: "0", description: "" },
    ]);

  const removeRow = (tempId: string) =>
    setRows((prev) => prev.filter((r) => r.tempId !== tempId));

  const updateRow = (tempId: string, field: keyof SplitRow, value: string | null) =>
    setRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r))
    );

  const allocatedTotal = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const remaining = parseFloat((absTotal - allocatedTotal).toFixed(2));
  const isValid = Math.abs(remaining) < 0.01 && rows.length >= 2;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      const splits = rows.map((r) => ({
        category_id: r.category_id,
        amount: parseFloat(r.amount),
        description: r.description || undefined,
      }));

      const result = await transactionService.saveSplits(transactionId, splits);
      if (result.isErr()) {
        toast.error("Failed to save splits", { description: result.error.message });
        return;
      }

      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success("Transaction split saved");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Split Transaction</DialogTitle>
          <DialogDescription>
            Divide this transaction (total: {absTotal.toFixed(2)}) across multiple
            categories. Amounts must add up exactly to the total.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {rows.map((row, idx) => (
            <div key={row.tempId} className="grid grid-cols-[1fr_100px_auto] gap-2 items-start">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <SearchableSelect
                  options={categoryOptions}
                  value={row.category_id ?? ""}
                  onValueChange={(v) => updateRow(row.tempId, "category_id", v || null)}
                  placeholder="Select…"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(row.tempId, "amount", e.target.value)}
                  className="text-right"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-5"
                onClick={() => removeRow(row.tempId)}
                disabled={rows.length <= 2}
                aria-label="Remove split row"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add row
          </Button>

          <div
            className={`text-sm ${Math.abs(remaining) < 0.01 ? "text-green-600" : "text-destructive"}`}
          >
            {Math.abs(remaining) < 0.01
              ? "✓ Amounts balance"
              : `Remaining: ${remaining.toFixed(2)}`}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Split"
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
git add apps/client/src/features/transactions/components/split-transaction-dialog.tsx
git commit -m "feat(split): add SplitTransactionDialog component"
```

---

## Task 10: Create the Group Transactions Dialog

**Files:**
- Create: `apps/client/src/features/transactions/components/group-transactions-dialog.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { transactionService } from "../services/transaction.service";
import { transactionQueryKeys } from "../services/transaction.keys";
import { uuidV7 } from "@nuts/utils";

interface GroupTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionIds: string[];
}

export function GroupTransactionsDialog({
  isOpen,
  onClose,
  transactionIds,
}: GroupTransactionsDialogProps) {
  const queryClient = useQueryClient();
  const [isGrouping, setIsGrouping] = useState(false);

  const handleGroup = async () => {
    setIsGrouping(true);
    try {
      const groupId = uuidV7();
      const result = await transactionService.setGroupID(transactionIds, groupId);
      if (result.isErr()) {
        toast.error("Failed to group transactions", { description: result.error.message });
        return;
      }
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.lists() });
      toast.success(`${transactionIds.length} transactions grouped`);
      onClose();
    } finally {
      setIsGrouping(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Transactions</DialogTitle>
          <DialogDescription>
            Link {transactionIds.length} selected transactions together as a group.
            Grouped transactions will be visually connected in the transaction list.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGrouping}>
            Cancel
          </Button>
          <Button onClick={handleGroup} disabled={isGrouping}>
            {isGrouping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Grouping…
              </>
            ) : (
              "Group Transactions"
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
git add apps/client/src/features/transactions/components/group-transactions-dialog.tsx
git commit -m "feat(split): add GroupTransactionsDialog component"
```

---

## Task 11: Wire split button into the Edit Sheet

**Files:**
- Modify: `apps/client/src/features/transactions/components/edt-records-sheet.tsx`

- [ ] **Step 1: Import and add state**

At the top of `edt-records-sheet.tsx`, add:

```tsx
import { SplitTransactionDialog } from "./split-transaction-dialog";
import { GitFork } from "lucide-react";
```

Inside the `EditTransactionSheet` component, add:

```tsx
const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
```

- [ ] **Step 2: Add the "Split transaction" button**

Anywhere in the form body (e.g., near the bottom, after the note textarea), add:

```tsx
{/* Split transaction */}
{!isSyncedTransaction && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="w-full"
    onClick={() => setIsSplitDialogOpen(true)}
  >
    <GitFork className="mr-2 h-4 w-4" />
    Split Transaction
  </Button>
)}
```

- [ ] **Step 3: Render the dialog**

At the end of the `EditTransactionSheet` return JSX (outside the `<Sheet>`), add:

```tsx
{transactionId && transaction && (
  <SplitTransactionDialog
    isOpen={isSplitDialogOpen}
    onClose={() => setIsSplitDialogOpen(false)}
    transactionId={transactionId}
    totalAmount={transaction.amount}
    existingSplits={(transaction as any).splits ?? undefined}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add apps/client/src/features/transactions/components/edt-records-sheet.tsx
git commit -m "feat(split): add Split Transaction button to EditTransactionSheet"
```

---

## Task 12: Wire Group button into the FloatingActionBar and RecordsTable

**Files:**
- Modify: `apps/client/src/features/transactions/components/floating-records-bar.tsx`
- Modify: `apps/client/src/features/transactions/components/records-table.tsx`

- [ ] **Step 1: Add Group callback to FloatingActionBar**

In `floating-records-bar.tsx`, add `onGroup` to the props interface and add a Group button:

```tsx
interface FloatingActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGroup: () => void;    // ← new
  isDeleting?: boolean;
}
```

In the JSX, add the Group button next to Edit and Delete:

```tsx
import { Pencil, Trash2, Check, Link2 } from "lucide-react";

// In the action icons section:
<Button
  variant="ghost"
  size="icon"
  onClick={onGroup}
  aria-label="Group selected"
  className="text-gray-400 hover:bg-white/10 hover:text-white"
>
  <Link2 className="h-5 w-5" />
</Button>
```

- [ ] **Step 2: Wire up in RecordsTable**

In `records-table.tsx`, add:

```tsx
import { GroupTransactionsDialog } from "./group-transactions-dialog";
```

Add state:

```tsx
const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
```

Pass `onGroup` to `FloatingActionBar`:

```tsx
<FloatingActionBar
  selectedCount={selectedRowCount}
  onClear={() => table.resetRowSelection()}
  onEdit={() => setIsBulkEditDialogOpen(true)}
  onDelete={handleBulkDelete}
  onGroup={() => setIsGroupDialogOpen(true)}   // ← add
  isDeleting={bulkDeleteMutation.isPending}
/>
```

Add the dialog near the other dialogs:

```tsx
<GroupTransactionsDialog
  isOpen={isGroupDialogOpen}
  onClose={() => {
    setIsGroupDialogOpen(false);
    table.resetRowSelection();
  }}
  transactionIds={selectedRowIds}
/>
```

Where `selectedRowIds` is derived from the table's row selection state (already available via `table.getSelectedRowModel().rows.map(r => r.original.id)`).

- [ ] **Step 3: Add split indicator on table rows**

In `records-table.tsx`, in the `MemoizedTransactionCard` component and in the desktop table row rendering, show a split indicator when `(transaction as any).splits?.length > 0`:

```tsx
{(transaction as any).splits?.length > 0 && (
  <Badge variant="outline" className="text-xs gap-1">
    <GitFork className="h-3 w-3" />
    Split
  </Badge>
)}
```

Import `GitFork` from `lucide-react`.

- [ ] **Step 4: Verify it builds**

```bash
cd apps/client && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/features/transactions/components/floating-records-bar.tsx apps/client/src/features/transactions/components/records-table.tsx
git commit -m "feat(split): add Group button to FloatingActionBar and split indicator to table rows"
```
