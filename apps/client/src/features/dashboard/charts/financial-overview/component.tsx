import { useSuspenseQuery } from "@tanstack/react-query";
import NumberFlow from "@number-flow/react";
import { Link } from "@tanstack/react-router";
import { Wallet, TrendingUp, Target, Shield, ChevronRight } from "lucide-react";
import type { Format } from "@number-flow/react";

import type { DashboardChartComponentProps } from "../types";
import { config } from "./index";
import { ChartCard, ChartCardHeader, ChartCardTitle, ChartCardContent, ChartCardMenu } from "@/features/dashboard/components/chart-card";
import { analyticsService } from "@/features/dashboard/services/analytics.service";
import { accountService } from "@/features/accounts/services/account";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TileStatus = "green" | "yellow" | "amber";

interface OverviewTile {
  id: string;
  label: string;
  icon: React.ElementType;
  primary: number;
  primaryFormat?: Format;
  primarySuffix?: string;
  secondary: string;
  status: TileStatus;
  attention?: boolean;
  route: "/dashboard/home" | "/dashboard/accounts" | "/dashboard/budgets" | "/dashboard/analytics" | "/dashboard/records";
}

interface OverviewData {
  tiles: OverviewTile[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENCY_FORMAT: Format = {
  style: "currency",
  currency: "USD",
} as const;

async function fetchOverviewData(): Promise<OverviewData> {
  const [incomeExpResult, accountsResult] = await Promise.all([analyticsService.getMonthlyIncomeExpense(1), accountService.getAccounts()]);

  const months = incomeExpResult.isOk() ? incomeExpResult.value : [];
  const accounts = accountsResult.isOk() ? accountsResult.value : [];

  const latest = months[months.length - 1];
  const income = latest?.income ?? 0;
  const expense = latest?.expense ?? 0;
  const remaining = income - expense;
  const moneyStatus: TileStatus = income === 0 ? "yellow" : remaining / income > 0.2 ? "green" : remaining / income > 0 ? "yellow" : "amber";

  const netWorth = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const loanTotal = accounts.filter((a) => a.type === "loan" || a.type === "credit").reduce((s, a) => s + Math.abs(a.balance ?? 0), 0);
  const avgIncome = months.length > 0 ? months.reduce((s, m) => s + m.income, 0) / months.length : 0;
  const diRatio = avgIncome > 0 ? loanTotal / (avgIncome * 12) : 0;
  const growStatus: TileStatus = loanTotal === 0 ? "green" : diRatio < 0.3 ? "green" : diRatio < 0.5 ? "yellow" : "amber";

  const investAccounts = accounts.filter((a) => a.type === "investment");
  const investTotal = investAccounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const investRatio = netWorth > 0 ? investTotal / netWorth : 0;
  const wealthStatus: TileStatus = accounts.length === 0 ? "yellow" : "green";

  const tiles: OverviewTile[] = [
    {
      id: "money",
      label: "Money",
      icon: Wallet,
      primary: remaining,
      primaryFormat: CURRENCY_FORMAT,
      secondary: `${expense > 0 ? new Intl.NumberFormat("en-US", CURRENCY_FORMAT).format(expense) + " spent" : "No spend yet"}`,
      status: moneyStatus,
      attention: remaining < 0,
      route: "/dashboard/budgets",
    },
    {
      id: "wealth",
      label: "Wealth",
      icon: TrendingUp,
      primary: netWorth,
      primaryFormat: CURRENCY_FORMAT,
      secondary: accounts.length === 0 ? "Add accounts to track" : `${(investRatio * 100).toFixed(0)}% invested`,
      status: wealthStatus,
      attention: accounts.length === 0,
      route: "/dashboard/accounts",
    },
    {
      id: "grow",
      label: "Grow",
      icon: Target,
      primary: loanTotal,
      primaryFormat: CURRENCY_FORMAT,
      secondary: loanTotal === 0 ? "Debt free" : `D/I ratio ${(diRatio * 100).toFixed(0)}%`,
      status: growStatus,
      route: "/dashboard/records",
    },
    {
      id: "protect",
      label: "Protect",
      icon: Shield,
      primary: 0,
      primarySuffix: "tracked",
      secondary: "Set up insurance tracking",
      status: "yellow",
      route: "/dashboard/home",
    },
  ];

  return { tiles };
}

const DUMMY_OVERVIEW: OverviewData = {
  tiles: [
    {
      id: "money",
      label: "Money",
      icon: Wallet,
      primary: 800,
      primaryFormat: CURRENCY_FORMAT,
      secondary: "1,970 spent · 430 saved",
      status: "green",
      route: "/dashboard/budgets",
    },
    {
      id: "wealth",
      label: "Wealth",
      icon: TrendingUp,
      primary: 47200,
      primaryFormat: CURRENCY_FORMAT,
      secondary: "↑ 1,840 this month",
      status: "green",
      route: "/dashboard/accounts",
    },
    {
      id: "grow",
      label: "Grow",
      icon: Target,
      primary: 5200,
      primaryFormat: CURRENCY_FORMAT,
      secondary: "Debt-free: Mar 2026",
      status: "yellow",
      route: "/dashboard/records",
    },
    {
      id: "protect",
      label: "Protect",
      icon: Shield,
      primary: 0,
      primarySuffix: "tracked",
      secondary: "Set up insurance tracking",
      status: "yellow",
      route: "/dashboard/home",
    },
  ],
};

function useOverviewData(enabled: boolean) {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "financialOverview"],
    queryFn: enabled ? fetchOverviewData : async () => DUMMY_OVERVIEW,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusDot(status: TileStatus) {
  return cn("size-2 rounded-full shrink-0", status === "green" && "bg-green-500", status === "yellow" && "bg-amber-400", status === "amber" && "bg-orange-500");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinancialOverviewComponent({ id, size, isLocked, hasAccounts }: DashboardChartComponentProps) {
  const { data } = useOverviewData(!!hasAccounts);

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <ChartCardTitle className="text-muted-foreground">{config.title}</ChartCardTitle>
          </ChartCardHeader>

          <ChartCardContent>
            <div className="grid grid-cols-2 gap-3">
              {data.tiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Link
                    key={tile.id}
                    to={tile.route}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-xl border p-3.5 transition-all",
                      "hover:bg-muted/40 hover:shadow-sm",
                      tile.attention && "border-amber-400/40 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]"
                    )}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className="text-muted-foreground size-3.5" />
                        <span className="text-muted-foreground text-xs font-medium">{tile.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={statusDot(tile.status)} />
                        <ChevronRight className="text-muted-foreground/40 size-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    {/* Primary metric */}
                    <div className="min-h-[2rem]">
                      {tile.primarySuffix ? (
                        <span className="text-xl font-bold">
                          <NumberFlow value={tile.primary} /> <span className="text-muted-foreground text-sm font-normal">{tile.primarySuffix}</span>
                        </span>
                      ) : (
                        <NumberFlow value={tile.primary} format={tile.primaryFormat} className="text-xl font-bold" />
                      )}
                    </div>

                    {/* Secondary */}
                    <p className="text-muted-foreground truncate text-xs">{tile.secondary}</p>
                  </Link>
                );
              })}
            </div>
          </ChartCardContent>
        </div>
      </ChartCardMenu>
    </ChartCard>
  );
}
