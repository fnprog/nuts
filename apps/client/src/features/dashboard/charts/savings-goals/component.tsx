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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";

const fetchSavingsGoalsData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return [
    { name: "Emergency Fund", target: 15000, current: 8500, color: "var(--chart-1)" },
    { name: "Vacation", target: 5000, current: 3200, color: "var(--chart-2)" },
    { name: "New Car", target: 25000, current: 6800, color: "var(--chart-3)" },
    { name: "Home Down Payment", target: 60000, current: 12800, color: "var(--chart-4)" },
  ];
};

const useSavingsGoalsData = () => {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "savingsGoalsData"],
    queryFn: fetchSavingsGoalsData,
    staleTime: 1000 * 60 * 5,
  });
};

const chartConfig = {
  target: {
    label: "Target",
    color: "var(--muted)",
  },
  current: {
    label: "Current",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function SavingsGoalsChartComponent({ id, size, isLocked }: DashboardChartComponentProps) {
  const { data: chartData } = useSavingsGoalsData();

  const totalCurrent = chartData.reduce((sum, item) => sum + item.current, 0);

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <div className='flex-1'>
              <ChartCardTitle className='text-muted-foreground'>{config.title}</ChartCardTitle>
              <h2 className="text-2xl font-bold mt-1">${totalCurrent.toLocaleString()}</h2>
            </div>
          </ChartCardHeader>
          <ChartCardContent className="mt-2">
            {chartData ? (
              <Chart size={size} config={chartConfig}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" horizontal={true} vertical={false} stroke=" color-mix(in oklab, var(--muted-foreground) 50%, transparent)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="target" name="Target" fill="var(--muted)" radius={[0, 4, 4, 0]} barSize={16} animationDuration={300} />
                  <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]} barSize={16} animationDuration={300}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
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

export default SavingsGoalsChartComponent;
