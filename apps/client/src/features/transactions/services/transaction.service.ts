import { crdtService } from "@/core/sync/crdt";
import { kyselyQueryService } from "@/core/sync/query";
import { CRDTTransaction } from "@nuts/types";
import { RecordCreateSchema, RecordUpdateSchema, RecordSchema, TransactionsResponse, TableRecordsSchema } from "./transaction.types";
import type { GetTransactionsParams } from "./transaction";
import { uuidV7 } from "@nuts/utils";
import { Result, ok, err, ServiceError } from "@/lib/result";

export function createTransactionService() {
  let isInitialized = false;

  const ensureInitialized = async (): Promise<Result<void, ServiceError>> => {
    if (!isInitialized) {
      return await initialize();
    }
    return ok(undefined);
  };

  const initialize = async (): Promise<Result<void, ServiceError>> => {
    if (isInitialized) return ok(undefined);

    const crdtResult = await crdtService.initialize();
    if (crdtResult.isErr()) return err(crdtResult.error);

    const kyselyResult = await kyselyQueryService.initialize();
    if (kyselyResult.isErr()) return err(kyselyResult.error);

    isInitialized = true;
    console.log("Transaction service initialized (offline-first)");
    return ok(undefined);
  };

  const getTransactions = async (params: GetTransactionsParams): Promise<Result<TransactionsResponse, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const {
      page = 1,
      limit = 25,
      q: search,
      account_id: accountId,
      category_id: categoryId,
      type,
      start_date: startDate,
      end_date: endDate,
      currency,
    } = params;

    const queryResult = await kyselyQueryService.queryTransactions({
      page,
      limit,
      search,
      account_id: accountId,
      category_id: categoryId,
      type,
      start_date: startDate,
      end_date: endDate,
      currency,
    } as GetTransactionsParams);

    if (queryResult.isErr()) return err(queryResult.error);

    const groupedData: Record<string, TableRecordsSchema> = {};

    queryResult.value.data.forEach((tx) => {
      const date = tx.date_only || tx.transaction_datetime.split("T")[0];

      if (!groupedData[date]) {
        groupedData[date] = {
          id: date,
          date: new Date(date),
          total: 0,
          transactions: [],
        };
      }

      const transaction = convertFromCRDTFormat(tx);
      groupedData[date].transactions.push(transaction);
      groupedData[date].total += transaction.amount;
    });

    const data = Object.values(groupedData).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return ok({
      data,
      pagination: {
        total_items: queryResult.value.pagination.total,
        total_pages: queryResult.value.pagination.totalPages,
        page,
        limit,
      },
    });
  };

  const getTransaction = async (id: string): Promise<Result<RecordSchema, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const transaction = crdtService.getTransaction(id);
    if (!transaction) {
      return err(ServiceError.notFound("transaction", id));
    }

    return ok(convertFromCRDTFormat(transaction));
  };

  const createTransaction = async (transaction: RecordCreateSchema): Promise<Result<RecordSchema[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const id = uuidV7();
    const crdtTransaction = convertToCRDTFormat({
      ...transaction,
      id,
      is_external: false,
      transaction_currency: "USD",
      original_amount: Math.abs(transaction.amount),
    });

    const createResult = await crdtService.createTransaction(crdtTransaction);
    if (createResult.isErr()) return err(createResult.error);

    if (transaction.type === "income") {
      const balanceResult = await updateAccountBalance(transaction.account_id, transaction.amount);
      if (balanceResult.isErr()) return err(balanceResult.error);
    } else if (transaction.type === "expense") {
      const balanceResult = await updateAccountBalance(transaction.account_id, -transaction.amount);
      if (balanceResult.isErr()) return err(balanceResult.error);
    } else if (transaction.type === "transfer" && transaction.destination_account_id) {
      const balanceResult1 = await updateAccountBalance(transaction.account_id, -transaction.amount);
      if (balanceResult1.isErr()) return err(balanceResult1.error);
      const balanceResult2 = await updateAccountBalance(transaction.destination_account_id, transaction.amount);
      if (balanceResult2.isErr()) return err(balanceResult2.error);
    }

    const rebuildResult = await rebuildFromCRDT();
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    const createdResult = await getTransaction(id);
    if (createdResult.isErr()) return err(createdResult.error);

    return ok([createdResult.value]);
  };

  const updateTransaction = async (id: string, updates: RecordUpdateSchema): Promise<Result<RecordSchema, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const existingResult = await getTransaction(id);
    if (existingResult.isErr()) return err(existingResult.error);
    const existing = existingResult.value;

    if (existing.type === "income") {
      const balanceResult = await updateAccountBalance(existing.account_id, -existing.amount);
      if (balanceResult.isErr()) return err(balanceResult.error);
    } else if (existing.type === "expense") {
      const balanceResult = await updateAccountBalance(existing.account_id, existing.amount);
      if (balanceResult.isErr()) return err(balanceResult.error);
    } else if (existing.type === "transfer" && existing.destination_account_id) {
      const balanceResult1 = await updateAccountBalance(existing.account_id, existing.amount);
      if (balanceResult1.isErr()) return err(balanceResult1.error);
      const balanceResult2 = await updateAccountBalance(existing.destination_account_id, -existing.amount);
      if (balanceResult2.isErr()) return err(balanceResult2.error);
    }

    const crdtUpdates = convertToCRDTFormat(updates);
    const updateResult = await crdtService.updateTransaction(id, crdtUpdates);
    if (updateResult.isErr()) return err(updateResult.error);

    const newAccountId = updates.account_id ?? existing.account_id;
    const newAmount = updates.amount ?? existing.amount;
    const newType = updates.type ?? existing.type;
    const newDestinationId = updates.destination_account_id ?? existing.destination_account_id;

    if (newType === "income") {
      const balanceResult = await updateAccountBalance(newAccountId, newAmount);
      if (balanceResult.isErr()) return err(balanceResult.error);
    } else if (newType === "expense") {
      const balanceResult = await updateAccountBalance(newAccountId, -newAmount);
      if (balanceResult.isErr()) return err(balanceResult.error);
    } else if (newType === "transfer" && newDestinationId) {
      const balanceResult1 = await updateAccountBalance(newAccountId, -newAmount);
      if (balanceResult1.isErr()) return err(balanceResult1.error);
      const balanceResult2 = await updateAccountBalance(newDestinationId, newAmount);
      if (balanceResult2.isErr()) return err(balanceResult2.error);
    }

    const rebuildResult = await rebuildFromCRDT();
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    const updatedResult = await getTransaction(id);
    if (updatedResult.isErr()) return err(updatedResult.error);

    return ok(updatedResult.value);
  };

  const deleteTransactions = async (ids: string[] | string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const transactionIds = Array.isArray(ids) ? ids : [ids];

    for (const id of transactionIds) {
      const transactionResult = await getTransaction(id);
      if (transactionResult.isOk()) {
        const transaction = transactionResult.value;

        if (transaction.type === "income") {
          const balanceResult = await updateAccountBalance(transaction.account_id, -transaction.amount);
          if (balanceResult.isErr()) return err(balanceResult.error);
        } else if (transaction.type === "expense") {
          const balanceResult = await updateAccountBalance(transaction.account_id, transaction.amount);
          if (balanceResult.isErr()) return err(balanceResult.error);
        } else if (transaction.type === "transfer" && transaction.destination_account_id) {
          const balanceResult1 = await updateAccountBalance(transaction.account_id, transaction.amount);
          if (balanceResult1.isErr()) return err(balanceResult1.error);
          const balanceResult2 = await updateAccountBalance(transaction.destination_account_id, -transaction.amount);
          if (balanceResult2.isErr()) return err(balanceResult2.error);
        }
      }

      const deleteResult = await crdtService.deleteTransaction(id);
      if (deleteResult.isErr()) return err(deleteResult.error);
    }

    const rebuildResult = await rebuildFromCRDT();
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    return ok(undefined);
  };

  const bulkDeleteTransactions = async (transactionIds: string[]): Promise<Result<void, ServiceError>> => {
    return deleteTransactions(transactionIds);
  };

  const bulkUpdateCategories = async (transactionIds: string[], categoryId: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    for (const id of transactionIds) {
      const updateResult = await crdtService.updateTransaction(id, { category_id: categoryId });
      if (updateResult.isErr()) return err(updateResult.error);
    }

    const rebuildResult = await rebuildFromCRDT();
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    return ok(undefined);
  };

  const bulkUpdateManualTransactions = async (params: {
    transactionIds: string[];
    categoryId?: string;
    accountId?: string;
    transactionDatetime?: Date;
  }): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const updates: Partial<CRDTTransaction> = {};

    if (params.categoryId) updates.category_id = params.categoryId;
    if (params.accountId) updates.account_id = params.accountId;
    if (params.transactionDatetime) {
      updates.transaction_datetime = params.transactionDatetime.toISOString();
    }

    for (const id of params.transactionIds) {
      const updateResult = await crdtService.updateTransaction(id, updates);
      if (updateResult.isErr()) return err(updateResult.error);
    }

    const rebuildResult = await rebuildFromCRDT();
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    return ok(undefined);
  };

  const convertFromCRDTFormat = (crdtTx: CRDTTransaction): RecordSchema => {
    return {
      id: crdtTx.id,
      amount: crdtTx.amount,
      transaction_datetime: new Date(crdtTx.transaction_datetime),
      description: crdtTx.description,
      category_id: crdtTx.category_id,
      account_id: crdtTx.account_id,
      type: crdtTx.type,
      destination_account_id: crdtTx.destination_account_id,
      details: crdtTx.details,
      updated_at: new Date(crdtTx.updated_at),
      is_external: crdtTx.is_external,
      transaction_currency: crdtTx.transaction_currency,
      original_amount: crdtTx.original_amount,
      ...(crdtTx.account_name && {
        account: {
          id: crdtTx.account_id,
          name: crdtTx.account_name,
          currency: crdtTx.account_currency,
        },
      }),
      ...(crdtTx.category_name && {
        category: {
          id: crdtTx.category_id,
          name: crdtTx.category_name,
          color: crdtTx.category_color,
        },
      }),
    } as RecordSchema;
  };

  const convertToCRDTFormat = (tx: RecordCreateSchema | RecordUpdateSchema): Partial<CRDTTransaction> => {
    const result: Partial<CRDTTransaction> = {};

    if (tx.id !== undefined) result.id = tx.id;
    if (tx.amount !== undefined) result.amount = tx.amount;
    if (tx.transaction_datetime !== undefined) {
      result.transaction_datetime = tx.transaction_datetime instanceof Date ? tx.transaction_datetime.toISOString() : tx.transaction_datetime;
    }
    if (tx.description !== undefined) result.description = tx.description;
    if (tx.category_id !== undefined) result.category_id = tx.category_id;
    if (tx.account_id !== undefined) result.account_id = tx.account_id;
    if (tx.type !== undefined) result.type = tx.type;
    if (tx.destination_account_id !== undefined) result.destination_account_id = tx.destination_account_id;
    if (tx.details !== undefined) result.details = tx.details;
    if (tx.transaction_currency !== undefined) result.transaction_currency = tx.transaction_currency;
    if (tx.original_amount !== undefined) result.original_amount = tx.original_amount;
    if (tx.is_external !== undefined) result.is_external = tx.is_external;

    return result;
  };

  const updateAccountBalance = async (accountId: string, amountDelta: number): Promise<Result<void, ServiceError>> => {
    const accounts = crdtService.getAccounts();
    const account = accounts[accountId];

    if (!account) {
      return err(ServiceError.notFound("account", accountId));
    }

    const newBalance = (account.balance || 0) + amountDelta;
    const updateResult = await crdtService.updateAccount(accountId, { balance: newBalance });
    if (updateResult.isErr()) return err(updateResult.error);

    return ok(undefined);
  };

  const rebuildFromCRDT = async (): Promise<Result<void, ServiceError>> => {
    const transactions = crdtService.getTransactions();
    const accounts = crdtService.getAccounts();
    const categories = crdtService.getCategories();
    const rules = crdtService.getRules();

    const rebuildResult = await kyselyQueryService.rebuildFromCRDT(transactions, accounts, categories, rules);
    if (rebuildResult.isErr()) return err(rebuildResult.error);

    return ok(undefined);
  };

  return {
    initialize,
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransactions,
    bulkDeleteTransactions,
    bulkUpdateCategories,
    bulkUpdateManualTransactions,
  };
}

export const transactionService = createTransactionService();
