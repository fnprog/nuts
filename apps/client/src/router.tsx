import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";
import { HTTPError } from "ky";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (error instanceof HTTPError) {
          const status = error.response.status;
          if (status === 401 || status === 403) {
            return false;
          }
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
        // Don't retry on client errors (4xx)
        if (error instanceof HTTPError) {
          const status = error.response.status;
          if (status >= 400 && status < 500) {
            return false;
          }
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
    <div className="p-8 max-w-md mx-auto bg-white dark:bg-zinc-900 shadow-xl rounded-lg text-center border border-zinc-200 dark:border-zinc-800" role="alert" aria-live="assertive">
      <svg aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" /></svg>
      <h2 className="mb-2 text-xl font-bold text-red-700 dark:text-red-300">Oops! Something went wrong</h2>
      <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">{error instanceof Error ? error.message : "Sorry, an unexpected error occurred. Please try again."}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-md px-4 py-2 font-medium shadow-sm mt-2 transition-colors"
      >
        Reload Page
      </button>
      <p className="mt-2 text-xs text-zinc-400">If the error persists, please contact support.</p>
    </div>
  ),

  defaultPendingComponent: () => (
    <div className="flex min-h-[220px] items-center justify-center bg-white dark:bg-zinc-900" role="status" aria-live="polite">
      <div className="flex flex-col items-center text-center space-y-2">
        <svg className="h-7 w-7 animate-spin text-primary mb-1 opacity-90" fill="none" viewBox="0 0 24 24" role="img" aria-label="Loading">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">Loading, one moment…</span>
        <span className="text-xs text-zinc-400">Preparing your data securely</span>
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
