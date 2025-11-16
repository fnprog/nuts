/**
 * Offline-First Auth Interceptor
 *
 * Handles authentication checks that work in offline mode by using cached auth state
 * when the server is not accessible or when in fully offline mode.
 */

import { FC } from "react";
import { Button } from "@/core/components/ui/button";
import { connectivityService } from "@/core/sync/connectivity";
import { authService } from "../services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";

interface OfflineFirstAuthInterceptorProps {
  children: React.ReactNode;
}

export const AuthInterceptor: FC<OfflineFirstAuthInterceptorProps> = ({ children }) => {
  const authStore = useAuthStore();

  const isDashboardRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard");

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${redirect}`;
  };

  // Check authentication based on offline mode
  const shouldUseOfflineFirst = !connectivityService.hasServerAccess();

  console.log(shouldUseOfflineFirst)

  console.log("authed", authService.isAuthenticated())
  console.log("anonymous", authStore.isAnonymous)



  let isAuthenticated = authService.isAuthenticated() || authStore.isAnonymous;

  // Only show auth guard for dashboard routes
  if (isDashboardRoute && !isAuthenticated) {
    if (shouldUseOfflineFirst) {
      return (
        <div className="flex h-screen flex-col items-center justify-center">
          <h2 className="mb-2 text-xl font-semibold">Offline Mode - Authentication Required</h2>
          <p className="mb-4 text-center">You need to authenticate while online first to use the app in offline mode.</p>
          <Button onClick={redirectToLogin}>Go to Login</Button>
        </div>
      );
    } else {
      return (
        <div className="flex h-screen flex-col items-center justify-center">
          <h2 className="mb-2 text-xl font-semibold">Session expired</h2>
          <p className="mb-4">Please log in again.</p>
          <Button onClick={redirectToLogin}>Go to Login</Button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
