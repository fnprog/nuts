import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { router, queryClient } from "./router";
import { Initializer } from "@/core/components/ui/Initializer";
import { ConflictResolutionIndicator } from "@/core/components/dev/ConflictResolutionUI";
import { crdtService } from "@/core/sync/crdt";
import { usePluginStore } from "@/features/plugins/store";
import { FeatureFlagsDeveloperPanel } from "./core/components/dev/FeatureFlagsDeveloperPanel";
import { HotkeysProvider } from "react-hotkeys-hook";

if (import.meta.env.DEV) {
  window.__CRDT_SERVICE__ = crdtService;
  window.__PLUGIN_STORE__ = usePluginStore;
}

function RouterWrapper() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAnonymous = useAuthStore((state) => state.isAnonymous);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isAuthenticated,
          isAnonymous,
        },
        queryClient,
      }}
    />
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HotkeysProvider initiallyActiveScopes={["*"]}>
        <Initializer>
          <RouterWrapper />
          <ConflictResolutionIndicator />
          <FeatureFlagsDeveloperPanel />
        </Initializer>
      </HotkeysProvider>
    </QueryClientProvider>
  );
}
