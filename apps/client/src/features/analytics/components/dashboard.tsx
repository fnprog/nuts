import { useState } from "react";
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  Wallet,
  Landmark,
  BadgeDollarSign,
  Sparkles,
  Clock,
  Filter,
  Layers,
  Zap,
  Lightbulb,
  Target,
  Gauge,
  Coins,
  Utensils,
  Car,
} from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Badge } from "@/core/components/ui/badge";
import { Separator } from "@/core/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/core/components/ui/scroll-area";

import SpendingOverviewChart from "./spending-overview-chart";
import IncomeExpenseChart from "./income-expense-chart";
import CategoryBreakdownChart from "./category-breakdown-chart";
import SavingsGoalChart from "./savings-goal-chart";
import NetWorthChart from "./net-worth-chart";
import CashflowForecastChart from "./cashflow-forecast-chart";
import BudgetComparisonChart from "./budget-comparison-chart";
import InvestmentPerformanceChart from "./investment-performance-chart";
import ExpenseHeatmapChart from "./expense-heatmap-chart";
import FinancialHealthScore from "./financial-health-score";
import InsightCard from "./insight-card";

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe] = useState("month");
  const [favoriteInsights, setFavoriteInsights] = useState<string[]>([]);

  const toggleFavorite = (insightId: string) => {
    setFavoriteInsights((prev) => (prev.includes(insightId) ? prev.filter((id) => id !== insightId) : [...prev, insightId]));
  };

  const insights = [
    {
      id: "spending-trend",
      title: "Spending Trend",
      description: "Your spending on dining out has decreased by 15% compared to last month.",
      icon: TrendingUp,
      color: "text-emerald-500",
      badge: "Positive",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    },
    {
      id: "budget-alert",
      title: "Budget Alert",
      description: "You've reached 85% of your entertainment budget with 10 days remaining.",
      icon: Zap,
      color: "text-amber-500",
      badge: "Warning",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    },
    {
      id: "savings-opportunity",
      title: "Savings Opportunity",
      description: "Based on your cash flow, you could increase your savings by $250 this month.",
      icon: Lightbulb,
      color: "text-blue-500",
      badge: "Tip",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      id: "subscription-alert",
      title: "Subscription Alert",
      description: "You have 3 unused subscriptions totaling $42.97 monthly.",
      icon: Clock,
      color: "text-red-500",
      badge: "Action Needed",
      badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
    {
      id: "investment-insight",
      title: "Investment Insight",
      description: "Your investment portfolio has grown 8.2% this quarter, outperforming the market.",
      icon: Target,
      color: "text-purple-500",
      badge: "Performance",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Income</p>
                <h3 className="mt-1 text-2xl font-bold">$8,942.00</h3>
                <p className="mt-1 flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>12.5% from last {timeframe}</span>
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-pink-50 dark:border-red-900 dark:from-red-950 dark:to-pink-950">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</p>
                <h3 className="mt-1 text-2xl font-bold">$5,687.25</h3>
                <p className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>8.2% from last {timeframe}</span>
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 dark:border-emerald-900 dark:from-emerald-950 dark:to-green-950">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Net Savings</p>
                <h3 className="mt-1 text-2xl font-bold">$3,254.75</h3>
                <p className="mt-1 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>21.3% from last {timeframe}</span>
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 dark:border-purple-900 dark:from-purple-950 dark:to-violet-950">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Net Worth</p>
                <h3 className="mt-1 text-2xl font-bold">$142,568.32</h3>
                <p className="mt-1 flex items-center text-sm text-purple-600 dark:text-purple-400">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>5.7% from last {timeframe}</span>
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <Landmark className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation tabs with visual indicators */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="relative space-y-6">
          <div className="flex items-center justify-between">
            <ScrollArea className="w-full max-w-3xl">
              <TabsList className="mb-0 h-auto bg-transparent p-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="spending"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Spending Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Income Tracking
                </TabsTrigger>
                <TabsTrigger
                  value="budget"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  Budget Performance
                </TabsTrigger>
                <TabsTrigger
                  value="forecast"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Financial Forecast
                </TabsTrigger>
                <TabsTrigger
                  value="wealth"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <BadgeDollarSign className="mr-2 h-4 w-4" />
                  Wealth Building
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Accounts</DropdownMenuItem>
                <DropdownMenuItem>Checking Accounts</DropdownMenuItem>
                <DropdownMenuItem>Savings Accounts</DropdownMenuItem>
                <DropdownMenuItem>Investment Accounts</DropdownMenuItem>
                <DropdownMenuItem>Credit Cards</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Income vs. Expenses</CardTitle>
                  <CardDescription>Compare your income and expenses over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <IncomeExpenseChart />
                  </div>
                </CardContent>
              </Card>

              {/* Financial health score */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Health</CardTitle>
                  <CardDescription>Your overall financial wellness score</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[350px] flex-col items-center justify-center pt-0">
                  <FinancialHealthScore score={78} />
                </CardContent>
              </Card>
            </div>

            {/* Insights section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Smart Insights</h3>
                <Button variant="ghost" size="sm">
                  <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                  View All Insights
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    isFavorite={favoriteInsights.includes(insight.id)}
                    onToggleFavorite={() => toggleFavorite(insight.id)}
                  />
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Where your money went this {timeframe}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <CategoryBreakdownChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Savings Goal Progress</CardTitle>
                  <CardDescription>Track progress toward your financial goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <SavingsGoalChart />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Spending Analysis Tab */}
          <TabsContent value="spending" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                  <CardDescription>Your spending patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <SpendingOverviewChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                  <CardDescription>Where most of your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Dining Out", amount: 842.56, percentage: 28, color: "bg-blue-500" },
                      { category: "Groceries", amount: 512.33, percentage: 18, color: "bg-emerald-500" },
                      { category: "Entertainment", amount: 423.12, percentage: 14, color: "bg-purple-500" },
                      { category: "Transportation", amount: 387.45, percentage: 12, color: "bg-amber-500" },
                      { category: "Shopping", amount: 356.78, percentage: 10, color: "bg-red-500" },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.category}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                        <div className="text-muted-foreground text-right text-xs">{item.percentage}% of total</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Heatmap</CardTitle>
                  <CardDescription>Visualize spending patterns by day and category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ExpenseHeatmapChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Merchant Analysis</CardTitle>
                  <CardDescription>Your top merchants by spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { merchant: "Amazon", amount: 423.67, transactions: 8, icon: "🛒" },
                      { merchant: "Whole Foods", amount: 312.45, transactions: 5, icon: "🥑" },
                      { merchant: "Netflix", amount: 219.88, transactions: 3, icon: "📺" },
                      { merchant: "Uber", amount: 187.32, transactions: 12, icon: "🚗" },
                      { merchant: "Starbucks", amount: 156.78, transactions: 18, icon: "☕" },
                    ].map((item, index) => (
                      <div key={index} className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full text-xl">{item.icon}</div>
                          <div>
                            <div className="font-medium">{item.merchant}</div>
                            <div className="text-muted-foreground text-sm">{item.transactions} transactions</div>
                          </div>
                        </div>
                        <div className="font-medium">${item.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Income Tracking Tab */}
          <TabsContent value="income" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Income Sources</CardTitle>
                  <CardDescription>Breakdown of your income streams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <CategoryBreakdownChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income Stability</CardTitle>
                  <CardDescription>Analysis of your income consistency</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative h-40 w-40">
                      <svg className="h-full w-full" viewBox="0 0 100 100">
                        <circle className="text-muted stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                        <circle
                          className="stroke-current text-blue-500"
                          strokeWidth="10"
                          strokeLinecap="round"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                          strokeDasharray="251.2"
                          strokeDashoffset="50.24"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">80%</span>
                        <span className="text-muted-foreground text-sm">Stability</span>
                      </div>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Recurring Income</span>
                        <span className="font-medium">$7,200.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Variable Income</span>
                        <span className="font-medium">$1,742.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Passive Income</span>
                        <span className="font-medium">$842.56</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Income Trends</CardTitle>
                  <CardDescription>How your income has changed over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <IncomeExpenseChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income Opportunities</CardTitle>
                  <CardDescription>Potential ways to increase your income</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Salary Negotiation",
                        description: "Based on market data, you may be able to increase your salary by 8-12%",
                        icon: <Coins className="h-5 w-5 text-blue-500" />,
                      },
                      {
                        title: "Side Hustle",
                        description: "Your skills could generate an additional $500-$1,000 monthly",
                        icon: <Layers className="h-5 w-5 text-purple-500" />,
                      },
                      {
                        title: "Passive Income",
                        description: "Consider dividend stocks or rental property for recurring income",
                        icon: <BadgeDollarSign className="h-5 w-5 text-emerald-500" />,
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex gap-4 rounded-lg border p-4">
                        <div className="mt-0.5">{item.icon}</div>
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-muted-foreground text-sm">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Budget Performance Tab */}
          <TabsContent value="budget" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Budget vs. Actual</CardTitle>
                  <CardDescription>Compare your planned budget with actual spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <BudgetComparisonChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Health</CardTitle>
                  <CardDescription>Overall budget performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="relative h-40 w-40">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle className="text-muted stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                          <circle
                            className="stroke-current text-emerald-500"
                            strokeWidth="10"
                            strokeLinecap="round"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                            strokeDasharray="251.2"
                            strokeDashoffset="75.36"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold">70%</span>
                          <span className="text-muted-foreground text-sm">On Track</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Housing</span>
                          <span>85% of budget</span>
                        </div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className="h-full bg-emerald-500" style={{ width: "85%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Food</span>
                          <span>92% of budget</span>
                        </div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className="h-full bg-amber-500" style={{ width: "92%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Entertainment</span>
                          <span>110% of budget</span>
                        </div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className="h-full bg-red-500" style={{ width: "100%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Transportation</span>
                          <span>65% of budget</span>
                        </div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className="h-full bg-emerald-500" style={{ width: "65%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Recommendations</CardTitle>
                <CardDescription>Personalized suggestions to optimize your budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      title: "Reduce Dining Out",
                      description: "Cutting dining out by 20% would save you approximately $168/month",
                      icon: <Utensils className="h-5 w-5 text-amber-500" />,
                      impact: "High Impact",
                    },
                    {
                      title: "Optimize Subscriptions",
                      description: "You have 3 overlapping streaming services costing $42.97/month",
                      icon: <Layers className="h-5 w-5 text-blue-500" />,
                      impact: "Medium Impact",
                    },
                    {
                      title: "Refinance Loan",
                      description: "Current rates could save you $215/month on your auto loan",
                      icon: <Car className="h-5 w-5 text-emerald-500" />,
                      impact: "High Impact",
                    },
                  ].map((item, index) => (
                    <Card key={index} className="border-muted">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <h4 className="font-medium">{item.title}</h4>
                          </div>
                          <p className="text-muted-foreground text-sm">{item.description}</p>
                          <Badge variant="outline" className="w-fit">
                            {item.impact}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Forecast Tab */}
          <TabsContent value="forecast" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Cash Flow Forecast</CardTitle>
                  <CardDescription>Projected income and expenses for the next 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <CashflowForecastChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Milestones</CardTitle>
                  <CardDescription>Projected timeline for your goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      {
                        title: "Emergency Fund",
                        target: "$15,000",
                        current: "$8,500",
                        date: "Sep 2025",
                        progress: 57,
                        color: "bg-emerald-500",
                      },
                      {
                        title: "Home Down Payment",
                        target: "$60,000",
                        current: "$12,800",
                        date: "Mar 2027",
                        progress: 21,
                        color: "bg-blue-500",
                      },
                      {
                        title: "Debt Free",
                        target: "$28,500",
                        current: "$18,200",
                        date: "Nov 2025",
                        progress: 64,
                        color: "bg-purple-500",
                      },
                    ].map((milestone, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-muted-foreground text-sm">
                              {milestone.current} of {milestone.target}
                            </p>
                          </div>
                          <Badge variant="outline">{milestone.date}</Badge>
                        </div>
                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                          <div className={`h-full ${milestone.color}`} style={{ width: `${milestone.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Planning</CardTitle>
                  <CardDescription>See how life changes could impact your finances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        scenario: "Job Change",
                        impact: "+$12,500 annually",
                        description: "10% salary increase with new position",
                        status: "positive",
                      },
                      {
                        scenario: "Home Purchase",
                        impact: "-$850 monthly",
                        description: "Mortgage payment for $350,000 home",
                        status: "neutral",
                      },
                      {
                        scenario: "New Child",
                        impact: "-$1,200 monthly",
                        description: "Childcare and related expenses",
                        status: "negative",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <h4 className="font-medium">{item.scenario}</h4>
                          <p className="text-muted-foreground text-sm">{item.description}</p>
                        </div>
                        <div
                          className={`font-medium ${
                            item.status === "positive"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : item.status === "negative"
                                ? "text-red-600 dark:text-red-400"
                                : ""
                          }`}
                        >
                          {item.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retirement Projection</CardTitle>
                  <CardDescription>Long-term financial outlook</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium">$1.2M</h4>
                        <p className="text-muted-foreground text-sm">Projected retirement savings</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">62</h4>
                        <p className="text-muted-foreground text-sm">Retirement age</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">$4,800</h4>
                        <p className="text-muted-foreground text-sm">Monthly income</p>
                      </div>
                    </div>

                    <div className="h-[200px]">
                      <NetWorthChart />
                    </div>

                    <div className="flex justify-center">
                      <Button variant="outline">
                        <Gauge className="mr-2 h-4 w-4" />
                        Run Retirement Calculator
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wealth Building Tab */}
          <TabsContent value="wealth" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Net Worth Growth</CardTitle>
                  <CardDescription>Track your wealth building progress over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <NetWorthChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                  <CardDescription>Distribution of your assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <CategoryBreakdownChart />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Investment Performance</CardTitle>
                  <CardDescription>How your investments are performing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <InvestmentPerformanceChart />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Opportunities</CardTitle>
                  <CardDescription>Personalized investment recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Increase 401(k) Contribution",
                        description: "You're currently contributing 6%. Increasing to 10% could add $250,000 to retirement.",
                        risk: "Low Risk",
                      },
                      {
                        title: "Diversify Portfolio",
                        description: "Your portfolio is heavily weighted in tech. Consider adding more international exposure.",
                        risk: "Medium Risk",
                      },
                      {
                        title: "Real Estate Investment",
                        description: "Based on your profile, REITs could provide income diversification.",
                        risk: "Medium Risk",
                      },
                    ].map((item, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge variant="outline">{item.risk}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
