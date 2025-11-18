import { lazy } from "react";
import type { DashboardChartModule } from "../types";

export const config: DashboardChartModule["config"] = {
  id: "cashflow-forecast",
  title: "Cashflow Forecast",
  description: "Project future income, expenses, and savings.",
  defaultSize: 3,
};

export const ChartComponent = lazy(() => import("./component"));

const moduleDefinition: DashboardChartModule = {
  config,
  ChartComponent,
};

export default moduleDefinition;
