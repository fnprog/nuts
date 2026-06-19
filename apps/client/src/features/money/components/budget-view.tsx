/**
 * Budget / Envelopes view — 2.7
 * Displays category budgets with real spending data.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, TrendingUp, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui/button";
import { crdtService } from "@/core/sync/crdt";
import { analyticsService } from "@/features/dashboard/services/analytics.service";
import { categoryService } from "@/features/categories/services/category.service";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";

// ── Colour helpers ─────────────────────────────────────────────────────────────
function progressColor(pct: number): string {
  if (pct <= 50) return "bg-emerald-500";
  if (pct <= 75) return "bg-emerald-400";
  if (pct <= 90) return "bg-amber-400";
  return "bg-amber-500";
}

// ── Category icons (best-effort) ───────────────────────────────────────────────
const ICONS: Record<string, string> = {
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
  other: "📋",
};
function catIcon(name: string) {
  const l = name.toLowerCase();
  for (const [k, v] of Object.entries(ICONS)) if (l.includes(k)) return v;
  return "📋";
}

// ── Envelope row ───────────────────────────────────────────────────────────────
function EnvelopeRow({ name, icon, limit, spent }: { name: string; icon: string; limit: number; spent: number }) {
  const [expanded, setExpanded] = useState(false);
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = limit - spent;
  const overBudget = spent > limit;

  return (
    <div className="border-border rounded-xl border">
      <button className="w-full p-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="font-medium">{name}</span>
          </div>
          <div className="text-right">
            <span className={cn("text-sm font-medium tabular-nums", overBudget ? "text-amber-600" : "text-foreground")}>GH¢{spent.toFixed(0)}</span>
            <span className="text-muted-foreground text-sm"> / GH¢{limit.toFixed(0)}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <motion.div
            className={cn("h-full rounded-full", progressColor(pct))}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className={cn("text-xs", overBudget ? "text-amber-600" : "text-muted-foreground")}>
            {overBudget ? `GH¢${(spent - limit).toFixed(0)} over budget` : `GH¢${remaining.toFixed(0)} remaining`}
          </span>
          <span className="text-muted-foreground text-xs">{pct.toFixed(0)}%</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-border border-t px-4 pt-3 pb-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => toast.info("Adjust limit — coming soon")}>
                  <TrendingUp className="h-3 w-3" /> Adjust limit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => toast.info("Move money — coming soon")}>
                  <MoveHorizontal className="h-3 w-3" /> Move money
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Budget view ────────────────────────────────────────────────────────────────
export function BudgetView() {
  const [month, setMonth] = useState(new Date());
  const _monthStart = startOfMonth(month);
  const _monthEnd = endOfMonth(month);

  const { data, isLoading } = useQuery({
    queryKey: ["budget-view", format(month, "yyyy-MM")],
    queryFn: async () => {
      // 1. Get budgets from CRDT
      const budgets = Object.values(crdtService.getBudgets());

      // 2. Get categories
      const catsResult = await categoryService.getCategories();
      const categories = catsResult.isOk() ? catsResult.value : [];
      const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

      // 3. Get spending breakdown for this month
      const breakdownResult = await analyticsService.getCategoryBreakdown(1);
      const breakdown = breakdownResult.isOk() ? breakdownResult.value : [];
      const spendMap = Object.fromEntries(breakdown.map((b) => [b.name.toLowerCase(), b.value]));

      // 4. Get monthly income/expense totals
      const ieResult = await analyticsService.getMonthlyIncomeExpense(1);
      const ie = ieResult.isOk() ? ieResult.value : [];
      const currentMonth = ie[ie.length - 1];
      const totalIncome = currentMonth?.income ?? 0;
      const totalExpense = currentMonth?.expense ?? 0;

      // 5. Build envelope list
      const envelopes = budgets
        .filter((b) => {
          const cat = catMap[b.category_id];
          return !!cat;
        })
        .map((b) => {
          const cat = catMap[b.category_id];
          const spent = spendMap[cat?.name?.toLowerCase() ?? ""] ?? 0;
          return {
            id: b.id,
            name: cat?.name ?? "Unknown",
            limit: b.amount,
            spent,
          };
        });

      const totalBudget = envelopes.reduce((s, e) => s + e.limit, 0);
      const totalSpent = envelopes.reduce((s, e) => s + e.spent, 0);
      const unallocated = totalIncome - totalBudget;

      return { envelopes, totalIncome, totalExpense, totalBudget, totalSpent, unallocated };
    },
  });

  const isCurrentMonth = format(month, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">{format(month, "MMMM yyyy")}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} disabled={isCurrentMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      {data && (
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-muted-foreground text-sm">
              {format(month, "MMMM yyyy")} · GH¢{data.totalIncome.toFixed(0)} income
            </span>
          </div>
          {/* Total progress bar */}
          <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
            <motion.div
              className={cn("h-full rounded-full", progressColor(data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0))}
              initial={{ width: 0 }}
              animate={{ width: `${data.totalBudget > 0 ? Math.min((data.totalSpent / data.totalBudget) * 100, 100) : 0}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              GH¢{data.totalSpent.toFixed(0)} of GH¢{data.totalBudget.toFixed(0)} spent
            </span>
            <span className="text-muted-foreground">{data.unallocated > 0 ? `GH¢${data.unallocated.toFixed(0)} unallocated` : ""}</span>
          </div>
        </div>
      )}

      {/* Envelope list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : data?.envelopes.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center text-sm">
          <p className="mb-1 text-2xl">📊</p>
          <p>No budgets set yet.</p>
          <p className="mt-1 text-xs">Create budgets in Settings → Categories.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.envelopes.map((env) => (
            <EnvelopeRow key={env.id} name={env.name} icon={catIcon(env.name)} limit={env.limit} spent={env.spent} />
          ))}
        </div>
      )}

      {/* Add envelope stub */}
      <Button
        variant="outline"
        className="text-muted-foreground w-full gap-2 border-dashed"
        onClick={() => toast.info("Add envelope — navigate to Settings → Categories to create budgets")}
      >
        <Plus className="h-4 w-4" /> Add envelope
      </Button>
    </div>
  );
}
