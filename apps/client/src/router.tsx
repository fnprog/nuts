import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";

import { routeTree } from "./routeTree.gen";
import { HTTPError } from "ky";
import { DefaultError } from "./core/components/default-error";
import { DefaultPending } from "./core/components/default-pending";

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
      staleTime: 1000 * 60 * 5,
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
  defaultPreloadGcTime: 5 * 60 * 1000,
  defaultViewTransition: true,
  defaultErrorComponent: DefaultError,
  defaultPendingComponent: DefaultPending,
});

// Enable hot module replacement for development
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.dispose(() => {
    queryClient.clear();
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
