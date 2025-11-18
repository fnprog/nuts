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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

const fetchNetWorthData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const data = [
    { month: "Jan", assets: 120000, liabilities: 85000 },
    { month: "Feb", assets: 122500, liabilities: 84200 },
    { month: "Mar", assets: 125000, liabilities: 83500 },
    { month: "Apr", assets: 128000, liabilities: 82800 },
    { month: "May", assets: 132000, liabilities: 82000 },
    { month: "Jun", assets: 135000, liabilities: 81200 },
  ];

  return data.map((item) => ({
    ...item,
    netWorth: item.assets - item.liabilities,
  }));
};

const useNetWorthData = () => {
  return useSuspenseQuery({
    queryKey: ["dashboardChart", "netWorthData"],
    queryFn: fetchNetWorthData,
    staleTime: 1000 * 60 * 5,
  });
};

const chartConfig = {
  assets: {
    label: "Assets",
    color: "var(--chart-1)",
  },
  liabilities: {
    label: "Liabilities",
    color: "var(--chart-2)",
  },
  netWorth: {
    label: "Net Worth",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function NetWorthChartComponent({ id, size, isLocked }: DashboardChartComponentProps) {
  const { data: chartData } = useNetWorthData();

  const latestNetWorth = chartData[chartData.length - 1]?.netWorth || 0;

  return (
    <ChartCard id={id} size={size} isLocked={isLocked}>
      <ChartCardMenu>
        <div>
          <ChartCardHeader>
            <div className='flex-1'>
              <ChartCardTitle className='text-muted-foreground'>{config.title}</ChartCardTitle>
              <h2 className="text-2xl font-bold mt-1">${latestNetWorth.toLocaleString()}</h2>
            </div>
          </ChartCardHeader>
          <ChartCardContent className="mt-2">
            {chartData ? (
              <Chart size={size} config={chartConfig}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke=" color-mix(in oklab, var(--muted-foreground) 50%, transparent)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                    content={<ChartTooltipContent />}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "14px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} strokeWidth={2} animationDuration={300} />
                </AreaChart>
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

export default NetWorthChartComponent;
