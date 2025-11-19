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
import { Cell, Pie, PieChart, Legend } from "recharts";

const DUMMY_DATA = [
  { name: "Housing", value: 1800, color: "var(--chart-1)" },
  { name: "Food", value: 850, color: "var(--chart-2)" },
  { name: "Transportation", value: 450, color: "var(--chart-3)" },
  { name: "Entertainment", value: 380, color: "var(--chart-4)" },
  { name: "Shopping", value: 520, color: "var(--chart-5)" },
  { name: "Other", value: 210, color: "var(--chart-6)" },
];

const fetchCategoryData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return DUMMY_DATA;
};

const useCategoryData = (enabled: boolean) => {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "categoryData"],
    queryFn: fetchCategoryData,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

const chartConfig = {
  value: {
    label: "Amount",
  },
} satisfies ChartConfig;

function CategoryBreakdownChartComponent({ id, size, isLocked, hasAccounts }: DashboardChartComponentProps) {
  const chartData = hasAccounts ? useCategoryData(true).data : DUMMY_DATA;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

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
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "14px", paddingTop: "8px" }} />
                </PieChart>
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

export default CategoryBreakdownChartComponent;
