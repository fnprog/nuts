import ky, { KyInstance } from 'ky';
import { config } from './env';
import { connectivityService } from '@/core/sync/connectivity';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userService } from '@/features/users/services/user.service';

// Tracks refresh state and allows queueing requests while refreshing
type QueuedRequest = (token: string) => void;
let isRefreshing = false;
let refreshSubscribers: QueuedRequest[] = [];

function subscribeTokenRefresh(cb: QueuedRequest) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

const IGNORE_AUTH_PATHS = ['/auth/login', '/auth/refresh'];

function isAuthRoute(url: string) {
  return IGNORE_AUTH_PATHS.some((path) => url.includes(path));
}

const api: KyInstance = ky.create({
  prefixUrl: config.VITE_API_BASE_URL,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        // Block network requests if offline
        if (!connectivityService.hasServerAccess()) {
          throw new Error('Request blocked: App is in offline mode');
        }
      },
    ],
    afterResponse: [
      async (request, _, response) => {
        if (
          response.status === 401 &&
          !isAuthRoute(request.url) &&
          !(request as any)._retry
        ) {
          // Only allow one refresh at a time
          if (isRefreshing) {
            return new Promise<Response>((resolve) => {
              subscribeTokenRefresh(() => {
                // Retry original request
                resolve(api(new Request(request, { headers: request.headers })));
              });
            });
          }
          (request as any)._retry = true;
          isRefreshing = true;
          try {
            await authService.refresh();
            const userResult = await userService.getMe();
            if (userResult.isErr()) throw userResult.error;
            const user = userResult.value;
            useAuthStore.getState().setUser(user);
            useAuthStore.getState().setAuthenticated(true);
            onRefreshed('refreshed'); // For queued requests (cookie handled server-side)
            isRefreshing = false;
            // Retry original request
            return api(new Request(request, { headers: request.headers }));
          } catch (error) {
            isRefreshing = false;
            await authService.logout();
            if (connectivityService.hasServerAccess() && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            throw error;
          }
        }
        return response;
      }
    ]
  }
});

export { api };
