import ky from "ky";
import { config } from "./env";
import { connectivityService } from "@/core/sync/connectivity";
import { authService } from "@/features/auth/services/auth.service";
import { userService } from "@/features/users/services/user.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export const api = ky.create({
  prefixUrl: config.VITE_API_BASE_URL,
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  hooks: {
    beforeRequest: [
      (request) => {
        // Block all HTTP calls if we're offline
        if (!connectivityService.hasServerAccess()) {
          throw new Error("Request blocked: App is in offline mode");
        }
      },
    ],
    afterResponse: [
      async (req, opts, res) => {
        // On 401, try refresh, retry, else logout and redirect
        if (res.status === 401 && !opts.isRefreshAttempt && !req.url.endsWith("/auth/refresh") && !req.url.endsWith("/auth/login")) {
          try {
            // Tag this as a refresh attempt to break loops
            const refreshOpts = { ...opts, isRefreshAttempt: true };
            await authService.refresh();
            const userResult = await userService.getMe();
            if (userResult.isErr()) throw userResult.error;
            useAuthStore.getState().setUser(userResult.value);
            useAuthStore.getState().setAuthenticated(true);
            // Re-issue the original request with updated cookie
            return ky.retry({ request: req, options: refreshOpts });
          } catch (refreshError) {
            await authService.logout();
            if (connectivityService.hasServerAccess() && !window.location.pathname.includes("/login")) {
              window.location.href = "/login";
            }
            throw refreshError;
          }
        }
        return res;
      },
    ],
  },
});
