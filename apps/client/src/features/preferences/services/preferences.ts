import { api } from "@/lib/axios";
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
  return ResultAsync.fromPromise(
    api.get(PREFERENCES_ENDPOINT).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const updatePreferences = (preferences: Partial<PreferencesResponse>) => {
  return ResultAsync.fromPromise(
    api.put(PREFERENCES_ENDPOINT, preferences).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};

const PREFBASEURI = "/meta";

const getLangs = () => {
  return ResultAsync.fromPromise(
    api.get(`${PREFBASEURI}/lang`).then((res) => res.data),
    ServiceError.fromAxiosError
  );
};


export const preferencesService = {
  getPreferences,
  updatePreferences,
};
