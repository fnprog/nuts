import { Suspense, useMemo } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useDashboardStore } from "@/features/dashboard/stores/dashboard.store";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { useTranslation } from "react-i18next";

import { AddChartDialog } from "@/features/dashboard/components/add-chart";
import { DashboardGrid } from "@/features/dashboard/components/dashboard-grid";
import { DashboardChartModuleConfig } from "@/features/dashboard/charts/types";
import { ChartErrorFallback, ChartLoadingSkeleton } from "@/features/dashboard/components/chart-card/chart-card.loading";
import { useLazyChartComponents } from "@/features/dashboard/hooks/useLazyChart";
import { SidebarTrigger } from "@/core/components/ui/sidebar";
import { Button } from "@/core/components/ui/button";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import { EmptyStateGuide } from "@/core/components/ui/emtpy-state-guide";
import { ErrorBoundary } from "@/core/components/ui/error-boundary";
import { H2, Small, Muted } from "@/core/components/ui/typography";


export const Route = createFileRoute("/dashboard/home")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { hasAccounts } = useRouteContext({ from: "/dashboard" });

  const chartLayout = useDashboardStore((state) => state.chartLayout);
  const chartOrder = useDashboardStore((state) => state.chartOrder);
  const addChart = useDashboardStore((state) => state.addChart);
  const name = useOnboardingStore((state) => state.name);

  // State to hold the map of loaded lazy components
  const { lazyChartComponents, loadingErrors } = useLazyChartComponents(chartOrder);

  // Memoize the layout map
  const layoutMap = useMemo(() => new Map(chartLayout.map((item) => [item.id, item])), [chartLayout]);

  const handleAddChart = (config: DashboardChartModuleConfig) => {
    addChart(config.id);
  };

  return (
    <>
      {!hasAccounts && (
        <EmptyStateGuide
          Icon={LayoutDashboard}
          title="Welcome to your Dashboard"
          description="Connect your first financial account to track your net worth, spending, and investments all in one place."
          ctaText="Add your first account"
        />
      )}

      <div className={`h-full w-full ${!hasAccounts ? "pointer-events-none blur-sm" : ""}`}>
        <div className="border-b-bg-nuts-500/20 -mx-4 flex items-center gap-2 border-b px-3 py-1 md:hidden">
          <SidebarTrigger />
          <Small className="font-semibold tracking-tight">Dashboard</Small>
        </div>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
          <div className="flex w-full items-center justify-between gap-2">
            <H2>{t("greet")} {name}</H2>
            <AddChartDialog onAddChart={handleAddChart}>
              <Button variant="default" size="sm" className="hidden md:inline-flex">
                <PlusCircle className="mr-2 size-4" />
                Add Chart
              </Button>
            </AddChartDialog>
          </div>
        </header>
        <div className="flex flex-1 h-full">
          <div className="h-full w-full ">
            {chartOrder.length === 0 ? (
              <div className="col-span-2 text-center py-12 flex flex-col justify-center items-center text-muted-foreground">
                <img src="/nuts_empty.png" className="md:w-60 w-50 grayscale" />
                <Muted>Your dashboard is empty. Add some charts using the button above!</Muted>
              </div>
            ) : (
              <DashboardGrid>
                {chartOrder.map((chartId) => {
                  const layout = layoutMap.get(chartId);
                  const ChartToRender = lazyChartComponents.get(chartId);
                  const loadingError = loadingErrors.get(chartId);

                  if (!layout) return <ChartErrorFallback key={chartId} chartId={chartId} error={new Error("Layout missing")} />;
                  if (loadingError) return <ChartErrorFallback key={chartId} chartId={chartId} error={loadingError} />;

                  // If the component isn't loaded yet (but no error), show skeleton
                  // The Suspense fallback will handle the component's internal loading
                  if (!ChartToRender) return <ChartLoadingSkeleton key={chartId} size={layout.size} />;

                  return (
                    <ErrorBoundary
                      key={chartId}
                      fallback={(props) => <ChartErrorFallback chartId={chartId} error={props.error} />}
                    >
                      <Suspense fallback={<ChartLoadingSkeleton size={layout.size} />}>
                        <ChartToRender
                          id={layout.id}
                          size={layout.size}
                          isLocked={layout.isLocked}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  );

                })}
              </DashboardGrid>
            )}
          </div >
        </div >

        <div className="fixed right-6 bottom-6 z-50 sm:hidden">
          <AddChartDialog onAddChart={handleAddChart}>
            <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full shadow-lg">
              <PlusCircle className="size-6" />
            </Button>
          </AddChartDialog>
        </div>
      </div >
    </>
  );
}
