import { api } from "@/lib/api";
import { ResultAsync } from "neverthrow";
import { ServiceError } from "@/lib/result";

const PREFERENCES_ENDPOINT = "/users/preferences";

export interface PreferencesResponse {
  locale: string;
  timezone: string;
  time_format: "12h" | "24h";
  date_format: "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
  start_week_on_monday: boolean;
  currency: string;
  theme: "light" | "dark" | "system";
  dark_sidebar: boolean;
}

const getPreferences = () => {
  return ResultAsync.fromPromise(api.get(PREFERENCES_ENDPOINT).json<PreferencesResponse>(), ServiceError.fromKyError);
};

const updatePreferences = (preferences: Partial<PreferencesResponse>) => {
  return ResultAsync.fromPromise(api.put(PREFERENCES_ENDPOINT, { json: preferences }).json<PreferencesResponse>(), ServiceError.fromKyError);
};

const PREFBASEURI = "/meta";

const _getLangs = () => {
  return ResultAsync.fromPromise(api.get(`${PREFBASEURI}/lang`).json<unknown>(), ServiceError.fromKyError);
};

export const preferencesService = {
  getPreferences,
  updatePreferences,
};
