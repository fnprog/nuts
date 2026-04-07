import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "./user.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { AuthNullable } from "@/features/auth/services/auth.types";

export const useUpdateAvatar = (user: AuthNullable) => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await userService.updateAvatar(formData);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onError: (error) => {
      console.error("Failed to upload avatar:", error);
    },
    onSuccess: (data) => {
      if (user) {
        setUser({
          ...user,
          avatar_url: data.avatar_url,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useUpdateUserInfo = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (info: any) => {
      const result = await userService.updateMe(info);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setUser(updatedUser);
    },
  });
};
