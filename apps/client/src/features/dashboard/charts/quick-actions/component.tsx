import { Plus, Mic, Camera, CheckCircle, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { isSunday } from "date-fns";

import type { DashboardChartComponentProps } from "../types";
import { config } from "./index";
import { ChartCard, ChartCardHeader, ChartCardTitle, ChartCardContent, ChartCardMenu } from "@/features/dashboard/components/chart-card";
import { cn } from "@/lib/utils";

// ─── Stub pending count (wired up in Part 2 — Money module) ──────────────────
const PENDING_COUNT = 3;
const isReportDay = isSunday(new Date());

// ─── Action definitions ───────────────────────────────────────────────────────

interface Action {
  id: string;
  label: string;
  Icon: React.ElementType;
  badge?: number;
  conditional?: boolean;
  onClick: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuickActionsComponent({ id, size, isLocked }: DashboardChartComponentProps) {
  const actions: Action[] = [
    {
      id: "add",
      label: "Add transaction",
      Icon: Plus,
      onClick: () => toast("Add transaction coming in Part 2 — Money module."),
    },
    {
      id: "voice",
      label: "Voice input",
      Icon: Mic,
      onClick: () => toast("Voice input coming in Part 2 — Money module."),
    },
    {
      id: "snap",
      label: "Snap receipt",
      Icon: Camera,
      onClick: () => toast("Receipt OCR coming in Part 2 — Money module."),
    },
    ...(PENDING_COUNT > 0
      ? [
          {
            id: "review",
            label: "Review pending",
            Icon: CheckCircle,
            badge: PENDING_COUNT,
            onClick: () => toast(`${PENDING_COUNT} pending transactions — coming in Part 2.`),
          } satisfies Action,
        ]
      : []),
    ...(isReportDay
      ? [
          {
            id: "report",
            label: "Weekly report",
            Icon: BarChart2,
            onClick: () => toast("Weekly report coming soon."),
          } satisfies Action,
        ]
      : []),
  ];

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <ChartCardTitle className="text-muted-foreground">{config.title}</ChartCardTitle>
          </ChartCardHeader>

          <ChartCardContent>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const Icon = action.Icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                      "transition-all duration-150",
                      "hover:bg-muted/60 hover:border-border/80 active:scale-[0.97]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{action.label}</span>
                    {action.badge != null && action.badge > 0 && (
                      <span className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full text-[10px] leading-none font-bold">
                        {action.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ChartCardContent>
        </div>
      </ChartCardMenu>
    </ChartCard>
  );
}
