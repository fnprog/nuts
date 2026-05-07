import { lazy } from "react";
import type { DashboardChartModule } from "../types";

export const config: DashboardChartModule["config"] = {
  id: "todays-briefing",
  title: "Today's Briefing",
  description: "Daily summary of items requiring your attention.",
  defaultSize: 2,
};

export const ChartComponent = lazy(() => import("./component"));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;
