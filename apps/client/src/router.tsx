import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const Axerror = error as AxiosError;

        if (Axerror?.response?.status === 401 || Axerror?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const Axerror = error as AxiosError;
        // Don't retry on client errors (4xx)
        if (Axerror?.response?.status && Axerror.response.status >= 400 && Axerror.response.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: "offlineFirst",
    },
  },
});

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultPreloadGcTime: 5 * 60 * 1000, // 5 minutes
  defaultViewTransition: true,

  defaultErrorComponent: ({ error }) => (
    <div className="p-4 text-center" role="alert">
      <h2 className="text-destructive mb-2 text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mb-4 text-sm">{error instanceof Error ? error.message : "An unexpected error occurred"}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 transition-colors"
      >
        Reload page
      </button>
    </div>
  ),

  defaultPendingComponent: () => (
    <div className="flex min-h-[200px] items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="border-primary mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground mt-2 text-sm">Loading...</p>
      </div>
    </div>
  ),
});

// Enable hot module replacement for development
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up router on hot reload
    queryClient.clear();
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
