import { useQuery } from "@tanstack/react-query";
import { notificationService } from "./notification.service";
import { notificationQueryKeys } from "./notification.keys";
import { NotificationFilters } from "./notification.types";

export const useNotifications = (filters?: NotificationFilters) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: async () => {
      const result = await notificationService.getAll();
      if (result.isErr()) throw result.error;

      let notifications = result.value;

      if (filters?.status) {
        notifications = notifications.filter((n) => n.status === filters.status);
      }

      if (filters?.type) {
        notifications = notifications.filter((n) => n.type === filters.type);
      }

      if (filters?.priority) {
        notifications = notifications.filter((n) => n.priority === filters.priority);
      }

      if (filters?.unread_only) {
        notifications = notifications.filter((n) => n.status === "unread");
      }

      if (filters?.related_recurring_id) {
        notifications = notifications.filter((n) => n.related_recurring_id === filters.related_recurring_id);
      }

      if (filters?.related_transaction_id) {
        notifications = notifications.filter((n) => n.related_transaction_id === filters.related_transaction_id);
      }

      if (filters?.related_account_id) {
        notifications = notifications.filter((n) => n.related_account_id === filters.related_account_id);
      }

      return notifications.filter((n) => !n.deleted_at);
    },
  });
};

export const useNotification = (id: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: async () => {
      const result = await notificationService.getById(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: !!id,
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: notificationQueryKeys.unread(),
    queryFn: async () => {
      const result = await notificationService.getUnread();
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useNotificationsByStatus = (status: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.byStatus(status),
    queryFn: async () => {
      const result = await notificationService.getByStatus(status);
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useNotificationsByType = (type: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.byType(type),
    queryFn: async () => {
      const result = await notificationService.getByType(type);
      if (result.isErr()) throw result.error;
      return result.value;
    },
  });
};

export const useNotificationsByRecurring = (recurringId: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.byRecurring(recurringId),
    queryFn: async () => {
      const result = await notificationService.getByRelatedRecurring(recurringId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    enabled: !!recurringId,
  });
};
