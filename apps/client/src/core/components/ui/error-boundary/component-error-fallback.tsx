import { Button } from "@/core/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ComponentErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export function ComponentErrorFallback({ error, resetErrorBoundary, componentName = "Component" }: ComponentErrorFallbackProps) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex items-center justify-center rounded-lg border p-6">
      <div className="max-w-sm text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="text-destructive h-6 w-6" />
        </div>

        <h3 className="text-foreground mb-2 font-semibold">{componentName} Error</h3>

        <p className="text-muted-foreground mb-4 text-sm">This component failed to load. Try refreshing or contact support if the issue persists.</p>

        <Button onClick={resetErrorBoundary} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-3 text-left">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">Error details</summary>
            <pre className="bg-muted mt-1 max-h-24 overflow-auto rounded p-2 text-xs">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
