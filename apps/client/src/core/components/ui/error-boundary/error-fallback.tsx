import { Button } from "@/core/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
        </div>

        <h2 className="text-foreground mb-2 text-2xl font-semibold">Something went wrong</h2>

        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
        </p>

        <div className="space-y-3">
          <Button onClick={resetErrorBoundary} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>

          <details className="text-left">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Show error details</summary>
            <pre className="bg-muted mt-2 max-h-32 overflow-auto rounded-md p-3 text-sm">{error.message}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
