import { cn } from "@/lib/utils";
import { ChartSize } from ".";

export const ChartLoadingSkeleton = ({ size }: { size: ChartSize }) => {
  const heightClasses = { 1: "min-h-[260px]", 2: "min-h-[260px]", 3: "min-h-[300px]" };
  const sizeClasses = { 1: "col-span-1", 2: "col-span-1 md:col-span-2", 3: "col-span-1 md:col-span-2 lg:col-span-3" };
  return <div className={cn("bg-muted animate-pulse rounded-lg", heightClasses[size] || "min-h-[260px]", sizeClasses[size] || "col-span-1")} />;
};

export const ChartErrorFallback = ({ chartId, error }: { chartId: string; error?: Error }) => (
  <div className="border-destructive bg-destructive/10 text-destructive-foreground col-span-1 rounded border p-4">
    <p className="font-semibold">Error loading chart: {chartId}</p>
    {error && <p className="mt-1 text-xs">{error.message}</p>}
    <p className="mt-1 text-xs">Please try removing/re-adding it.</p>
  </div>
);
