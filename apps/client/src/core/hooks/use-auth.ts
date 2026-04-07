/**
 * Offline-First Authentication Hooks
 *
 * Provides React Query hooks that work offline-first by using cached auth
 * when in fully offline mode or when server is not accessible.
 */

import { useQuery, UseQueryOptions, useSuspenseQuery, UseSuspenseQueryOptions } from "@tanstack/react-query";
import { connectivityService } from "@/core/sync/connectivity";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";

/**
 * Offline-first authenticated query hook
 * Uses cached auth data when in fully offline mode or when server is unreachable
 */

export function useAuthenticatedQuery<T = unknown, E = unknown>(options: UseQueryOptions<T, E>) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const shouldUseOfflineFirst = !connectivityService.hasServerAccess();

  return useQuery({
    ...options,
    enabled: shouldUseOfflineFirst ? false : isAuthenticated && options.enabled !== false,
    queryFn: shouldUseOfflineFirst
      ? () => {
          console.warn(`Query '${JSON.stringify(options.queryKey)}' disabled in fully offline mode`);
          return Promise.reject(new Error("Query disabled in fully offline mode"));
        }
      : options.queryFn,
  });
}

/**
 * Offline-first authenticated suspense query hook
 */
export function useAuthenticatedSuspenseQuery<T = unknown, E = unknown>(options: UseSuspenseQueryOptions<T, E>) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const shouldUseOfflineFirst = !connectivityService.hasServerAccess();

  const result = useSuspenseQuery({
    ...options,
    queryFn: options.queryFn
      ? async (...args) => {
          if (shouldUseOfflineFirst) {
            throw new Error("Suspense queries not available in fully offline mode");
          }
          if (!isAuthenticated) {
            throw new Error("Not authenticated");
          }
          return options.queryFn!(...args);
        }
      : undefined,
  });

  return result;
}

/**
 * Hook to check if user is authenticated (works offline)
 */
export function useAuth() {
  const authStore = useAuthStore();
  const shouldUseOfflineFirst = !connectivityService.hasServerAccess();

  if (shouldUseOfflineFirst) {
    // Use offline auth service for validation
    return {
      isAuthenticated: authService.isAuthenticated(),
      user: authService.getCurrentUser(),
      isOfflineMode: true,
    };
  }

  // Online mode: use normal auth store
  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    isOfflineMode: false,
  };
}

/**
 * Create query options that are offline-first aware
 */
export function createQueryOptions<T = unknown, E = unknown>(options: UseQueryOptions<T, E>): UseQueryOptions<T, E> {
  return {
    ...options,
    enabled: false, // Will be overridden by useOfflineFirstAuthenticatedQuery
  };
}
