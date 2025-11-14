import { crdtService } from "@/core/sync/crdt";
import { Result, ok, err, ServiceError } from "@/lib/result";
import {
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
  RecurringTransactionStats,
  RecurringTransactionFilters,
  RecurringInstancesRequest,
  RecurringInstancesResponse,
  RecurringInstance,
  ProcessRecurringTransaction,
} from "./recurring-transaction.types";
import { generateRecurringInstances } from "./recurring-instance-generator";
import { transactionService } from "./transaction.service";

export const recurringTransactionService = {
  async create(data: RecurringTransactionCreate): Promise<Result<RecurringTransaction, ServiceError>> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const recurringTransaction: RecurringTransaction = {
      id,
      user_id: "",
      ...data,
      occurrences_count: 0,
      last_generated_date: undefined,
      next_due_date: data.start_date,
      created_at: now,
      updated_at: now,
      deleted_at: undefined,
    };

    const createResult = await crdtService.createRecurringTransaction(recurringTransaction);
    if (createResult.isErr()) {
      return err(createResult.error);
    }

    return ok(recurringTransaction);
  },

  async getAll(filters?: RecurringTransactionFilters): Promise<Result<RecurringTransaction[], ServiceError>> {
    try {
      const recurringTransactions = crdtService.getRecurringTransactions();
      let filtered = Object.values(recurringTransactions) as RecurringTransaction[];

      if (filters?.account_id) {
        filtered = filtered.filter((rt) => rt.account_id === filters.account_id);
      }

      if (filters?.category_id) {
        filtered = filtered.filter((rt) => rt.category_id === filters.category_id);
      }

      if (filters?.frequency) {
        filtered = filtered.filter((rt) => rt.frequency === filters.frequency);
      }

      if (filters?.is_paused !== undefined) {
        filtered = filtered.filter((rt) => rt.is_paused === filters.is_paused);
      }

      if (filters?.auto_post !== undefined) {
        filtered = filtered.filter((rt) => rt.auto_post === filters.auto_post);
      }

      if (filters?.template_name) {
        filtered = filtered.filter((rt) => rt.template_name === filters.template_name);
      }

      if (filters?.start_date) {
        filtered = filtered.filter((rt) => new Date(rt.start_date) >= filters.start_date!);
      }

      if (filters?.end_date) {
        filtered = filtered.filter((rt) => 
          !rt.end_date || new Date(rt.end_date) <= filters.end_date!
        );
      }

      return ok(filtered.filter((rt) => !rt.deleted_at));
    } catch (error) {
      return err(ServiceError.operation("fetch", "recurring transactions", error));
    }
  },

  async getById(id: string): Promise<Result<RecurringTransaction | null, ServiceError>> {
    try {
      const recurringTransaction = crdtService.getRecurringTransaction(id);
      return ok(recurringTransaction as RecurringTransaction | null);
    } catch (error) {
      return err(ServiceError.operation("fetch", "recurring transaction", error));
    }
  },

  async update(id: string, data: RecurringTransactionUpdate): Promise<Result<RecurringTransaction, ServiceError>> {
    const now = new Date().toISOString();
    const updates = {
      ...data,
      updated_at: now,
    };

    const updateResult = await crdtService.updateRecurringTransaction(id, updates);
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }

    const result = await this.getById(id);
    if (result.isErr()) return err(result.error);
    if (!result.value) return err(ServiceError.notFound("recurring-transaction", id));
    
    return ok(result.value);
  },

  async delete(id: string): Promise<Result<void, ServiceError>> {
    return crdtService.deleteRecurringTransaction(id);
  },

  async pause(id: string, isPaused: boolean): Promise<Result<RecurringTransaction, ServiceError>> {
    return this.update(id, { is_paused: isPaused });
  },

  async getStats(): Promise<Result<RecurringTransactionStats, ServiceError>> {
    try {
      const recurringTransactions = crdtService.getRecurringTransactions();
      const all = Object.values(recurringTransactions).filter((rt: any) => !rt.deleted_at);
      
      const active = all.filter((rt: any) => !rt.is_paused);
      const paused = all.filter((rt: any) => rt.is_paused);
      const due = active.filter((rt: any) => {
        const nextDueDate = new Date(rt.next_due_date);
        const today = new Date();
        return nextDueDate <= today;
      });

      return ok({
        total_count: all.length,
        active_count: active.length,
        paused_count: paused.length,
        due_count: due.length,
      });
    } catch (error) {
      return err(ServiceError.operation("calculate", "recurring transaction stats", error));
    }
  },

  async getInstances(request: RecurringInstancesRequest): Promise<Result<RecurringInstancesResponse, ServiceError>> {
    try {
      const recurringTransactions = crdtService.getRecurringTransactions();
      const activeRecurring = Object.values(recurringTransactions).filter(
        (rt: any) => !rt.deleted_at && !rt.is_paused
      ) as RecurringTransaction[];

      const allInstances: RecurringInstance[] = [];

      for (const recurring of activeRecurring) {
        const instances = generateRecurringInstances(
          recurring,
          request.start_date,
          request.end_date,
          50
        );

        allInstances.push(...instances);
      }

      allInstances.sort((a, b) => a.due_date.getTime() - b.due_date.getTime());

      const summary = {
        total_count: allInstances.length,
        pending_count: allInstances.filter((i) => i.status === "pending").length,
        posted_count: allInstances.filter((i) => i.status === "posted").length,
        skipped_count: allInstances.filter((i) => i.status === "skipped").length,
        total_amount: allInstances.reduce((sum, i) => sum + i.amount, 0),
      };

      return ok({
        instances: allInstances,
        summary,
      });
    } catch (error) {
      return err(ServiceError.operation("generate", "recurring instances", error));
    }
  },

  async getRecurringInstances(id: string): Promise<Result<RecurringInstance[], ServiceError>> {
    const result = await this.getById(id);
    if (result.isErr()) return err(result.error);
    if (!result.value) return err(ServiceError.notFound("recurring-transaction", id));

    try {
      const recurring = result.value;
      const now = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(now.getMonth() + 6);

      return ok(generateRecurringInstances(recurring, now, sixMonthsFromNow, 50));
    } catch (error) {
      return err(ServiceError.operation("generate", "recurring instances for transaction", error));
    }
  },

  async process(id: string, action: ProcessRecurringTransaction): Promise<Result<any, ServiceError>> {
    const result = await this.getById(id);
    if (result.isErr()) return err(result.error);
    if (!result.value) return err(ServiceError.notFound("recurring-transaction", id));

    const recurring = result.value;

    try {
      switch (action.action) {
        case "post": {
          const transactionData = {
            account_id: recurring.account_id,
            category_id: recurring.category_id,
            destination_account_id: recurring.destination_account_id,
            amount: action.transaction_request?.amount ?? recurring.amount,
            type: recurring.type,
            description: action.transaction_request?.description ?? recurring.description,
            details: recurring.details,
            transaction_datetime: action.transaction_request?.transaction_datetime ?? recurring.next_due_date,
          };

          const txResult = await transactionService.createTransaction(transactionData);
          if (txResult.isErr()) return err(txResult.error);

          await this.update(id, {
            occurrences_count: recurring.occurrences_count + 1,
            last_generated_date: recurring.next_due_date,
          });

          return ok({ success: true, transaction: txResult.value[0] });
        }

        case "skip": {
          await this.update(id, {
            occurrences_count: recurring.occurrences_count + 1,
            last_generated_date: recurring.next_due_date,
          });

          return ok({ success: true, action: "skipped" });
        }

        case "modify": {
          if (action.transaction_request) {
            await this.update(id, {
              amount: action.transaction_request.amount,
              description: action.transaction_request.description,
              category_id: action.transaction_request.category_id,
            });
          }

          return ok({ success: true, action: "modified" });
        }

        default:
          return err(ServiceError.operation("process", "recurring transaction with invalid action", undefined));
      }
    } catch (error) {
      return err(ServiceError.operation("process", "recurring transaction", error));
    }
  },
};