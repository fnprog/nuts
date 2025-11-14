import { crdtService } from "@/core/sync/crdt";
import { Result, ResultAsync, ServiceError } from "@/lib/result";
import { Notification, CreateNotification, UpdateNotification } from "./notification.types";
import { generateUUID } from "@/lib/utils";

export const notificationService = {
  async getAll(): Promise<Result<Notification[], ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const notifications = crdtService.getNotifications();
        return Object.values(notifications) as Notification[];
      })(),
      ServiceError.fromError
    );
  },

  async getById(id: string): Promise<Result<Notification | null, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const notification = crdtService.getNotification(id);
        return notification as Notification | null;
      })(),
      ServiceError.fromError
    );
  },

  async getUnread(): Promise<Result<Notification[], ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const notifications = crdtService.getNotifications();
        return Object.values(notifications).filter((n: any) => n.status === "unread") as Notification[];
      })(),
      ServiceError.fromError
    );
  },

  async getByStatus(status: string): Promise<Result<Notification[], ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const notifications = crdtService.getNotifications();
        return Object.values(notifications).filter((n: any) => n.status === status) as Notification[];
      })(),
      ServiceError.fromError
    );
  },

  async getByType(type: string): Promise<Result<Notification[], ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const notifications = crdtService.getNotifications();
        return Object.values(notifications).filter((n: any) => n.type === type) as Notification[];
      })(),
      ServiceError.fromError
    );
  },

  async getByRelatedRecurring(recurringId: string): Promise<Result<Notification[], ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const notifications = crdtService.getNotifications();
        return Object.values(notifications).filter((n: any) => n.related_recurring_id === recurringId) as Notification[];
      })(),
      ServiceError.fromError
    );
  },

  async create(data: CreateNotification): Promise<Result<Notification, ServiceError>> {
    const id = generateUUID();
    const now = new Date().toISOString();

    const notification: Notification = {
      id,
      ...data,
      created_at: now,
      read_at: null,
      archived_at: null,
      action_taken_at: null,
      hlc: 0,
      node_id: "",
      deleted_at: null,
    };

    const createResult = await crdtService.createNotification(notification);
    if (createResult.isErr()) {
      return Result.err(createResult.error);
    }

    return Result.ok(notification);
  },

  async markAsRead(id: string): Promise<Result<Notification, ServiceError>> {
    const now = new Date().toISOString();
    return this.update(id, {
      status: "read",
      read_at: now,
    });
  },

  async markAsActioned(id: string): Promise<Result<Notification, ServiceError>> {
    const now = new Date().toISOString();
    return this.update(id, {
      status: "actioned",
      action_taken_at: now,
    });
  },

  async archive(id: string): Promise<Result<Notification, ServiceError>> {
    const now = new Date().toISOString();
    return this.update(id, {
      status: "archived",
      archived_at: now,
    });
  },

  async update(id: string, updates: UpdateNotification): Promise<Result<Notification, ServiceError>> {
    const updateResult = await crdtService.updateNotification(id, updates);
    if (updateResult.isErr()) {
      return Result.err(updateResult.error);
    }

    const result = await this.getById(id);
    if (result.isErr()) return Result.err(result.error);
    if (!result.value) return Result.err(ServiceError.notFound("notification", id));
    
    return Result.ok(result.value);
  },

  async delete(id: string): Promise<Result<void, ServiceError>> {
    return crdtService.deleteNotification(id);
  },

  async deleteExpired(): Promise<Result<number, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const now = new Date().toISOString();
        const notifications = crdtService.getNotifications();

        const expiredNotifications = Object.values(notifications).filter(
          (n: any) => n.expires_at && new Date(n.expires_at) < new Date(now)
        );

        for (const notification of expiredNotifications) {
          await crdtService.deleteNotification((notification as any).id);
        }

        return expiredNotifications.length;
      })(),
      ServiceError.fromError
    );
  },

  async markAllAsRead(): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const result = await this.getUnread();
        if (result.isErr()) throw result.error;

        const now = new Date().toISOString();
        for (const notification of result.value) {
          await crdtService.updateNotification(notification.id, {
            status: "read",
            read_at: now,
          });
        }
      })(),
      ServiceError.fromError
    );
  },
};
