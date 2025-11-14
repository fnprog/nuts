import { notificationService } from "@/features/notifications/services/notification.service";
import { transactionService } from "./transaction.service";
import { recurringInstanceGenerator } from "./recurring-instance-generator";
import { RecurringTransaction } from "./recurring-transaction.types";
import { Result, ok, err, ServiceError } from "@/lib/result";
import { startOfDay, endOfDay } from "date-fns";

interface ProcessRecurringOptions {
  lookAheadDays?: number;
  userId: string;
}

interface ProcessingResult {
  notificationsCreated: number;
  transactionsCreated: number;
  errors: string[];
}

export const recurringProcessorService = {
  async processRecurringTransactions(
    recurringTransactions: RecurringTransaction[],
    options: ProcessRecurringOptions
  ): Promise<Result<ProcessingResult, ServiceError>> {
    const { lookAheadDays = 7, userId } = options;
    const now = new Date();
    const startDate = startOfDay(now);
    const endDate = endOfDay(new Date(now.getTime() + lookAheadDays * 24 * 60 * 60 * 1000));

    const result: ProcessingResult = {
      notificationsCreated: 0,
      transactionsCreated: 0,
      errors: [],
    };

    for (const recurring of recurringTransactions) {
      if (recurring.is_paused) continue;

      const instances = recurringInstanceGenerator.generateInstances(recurring, {
        startDate,
        endDate,
        maxInstances: 10,
      });

      for (const instance of instances) {
        try {
          const alreadyProcessed = await this.checkIfInstanceAlreadyProcessed(recurring.id, instance.due_date);
          if (alreadyProcessed) continue;

          if (recurring.auto_post) {
            const transactionResult = await this.createTransactionFromRecurring(recurring, instance.due_date, userId);
            if (transactionResult.isOk()) {
              result.transactionsCreated++;
            } else {
              result.errors.push(`Failed to create transaction for ${recurring.description}: ${transactionResult.error.message}`);
            }
          } else {
            const notificationResult = await this.createDueNotification(recurring, instance.due_date, userId);
            if (notificationResult.isOk()) {
              result.notificationsCreated++;
            } else {
              result.errors.push(`Failed to create notification for ${recurring.description}: ${notificationResult.error.message}`);
            }
          }
        } catch (error) {
          result.errors.push(`Error processing ${recurring.description}: ${error}`);
        }
      }
    }

    return ok(result);
  },

  async createTransactionFromRecurring(
    recurring: RecurringTransaction,
    dueDate: Date,
    userId: string
  ): Promise<Result<string, ServiceError>> {
    const transactionResult = await transactionService.createTransaction({
      account_id: recurring.account_id,
      category_id: recurring.category_id,
      destination_account_id: recurring.destination_account_id,
      amount: recurring.amount,
      type: recurring.type,
      description: recurring.description || "Recurring transaction",
      transaction_datetime: dueDate,
      details: {
        ...recurring.details,
        recurring_transaction_id: recurring.id,
      },
    });

    if (transactionResult.isErr()) {
      return err(transactionResult.error);
    }

    const createdTransactions = transactionResult.value;
    const transactionId = createdTransactions[0]?.id;

    if (transactionId) {
      const notificationResult = await notificationService.create({
        user_id: userId,
        type: "recurring_transaction_due",
        status: "actioned",
        priority: "low",
        title: `Auto-posted: ${recurring.description || "Recurring transaction"}`,
        message: `Automatically posted recurring transaction of $${Math.abs(recurring.amount).toFixed(2)}`,
        data: {
          recurring_transaction_id: recurring.id,
          transaction_id: transactionId,
          due_date: dueDate.toISOString(),
          amount: recurring.amount,
          auto_posted: true,
        },
        action_url: `/transactions/${transactionId}`,
        action_label: "View Transaction",
        related_transaction_id: transactionId,
        related_recurring_id: recurring.id,
        related_account_id: recurring.account_id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (notificationResult.isErr()) {
        return err(notificationResult.error);
      }
    }

    return ok(transactionId || "");
  },

  async createDueNotification(
    recurring: RecurringTransaction,
    dueDate: Date,
    userId: string
  ): Promise<Result<string, ServiceError>> {
    const notificationResult = await notificationService.create({
      user_id: userId,
      type: "recurring_transaction_due",
      status: "unread",
      priority: this.calculatePriority(dueDate),
      title: `Recurring transaction due: ${recurring.description || "Transaction"}`,
      message: `Due ${this.formatDueDate(dueDate)} - $${Math.abs(recurring.amount).toFixed(2)}`,
      data: {
        recurring_transaction_id: recurring.id,
        due_date: dueDate.toISOString(),
        amount: recurring.amount,
        auto_post: recurring.auto_post,
      },
      action_url: `/transactions/recurring/${recurring.id}/review`,
      action_label: "Review & Post",
      related_recurring_id: recurring.id,
      related_account_id: recurring.account_id,
      expires_at: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (notificationResult.isErr()) {
      return err(notificationResult.error);
    }

    return ok(notificationResult.value.id);
  },

  async checkIfInstanceAlreadyProcessed(recurringId: string, dueDate: Date): Promise<boolean> {
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const notificationsResult = await notificationService.getByRelatedRecurring(recurringId);
    if (notificationsResult.isErr()) return false;

    const existingNotifications = notificationsResult.value.filter((n) => {
      if (!n.data || typeof n.data !== "object") return false;
      const data = n.data as Record<string, unknown>;
      if (!data.due_date || typeof data.due_date !== "string") return false;
      const notificationDueDate = new Date(data.due_date).toISOString().split("T")[0];
      return notificationDueDate === dueDateStr;
    });

    return existingNotifications.length > 0;
  },

  calculatePriority(dueDate: Date): "low" | "medium" | "high" | "urgent" {
    const now = new Date();
    const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return "urgent";
    if (daysDiff === 0) return "high";
    if (daysDiff <= 2) return "medium";
    return "low";
  },

  formatDueDate(dueDate: Date): string {
    const now = new Date();
    const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return "overdue";
    if (daysDiff === 0) return "today";
    if (daysDiff === 1) return "tomorrow";
    if (daysDiff <= 7) return `in ${daysDiff} days`;
    return dueDate.toLocaleDateString();
  },
};
