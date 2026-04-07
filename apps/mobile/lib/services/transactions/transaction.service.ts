import { getCRDTService, getKyselyQueryService } from '@/lib/sync';
import { accountService } from '../accounts/account.service';
import type { CRDTTransaction } from '@nuts/types';
import type { Transaction, TransactionCreate, Result, ServiceError } from './transaction.types';
import { ok, err, ServiceErrorFactory as ServiceErr } from './transaction.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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

    const crdtService = getCRDTService();
    const crdtInitResult = await crdtService.initialize();
    
    if (crdtInitResult.isErr()) {
      console.error('❌ Failed to initialize transaction service:', crdtInitResult.error);
      return err(ServiceErr.initialization('Failed to initialize transaction service', crdtInitResult.error));
    }

    const accountInitResult = await accountService.initialize();
    if (accountInitResult.isErr()) {
      console.error('❌ Failed to initialize account service:', accountInitResult.error);
      return err(accountInitResult.error);
    }

    isInitialized = true;
    console.log('✅ Transaction service initialized');
    return ok(undefined);
  };

  const getTransactions = async (): Promise<Result<Transaction[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtService = getCRDTService();
    const crdtTransactions = crdtService.getAll('transactions');
    const transactions = crdtTransactions
      .map((crdtTransaction: CRDTTransaction) => convertFromCRDTFormat(crdtTransaction))
      .sort(
        (a, b) =>
          new Date(b.transaction_datetime).getTime() - new Date(a.transaction_datetime).getTime()
      );
    return ok(transactions);
  };

  const getTransactionById = async (id: string): Promise<Result<Transaction, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtService = getCRDTService();
    const crdtTransaction = crdtService.getById('transactions', id);

    if (!crdtTransaction) {
      return err(ServiceErr.notFound('Transaction', id));
    }

    return ok(convertFromCRDTFormat(crdtTransaction));
  };

  const getRecentTransactions = async (
    limit: number = 50
  ): Promise<Result<Transaction[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const kyselyService = getKyselyQueryService();
      const transactions = await kyselyService.getRecentTransactions(limit);
      return ok(
        transactions.map((tx) => ({
          ...tx,
          transaction_datetime: new Date(tx.transaction_datetime).toISOString(),
          updated_at: new Date(tx.updated_at).toISOString(),
          details: tx.details ? JSON.parse(tx.details) : undefined,
          is_external: tx.is_external === 1,
        }))
      );
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return err(ServiceErr.database('Failed to get recent transactions', error));
    }
  };

  const createTransaction = async (
    transactionData: TransactionCreate
  ): Promise<Result<Transaction, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    if (transactionData.amount <= 0) {
      return err(ServiceErr.validation('Amount must be greater than 0'));
    }

    if (transactionData.type === 'transfer' && !transactionData.destination_account_id) {
      return err(ServiceErr.validation('Destination account is required for transfers'));
    }

    if (
      transactionData.type === 'transfer' &&
      transactionData.account_id === transactionData.destination_account_id
    ) {
      return err(ServiceErr.validation('Source and destination accounts must be different'));
    }

    const id = generateId();
    console.log('[TRANSACTION] Creating transaction with ID:', id);

    const amount =
      transactionData.type === 'expense' && transactionData.amount > 0
        ? -transactionData.amount
        : transactionData.amount;

    const crdtTransaction = convertToCRDTFormat({
      ...transactionData,
      id,
      amount,
      original_amount: transactionData.amount,
      is_external: false,
      updated_at: new Date().toISOString(),
      transaction_datetime: transactionData.transaction_datetime.toISOString(),
    });

    const crdtService = getCRDTService();
    const createResult = await crdtService.create('transactions', id, crdtTransaction);
    
    if (createResult.isErr()) {
      console.error('[TRANSACTION] ❌ Error creating transaction:', createResult.error);
      return err(ServiceErr.database('Failed to create transaction', createResult.error));
    }

    await rebuildFromCRDT();

    console.log('[TRANSACTION] ✅ Transaction created:', id);
    return ok(convertFromCRDTFormat(crdtTransaction));
  };

  const updateTransaction = async (
    id: string,
    transactionData: TransactionCreate
  ): Promise<Result<Transaction, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log('[TRANSACTION] Updating transaction:', id);

    const amount =
      transactionData.type === 'expense' && transactionData.amount > 0
        ? -transactionData.amount
        : transactionData.amount;

    const crdtUpdates = convertToCRDTFormat({
      ...transactionData,
      id,
      amount,
      original_amount: transactionData.amount,
      is_external: false,
      updated_at: new Date().toISOString(),
      transaction_datetime: transactionData.transaction_datetime.toISOString(),
    });

    const { id: _id, ...updates } = crdtUpdates;

    const crdtService = getCRDTService();
    const updateResult = await crdtService.update('transactions', id, updates);
    
    if (updateResult.isErr()) {
      console.error('[TRANSACTION] ❌ Error updating transaction:', updateResult.error);
      return err(ServiceErr.database('Failed to update transaction', updateResult.error));
    }

    await rebuildFromCRDT();

    const updatedTransaction = crdtService.getById('transactions', id);

    if (!updatedTransaction) {
      return err(ServiceErr.notFound('Transaction', id));
    }

    console.log('[TRANSACTION] ✅ Transaction updated:', id);
    return ok(convertFromCRDTFormat(updatedTransaction));
  };

  const deleteTransaction = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log('[TRANSACTION] Deleting transaction:', id);

    const crdtService = getCRDTService();
    const deleteResult = await crdtService.delete('transactions', id);
    
    if (deleteResult.isErr()) {
      console.error('[TRANSACTION] ❌ Error deleting transaction:', deleteResult.error);
      return err(ServiceErr.database('Failed to delete transaction', deleteResult.error));
    }

    await rebuildFromCRDT();

    console.log('[TRANSACTION] ✅ Transaction deleted:', id);
    return ok(undefined);
  };

  const convertFromCRDTFormat = (crdtTransaction: CRDTTransaction): Transaction => {
    return {
      id: crdtTransaction.id,
      amount: crdtTransaction.amount,
      type: crdtTransaction.type,
      account_id: crdtTransaction.account_id,
      category_id: crdtTransaction.category_id ?? null,
      destination_account_id: crdtTransaction.destination_account_id ?? null,
      transaction_datetime: crdtTransaction.transaction_datetime,
      description: crdtTransaction.description,
      details: crdtTransaction.details,
      transaction_currency: crdtTransaction.transaction_currency,
      original_amount: crdtTransaction.original_amount,
      is_external: crdtTransaction.is_external,
      updated_at: crdtTransaction.updated_at,
    };
  };

  const convertToCRDTFormat = (transaction: any): CRDTTransaction => {
    return {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      account_id: transaction.account_id,
      category_id: transaction.category_id ?? undefined,
      destination_account_id: transaction.destination_account_id ?? undefined,
      transaction_datetime: transaction.transaction_datetime,
      description: transaction.description,
      details: transaction.details ?? undefined,
      transaction_currency: transaction.transaction_currency,
      original_amount: transaction.original_amount,
      is_external: transaction.is_external || false,
      created_at: transaction.created_at || new Date().toISOString(),
      updated_at: transaction.updated_at || new Date().toISOString(),
      deleted_at: transaction.deleted_at ?? undefined,
    };
  };

  const rebuildFromCRDT = async () => {
    const crdtService = getCRDTService();
    const kyselyService = getKyselyQueryService();

    const transactions = crdtService.getAll('transactions');
    const accounts = crdtService.getAll('accounts');
    const categories = crdtService.getAll('categories');
    const rules = crdtService.getAll('rules');

    await kyselyService.clearAllTables();

    for (const account of accounts) {
      await kyselyService.insertAccount({
        id: account.id,
        name: account.name,
        type: account.type as any,
        subtype: account.subtype || null,
        balance: account.balance,
        currency: account.currency,
        meta: account.meta ? JSON.stringify(account.meta) : null,
        is_external: account.is_external ? 1 : 0,
        is_active: account.is_active ? 1 : 0,
        provider_account_id: account.provider_account_id || null,
        provider_name: account.provider_name || null,
        sync_status: account.sync_status || null,
        last_synced_at: account.last_synced_at ? new Date(account.last_synced_at).getTime() : null,
        connection_id: account.connection_id || null,
        shared_finance_id: account.shared_finance_id || null,
        created_by: account.created_by || null,
        updated_by: account.updated_by || null,
        created_at: new Date(account.created_at).getTime(),
        updated_at: new Date(account.updated_at).getTime(),
        deleted_at: account.deleted_at ? new Date(account.deleted_at).getTime() : null,
      });
    }

    for (const category of categories) {
      await kyselyService.insertCategory({
        id: category.id,
        name: category.name,
        type: category.type,
        parent_id: category.parent_id || null,
        is_default: 0,
        is_active: category.is_active ? 1 : 0,
        color: category.color || null,
        icon: category.icon || 'Box',
        created_by: 'system',
        updated_by: null,
        created_at: new Date(category.created_at).getTime(),
        updated_at: new Date(category.updated_at).getTime(),
        deleted_at: category.deleted_at ? new Date(category.deleted_at).getTime() : null,
      });
    }

    for (const transaction of transactions) {
      await kyselyService.insertTransaction({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        account_id: transaction.account_id,
        category_id: transaction.category_id || null,
        destination_account_id: transaction.destination_account_id || null,
        transaction_datetime: new Date(transaction.transaction_datetime).getTime(),
        description: transaction.description,
        details: transaction.details ? JSON.stringify(transaction.details) : null,
        is_external: transaction.is_external ? 1 : 0,
        is_categorized: transaction.category_id ? 1 : 0,
        transaction_currency: transaction.transaction_currency,
        original_amount: transaction.original_amount,
        shared_finance_id: null,
        provider_transaction_id: null,
        created_by: null,
        updated_by: null,
        created_at: new Date(transaction.created_at).getTime(),
        updated_at: new Date(transaction.updated_at).getTime(),
        deleted_at: transaction.deleted_at ? new Date(transaction.deleted_at).getTime() : null,
      });
    }

    for (const rule of rules) {
      await kyselyService.insertRule({
        id: rule.id,
        name: rule.name,
        conditions: JSON.stringify(rule.conditions),
        actions: JSON.stringify(rule.actions),
        priority: rule.priority,
        is_active: rule.is_active ? 1 : 0,
        created_by: rule.created_by,
        updated_by: rule.updated_by || null,
        created_at: new Date(rule.created_at).getTime(),
        updated_at: new Date(rule.updated_at).getTime(),
        deleted_at: rule.deleted_at ? new Date(rule.deleted_at).getTime() : null,
      });
    }
  };

  return {
    initialize,
    getTransactions,
    getTransactionById,
    getRecentTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export const transactionService = createTransactionService();
