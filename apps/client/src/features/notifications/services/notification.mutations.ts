import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateNotification, UpdateNotification } from "./notification.types";
import { notificationService } from "./notification.service";
import { notificationQueryKeys } from "./notification.keys";

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotification) => {
      const result = await notificationService.create(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};

export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNotification }) => {
      const result = await notificationService.update(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.detail(notification.id) });
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await notificationService.markAsRead(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};

export const useMarkNotificationAsActioned = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await notificationService.markAsActioned(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};

export const useArchiveNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await notificationService.archive(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await notificationService.delete(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await notificationService.markAllAsRead();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};

export const useDeleteExpiredNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await notificationService.deleteExpired();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
};
