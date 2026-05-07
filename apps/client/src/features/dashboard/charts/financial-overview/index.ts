import { lazy } from "react";
import type { DashboardChartModule } from "../types";

export const config: DashboardChartModule["config"] = {
  id: "financial-overview",
  title: "Financial Overview",
  description: "Quick snapshot of Money, Wealth, Growth, and Protection modules.",
  defaultSize: 3,
};

export const ChartComponent = lazy(() => import("./component"));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;
