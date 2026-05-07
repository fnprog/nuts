import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { Calendar, Smartphone, TrendingUp, Send, Target, Shield, BarChart2, X } from "lucide-react";
import { toast } from "sonner";

import type { DashboardChartComponentProps } from "../types";
import { config } from "./index";
import { ChartCard, ChartCardHeader, ChartCardTitle, ChartCardContent, ChartCardMenu } from "@/features/dashboard/components/chart-card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type BriefingType = "bill" | "pending" | "investment" | "invoice" | "goal" | "insurance" | "anomaly";

interface BriefingItem {
  id: string;
  type: BriefingType;
  text: string;
  subtext?: string;
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

const DUMMY_ITEMS: BriefingItem[] = [
  {
    id: "1",
    type: "bill",
    text: "Electricity bill due in 3 days",
    subtext: "$85",
  },
  {
    id: "2",
    type: "pending",
    text: "3 MoMo transactions to review",
  },
  {
    id: "3",
    type: "investment",
    text: "T-bill matures in 3 days",
    subtext: "$10,487",
  },
  {
    id: "4",
    type: "insurance",
    text: "Car insurance expires in 14 days",
    subtext: "Renew now?",
  },
];

// ─── Icon + color per type ────────────────────────────────────────────────────

const TYPE_META: Record<BriefingType, { Icon: React.ElementType; color: string; bg: string }> = {
  bill: {
    Icon: Calendar,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  pending: {
    Icon: Smartphone,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  investment: {
    Icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  invoice: {
    Icon: Send,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  goal: {
    Icon: Target,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  insurance: {
    Icon: Shield,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  anomaly: {
    Icon: BarChart2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TodaysBriefingComponent({ id, size, isLocked }: DashboardChartComponentProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const items = DUMMY_ITEMS.filter((item) => !dismissed.has(item.id));
  const today = format(new Date(), "EEEE, MMMM d");

  function dismiss(itemId: string) {
    setDismissed((prev) => new Set([...prev, itemId]));
    toast("Item dismissed", {
      duration: 4000,
      action: {
        label: "Remind me tomorrow",
        onClick: () => {
          // In a real implementation this would schedule a re-appearance
          toast("We'll remind you tomorrow.", { duration: 2000 });
        },
      },
    });
  }

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <div className="flex-1">
              <ChartCardTitle className="text-muted-foreground">{config.title}</ChartCardTitle>
              <p className="text-muted-foreground mt-0.5 text-xs">{today}</p>
            </div>
          </ChartCardHeader>

          <ChartCardContent>
            {items.length === 0 ? (
              // Quiet state
              <div className="flex flex-col gap-1.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-green-500" />
                  <p className="text-sm font-medium">Quiet day financially. Everything's on track.</p>
                </div>
                <p className="text-muted-foreground pl-4 text-xs">Nothing requires your attention today.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const meta = TYPE_META[item.type];
                    const Icon = meta.Icon;

                    return (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.15 }}
                        className="group hover:bg-muted/40 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                      >
                        {/* Icon badge */}
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                          <Icon className={cn("size-3.5", meta.color)} />
                        </div>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm leading-tight font-medium">{item.text}</p>
                          {item.subtext && <p className="text-muted-foreground text-xs">{item.subtext}</p>}
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(item.id);
                          }}
                          className="text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                          aria-label="Dismiss"
                        >
                          <X className="size-3.5" />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </ChartCardContent>
        </div>
      </ChartCardMenu>
    </ChartCard>
  );
}
