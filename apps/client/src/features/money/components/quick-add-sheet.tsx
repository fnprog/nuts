/**
 * Quick-Add Sheet — 2.3 Manual Transaction Entry
 * Trigger via FAB, Home quick-action, or keyboard shortcut N.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/core/components/ui/dialog-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Calendar as CalendarComponent } from "@/core/components/ui/calendar";
import { transactionService } from "@/features/transactions/services/transaction.service";
import { categoryService } from "@/features/categories/services/category.service";
import { accountService } from "@/features/accounts/services/account";
import { RecordCreateSchema } from "@/features/transactions/services/transaction.types";
import { format } from "date-fns";

// ── Category icon mapping (best-effort emoji fallback) ─────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔",
  transport: "🚗",
  airtime: "📱",
  rent: "🏠",
  utilities: "💡",
  savings: "🎯",
  health: "💊",
  entertainment: "🎭",
  clothing: "👕",
  education: "📚",
  salary: "💰",
  freelance: "💼",
  business: "🏢",
  other: "📋",
};

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "📋";
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TxType = "expense" | "income";

interface QuickAddSheetProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultType?: TxType;
}

export function QuickAddSheet({ children, open: controlledOpen, onOpenChange, defaultType = "expense" }: QuickAddSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [txType, setTxType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [dateOpen, setDateOpen] = useState(false);
  const [amountShake, setAmountShake] = useState(false);
  const [categoryShake, setCategoryShake] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const [{ data: categories }, { data: accountsRaw }] = useQueries({
    queries: [
      {
        queryKey: ["categories"],
        queryFn: async () => {
          const r = await categoryService.getCategories();
          if (r.isErr()) throw r.error;
          return r.value;
        },
      },
      {
        queryKey: ["accounts"],
        queryFn: async () => {
          const r = await accountService.getAccounts();
          if (r.isErr()) throw r.error;
          return r.value;
        },
      },
    ],
  });

  // Filter categories by type
  const expenseCategories = (categories ?? []).filter((c) => c.type !== "income").slice(0, showAllCategories ? 999 : 6);
  const incomeCategories = (categories ?? []).filter(
    (c) => c.type === "income" || ["salary", "freelance", "business"].some((k) => c.name.toLowerCase().includes(k))
  );
  const visibleCategories = txType === "expense" ? expenseCategories : incomeCategories.length ? incomeCategories : (categories ?? []).slice(0, 6);
  const accounts = useMemo(() => accountsRaw ?? [], [accountsRaw]);

  // Auto-select first account
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setAmount("");
      setCategoryId(null);
      setDescription("");
      setDate(new Date());
      setTxType(defaultType);
      setShowAllCategories(false);
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  }, [open, defaultType]);

  const createMutation = useMutation({
    mutationFn: async (data: RecordCreateSchema) => {
      const r = await transactionService.createTransaction(data);
      if (r.isErr()) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const handleSave = async () => {
    let valid = true;
    if (!amount || isNaN(parseFloat(amount))) {
      setAmountShake(true);
      setTimeout(() => setAmountShake(false), 500);
      valid = false;
    }
    if (!categoryId) {
      setCategoryShake(true);
      setTimeout(() => setCategoryShake(false), 500);
      valid = false;
    }
    if (!valid || !accountId) return;

    const numAmount = parseFloat(amount);
    const cat = (categories ?? []).find((c) => c.id === categoryId);

    try {
      await createMutation.mutateAsync({
        amount: numAmount,
        transaction_datetime: date,
        description: description || cat?.name || (txType === "income" ? "Income" : "Expense"),
        category_id: categoryId ?? undefined,
        account_id: accountId,
        type: txType,
      });

      setOpen(false);
      toast.success(`${txType === "income" ? "+" : ""}GH¢${numAmount.toFixed(2)} added to ${cat?.name ?? "transactions"} ✓`);
    } catch {
      toast.error("Failed to save transaction");
    }
  };

  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return format(d, "MMM d");
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {children && <ResponsiveDialogTrigger>{children}</ResponsiveDialogTrigger>}

      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between">
            <ResponsiveDialogTitle className="text-lg font-semibold">{txType === "income" ? "Log income" : "Add expense"}</ResponsiveDialogTitle>
            {/* Expense ↔ Income toggle */}
            <button
              onClick={() => {
                setTxType((t) => (t === "expense" ? "income" : "expense"));
                setCategoryId(null);
              }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors"
            >
              <ArrowUpDown className="h-3 w-3" />
              {txType === "expense" ? "Expense" : "Income"}
            </button>
          </div>
        </ResponsiveDialogHeader>

        <div className="space-y-5 px-1 pb-4">
          {/* Amount */}
          <div>
            <p className="text-muted-foreground mb-1 text-sm">How much?</p>
            <motion.div animate={amountShake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}} transition={{ duration: 0.4 }}>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">GH¢</span>
                <Input
                  ref={amountRef}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(
                    "pl-12 text-2xl font-semibold h-14",
                    txType === "income" ? "text-emerald-600" : "",
                    amountShake ? "border-amber-400 ring-amber-400/30 ring-2" : ""
                  )}
                />
              </div>
            </motion.div>
          </div>

          {/* Category chips */}
          <div>
            <p className="text-muted-foreground mb-2 text-sm">What for?</p>
            <motion.div animate={categoryShake ? { x: [-4, 4, -3, 3, -2, 2, 0] } : {}} transition={{ duration: 0.4 }} className="flex flex-wrap gap-2">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                    categoryId === cat.id
                      ? "border-foreground bg-foreground text-background font-medium scale-105"
                      : "border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{getCategoryIcon(cat.name)}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
              {(categories ?? []).length > 6 && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="border-border text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors"
                >
                  {showAllCategories ? "Show less" : `+ ${(categories ?? []).length - 6} more`}
                </button>
              )}
            </motion.div>
          </div>

          {/* Description (merchant) */}
          <div>
            <Input placeholder="Merchant / note (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm" />
          </div>

          {/* Account + Date row */}
          <div className="flex gap-2">
            <Select value={accountId ?? ""} onValueChange={setAccountId}>
              <SelectTrigger className="flex-1 text-sm">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-between text-sm">
                  <span>{formatDateLabel(date)}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col">
                  {[
                    { label: "Today", offset: 0 },
                    { label: "Yesterday", offset: -1 },
                  ].map(({ label, offset }) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    return (
                      <button
                        key={label}
                        className={cn(
                          "px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                          date.toDateString() === d.toDateString() ? "font-medium" : ""
                        )}
                        onClick={() => {
                          setDate(d);
                          setDateOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <div className="border-t" />
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d);
                        setDateOpen(false);
                      }
                    }}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Save button */}
          <Button className="w-full" size="lg" onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
