/**
 * Offline-First Authentication Service
 *
 * Handles authentication in offline mode with secure refresh token storage
 * and smart token management for sync operations.
 */

import { connectivityService } from "@/core/sync/connectivity";
import { authApi } from "@/features/auth/api";
import { userService } from "@/features/users/services/user.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { AuthNullable, RefreshAuthRes } from "@/features/auth/services/auth.types";
import { Result, ok, err, ServiceError } from "@/lib/result";
import { logger } from "@/lib/logger";
import { uuidV7 } from "@nuts/utils";

export interface CachedAuthState {
  user: AuthNullable;
  isAuthenticated: boolean;
  lastValidated: Date;
  expiresAt: Date | null;
  accessToken?: string;
  accessTokenExpiresAt?: Date;
}

export interface SecureTokenStorage {
  refreshToken: string;
  refreshTokenExpiresAt: Date | null; // null = non-expiring
  deviceId: string;
  lastUsed: Date;
}

export function createAuthservice() {
  const STORAGE_KEY = "nuts-offline-auth";
  const SECURE_TOKEN_KEY = "nuts-secure-tokens";
  const DEVICE_ID_KEY = "nuts-device-id"
  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
  const ACCESS_TOKEN_DURATION = 15 * 60 * 1000;

  /**
   * Get or create persistent device ID
   */
  const getOrCreateDeviceId = (): string => {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const newId = uuidV7();
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  };

  let deviceId = getOrCreateDeviceId();

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    try {
      logger.debug("🔐 Initializing offline auth service...");

      const cachedAuth = getCachedAuthState();

      if (cachedAuth && isCachedAuthValid(cachedAuth)) {
        useAuthStore.getState().setUser(cachedAuth.user);
        useAuthStore.getState().setAuthenticated(cachedAuth.isAuthenticated);
        logger.debug("✅ Restored auth state from cache");
      }

      // Only validate with server if we have cached auth to validate
      // Don't make unnecessary calls for unauthenticated users
      if (connectivityService.hasServerAccess() && cachedAuth && isCachedAuthValid(cachedAuth)) {
        try {
          await validateOrRefreshWithServer();
        } catch (error) {
          logger.warn("Failed to validate auth with server, using cached state:", error);
          logger.warn("🔄 Continuing with cached auth due to server validation failure");
        }
      }

      // else if (!cachedAuth || !isCachedAuthValid(cachedAuth)) {
      //   logger.debug("📱 No cached auth found, starting in unauthenticated mode");
      //   useAuthStore.getState().resetState();
      // }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceError.internal(
          "auth-init",
          error instanceof Error ? error.message : "Failed to initialize auth service",
          error
        )
      );
    }
  };

  /**
   * Login with offline fallback
   */
  const login = async (credentials: any): Promise<any> => {
    if (connectivityService.hasServerAccess()) {
      // Online: use server login
      try {
        const loginResult = await authApi.login(credentials);
        if (loginResult.isErr()) throw loginResult.error;
        const response = loginResult.value;

        // Cache successful auth state
        const userResult = await userService.getMe();
        if (userResult.isErr()) throw userResult.error;
        const user = userResult.value;

        // Extract tokens from response body (new backend functionality)
        const accessToken = response.data?.access_token;
        const refreshToken = response.data?.refresh_token;

        await cacheAuthState({
          user,
          isAuthenticated: true,
          lastValidated: new Date(),
          expiresAt: new Date(Date.now() + CACHE_DURATION),
          accessToken,
          accessTokenExpiresAt: accessToken ? new Date(Date.now() + ACCESS_TOKEN_DURATION) : undefined,
        });

        // Store refresh token securely if provided in response body
        if (refreshToken) {
          await storeSecureTokens({
            refreshToken,
            refreshTokenExpiresAt: null, // Non-expiring as requested
            deviceId: deviceId,
            lastUsed: new Date(),
          });
        }

        return response;
      } catch (error) {
        throw error;
      }
    } else {
      // Offline: check if we have cached credentials (for development/testing)
      throw new Error("Cannot login while offline - server connectivity required for authentication");
    }
  };

  /**
   * Logout with offline handling
   */
  const logout = async (): Promise<void> => {
    clearAllAuthData();

    if (connectivityService.hasServerAccess()) {
      try {
        const result = await authApi.logout();
        if (result.isErr()) throw result.error;
      } catch (error) {
        console.warn("Failed to logout from server, cleared local state:", error);
      }
    }

    useAuthStore.getState().resetState();
  };

  const upgradeToAuthenticated = async (credentials: any): Promise<any> => {
    const result = await login(credentials);

    const { dataMigrationService } = await import("@/core/sync/data-migration");

    try {
      const migrationResult = await dataMigrationService.migrateAnonymousDataToAuthenticated();
      console.log("✅ Migration completed:", migrationResult);
    } catch (error) {
      console.warn("Migration failed during upgrade, continuing with auth:", error);
    }

    useAuthStore.getState().setAnonymous(false);
    console.log("✅ Upgraded from anonymous to authenticated mode");
    return result;
  };

  /**
   * Refresh auth token with offline fallback and smart token management
   */
  const refresh = async (): Promise<void> => {
    if (connectivityService.hasServerAccess()) {
      try {
        // Try to use stored refresh token if access token expired
        const cachedAuth = getCachedAuthState();
        const secureTokens = await getSecureTokens();

        if (isAccessTokenExpired(cachedAuth) && secureTokens?.refreshToken) {
          // Use refresh token to get new access token
          const refreshResponse = await refreshUsingStoredToken(secureTokens);

          // Update cached auth state with new tokens
          const userResult = await userService.getMe();
          if (userResult.isErr()) throw userResult.error;
          const user = userResult.value;
          await cacheAuthState({
            user,
            isAuthenticated: true,
            lastValidated: new Date(),
            expiresAt: new Date(Date.now() + CACHE_DURATION),
            accessToken: refreshResponse.access_token,
            accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_DURATION),
          });
        } else {
          // Use existing auth service refresh
          const refreshResult = await authApi.refresh();
          if (refreshResult.isErr()) throw refreshResult.error;
          const refreshResponse = refreshResult.value;

          // Update cached auth state
          const userResult = await userService.getMe();
          if (userResult.isErr()) throw userResult.error;
          const user = userResult.value;
          await cacheAuthState({
            user,
            isAuthenticated: true,
            lastValidated: new Date(),
            expiresAt: new Date(Date.now() + CACHE_DURATION),
            accessToken: refreshResponse?.access_token || cachedAuth?.accessToken, // Use new token if provided, otherwise keep existing
            accessTokenExpiresAt: refreshResponse?.access_token ? new Date(Date.now() + ACCESS_TOKEN_DURATION) : cachedAuth?.accessTokenExpiresAt,
          });
        }
      } catch (error) {
        // If refresh fails, check if we have valid cached auth
        const cachedAuth = getCachedAuthState();
        if (!cachedAuth || !isCachedAuthValid(cachedAuth)) {
          // No valid cached auth, need to logout
          clearAllAuthData();
          useAuthStore.getState().resetState();
          throw error;
        }
        // Otherwise, continue with cached auth
        console.warn("Auth refresh failed, using cached auth state:", error);
      }
    } else {
      // Offline: validate cached auth state
      const cachedAuth = getCachedAuthState();
      if (!cachedAuth || !isCachedAuthValid(cachedAuth)) {
        throw new Error("No valid cached authentication available");
      }
      // Cached auth is valid, continue
    }
  };

  /**
   * Check if user is authenticated (works offline)
   */
  const isAuthenticated = (): boolean => {
    const currentAuth = useAuthStore.getState().isAuthenticated;

    if (connectivityService.hasServerAccess()) {
      return currentAuth;
    } else {
      // Offline: check cached auth
      const cachedAuth = getCachedAuthState();
      return cachedAuth ? isCachedAuthValid(cachedAuth) && cachedAuth.isAuthenticated : false;
    }
  };

  /**
   * Get current user (works offline)
   */
  const getCurrentUser = (): AuthNullable => {
    const currentUser = useAuthStore.getState().user;

    if (connectivityService.hasServerAccess()) {
      return currentUser;
    } else {
      // Offline: get from cache
      const cachedAuth = getCachedAuthState();
      return cachedAuth && isCachedAuthValid(cachedAuth) ? cachedAuth.user : null;
    }
  };

  /**
   * Check if we can perform sync operations (requires valid tokens when online)
   */
  const canSync = (): boolean => {
    // If offline, no sync possible
    if (!connectivityService.hasServerAccess()) {
      return false;
    }

    // Online: check if we have valid authentication for sync
    const cachedAuth = getCachedAuthState();
    return Boolean(cachedAuth && isCachedAuthValid(cachedAuth) && cachedAuth.isAuthenticated);
  };

  /**
   * Get access token for API calls (only when sync is allowed)
   */
  const getAccessTokenForSync = async (): Promise<string | null> => {
    if (!canSync()) {
      return null;
    }

    const cachedAuth = getCachedAuthState();

    // If access token is expired, try to refresh
    if (isAccessTokenExpired(cachedAuth)) {
      try {
        await refresh();
        const updatedAuth = getCachedAuthState();
        return updatedAuth?.accessToken || null;
      } catch (error) {
        console.warn("Failed to refresh access token for sync:", error);
        return null;
      }
    }

    return cachedAuth?.accessToken || null;
  };

  /**
   * Validate auth state with server or refresh using stored tokens
   */
  const validateOrRefreshWithServer = async (): Promise<void> => {
    try {
      const userResult = await userService.getMe();
      if (userResult.isErr()) throw userResult.error;
      const user = userResult.value;

      // Update cached auth state
      const cachedAuth = getCachedAuthState();
      await cacheAuthState({
        user,
        isAuthenticated: true,
        lastValidated: new Date(),
        expiresAt: new Date(Date.now() + CACHE_DURATION),
        accessToken: cachedAuth?.accessToken,
        accessTokenExpiresAt: cachedAuth?.accessTokenExpiresAt,
      });

      // Update store
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setAuthenticated(true);
    } catch (error) {
      // If validation fails, try refresh with stored tokens
      const secureTokens = await getSecureTokens();
      if (secureTokens?.refreshToken) {
        try {
          await refreshUsingStoredToken(secureTokens);
          return;
        } catch (refreshError) {
          console.warn("Both validation and refresh failed:", error, refreshError);
        }
      }

      // If everything fails, clear auth state
      clearAllAuthData();
      useAuthStore.getState().resetState();
      throw error;
    }
  };

  /**
   * Refresh authentication using stored refresh token
   */
  const refreshUsingStoredToken = async (tokens: SecureTokenStorage): Promise<RefreshAuthRes> => {
    try {
      // This calls the refresh endpoint which now returns tokens in response body
      const refreshResult = await authApi.refresh();
      if (refreshResult.isErr()) throw refreshResult.error;
      const refreshResponse = refreshResult.value;

      // Update last used timestamp and store new refresh token if provided
      await storeSecureTokens({
        ...tokens,
        refreshToken: refreshResponse.refresh_token || tokens.refreshToken, // Use new token if provided
        lastUsed: new Date(),
      });

      // Return the tokens (backend now includes them in response body)
      return refreshResponse;
    } catch (error) {
      // If refresh token is invalid, clear it
      await clearSecureTokens();
      throw error;
    }
  };

  /**
   * Check if access token is expired
   */
  const isAccessTokenExpired = (auth: CachedAuthState | null): boolean => {
    if (!auth?.accessTokenExpiresAt) return true;
    return new Date() >= auth.accessTokenExpiresAt;
  };

  /**
   * Cache authentication state
   */
  const cacheAuthState = async (authState: CachedAuthState): Promise<void> => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...authState,
          lastValidated: authState.lastValidated.toISOString(),
          expiresAt: authState.expiresAt?.toISOString(),
          accessTokenExpiresAt: authState.accessTokenExpiresAt?.toISOString(),
        })
      );
    } catch (error) {
      console.warn("Failed to cache auth state:", error);
    }
  };

  /**
   * Store refresh tokens securely using IndexedDB for larger storage
   */
  const storeSecureTokens = async (tokens: SecureTokenStorage): Promise<void> => {
    try {
      // For now, use localStorage with encryption-like encoding
      // In production, this should use IndexedDB with proper encryption
      const encoded = btoa(
        JSON.stringify({
          ...tokens,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt?.toISOString(),
          lastUsed: tokens.lastUsed.toISOString(),
        })
      );
      localStorage.setItem(SECURE_TOKEN_KEY, encoded);
    } catch (error) {
      console.warn("Failed to store secure tokens:", error);
    }
  };

  /**
   * Get stored secure tokens
   */
  const getSecureTokens = async (): Promise<SecureTokenStorage | null> => {
    try {
      const encoded = localStorage.getItem(SECURE_TOKEN_KEY);
      if (!encoded) return null;

      const decoded = JSON.parse(atob(encoded));
      return {
        ...decoded,
        refreshTokenExpiresAt: decoded.refreshTokenExpiresAt ? new Date(decoded.refreshTokenExpiresAt) : null,
        lastUsed: new Date(decoded.lastUsed),
      };
    } catch (error) {
      console.warn("Failed to load secure tokens:", error);
      return null;
    }
  };

  /**
   * Clear secure tokens
   */
  const clearSecureTokens = async (): Promise<void> => {
    try {
      localStorage.removeItem(SECURE_TOKEN_KEY);
    } catch (error) {
      console.warn("Failed to clear secure tokens:", error);
    }
  };

  /**
   * Get cached authentication state
   */
  const getCachedAuthState = (): CachedAuthState | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);

      return {
        ...parsed,
        lastValidated: new Date(parsed.lastValidated),
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        accessTokenExpiresAt: parsed.accessTokenExpiresAt ? new Date(parsed.accessTokenExpiresAt) : undefined,
      };
    } catch (error) {
      logger.warn("Failed to load cached auth state:", error);
      return null;
    }
  };

  /**
   * Check if cached auth state is still valid
   */
  const isCachedAuthValid = (cachedAuth: CachedAuthState): boolean => {
    if (!cachedAuth.expiresAt) return false;
    return new Date() < cachedAuth.expiresAt;
  };

  /**
   * Clear all authentication data
   */
  const clearAllAuthData = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      clearSecureTokens();
    } catch (error) {
      console.warn("Failed to clear auth data:", error);
    }
  };

  /**
   * Check if auth cache is about to expire (within 1 hour)
   */
  const isAuthCacheExpiringSoon = (): boolean => {
    const cachedAuth = getCachedAuthState();
    if (!cachedAuth || !cachedAuth.expiresAt) return false;

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    return cachedAuth.expiresAt < oneHourFromNow;
  };

  /**
   * Clear all offline auth data (for logout/reset)
   */
  const clear = (): void => {
    clearAllAuthData();
  };

  const signup = async (credentials: any): Promise<any> => {
    if (connectivityService.hasServerAccess()) {
      const result = await authApi.signup(credentials);
      if (result.isErr()) throw result.error;
      return result.value;
    }
    throw new Error("Signup requires server connection");
  };

  return {
    initialize,
    login,
    signup,
    logout,
    upgradeToAuthenticated,
    refresh,
    isAuthenticated,
    getCurrentUser,
    canSync,
    getAccessTokenForSync,
    isAuthCacheExpiringSoon,
    clear,
  };
}

export const authService = createAuthservice();
