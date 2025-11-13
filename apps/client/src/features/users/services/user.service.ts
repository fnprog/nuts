import * as userApi from "../api/user";
import { connectivityService } from "@/core/sync/connectivity";
import { ResultAsync } from "neverthrow";
import type { ServiceError } from "@/lib/result";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export type { UserInfo, LinkedAccount } from "../api/user";
export type { UserInfo as UserInfoType } from "../api/user";

interface CachedUser {
  data: userApi.UserInfo;
  timestamp: number;
  expiresAt: number;
}

function createUserService() {
  const STORAGE_KEY = "nuts-offline-user";
  const CACHE_DURATION = 24 * 60 * 60 * 1000;

  const getCachedUser = (): CachedUser | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Failed to load cached user:", error);
      return null;
    }
  };

  const isCacheValid = (cached: CachedUser): boolean => {
    return Date.now() < cached.expiresAt;
  };

  const cacheUser = (user: userApi.UserInfo): void => {
    try {
      const cached: CachedUser = {
        data: user,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn("Failed to cache user:", error);
    }
  };

  const getMe = (): ResultAsync<userApi.UserInfo, ServiceError> => {
    const { isAnonymous } = useAuthStore.getState();

    if (isAnonymous) {
      const anonymousUser = anonymousUserService.getAnonymousUser();
      if (anonymousUser) {
        const userInfo: userApi.UserInfo = {
          id: anonymousUser.id,
          email: "",
          first_name: "Guest",
          last_name: "User",
          mfa_enabled: false,
          createdAt: anonymousUser.createdAt,
          updatedAt: anonymousUser.createdAt,
          has_password: false,
          linked_accounts: [],
        };
        console.log("📱 Using anonymous user data");
        return ResultAsync.fromSafePromise(Promise.resolve(userInfo));
      }
    }

    const cachedUser = getCachedUser();

    if (cachedUser && isCacheValid(cachedUser)) {
      console.log("📱 Using cached user data");

      if (!connectivityService.hasServerAccess()) {
        return ResultAsync.fromSafePromise(Promise.resolve(cachedUser.data));
      }

      userApi.getMe().match(
        (freshUser) => {
          cacheUser(freshUser);
          console.log("✅ User data refreshed from server");
        },
        (error) => {
          console.warn("Failed to refresh user data from server, using cache:", error);
        }
      );

      return ResultAsync.fromSafePromise(Promise.resolve(cachedUser.data));
    }

    if (!connectivityService.hasServerAccess()) {
      console.warn("⚠️  No cached user data and offline");
      if (cachedUser) {
        return ResultAsync.fromSafePromise(Promise.resolve(cachedUser.data));
      }
      return userApi.getMe();
    }

    return userApi.getMe().map((user) => {
      cacheUser(user);
      console.log("✅ User data fetched from server");
      return user;
    });
  };

  const updateMe = (info: Partial<userApi.UserInfo>): ResultAsync<userApi.UserInfo, ServiceError> => {
    const cachedUser = getCachedUser();

    if (cachedUser) {
      const updated = { ...cachedUser.data, ...info };
      cacheUser(updated);
      console.log("📱 User data updated locally");

      if (!connectivityService.hasServerAccess()) {
        console.log("⚠️  Offline: User update queued for sync");
        return ResultAsync.fromSafePromise(Promise.resolve(updated));
      }
    }

    return userApi.updateMe(info).map((user) => {
      cacheUser(user);
      console.log("✅ User data synced to server");
      return user;
    });
  };

  const createPassword = (password: string) => {
    if (!connectivityService.hasServerAccess()) {
      console.warn("⚠️  Cannot create password while offline");
    }
    return userApi.createPassword(password);
  };

  const updatePassword = (data: { current_password: string; password: string }) => {
    if (!connectivityService.hasServerAccess()) {
      console.warn("⚠️  Cannot update password while offline");
    }
    return userApi.updatePassword(data);
  };

  const updateAvatar = (formData: FormData) => {
    if (!connectivityService.hasServerAccess()) {
      console.warn("⚠️  Cannot update avatar while offline");
    }
    return userApi.updateAvatar(formData).map((result) => {
      const cachedUser = getCachedUser();
      if (cachedUser) {
        const updated = { ...cachedUser.data, avatar_url: result.avatar_url };
        cacheUser(updated);
      }
      return result;
    });
  };

  const getSessions = (): ResultAsync<any[], ServiceError> => {
    const { isAnonymous } = useAuthStore.getState();

    if (isAnonymous) {
      console.log("📱 Anonymous user: returning empty sessions");
      return ResultAsync.fromSafePromise(Promise.resolve([]));
    }

    if (!connectivityService.hasServerAccess()) {
      console.warn("⚠️  Offline: returning empty sessions");
      return ResultAsync.fromSafePromise(Promise.resolve([]));
    }

    const authApi = require("@/features/auth/api").authApi;
    return authApi.getSessions();
  };

  const clear = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log("🧹 Cleared cached user data");
    } catch (error) {
      console.warn("Failed to clear cached user:", error);
    }
  };

  return {
    getMe,
    updateMe,
    createPassword,
    updatePassword,
    updateAvatar,
    getSessions,
    clear,
  };
}

export const userService = createUserService();
