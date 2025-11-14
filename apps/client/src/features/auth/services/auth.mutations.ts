import { LoginFormValues } from "./auth.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api";
import { userService } from "@/features/users/services/user.service";
import { useAuthStore } from "../stores/auth.store";
import { logger } from "@/lib/logger";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const result = await authApi.login(credentials);
      if (result.isErr()) throw result.error;

      const response = result.value;
      if (response.status === 202 && response.data.two_fa_required) {
        return { twoFactorRequired: true, user: null };
      }

      const userResult = await userService.getMe();
      if (userResult.isErr()) throw userResult.error;
      return { twoFactorRequired: false, user: userResult.value };
    },
    onSuccess: (data) => {
      if (!data.twoFactorRequired && data.user) {
        setUser(data.user);
        setAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    },
    onError: (error) => {
      logger.error("Login failed:", { error: error });
      setAuthenticated(false);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.resetState);

  return useMutation({
    mutationFn: async () => {
      const result = await authApi.logout();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      reset();
      queryClient.clear(); // Clear all cached data
    },
    onError: (error) => {
      logger.error("Logout failed:", { error });
      // Still reset state even if logout fails
      reset();
      queryClient.clear();
    },
  });
};

export const useRefreshAuth = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const reset = useAuthStore((s) => s.resetState);

  return useMutation({
    mutationFn: async () => {
      const refreshResult = await authApi.refresh();
      if (refreshResult.isErr()) throw refreshResult.error;

      const userResult = await userService.getMe();
      if (userResult.isErr()) throw userResult.error;
      return userResult.value;
    },
    onSuccess: (user) => {
      setUser(user);
      setAuthenticated(true);
    },
    onError: (error) => {
      logger.error("Auth refresh failed:", { error });
      reset();
    },
  });
};

export const useInitiateMfaSetup = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await authApi.initiateMfaSetup();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onError: (error) => {
      logger.error("MFA setup initiation failed:", { error });
    },
  });
};

export const useVerifyMfaSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const result = await authApi.verifyMfaSetup(code);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      logger.error("MFA verification failed:", { error });
    },
  });
};

export const useDisableMfa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authApi.disableMfa();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      logger.error("MFA disable failed:", { error });
    },
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await authApi.revokeSession(sessionId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      logger.error("Session revoke failed:", { error });
    },
  });
};

export const useRevokeAllOtherSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authApi.revokeAllOtherSessions();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => {
      logger.error("Revoke all sessions failed:", { error });
    },
  });
};

export const useUnlinkSocialAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: "google" | "apple") => {
      const result = await authApi.unlinkSocialAccount(provider);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      logger.error("Social account unlink failed:", { error });
    },
  });
};
