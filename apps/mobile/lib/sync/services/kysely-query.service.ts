import { Kysely } from 'kysely';
import type {
  Database,
  DBAccount,
  DBCategory,
  DBTransaction,
  DBPreference,
  DBTag,
  DBBudget,
  DBRule,
  DBNewAccount,
  DBNewCategory,
  DBNewTransaction,
  DBNewPreference,
  DBNewTag,
  DBNewBudget,
  DBNewRule,
  DBAccountUpdate,
  DBCategoryUpdate,
  DBTransactionUpdate,
  DBPreferenceUpdate,
  DBTagUpdate,
  DBBudgetUpdate,
  DBRuleUpdate,
} from '@nuts/types/storage';

export class KyselyQueryService {
  constructor(private kysely: Kysely<Database>) {}

  getKysely(): Kysely<Database> {
    return this.kysely;
  }

  async getAllTransactions(): Promise<DBTransaction[]> {
    return await this.kysely
      .selectFrom('transactions')
      .selectAll()
      .where('deleted_at', 'is', null)
      .execute();
  }

  async getAccountById(id: string): Promise<DBAccount | null> {
    const account = await this.kysely
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return account || null;
  }

  async getAllAccounts(): Promise<DBAccount[]> {
    return await this.kysely
      .selectFrom('accounts')
      .selectAll()
      .where('deleted_at', 'is', null)
      .execute();
  }

  async getActiveAccounts(): Promise<DBAccount[]> {
    return await this.kysely
      .selectFrom('accounts')
      .selectAll()
      .where('deleted_at', 'is', null)
      .where('is_active', '=', 1)
      .execute();
  }

  async getCategoryById(id: string): Promise<DBCategory | null> {
    const category = await this.kysely
      .selectFrom('categories')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return category || null;
  }

  async getAllCategories(): Promise<DBCategory[]> {
    return await this.kysely
      .selectFrom('categories')
      .selectAll()
      .where('deleted_at', 'is', null)
      .execute();
  }

  async getTransactionById(id: string): Promise<DBTransaction | null> {
    const transaction = await this.kysely
      .selectFrom('transactions')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return transaction || null;
  }

  async getTransactionsByAccountId(accountId: string): Promise<DBTransaction[]> {
    return await this.kysely
      .selectFrom('transactions')
      .selectAll()
      .where('account_id', '=', accountId)
      .where('deleted_at', 'is', null)
      .orderBy('transaction_datetime', 'desc')
      .execute();
  }

  async getRecentTransactions(limit: number = 50): Promise<DBTransaction[]> {
    return await this.kysely
      .selectFrom('transactions')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('transaction_datetime', 'desc')
      .limit(limit)
      .execute();
  }

  async getPreferenceByUserId(userId: string): Promise<DBPreference | null> {
    const preference = await this.kysely
      .selectFrom('preferences')
      .selectAll()
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return preference || null;
  }

  async getAllTags(): Promise<DBTag[]> {
    return await this.kysely.selectFrom('tags').selectAll().execute();
  }

  async getAllBudgets(): Promise<DBBudget[]> {
    return await this.kysely
      .selectFrom('budgets')
      .selectAll()
      .where('deleted_at', 'is', null)
      .execute();
  }

  async getActiveBudgets(): Promise<DBBudget[]> {
    const now = Date.now();
    return await this.kysely
      .selectFrom('budgets')
      .selectAll()
      .where('deleted_at', 'is', null)
      .where('start_date', '<=', now)
      .where('end_date', '>=', now)
      .execute();
  }

  async getAllRules(): Promise<DBRule[]> {
    return await this.kysely
      .selectFrom('rules')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('priority', 'asc')
      .execute();
  }

  async getActiveRules(): Promise<DBRule[]> {
    return await this.kysely
      .selectFrom('rules')
      .selectAll()
      .where('deleted_at', 'is', null)
      .where('is_active', '=', 1)
      .orderBy('priority', 'asc')
      .execute();
  }

  async insertAccount(account: DBNewAccount): Promise<void> {
    await this.kysely.insertInto('accounts').values(account).execute();
  }

  async updateAccount(id: string, updates: DBAccountUpdate): Promise<void> {
    await this.kysely.updateTable('accounts').set(updates).where('id', '=', id).execute();
  }

  async deleteAccount(id: string): Promise<void> {
    await this.kysely
      .updateTable('accounts')
      .set({ deleted_at: Date.now() })
      .where('id', '=', id)
      .execute();
  }

  async insertCategory(category: DBNewCategory): Promise<void> {
    await this.kysely.insertInto('categories').values(category).execute();
  }

  async updateCategory(id: string, updates: DBCategoryUpdate): Promise<void> {
    await this.kysely.updateTable('categories').set(updates).where('id', '=', id).execute();
  }

  async deleteCategory(id: string): Promise<void> {
    await this.kysely
      .updateTable('categories')
      .set({ deleted_at: Date.now() })
      .where('id', '=', id)
      .execute();
  }

  async insertTransaction(transaction: DBNewTransaction): Promise<void> {
    await this.kysely.insertInto('transactions').values(transaction).execute();
  }

  async updateTransaction(id: string, updates: DBTransactionUpdate): Promise<void> {
    await this.kysely.updateTable('transactions').set(updates).where('id', '=', id).execute();
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.kysely
      .updateTable('transactions')
      .set({ deleted_at: Date.now() })
      .where('id', '=', id)
      .execute();
  }

  async insertPreference(preference: DBNewPreference): Promise<void> {
    await this.kysely.insertInto('preferences').values(preference).execute();
  }

  async updatePreference(id: string, updates: DBPreferenceUpdate): Promise<void> {
    await this.kysely.updateTable('preferences').set(updates).where('id', '=', id).execute();
  }

  async insertTag(tag: DBNewTag): Promise<void> {
    await this.kysely.insertInto('tags').values(tag).execute();
  }

  async updateTag(id: string, updates: DBTagUpdate): Promise<void> {
    await this.kysely.updateTable('tags').set(updates).where('id', '=', id).execute();
  }

  async deleteTag(id: string): Promise<void> {
    await this.kysely.deleteFrom('tags').where('id', '=', id).execute();
  }

  async insertBudget(budget: DBNewBudget): Promise<void> {
    await this.kysely.insertInto('budgets').values(budget).execute();
  }

  async updateBudget(id: string, updates: DBBudgetUpdate): Promise<void> {
    await this.kysely.updateTable('budgets').set(updates).where('id', '=', id).execute();
  }

  async deleteBudget(id: string): Promise<void> {
    await this.kysely
      .updateTable('budgets')
      .set({ deleted_at: Date.now() })
      .where('id', '=', id)
      .execute();
  }

  async insertRule(rule: DBNewRule): Promise<void> {
    await this.kysely.insertInto('rules').values(rule).execute();
  }

  async updateRule(id: string, updates: DBRuleUpdate): Promise<void> {
    await this.kysely.updateTable('rules').set(updates).where('id', '=', id).execute();
  }

  async deleteRule(id: string): Promise<void> {
    await this.kysely
      .updateTable('rules')
      .set({ deleted_at: Date.now() })
      .where('id', '=', id)
      .execute();
  }

  async clearAllTables(): Promise<void> {
    await this.kysely.deleteFrom('rules').execute();
    await this.kysely.deleteFrom('budgets').execute();
    await this.kysely.deleteFrom('tags').execute();
    await this.kysely.deleteFrom('transactions').execute();
    await this.kysely.deleteFrom('preferences').execute();
    await this.kysely.deleteFrom('categories').execute();
    await this.kysely.deleteFrom('accounts').execute();
  }
}
