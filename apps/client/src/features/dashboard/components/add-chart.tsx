import { useState, useEffect } from "react";
import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/core/components/ui/dialog";
import { getAvailableChartConfigs } from "@/features/dashboard/charts/loader";
import type { DashboardChartModuleConfig } from "@/features/dashboard/charts/types";

interface AddChartDialogProps {
  children: React.ReactNode;
  onClose?: () => void;
  onAddChart: (config: DashboardChartModuleConfig) => void;
}

export function AddChartDialog({ onAddChart, children }: AddChartDialogProps) {
  const [availableCharts, setAvailableCharts] = useState<DashboardChartModuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load configs when the dialog is about to open or is open
    if (isOpen) {
      setIsLoading(true);
      getAvailableChartConfigs()
        .then((configs) => {
          setAvailableCharts(configs);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load available chart configs:", err);
          setIsLoading(false);
          // Handle error state in UI if needed
        });
    }
  }, [isOpen]); // Re-fetch if dialog re-opens (might be overkill if configs rarely change)

  const handleSelectChart = (config: DashboardChartModuleConfig) => {
    onAddChart(config);
    setIsOpen(false); // Close dialog after adding
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="grid grid-rows-[auto_1fr_auto] overflow-hidden sm:min-h-[80vh] md:max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Add Chart to Dashboard</DialogTitle>
          <DialogDescription>Select a chart widget to add to your current view.</DialogDescription>
        </DialogHeader>
        <div className="h-full min-h-0 py-4">
          {isLoading ? (
            <div className="p-4 text-center">Loading available charts...</div>
          ) : availableCharts.length > 0 ? (
            <div className="h-full min-h-0 overflow-y-auto">
              <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-2">
                {availableCharts.map((config) => (
                  <Button
                    key={config.id}
                    variant="ghost"
                    className="border-border hover:border-primary/50 h-auto w-full rounded-lg border p-5 transition-colors"
                    onClick={() => handleSelectChart(config)}
                  >
                    <div className="flex w-full flex-col items-start gap-4">
                      <div className="bg-muted flex h-36 w-full items-center justify-center rounded-md">
                        <div className="text-muted-foreground text-sm">Chart Preview</div>
                      </div>
                      <div className="w-full text-left">
                        <div className="mb-2 text-base font-medium">{config.title}</div>
                        {config.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed wrap-break-word whitespace-normal">{config.description}</p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground p-4 text-center">No charts available to add.</div>
          )}
        </div>
        {/* Optional Footer with Close button */}
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
