import { NotificationFilters } from "./notification.types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationQueryKeys.all, "list"] as const,
  list: (filters?: NotificationFilters) => [...notificationQueryKeys.lists(), filters] as const,
  unread: () => [...notificationQueryKeys.all, "unread"] as const,
  details: () => [...notificationQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationQueryKeys.details(), id] as const,
  byStatus: (status: string) => [...notificationQueryKeys.all, "status", status] as const,
  byType: (type: string) => [...notificationQueryKeys.all, "type", type] as const,
  byRecurring: (recurringId: string) => [...notificationQueryKeys.all, "recurring", recurringId] as const,
};
