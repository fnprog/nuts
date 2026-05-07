import { lazy } from "react";
import type { DashboardChartModule } from "../types";

export const config: DashboardChartModule["config"] = {
  id: "health-score",
  title: "Financial Health",
  description: "Your overall financial health score with actionable breakdown.",
  defaultSize: 2,
};

export const ChartComponent = lazy(() => import("./component"));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;
