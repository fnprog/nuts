import { Button } from "@/core/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface RouteErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function RouteErrorFallback({ error, resetErrorBoundary }: RouteErrorFallbackProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate({ to: "/dashboard/home" });
    resetErrorBoundary();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <AlertTriangle className="text-destructive h-12 w-12" />
          </div>
        </div>

        <h1 className="text-foreground mb-4 text-3xl font-bold">Page Error</h1>

        <p className="text-muted-foreground mb-8 text-lg">
          This page encountered an error and couldn't be loaded. You can try refreshing the page or returning to the dashboard.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button onClick={resetErrorBoundary} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>

          <Button onClick={handleGoHome}>
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        <details className="mt-8 text-left">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Show technical details</summary>
          <div className="bg-muted mt-3 rounded-md p-4 text-sm">
            <div className="text-destructive mb-2 font-mono">
              {error.name}: {error.message}
            </div>
            {error.stack && <pre className="text-muted-foreground max-h-48 overflow-auto text-xs">{error.stack}</pre>}
          </div>
        </details>
      </div>
    </div>
  );
}
