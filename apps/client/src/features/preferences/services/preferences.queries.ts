import { queryOptions } from "@tanstack/react-query";
import { preferencesService } from "./preferences.service";

export const PREFERENCES_QUERY_KEY = ["preferences"] as const;

export const preferencesQueryOptions = () =>
  queryOptions({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: () => preferencesService.getPreferences(),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    // Don't retry - preferences service handles fallback to cache/defaults
    retry: false,
    // This is local-first, so it should never throw
    throwOnError: false,
  });
