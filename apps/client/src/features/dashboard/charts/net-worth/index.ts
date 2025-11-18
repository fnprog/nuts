import { lazy } from "react";
import type { DashboardChartModule } from "../types";

export const config: DashboardChartModule["config"] = {
  id: "net-worth",
  title: "Net Worth Trend",
  description: "Track your net worth over time with assets and liabilities.",
  defaultSize: 3,
};

export const ChartComponent = lazy(() => import("./component"));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;
