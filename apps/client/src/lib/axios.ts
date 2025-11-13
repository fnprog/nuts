import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { config } from "./env";
import { userService } from "@/features/preferences/services/user.service";
import { connectivityService } from "@/core/sync/connectivity";
import { authService } from "@/features/auth/services/auth.service";

export const api = axios.create({
  baseURL: config.VITE_API_BASE_URL,
  withCredentials: true,
});

api.defaults.headers.common["Content-Type"] = "application/json";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || "";

    // If we're in fully offline mode, reject all network requests immediately
    if (!connectivityService.hasServerAccess()) {
      return Promise.reject(new Error("Request blocked: App is in offline mode"));
    }

    // Only attempt refresh if conditions are met
    if (error.response?.status === 401 && !originalRequest._retry && !requestUrl.includes("/auth/refresh") && !requestUrl.includes("/auth/login")) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(axios(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await authService.refresh();
        const userResult = await userService.getMe();
        if (userResult.isErr()) throw userResult.error;
        const user = userResult.value;

        // Update store
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setAuthenticated(true);

        onRefreshed("refreshed"); // Token is handled by httpOnly cookie
        isRefreshing = false;

        return axios(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;

        await authService.logout();

        // Only redirect if we have connectivity and we're not already on login page
        if (connectivityService.hasServerAccess() && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
