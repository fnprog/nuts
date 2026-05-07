import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NumberFlow from "@number-flow/react";
import { ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import type { DashboardChartComponentProps } from "../types";
import { config } from "./index";
import { ChartCard, ChartCardHeader, ChartCardTitle, ChartCardContent, ChartCardMenu } from "@/features/dashboard/components/chart-card";
import { analyticsService } from "@/features/dashboard/services/analytics.service";
import { accountService } from "@/features/accounts/services/account";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HealthComponent {
  name: string;
  score: number;
  max: number;
  status: string;
  detail: string;
  action: string;
  route: string;
}

interface HealthScore {
  total: number;
  components: HealthComponent[];
}

// ─── Score computation ────────────────────────────────────────────────────────

async function computeHealthScore(): Promise<HealthScore> {
  const [incomeExpenseResult, accountsResult] = await Promise.all([analyticsService.getMonthlyIncomeExpense(3), accountService.getAccounts()]);

  const months = incomeExpenseResult.isOk() ? incomeExpenseResult.value : [];
  const accounts = accountsResult.isOk() ? accountsResult.value : [];

  // ── Emergency Fund (max 20) ──────────────────────────────────────────────
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const avgExpense = months.length > 0 ? months.reduce((s, m) => s + m.expense, 0) / months.length : 0;
  const monthsCovered = avgExpense > 0 ? totalBalance / avgExpense : 0;
  const efScore = Math.min(20, Math.round((Math.min(monthsCovered, 6) / 6) * 20));

  // ── Debt Management (max 20) ─────────────────────────────────────────────
  const loanAccounts = accounts.filter((a) => a.type === "loan" || a.type === "credit");
  const totalDebt = loanAccounts.reduce((sum, a) => sum + Math.abs(a.balance ?? 0), 0);
  const avgIncome = months.length > 0 ? months.reduce((s, m) => s + m.income, 0) / months.length : 0;
  const diRatio = avgIncome > 0 ? totalDebt / (avgIncome * 12) : 0;
  const dmScore = totalDebt === 0 ? 20 : diRatio < 0.3 ? 18 : diRatio < 0.5 ? 12 : Math.max(0, Math.round(20 - diRatio * 20));

  // ── Savings Rate (max 15) ────────────────────────────────────────────────
  const recentMonths = months.slice(-3);
  const avgSavingsRate =
    recentMonths.length > 0
      ? recentMonths.reduce((s, m) => {
          const rate = m.income > 0 ? (m.income - m.expense) / m.income : 0;
          return s + rate;
        }, 0) / recentMonths.length
      : 0;
  const srScore = Math.round(Math.min(15, avgSavingsRate * 50));

  // ── Budget Adherence (max 15) ────────────────────────────────────────────
  // Proxy: consistency of spend relative to income
  const baScore = avgIncome > 0 && avgExpense > 0 ? Math.round(Math.min(15, (1 - Math.min(1, avgExpense / avgIncome)) * 20)) : 8;

  // ── Investment Growth (max 15) ───────────────────────────────────────────
  const investAccounts = accounts.filter((a) => a.type === "investment");
  const investTotal = investAccounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const netWorth = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const investRatio = netWorth > 0 ? investTotal / netWorth : 0;
  const igScore = Math.round(Math.min(15, investRatio * 30));

  // ── Income Stability (max 10) ────────────────────────────────────────────
  const incomes = months.map((m) => m.income).filter((i) => i > 0);
  const incomeStdDev = incomes.length > 1 ? Math.sqrt(incomes.reduce((s, i) => s + Math.pow(i - avgIncome, 2), 0) / incomes.length) : 0;
  const incomeCV = avgIncome > 0 ? incomeStdDev / avgIncome : 1;
  const isScore = Math.round(Math.min(10, (1 - Math.min(1, incomeCV)) * 10));

  // ── Protection (max 5) — stub until Protect module ──────────────────────
  const protScore = 3;

  const total = efScore + dmScore + srScore + baScore + igScore + isScore + protScore;

  return {
    total,
    components: [
      {
        name: "Emergency Fund",
        score: efScore,
        max: 20,
        status: efScore >= 16 ? "green" : efScore >= 10 ? "yellow" : "amber",
        detail: `You have ${monthsCovered.toFixed(1)} months of expenses covered. Target is 6 months.`,
        action: "Build your emergency fund",
        route: "/dashboard/accounts",
      },
      {
        name: "Debt Management",
        score: dmScore,
        max: 20,
        status: dmScore >= 16 ? "green" : dmScore >= 10 ? "yellow" : "amber",
        detail: totalDebt === 0 ? "Great — no tracked debt." : `Debt-to-income ratio is ${(diRatio * 100).toFixed(1)}%. Target is under 30%.`,
        action: "Manage your debt",
        route: "/dashboard/records",
      },
      {
        name: "Savings Rate",
        score: srScore,
        max: 15,
        status: srScore >= 12 ? "green" : srScore >= 7 ? "yellow" : "amber",
        detail: `You're saving ${(avgSavingsRate * 100).toFixed(0)}% of income on average. Target is 20%+.`,
        action: "Review your budget",
        route: "/dashboard/budgets",
      },
      {
        name: "Budget Adherence",
        score: baScore,
        max: 15,
        status: baScore >= 12 ? "green" : baScore >= 7 ? "yellow" : "amber",
        detail:
          avgIncome > 0
            ? `Spending ${((avgExpense / avgIncome) * 100).toFixed(0)}% of income. Aim to keep under 80%.`
            : "Add income transactions to track budget adherence.",
        action: "View spending breakdown",
        route: "/dashboard/analytics",
      },
      {
        name: "Investment Growth",
        score: igScore,
        max: 15,
        status: igScore >= 12 ? "green" : igScore >= 6 ? "yellow" : "amber",
        detail: `${(investRatio * 100).toFixed(0)}% of your net worth is invested. Target is 20%+.`,
        action: "Explore investment accounts",
        route: "/dashboard/accounts",
      },
      {
        name: "Income Stability",
        score: isScore,
        max: 10,
        status: isScore >= 8 ? "green" : isScore >= 5 ? "yellow" : "amber",
        detail:
          incomes.length < 2
            ? "Add more income transactions to measure stability."
            : `Income variability is ${(incomeCV * 100).toFixed(0)}%. Lower is more stable.`,
        action: "Track income sources",
        route: "/dashboard/records",
      },
      {
        name: "Protection",
        score: protScore,
        max: 5,
        status: "yellow",
        detail: "Insurance tracking coming soon. Score based on emergency fund coverage.",
        action: "Review protection",
        route: "/dashboard/home",
      },
    ],
  };
}

// ─── Query ────────────────────────────────────────────────────────────────────

const DUMMY_HEALTH: HealthScore = {
  total: 62,
  components: [
    {
      name: "Emergency Fund",
      score: 10,
      max: 20,
      status: "yellow",
      detail: "Add accounts to track your emergency fund.",
      action: "Add an account",
      route: "/dashboard/accounts",
    },
    {
      name: "Debt Management",
      score: 16,
      max: 20,
      status: "green",
      detail: "No tracked debt — well done.",
      action: "Track liabilities",
      route: "/dashboard/accounts",
    },
    {
      name: "Savings Rate",
      score: 9,
      max: 15,
      status: "yellow",
      detail: "Saving ~18% of income. Target is 20%+.",
      action: "Review your budget",
      route: "/dashboard/budgets",
    },
    {
      name: "Budget Adherence",
      score: 11,
      max: 15,
      status: "green",
      detail: "Spending 72% of income. Good discipline.",
      action: "View spending",
      route: "/dashboard/analytics",
    },
    {
      name: "Investment Growth",
      score: 8,
      max: 15,
      status: "yellow",
      detail: "15% of net worth is invested. Target 20%+.",
      action: "Explore investments",
      route: "/dashboard/accounts",
    },
    {
      name: "Income Stability",
      score: 5,
      max: 10,
      status: "yellow",
      detail: "Some variability in monthly income.",
      action: "Track income",
      route: "/dashboard/records",
    },
    {
      name: "Protection",
      score: 3,
      max: 5,
      status: "yellow",
      detail: "Insurance tracking coming soon.",
      action: "Review protection",
      route: "/dashboard/home",
    },
  ],
};

function useHealthScore(enabled: boolean) {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "healthScore"],
    queryFn: enabled ? computeHealthScore : async () => DUMMY_HEALTH,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Arc helpers ──────────────────────────────────────────────────────────────

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function arcColor(score: number) {
  if (score >= 90) return "var(--color-emerald, #059669)";
  if (score >= 70) return "var(--color-green, #16a34a)";
  if (score >= 40) return "var(--color-teal, #0d9488)";
  return "var(--color-amber, #d97706)";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Exceptional financial health 🌟";
  if (score >= 75) return "You're doing really well";
  if (score >= 60) return "Your finances are in good shape";
  if (score >= 40) return "You're building momentum";
  return "Let's get you on solid ground";
}

function statusColor(status: string) {
  if (status === "green") return "bg-green-500";
  if (status === "yellow") return "bg-amber-400";
  return "bg-orange-500";
}

function barColor(pct: number) {
  if (pct >= 0.8) return "bg-green-500";
  if (pct >= 0.5) return "bg-amber-400";
  return "bg-orange-500";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HealthScoreChartComponent({ id, size, isLocked, hasAccounts }: DashboardChartComponentProps) {
  const { data: health } = useHealthScore(!!hasAccounts);
  const [expanded, setExpanded] = useState(false);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const navigate = useNavigate();

  const score = health.total;
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);
  const color = arcColor(score);

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <ChartCardTitle className="text-muted-foreground">{config.title}</ChartCardTitle>
          </ChartCardHeader>

          <ChartCardContent>
            {/* Score circle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="group mx-auto flex w-full flex-col items-center gap-2 focus:outline-none"
              aria-label="Toggle health score breakdown"
            >
              <div className="relative flex items-center justify-center">
                <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90" aria-hidden="true">
                  {/* Track */}
                  <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  {/* Arc */}
                  <circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 500ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <NumberFlow value={score} className="text-4xl leading-none font-bold" />
                  <span className="text-muted-foreground mt-1 text-[10px] font-medium tracking-widest uppercase">/ 100</span>
                </div>
              </div>

              <p className="text-muted-foreground text-center text-sm">{scoreLabel(score)}</p>

              <div className={cn("text-muted-foreground flex items-center gap-1 text-xs transition-opacity", "group-hover:opacity-100 opacity-60")}>
                <ChevronRight className={cn("size-3 transition-transform duration-200", expanded && "rotate-90")} />
                {expanded ? "Hide breakdown" : "See breakdown"}
              </div>
            </button>

            {/* Breakdown panel */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-1 border-t pt-4">
                    {health.components.map((comp, i) => {
                      const pct = comp.score / comp.max;
                      const isOpen = openRow === i;

                      return (
                        <div key={comp.name}>
                          <button
                            onClick={() => setOpenRow(isOpen ? null : i)}
                            className="hover:bg-muted/40 flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
                          >
                            {/* Name */}
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{comp.name}</span>

                            {/* Bar */}
                            <div className="bg-muted/30 h-1.5 w-24 shrink-0 overflow-hidden rounded-full">
                              <motion.div
                                className={cn("h-full rounded-full", barColor(pct))}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct * 100}%` }}
                                transition={{
                                  duration: 0.5,
                                  delay: i * 0.08,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>

                            {/* Fraction */}
                            <span className="text-muted-foreground w-12 shrink-0 text-right text-xs">
                              {comp.score}/{comp.max}
                            </span>

                            {/* Status dot */}
                            <span className={cn("size-2 shrink-0 rounded-full", statusColor(comp.status))} />
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-muted/20 mx-2 mb-1 rounded-md px-3 py-2.5">
                                  <p className="text-muted-foreground mb-2 text-xs leading-relaxed">{comp.detail}</p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate({ to: comp.route as "/dashboard/home" });
                                      setExpanded(false);
                                    }}
                                    className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
                                  >
                                    {comp.action}
                                    <ArrowRight className="size-3" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ChartCardContent>
        </div>
      </ChartCardMenu>
    </ChartCard>
  );
}
