import { useEffect } from "react";
import { usePreferencesStore } from "@/features/preferences/stores/preferences.store";
import { useQuery } from "@tanstack/react-query";
import { preferencesQueryOptions } from "../services/preferences.queries";
import { logger } from "@/lib/logger";

export function PreferencesProvider({ children }: React.PropsWithChildren) {
  const setLoading = usePreferencesStore((state) => state.setLoading);
  const setError = usePreferencesStore((state) => state.setError as (error: string | null) => void);
  const setPreferences = usePreferencesStore((state) => state.setPreferences);

  const { data, error, isLoading, isSuccess } = useQuery(preferencesQueryOptions());

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load preferences";
      setError(errorMessage);
      logger.error(error, {
        component: "PreferencesProvider",
        action: "loadPreferences",
      });
    } else {
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    if (isSuccess && data) {
      setPreferences(data);
    }
  }, [isSuccess, data, setPreferences]);

  return <>{children}</>;
}
