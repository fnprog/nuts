import { userService } from "@/features/preferences/services/user.service";
import { authApi } from "../api";
import { useAuthenticatedQuery } from "@/core/hooks/use-auth";

export const userQueryOptions = () => ({
  queryKey: ["user"],
  queryFn: async () => {
    const result = await userService.getMe();
    if (result.isErr()) throw result.error;
    return result.value;
  },
  staleTime: 5 * 60 * 1000,
});

export const useUserQuery = () => {
  return useAuthenticatedQuery(userQueryOptions());
};

export const sessionsQueryOptions = () => ({
  queryKey: ["sessions"],
  queryFn: async () => {
    const result = await authApi.getSessions();
    if (result.isErr()) throw result.error;
    return result.value;
  },
  staleTime: 1 * 60 * 1000,
});

export const useSessionsQuery = () => {
  return useAuthenticatedQuery(sessionsQueryOptions());
};
