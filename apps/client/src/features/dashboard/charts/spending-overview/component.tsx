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
  { month: "Jan", groceries: 420, dining: 380, entertainment: 220, shopping: 350 },
  { month: "Feb", groceries: 460, dining: 420, entertainment: 280, shopping: 290 },
  { month: "Mar", groceries: 480, dining: 450, entertainment: 320, shopping: 380 },
  { month: "Apr", groceries: 520, dining: 480, entertainment: 300, shopping: 420 },
  { month: "May", groceries: 490, dining: 520, entertainment: 350, shopping: 390 },
  { month: "Jun", groceries: 550, dining: 540, entertainment: 380, shopping: 430 },
];

const fetchSpendingData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return DUMMY_DATA;
};

const useSpendingData = (enabled: boolean) => {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "spendingData"],
    queryFn: fetchSpendingData,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

const chartConfig = {
  groceries: {
    label: "Groceries",
    color: "var(--chart-1)",
  },
  dining: {
    label: "Dining",
    color: "var(--chart-2)",
  },
  entertainment: {
    label: "Entertainment",
    color: "var(--chart-3)",
  },
  shopping: {
    label: "Shopping",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

function SpendingOverviewChartComponent({ id, size, isLocked, hasAccounts }: DashboardChartComponentProps) {
  const chartData = hasAccounts ? useSpendingData(true).data : DUMMY_DATA;

  const latestMonth = chartData[chartData.length - 1];
  const total = latestMonth ? Object.values(latestMonth).reduce((sum, val) => typeof val === "number" ? sum + val : sum, 0) : 0;

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <div className='flex-1'>
              <ChartCardTitle className='text-muted-foreground'>{config.title}</ChartCardTitle>
              <h2 className="text-2xl font-bold mt-1">${total.toLocaleString()}</h2>
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
                  <Bar dataKey="groceries" name="Groceries" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} stackId="a" />
                  <Bar dataKey="dining" name="Dining" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} stackId="a" />
                  <Bar dataKey="entertainment" name="Entertainment" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} stackId="a" />
                  <Bar dataKey="shopping" name="Shopping" fill="var(--chart-4)" radius={[4, 4, 0, 0]} barSize={16} animationDuration={300} stackId="a" />
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

export default SpendingOverviewChartComponent;
