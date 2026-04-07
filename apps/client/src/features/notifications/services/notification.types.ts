import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "recurring_transaction_due",
  "recurring_transaction_failed",
  "transaction_needs_review",
  "budget_warning",
  "budget_exceeded",
  "system_announcement",
  "account_sync_failed",
]);

export const notificationStatusSchema = z.enum(["unread", "read", "archived", "actioned"]);

export const notificationPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: notificationTypeSchema,
  status: notificationStatusSchema,
  priority: notificationPrioritySchema,
  title: z.string(),
  message: z.string().nullable(),
  data: z.record(z.unknown()).nullable(),
  action_url: z.string().nullable(),
  action_label: z.string().nullable(),
  action_taken_at: z.string().nullable(),
  related_transaction_id: z.string().uuid().nullable(),
  related_recurring_id: z.string().uuid().nullable(),
  related_account_id: z.string().uuid().nullable(),
  created_at: z.string(),
  read_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  hlc: z.number(),
  node_id: z.string(),
  deleted_at: z.string().nullable(),
});

export const createNotificationSchema = notificationSchema.omit({
  id: true,
  created_at: true,
  read_at: true,
  archived_at: true,
  action_taken_at: true,
  hlc: true,
  node_id: true,
  deleted_at: true,
});

export const updateNotificationSchema = createNotificationSchema.partial();

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotification = z.infer<typeof createNotificationSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;

export interface NotificationFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  unread_only?: boolean;
  related_recurring_id?: string;
  related_transaction_id?: string;
  related_account_id?: string;
}

export interface RecurringTransactionDueData {
  recurring_transaction_id: string;
  due_date: string;
  amount: number;
  description: string;
  account_name: string;
  auto_post: boolean;
}

export interface BudgetWarningData {
  budget_id: string;
  budget_name: string;
  spent: number;
  limit: number;
  percentage: number;
}
