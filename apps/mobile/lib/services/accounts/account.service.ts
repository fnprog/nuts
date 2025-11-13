import { getCRDTService, getKyselyQueryService } from '@/lib/sync';
import type { CRDTAccount } from '@nuts/types';
import type {
  Account,
  AccountCreate,
  AccountWTrend,
  AccountBalanceTimeline,
  Result,
  ServiceError,
} from './account.types';
import { ok, err, ServiceErrorFactory as ServiceErr } from './account.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createAccountService() {
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
    const initResult = await crdtService.initialize();
    
    if (initResult.isErr()) {
      console.error('❌ Failed to initialize account service:', initResult.error);
      return err(ServiceErr.initialization('Failed to initialize account service', initResult.error));
    }

    isInitialized = true;
    console.log('✅ Account service initialized');
    return ok(undefined);
  };

  const getAccounts = async (): Promise<Result<Account[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtService = getCRDTService();
    const crdtAccounts = crdtService.getAll('accounts');
    const accounts = crdtAccounts
      .map((crdtAccount: CRDTAccount) => convertFromCRDTFormat(crdtAccount))
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok(accounts);
  };

  const getAccountsWTrends = async (): Promise<Result<AccountWTrend[], ServiceError>> => {
    const accountsResult = await getAccounts();
    if (accountsResult.isErr()) return err(accountsResult.error);

    const now = Date.now();
    const startDate = now - 30 * 24 * 60 * 60 * 1000;

    const accountsWithTrends = await Promise.all(
      accountsResult.value.map(async (account: Account) => {
        const trendData = await calculateAccountTrend(account.id, startDate, now);
        return {
          ...account,
          trend: trendData.trend,
          balance_timeseries: trendData.timeseries,
        };
      })
    );

    return ok(accountsWithTrends);
  };

  const calculateAccountTrend = async (
    accountId: string,
    startDate: number,
    endDate: number
  ): Promise<{
    trend: number;
    timeseries: { date: Date; balance: number }[];
  }> => {
    try {
      const kyselyService = getKyselyQueryService();
      const db = kyselyService.getKysely();

      const transactions = await db
        .selectFrom('transactions')
        .selectAll()
        .where((eb: any) =>
          eb.or([
            eb('transactions.account_id', '=', accountId),
            eb('transactions.destination_account_id', '=', accountId),
          ])
        )
        .where('transactions.transaction_datetime', '>=', startDate)
        .where('transactions.transaction_datetime', '<=', endDate)
        .where('transactions.deleted_at', 'is', null)
        .orderBy('transactions.transaction_datetime', 'asc')
        .execute();

      let startBalance = 0;
      let currentBalance = 0;
      const dailyBalances = new Map<string, number>();

      for (const tx of transactions) {
        let amount = 0;

        if (tx.type === 'income' && tx.account_id === accountId) {
          amount = tx.amount;
        } else if (tx.type === 'expense' && tx.account_id === accountId) {
          amount = -tx.amount;
        } else if (tx.type === 'transfer' && tx.account_id === accountId) {
          amount = -tx.amount;
        } else if (tx.type === 'transfer' && tx.destination_account_id === accountId) {
          amount = tx.amount;
        }

        currentBalance += amount;

        const date = new Date(tx.transaction_datetime).toISOString().split('T')[0];
        dailyBalances.set(date, currentBalance);
      }

      const endBalance = currentBalance;

      const trend =
        startBalance === 0
          ? endBalance > 0
            ? 100
            : endBalance < 0
              ? -100
              : 0
          : ((endBalance - startBalance) / Math.abs(startBalance)) * 100;

      const timeseries = Array.from(dailyBalances.entries()).map(([date, balance]) => ({
        date: new Date(date),
        balance,
      }));

      return { trend, timeseries };
    } catch (error) {
      console.error('Error calculating account trend:', error);
      return { trend: 0, timeseries: [] };
    }
  };

  const getAccountsBalanceTimeline = async (): Promise<
    Result<AccountBalanceTimeline[], ServiceError>
  > => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    try {
      const kyselyService = getKyselyQueryService();
      const db = kyselyService.getKysely();
      const now = Date.now();
      const startMonth = now - 11 * 30 * 24 * 60 * 60 * 1000;

      const accounts = await db
        .selectFrom('accounts')
        .selectAll()
        .where('accounts.deleted_at', 'is', null)
        .execute();

      const monthlyBalances = new Map<string, number>();

      for (const account of accounts) {
        const transactions = await db
          .selectFrom('transactions')
          .selectAll()
          .where((eb: any) =>
            eb.or([
              eb('transactions.account_id', '=', account.id),
              eb('transactions.destination_account_id', '=', account.id),
            ])
          )
          .where('transactions.transaction_datetime', '>=', startMonth)
          .where('transactions.deleted_at', 'is', null)
          .orderBy('transactions.transaction_datetime', 'asc')
          .execute();

        for (const tx of transactions) {
          let amount = 0;

          if (tx.type === 'income' && tx.account_id === account.id) {
            amount = tx.amount;
          } else if (tx.type === 'expense' && tx.account_id === account.id) {
            amount = -tx.amount;
          } else if (tx.type === 'transfer' && tx.account_id === account.id) {
            amount = -tx.amount;
          } else if (tx.type === 'transfer' && tx.destination_account_id === account.id) {
            amount = tx.amount;
          }

          const monthKey = new Date(tx.transaction_datetime).toISOString().slice(0, 7);
          monthlyBalances.set(monthKey, (monthlyBalances.get(monthKey) || 0) + amount);
        }
      }

      const timeline: AccountBalanceTimeline[] = [];
      let cumulativeBalance = 0;

      const sortedMonths = Array.from(monthlyBalances.keys()).sort();

      for (const month of sortedMonths) {
        cumulativeBalance += monthlyBalances.get(month) || 0;
        timeline.push({
          month: new Date(month + '-01'),
          balance: cumulativeBalance,
        });
      }

      return ok(timeline);
    } catch (error) {
      console.error('Error calculating balance timeline:', error);
      return err(ServiceErr.database('Failed to calculate balance timeline', error));
    }
  };

  const createAccount = async (
    accountData: AccountCreate
  ): Promise<Result<Account, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const id = generateId();
    console.log('[ACCOUNT] Creating account with ID:', id);

    const crdtAccount = convertToCRDTFormat({
      ...accountData,
      id,
      is_external: false,
      updated_at: new Date().toISOString(),
    });

    const crdtService = getCRDTService();
    const createResult = await crdtService.create('accounts', id, crdtAccount);
    
    if (createResult.isErr()) {
      console.error('[ACCOUNT] ❌ Error creating account:', createResult.error);
      return err(ServiceErr.database('Failed to create account', createResult.error));
    }

    await rebuildFromCRDT();

    console.log('[ACCOUNT] ✅ Account created:', id);
    return ok(convertFromCRDTFormat(crdtAccount));
  };

  const updateAccount = async (
    id: string,
    accountData: AccountCreate
  ): Promise<Result<Account, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log('[ACCOUNT] Updating account:', id);

    const crdtUpdates = convertToCRDTFormat({
      ...accountData,
      id,
      is_external: false,
      updated_at: new Date().toISOString(),
    });

    const { id: _id, ...updates } = crdtUpdates;

    const crdtService = getCRDTService();
    const updateResult = await crdtService.update('accounts', id, updates);
    
    if (updateResult.isErr()) {
      console.error('[ACCOUNT] ❌ Error updating account:', updateResult.error);
      return err(ServiceErr.database('Failed to update account', updateResult.error));
    }

    await rebuildFromCRDT();

    const updatedAccount = crdtService.getById('accounts', id);

    if (!updatedAccount) {
      return err(ServiceErr.notFound('Account', id));
    }

    console.log('[ACCOUNT] ✅ Account updated:', id);
    return ok(convertFromCRDTFormat(updatedAccount));
  };

  const deleteAccount = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log('[ACCOUNT] Deleting account:', id);

    const crdtService = getCRDTService();
    const deleteResult = await crdtService.delete('accounts', id);
    
    if (deleteResult.isErr()) {
      console.error('[ACCOUNT] ❌ Error deleting account:', deleteResult.error);
      return err(ServiceErr.database('Failed to delete account', deleteResult.error));
    }

    await rebuildFromCRDT();

    console.log('[ACCOUNT] ✅ Account deleted:', id);
    return ok(undefined);
  };

  const linkTellerAccount = async (_payload: any): Promise<Result<void, ServiceError>> => {
    return err(ServiceErr.unavailable('External account linking'));
  };

  const linkMonoAccount = async (_payload: any): Promise<Result<void, ServiceError>> => {
    return err(ServiceErr.unavailable('External account linking'));
  };

  const convertFromCRDTFormat = (crdtAccount: CRDTAccount): Account => {
    return {
      id: crdtAccount.id,
      name: crdtAccount.name,
      type: crdtAccount.type as any,
      balance: crdtAccount.balance,
      currency: crdtAccount.currency,
      is_external: crdtAccount.is_external,
      updated_at: crdtAccount.updated_at,
      meta: crdtAccount.meta || null,
    };
  };

  const convertToCRDTFormat = (account: any): CRDTAccount => {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      subtype: account.subtype ?? null,
      currency: account.currency,
      balance: account.balance || 0,
      meta: account.meta ?? null,
      is_active: true,
      is_external: account.is_external || false,
      provider_account_id: account.provider_account_id ?? null,
      provider_name: account.provider_name ?? null,
      sync_status: account.sync_status ?? null,
      last_synced_at: account.last_synced_at ?? null,
      connection_id: account.connection_id ?? null,
      shared_finance_id: account.shared_finance_id ?? null,
      created_by: account.created_by ?? null,
      updated_by: account.updated_by ?? null,
      created_at: account.created_at || new Date().toISOString(),
      updated_at: account.updated_at || new Date().toISOString(),
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
    getAccounts,
    getAccountsWTrends,
    getAccountsBalanceTimeline,
    createAccount,
    updateAccount,
    deleteAccount,
    linkTellerAccount,
    linkMonoAccount,
  };
}

export const accountService = createAccountService();
