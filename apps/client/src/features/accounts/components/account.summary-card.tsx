import { Card, CardHeader } from "@/core/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { ChartContainer } from "@/core/components/ui/chart";
import { AccountWTrend } from "../services/account.types";
import { PieChart, Pie, Cell } from "recharts";
import { useFormatting } from "@/lib/formatting";
import { useTranslation } from "react-i18next";
import { usePreferencesStore } from "@/features/preferences/stores/preferences.store";
import { currencyConverter } from "@/lib/currency";
import { useState, useEffect } from "react";

interface SummaryCardProps {
  accounts: AccountWTrend[];
}
interface ChartConfigItem {
  label: string;
  color: string;
}

type ChartConfig = Record<string, ChartConfigItem>;


interface CategoryBreakdown {
  name: string;
  total: number;
  accounts: AccountWTrend[];
  color: string;
}

interface SummaryData {
  assets: CategoryBreakdown[];
  liabilities: CategoryBreakdown[];
  totalAssets: number;
  totalLiabilities: number;
}

// Define which account types are assets vs liabilities with colors
const ASSET_TYPES = [
  { type: "investment", name: "Investments", color: "#8B5CF6" },
  { type: "savings", name: "Real Estate", color: "#A855F7" }, // Using savings as Real Estate for demo
  { type: "cash", name: "Cash", color: "#22C55E" },
  { type: "checking", name: "Vehicles", color: "#F97316" },
] as const;

const LIABILITY_TYPES = [
  { type: "credit", name: "Loans", color: "#EAB308" },
  { type: "credit", name: "Credit Cards", color: "#EF4444" },
] as const;

export const SummaryCard = ({ accounts }: SummaryCardProps) => {
  const { formatCurrency } = useFormatting();
  const { t } = useTranslation();
  const appCurrency = usePreferencesStore((state) => state.currency);
  const [convertedBalances, setConvertedBalances] = useState<Map<string, number>>(new Map());
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const convertAccountBalances = async () => {
      const uniqueCurrencies = new Set(accounts.map(a => a.currency));

      if (uniqueCurrencies.size === 1 && uniqueCurrencies.has(appCurrency)) {
        return;
      }

      setIsConverting(true);
      const newConversions = new Map<string, number>();

      for (const account of accounts) {
        if (account.currency === appCurrency) {
          newConversions.set(account.id, account.balance);
        } else {
          const result = await currencyConverter.convert(
            account.balance,
            account.currency,
            appCurrency
          );

          if (result) {
            newConversions.set(account.id, result.convertedAmount);
          } else {
            newConversions.set(account.id, account.balance);
          }
        }
      }

      setConvertedBalances(newConversions);
      setIsConverting(false);
    };

    convertAccountBalances();
  }, [accounts, appCurrency]);

  const calculateSummaryData = (): SummaryData => {
    const assets: CategoryBreakdown[] = [];
    const liabilities: CategoryBreakdown[] = [];

    const accountGroups = accounts.reduce(
      (groups, account) => {
        if (!groups[account.type]) {
          groups[account.type] = [];
        }
        groups[account.type].push(account);
        return groups;
      },
      {} as Record<string, AccountWTrend[]>
    );

    ASSET_TYPES.forEach(({ type, name, color }) => {
      const typeAccounts = accountGroups[type] || [];
      if (typeAccounts.length > 0) {
        const total = typeAccounts.reduce((sum, account) => {
          const balance = convertedBalances.get(account.id) ?? account.balance;
          return sum + balance;
        }, 0);
        assets.push({
          name,
          total,
          accounts: typeAccounts,
          color,
        });
      }
    });

    LIABILITY_TYPES.forEach(({ type, name, color }) => {
      const typeAccounts = accountGroups[type] || [];
      if (typeAccounts.length > 0) {
        const total = Math.abs(
          typeAccounts.reduce((sum, account) => {
            const balance = convertedBalances.get(account.id) ?? account.balance;
            return sum + balance;
          }, 0)
        );
        liabilities.push({
          name,
          total,
          accounts: typeAccounts,
          color,
        });
      }
    });

    const totalAssets = assets.reduce((sum, category) => sum + category.total, 0);
    const totalLiabilities = liabilities.reduce((sum, category) => sum + category.total, 0);

    return {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
    };
  };

  const formatPercentage = (amount: number, total: number): string => {
    if (total === 0) return "0.0%";
    return ((amount / total) * 100).toFixed(1) + "%";
  };

  const summaryData = calculateSummaryData();
  const grandTotal = summaryData.totalAssets + summaryData.totalLiabilities;

  // Prepare data for pie chart
  const chartData = [
    ...summaryData.assets.map((asset) => ({
      name: asset.name,
      value: asset.total,
      color: asset.color,
    })),
    ...summaryData.liabilities.map((liability) => ({
      name: liability.name,
      value: liability.total,
      color: liability.color,
    })),
  ];

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name] = {
      label: item.name,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader className="pb-4">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">{t('analytics.overview')}</TabsTrigger>
            <TabsTrigger value="percent">{t('analytics.percent')}</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <div className="space-y-6">
              {/* Assets Section */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t("analytics.assets")}</h3>
                  <span className="font-mono text-lg font-semibold">{formatCurrency(summaryData.totalAssets, appCurrency)}</span>
                </div>

                {/* Assets Progress Bar */}
                <div className="bg-muted mb-4 flex h-3 overflow-hidden rounded-full">
                  {summaryData.assets.map((asset) => {
                    const percentage = (asset.total / summaryData.totalAssets) * 100;
                    return (
                      <div
                        key={asset.name}
                        className="h-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: asset.color,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Asset Categories */}
                <div className="space-y-3">
                  {summaryData.assets.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="font-mono text-sm font-medium">{formatCurrency(category.total, appCurrency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liabilities Section */}
              {summaryData.liabilities.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("analytics.liabilities")}</h3>
                    <span className="font-mono text-lg font-semibold">{formatCurrency(summaryData.totalLiabilities, appCurrency)}</span>
                  </div>

                  {/* Liabilities Progress Bar */}
                  <div className="bg-muted mb-4 h-3 overflow-hidden rounded-full">
                    <div
                      className="h-full"
                      style={{
                        width: "100%",
                        backgroundColor: "#EAB308",
                      }}
                    />
                  </div>

                  {/* Liability Categories */}
                  <div className="space-y-3">
                    {summaryData.liabilities.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="font-mono text-sm font-medium">{formatCurrency(category.total, appCurrency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="percent" className="mt-6">
            <div className="flex flex-col items-center space-y-4">
              {/* Pie Chart */}
              <div className="h-32 w-32">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              {/* Percentage Breakdown */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">{t("analytics.assets").toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold">{formatCurrency(summaryData.totalAssets, appCurrency)}</div>
                    <div className="text-muted-foreground text-sm">{formatPercentage(summaryData.totalAssets, grandTotal)}</div>
                  </div>
                </div>

                {summaryData.liabilities.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">{t("analytics.liabilities").toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold">{formatCurrency(summaryData.totalLiabilities, appCurrency)}</div>
                      <div className="text-muted-foreground text-sm">{formatPercentage(summaryData.totalLiabilities, grandTotal)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
};
