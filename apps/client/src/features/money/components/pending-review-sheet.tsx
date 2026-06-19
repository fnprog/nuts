/**
 * Pending Transaction Review Sheet — 2.2
 * Swipeable card stack: confirm / dismiss / confirm-all.
 * Currently uses mock data; wire to real SMS-parsed transactions when available.
 */
import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { toast } from "sonner";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/core/components/ui/dialog-sheet";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PendingTransaction {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  account: string;
  datetime: Date;
  source: "sms" | "voice" | "receipt" | "manual";
}

interface PendingReviewSheetProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transactions?: PendingTransaction[];
}

// ── Mock data (replace with real SMS-parsed transactions) ─────────────────────
const MOCK_PENDING: PendingTransaction[] = [
  { id: "1", amount: 120, merchant: "Shoprite Accra Mall", category: "Food & Groceries", account: "MTN MoMo", datetime: new Date(), source: "sms" },
  { id: "2", amount: 35, merchant: "Bolt", category: "Transport", account: "MTN MoMo", datetime: new Date(Date.now() - 3600000), source: "sms" },
  { id: "3", amount: 50, merchant: "Electroland", category: "Electronics", account: "MTN MoMo", datetime: new Date(Date.now() - 7200000), source: "sms" },
];

// ── Card component with drag-to-confirm/dismiss ───────────────────────────────
function ReviewCard({
  tx,
  index,
  total,
  onConfirm,
  onDismiss,
}: {
  tx: PendingTransaction;
  index: number;
  total: number;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-12, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Overlay indicators
  const confirmOpacity = useTransform(x, [0, 80, 150], [0, 0.7, 1]);
  const dismissOpacity = useTransform(x, [-150, -80, 0], [1, 0.7, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) onConfirm();
    else if (info.offset.x < -100) onDismiss();
  };

  // Stack offset for cards behind
  const stackOffset = index * 6;
  const stackScale = 1 - index * 0.04;

  return (
    <motion.div
      key={tx.id}
      style={{
        x: index === 0 ? x : 0,
        rotate: index === 0 ? rotate : 0,
        opacity: index === 0 ? opacity : 1,
        zIndex: total - index,
        top: stackOffset,
        scale: stackScale,
      }}
      drag={index === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={index === 0 ? handleDragEnd : undefined}
      className="absolute inset-x-0 cursor-grab active:cursor-grabbing"
    >
      <div className="bg-background border-border relative mx-auto w-full max-w-sm rounded-2xl border p-5 shadow-lg">
        {/* Source badge */}
        <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
          <Zap className="h-3 w-3" />
          <span>Parsed from MTN MoMo SMS · {tx.datetime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {/* Amount */}
        <div className="mb-4 text-center">
          <span className="text-4xl font-bold tracking-tight">GH¢{tx.amount.toFixed(2)}</span>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <span className="font-medium">{tx.merchant}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📂</span>
            <span className="text-muted-foreground">{tx.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">💳</span>
            <span className="text-muted-foreground">{tx.account}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="text-muted-foreground">{tx.datetime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>
        </div>

        {/* Swipe indicators (only top card) */}
        {index === 0 && (
          <>
            <motion.div
              style={{ opacity: confirmOpacity }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/10"
            >
              <div className="rounded-full border-2 border-emerald-500 p-2">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: dismissOpacity }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-amber-500/10"
            >
              <div className="rounded-full border-2 border-amber-500 p-2">
                <X className="h-8 w-8 text-amber-500" />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PendingReviewSheet({ children, open: controlledOpen, onOpenChange, transactions }: PendingReviewSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const pending = transactions ?? MOCK_PENDING;
  const [queue, setQueue] = useState<PendingTransaction[]>([...pending]);
  const [reviewed, setReviewed] = useState(0);
  const total = pending.length;

  const handleConfirm = () => {
    const tx = queue[0];
    setQueue((q) => q.slice(1));
    setReviewed((r) => r + 1);
    toast.success(`GH¢${tx.amount.toFixed(2)} logged to ${tx.category} ✓`);

    if (queue.length === 1) {
      setTimeout(() => setOpen(false), 400);
    }
  };

  const handleDismiss = () => {
    const undoQueue = [...queue];
    const _tx = queue[0];
    setQueue((q) => q.slice(1));
    setReviewed((r) => r + 1);
    toast("Dismissed.", {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => setQueue(undoQueue),
      },
    });

    if (queue.length === 1) {
      setTimeout(() => setOpen(false), 400);
    }
  };

  const handleConfirmAll = () => {
    const count = queue.length;
    setQueue([]);
    setReviewed(total);
    toast.success(`${count} transactions logged ✓`);
    setTimeout(() => setOpen(false), 400);
  };

  // Reset queue when opened
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setQueue([...pending]);
      setReviewed(0);
    }
    setOpen(v);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      {children && <ResponsiveDialogTrigger>{children}</ResponsiveDialogTrigger>}

      <ResponsiveDialogContent className="sm:max-w-sm">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between">
            <ResponsiveDialogTitle>Review pending</ResponsiveDialogTitle>
            {total > 0 && (
              <span className="text-muted-foreground text-sm">
                {reviewed} of {total}
              </span>
            )}
          </div>
          {/* Progress bar */}
          {total > 0 && (
            <div className="bg-muted mt-1 h-0.5 w-full rounded-full">
              <motion.div
                className="bg-foreground h-full rounded-full"
                animate={{ width: `${(reviewed / total) * 100}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>
          )}
        </ResponsiveDialogHeader>

        <div className="px-1 pb-4">
          {queue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-12 text-center"
            >
              <span className="text-4xl">🎉</span>
              <p className="font-semibold">All caught up!</p>
              <p className="text-muted-foreground text-sm">No more transactions to review.</p>
            </motion.div>
          ) : (
            <>
              {/* Confirm All (3+ pending) */}
              {queue.length >= 3 && (
                <div className="mb-4">
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleConfirmAll}>
                    <Check className="h-4 w-4" />
                    Confirm all {queue.length} transactions
                  </Button>
                </div>
              )}

              {/* Card stack */}
              <div className="relative" style={{ height: 320 }}>
                <AnimatePresence>
                  {queue.slice(0, 3).map((tx, i) => (
                    <ReviewCard key={tx.id} tx={tx} index={i} total={Math.min(queue.length, 3)} onConfirm={handleConfirm} onDismiss={handleDismiss} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Swipe hint */}
              <p className="text-muted-foreground mt-2 text-center text-xs">Swipe right to confirm · Swipe left to dismiss</p>

              {/* Buttons */}
              <div className="mt-4 flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                  Dismiss
                </Button>
                <Button className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleConfirm}>
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
              </div>
            </>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
