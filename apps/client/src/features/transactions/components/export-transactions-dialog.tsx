import { useState } from "react";
import Papa from "papaparse";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Label } from "@/core/components/ui/label";
import { transactionService } from "../services/transaction.service";
import type { RecordSchema } from "../services/transaction.types";
import type { TransactionFilterState } from "./transaction-filter-dropdown";

// The columns the user can choose to include in the CSV.
const AVAILABLE_COLUMNS: { key: string; label: string; getValue: (tx: RecordSchema) => string | number }[] = [
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
  { key: "note", label: "Note", getValue: (tx) => tx.details?.note ?? "" },
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

export function ExportTransactionsDialog({ isOpen, onClose, filters, search }: ExportTransactionsDialogProps) {
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
            Choose which columns to include in your CSV export. The export will include all transactions matching your current filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {AVAILABLE_COLUMNS.map((col) => (
            <div key={col.key} className="flex items-center gap-2">
              <Checkbox id={`col-${col.key}`} checked={selectedColumns.has(col.key)} onCheckedChange={() => toggleColumn(col.key)} />
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
