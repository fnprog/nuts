import { useSuspenseQuery } from "@tanstack/react-query";

import type { DashboardChartComponentProps } from "../types";
import { config } from "./index";

import {
  ChartCard,
  ChartCardHeader,
  ChartCardTitle,
  ChartCardContent,
  ChartCardMenu
} from '@/features/dashboard/components/chart-card';

import { Chart } from "@/features/dashboard/components/chart-card/chart-renderer";
import { ChartConfig, ChartTooltip, ChartTooltipContent } from "@/core/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

const DUMMY_DATA = [
  { month: "Jan", income: 8500, expenses: 6200, savings: 2300 },
  { month: "Feb", income: 8500, expenses: 6300, savings: 2200 },
  { month: "Mar", income: 8500, expenses: 6100, savings: 2400 },
  { month: "Apr", income: 8500, expenses: 6400, savings: 2100 },
  { month: "May", income: 8500, expenses: 6200, savings: 2300 },
  { month: "Jun", income: 8500, expenses: 6300, savings: 2200 },
];

const fetchCashflowData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return DUMMY_DATA;
};

const useCashflowData = (enabled: boolean) => {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "cashflowData"],
    queryFn: fetchCashflowData,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
  savings: {
    label: "Savings",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function CashflowForecastChartComponent({ id, size, isLocked, hasAccounts }: DashboardChartComponentProps) {
  const chartData = hasAccounts ? useCashflowData(true).data : DUMMY_DATA;

  const totalSavings = chartData.reduce((sum, item) => sum + item.savings, 0);

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <div className='flex-1'>
              <ChartCardTitle className='text-muted-foreground'>{config.title}</ChartCardTitle>
              <h2 className="text-2xl font-bold mt-1">${totalSavings.toLocaleString()}</h2>
            </div>
          </ChartCardHeader>
          <ChartCardContent className="mt-2">
            {chartData ? (
              <Chart size={size} config={chartConfig}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke=" color-mix(in oklab, var(--muted-foreground) 50%, transparent)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "14px", paddingTop: "8px" }} />
                  <Bar dataKey="income" name="Income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} />
                  <Bar dataKey="expenses" name="Expenses" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} />
                  <Bar dataKey="savings" name="Savings" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} />
                </BarChart>
              </Chart>
            ) : (
              <div>Loading chart data...</div>
            )}
          </ChartCardContent>
        </div>
      </ChartCardMenu>
    </ChartCard>
  );
}

export default CashflowForecastChartComponent;
