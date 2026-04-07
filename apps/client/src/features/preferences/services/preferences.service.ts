import { connectivityService } from "@/core/sync/connectivity";
import { preferencesService as preferencesApi, type PreferencesResponse } from "./preferences";
import { Result, ok, err, ServiceError } from "@/lib/result";

interface CachedPreferences {
  data: PreferencesResponse;
  timestamp: number;
  expiresAt: number;
}

function createPreferencesService() {
  const STORAGE_KEY = "nuts-offline-preferences";
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  const getDefaultPreferences = (): PreferencesResponse => {
    return {
      locale: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      time_format: "24h",
      date_format: "yyyy-mm-dd",
      start_week_on_monday: true,
      currency: "USD",
      theme: "system",
      dark_sidebar: false,
    };
  };

  const getCachedPreferences = (): CachedPreferences | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to load cached preferences:", error);
      return null;
    }
  };

  const isCacheValid = (cached: CachedPreferences): boolean => {
    return Date.now() < cached.expiresAt;
  };

  const cachePreferences = (preferences: PreferencesResponse): void => {
    try {
      const cached: CachedPreferences = {
        data: preferences,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn("Failed to cache preferences:", error);
    }
  };

  const getPreferences = async (): Promise<PreferencesResponse> => {
    // Always try cache first (local-first approach)
    const cachedPrefs = getCachedPreferences();

    // If we have valid cache, return it immediately
    if (cachedPrefs && isCacheValid(cachedPrefs)) {
      console.log("📱 Using cached preferences");
      return cachedPrefs.data;
    }

    // If no cache or expired, check if we have server access AND are authenticated
    const { useAuthStore } = await import("@/features/auth/stores/auth.store");
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (!connectivityService.hasServerAccess() || !isAuthenticated) {
      // Offline or not authenticated: use cache or defaults
      console.log("📱 Using preferences from cache or defaults (offline/unauthenticated)");
      return cachedPrefs?.data || getDefaultPreferences();
    }

    // Online and authenticated: try to fetch from server
    try {
      const result = await preferencesApi.getPreferences();
      if (result.isErr()) {
        throw result.error;
      }

      cachePreferences(result.value);
      console.log("✅ Preferences fetched from server");
      return result.value;
    } catch (error) {
      console.warn("Failed to fetch preferences from server, using cache or defaults:", error);
      return cachedPrefs?.data || getDefaultPreferences();
    }
  };

  const updatePreferences = async (preferences: Partial<PreferencesResponse>): Promise<PreferencesResponse> => {
    // Always update local cache first (local-first approach)
    const current = await getPreferences();
    const updated = { ...current, ...preferences };
    cachePreferences(updated);

    console.log("📱 Preferences updated locally");

    // Only sync to server if authenticated and online
    const { useAuthStore } = await import("@/features/auth/stores/auth.store");
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    if (connectivityService.hasServerAccess() && isAuthenticated) {
      try {
        const result = await preferencesApi.updatePreferences(preferences);
        if (result.isErr()) {
          console.warn("Failed to sync preferences to server, will retry later:", result.error);
        } else {
          console.log("✅ Preferences synced to server");
          cachePreferences(result.value);
          return result.value;
        }
      } catch (error) {
        console.warn("Failed to sync preferences to server:", error);
      }
    }

    return updated;
  };

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    try {
      console.debug("🎨 Initializing preferences service...");
      const cached = getCachedPreferences();

      if (cached && isCacheValid(cached)) {
        console.debug("✅ Preferences cache is valid");
      } else if (connectivityService.hasServerAccess()) {
        try {
          await getPreferences();
          console.debug("✅ Preferences loaded from server");
        } catch (error) {
          console.debug("⚠️  Failed to load preferences from server, will use defaults when needed");
        }
      } else {
        console.debug("⚠️  No cached preferences and offline, using defaults");
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceError.internal(
          "preferences-init",
          error instanceof Error ? error.message : "Failed to initialize preferences service",
          error
        )
      );
    }
  };

  const clear = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear cached preferences:", error);
    }
  };

  return {
    initialize,
    getPreferences,
    updatePreferences,
    clear,
  };
}

export const preferencesService = createPreferencesService();
