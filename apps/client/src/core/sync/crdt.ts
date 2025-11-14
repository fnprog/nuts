import { next as Automerge } from "@automerge/automerge";
import { CRDTDocument, CRDTTransaction, CRDTAccount, CRDTCategory, CRDTBudget, CRDTTag, CRDTPreference, CRDTRule } from "@nuts/types";
import { anonymousUserService } from "@/features/auth/services/anonymous-user.service";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { Result, ok, err, ResultAsync } from "@/lib/result";
import { ServiceError } from "@/lib/service-error";
import { logger } from "@/lib/logger";
import { crdtStorage } from "./crdt-storage";


/**
 * CRDT Service for Offline-First Architecture
 *
 * Handles Automerge document operations, persistence, and synchronization.
 * This service manages the CRDT document lifecycle and provides APIs for
 * local-first data operations.
 */

//NOTE: Should we turn it into an event thing ?
class CRDTService {
  private readonly CURRENT_VERSION = "1.0.0";
  private doc: Automerge.Doc<CRDTDocument> | null = null;
  private currentUserId: string | null = null;
  private operationQueue: Promise<any> = Promise.resolve();

  private getCurrentUserId(): string {
    const authStore = useAuthStore.getState();
    return authStore.isAuthenticated && authStore.user?.id
      ? authStore.user.id
      : anonymousUserService.getUserId();
  }

  private migrateDocument(doc: Automerge.Doc<CRDTDocument>): Automerge.Doc<CRDTDocument> {
    const currentVersion = doc.version;
    
    if (currentVersion === this.CURRENT_VERSION) {
      return doc;
    }

    logger.info(`Migrating CRDT document from version ${currentVersion} to ${this.CURRENT_VERSION}`);

    let migratedDoc = doc;

    migratedDoc = Automerge.change(migratedDoc, (draft) => {
      draft.version = this.CURRENT_VERSION;
      draft.updated_at = new Date().toISOString();
    });

    logger.info("CRDT document migration completed");
    return migratedDoc;
  }

  async initialize(): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        const userId = this.getCurrentUserId();
        this.currentUserId = userId;

        const migrateResult = await crdtStorage.migrateFromLocalStorage(userId);

        if (migrateResult.isErr()) {
          logger.warn("Failed to migrate from localStorage:", migrateResult.error);
        } else if (migrateResult.value) {
          logger.info("Successfully migrated CRDT document from localStorage");
        }

        const loadResult = await crdtStorage.loadDocument(userId);

        if (loadResult.isErr()) {
          throw loadResult.error;
        }

        if (loadResult.value) {
          this.doc = Automerge.load(loadResult.value);
          logger.info("Loaded existing CRDT document from database for user:", userId);

          this.doc = this.migrateDocument(this.doc);

          const persistResult = await this.persist();
          if (persistResult.isErr()) {
            logger.warn("Failed to persist migrated document:", persistResult.error);
          }

          return
        }

        this.doc = Automerge.from<CRDTDocument>({
          version: this.CURRENT_VERSION,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userId,
          transactions: {},
          accounts: {},
          categories: {},
          budgets: {},
          tags: {},
          preferences: {},
          rules: {},
          recurring_transactions: {},
          notifications: {},
          plugins: {},
          plugin_data: {},
          plugin_migrations: {},
          indices: {
            version: 1,
          },
        });

        logger.info("Created new CRDT document for user:", userId);
        const persistResult = await this.persist();

        if (persistResult.isErr()) {
          throw persistResult.error;
        }

      })(),
      (error) => {
        logger.error("Failed to initialize CRDT document:", error);
        return ServiceError.initialization("Failed to initialize CRDT document", error);
      }
    );
  }

  /**
   * Get the current document state
   */
  getDocument(): CRDTDocument | null {
    if (!this.doc) return null;
    return JSON.parse(JSON.stringify(this.doc)); // Deep clone
  }


  async persist(): Promise<Result<void, ServiceError>> {
    if (!this.doc) return ok(undefined);

    const userId = this.currentUserId || this.getCurrentUserId();

    return ResultAsync.fromPromise(
      (async () => {
        const binaryDoc = Automerge.save(this.doc!);
        const saveResult = await crdtStorage.saveDocument(userId, binaryDoc);

        if (saveResult.isErr()) {
          throw saveResult.error;
        }
      })(),
      (error) => {
        logger.error("Failed to persist CRDT document:", error);
        return ServiceError.storage("Failed to persist CRDT document", error);
      }
    );
  }

  private async withMutationLock<T>(fn: () => Promise<T>): Promise<T> {
    const previousOperation = this.operationQueue;

    let resolver: (value: T) => void;
    let rejecter: (error: any) => void;

    this.operationQueue = new Promise<T>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    try {
      await previousOperation; // Wait for previous operation
      const result = await fn();
      resolver!(result);
      return result;
    } catch (error) {
      rejecter!(error);
      throw error;
    }
  }


  /**
   * Create a new transaction in the CRDT document
   */
  async createTransaction(transaction: Omit<CRDTTransaction, "created_at" | "updated_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {

      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const transactionWithTimestamps: CRDTTransaction = {
        ...transaction,
        created_at: timestamp,
        updated_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        doc.transactions[transaction.id] = transactionWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();

      if (persistResult.isErr()) {
        logger.error("Failed to persist transaction:", persistResult.error);
        return err(persistResult.error);
      }

      this.notifySyncService("create", "transaction", transactionWithTimestamps);

      return ok(transaction.id);
    })
  }

  async updateTransaction(id: string, updates: Partial<CRDTTransaction>): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.transactions[id]) {
          const tx = doc.transactions[id] as any;

          for (const [key, value] of Object.entries(updates)) {
            tx[key] = value;
          }

          tx.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();

      if (persistResult.isErr()) {
        logger.error("Failed to persist transaction update:", persistResult.error);
        return err(persistResult.error);
      }

      const updatedTransaction = this.getTransaction(id);

      if (updatedTransaction) {
        this.notifySyncService("update", "transaction", updatedTransaction);
      }

      return ok(undefined);
    });
  }

  async deleteTransaction(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.transactions[id]) {
          (doc.transactions[id] as any).deleted_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();

      if (persistResult.isErr()) {
        logger.error("Failed to persist transaction deletion:", persistResult.error);
        return err(persistResult.error);
      }

      const deletedTransaction = this.getTransaction(id);

      if (deletedTransaction) {
        this.notifySyncService("delete", "transaction", { id, deleted_at: timestamp });
      }

      return ok(undefined);
    });
  }

  /**
   * Get all active (non-deleted) transactions
   * NOTE: Do we need caching ? or will tanstack handle it ?
   */
  getTransactions(): Record<string, CRDTTransaction> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const transactions: Record<string, CRDTTransaction> = {};

    for (const [id, transaction] of Object.entries(currentDoc.transactions || {})) {
      const tx = transaction as CRDTTransaction;
      if (!tx.deleted_at) {
        transactions[id] = tx;
      }
    }

    return transactions;
  }

  /**
   * Get a specific transaction by ID
   */
  getTransaction(id: string): CRDTTransaction | null {
    if (!this.doc) return null;

    const currentDoc = this.doc as any;
    const transaction = currentDoc.transactions?.[id] as CRDTTransaction;

    return transaction && !transaction.deleted_at ? transaction : null;
  }

  async createAccount(account: Omit<CRDTAccount, "created_at" | "updated_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      logger.info("[CRDT] createAccount called:", account.id);
      const timestamp = new Date().toISOString();
      const accountWithTimestamps: CRDTAccount = {
        ...account,
        created_at: timestamp,
        updated_at: timestamp,
      };

      logger.info("[CRDT] Step 1: Adding account to Automerge document...");
      this.doc = Automerge.change(this.doc, (doc) => {
        doc.accounts[account.id] = accountWithTimestamps;
        doc.updated_at = timestamp;
      });
      logger.info("[CRDT] Step 2: Account added to CRDT, total accounts:", Object.keys(this.doc.accounts).length);

      logger.info("[CRDT] Step 3: Persisting to database...");
      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist account:", persistResult.error);
        return err(persistResult.error);
      }
      logger.info("[CRDT] Step 4: Persisted successfully");

      logger.info("[CRDT] Step 5: Notifying sync service...");
      this.notifySyncService("create", "account", accountWithTimestamps);
      logger.info("[CRDT] ✅ createAccount complete, returning ID:", account.id);

      return ok(account.id);
    });
  }

  async updateAccount(id: string, updates: Partial<CRDTAccount>): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      logger.info("[CRDT] updateAccount called:", id, "updates:", updates);
      const timestamp = new Date().toISOString();

      logger.info("[CRDT] Step 1: Updating account in Automerge document...");
      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.accounts[id]) {
          const tx = doc.accounts[id] as any;

          for (const [key, value] of Object.entries(updates)) {
            tx[key] = value;
          }

          tx.updated_at = timestamp;
          doc.updated_at = timestamp;

        }
      });
      logger.info("[CRDT] Step 2: Account updated in CRDT");

      logger.info("[CRDT] Step 3: Persisting to database...");
      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist account update:", persistResult.error);
        return err(persistResult.error);
      }
      logger.info("[CRDT] Step 4: Persisted successfully");

      if (this.doc.accounts[id]) {
        logger.info("[CRDT] Step 5: Notifying sync service...");
        this.notifySyncService("update", "account", this.doc.accounts[id]);
        logger.info("[CRDT] ✅ updateAccount complete");
      }

      return ok(undefined);
    });
  }

  getAccounts(): Record<string, CRDTAccount> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const accounts: Record<string, CRDTAccount> = {};

    for (const [id, account] of Object.entries(currentDoc.accounts || {})) {
      const acc = account as CRDTAccount;
      if (!acc.deleted_at) {
        accounts[id] = acc;
      }
    }

    return accounts;
  }

  async createCategory(category: Omit<CRDTCategory, "created_at" | "updated_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const categoryWithTimestamps: CRDTCategory = {
        ...category,
        created_at: timestamp,
        updated_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        doc.categories[category.id] = categoryWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist category:", persistResult.error);
        return err(persistResult.error);
      }

      this.notifySyncService("create", "category", categoryWithTimestamps);

      return ok(category.id);
    });
  }

  async updateCategory(id: string, updates: Partial<CRDTCategory>): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.categories[id]) {

          const tx = doc.categories[id] as any;

          for (const [key, value] of Object.entries(updates)) {
            tx[key] = value;
          }

          tx.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist category update:", persistResult.error);
        return err(persistResult.error);
      }

      const currentDoc = this.doc as any;
      const updatedCategory = currentDoc.categories?.[id];
      if (updatedCategory) {
        this.notifySyncService("update", "category", updatedCategory);
      }

      return ok(undefined);
    });
  }

  async deleteCategory(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.categories[id]) {
          (doc.categories[id] as any).deleted_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist category deletion:", persistResult.error);
        return err(persistResult.error);
      }

      this.notifySyncService("delete", "category", { id, deleted_at: timestamp });

      return ok(undefined);
    });
  }

  getCategories(): Record<string, CRDTCategory> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const categories: Record<string, CRDTCategory> = {};

    for (const [id, category] of Object.entries(currentDoc.categories || {})) {
      const cat = category as CRDTCategory;
      if (!cat.deleted_at) {
        categories[id] = cat;
      }
    }

    return categories;
  }

  async createBudget(budget: Omit<CRDTBudget, "created_at" | "updated_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const budgetWithTimestamps: CRDTBudget = {
        ...budget,
        created_at: timestamp,
        updated_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        doc.budgets[budget.id] = budgetWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist budget:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(budget.id);
    });
  }

  async updateBudget(id: string, updates: Partial<CRDTBudget>): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.budgets[id]) {

          const tx = doc.budgets[id] as any;

          for (const [key, value] of Object.entries(updates)) {
            tx[key] = value;
          }

          tx.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist budget update:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  getBudgets(): Record<string, CRDTBudget> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const budgets: Record<string, CRDTBudget> = {};

    for (const [id, budget] of Object.entries(currentDoc.budgets || {})) {
      budgets[id] = budget as CRDTBudget;
    }

    return budgets;
  }

  async createTag(tag: Omit<CRDTTag, "created_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const tagWithTimestamp: CRDTTag = {
        ...tag,
        created_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        doc.tags[tag.id] = tagWithTimestamp;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist tag:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(tag.id);
    });
  }

  getTags(): Record<string, CRDTTag> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    return (currentDoc.tags || {}) as Record<string, CRDTTag>;
  }

  async createPreference(preference: Omit<CRDTPreference, "created_at" | "updated_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const preferenceWithTimestamps: CRDTPreference = {
        ...preference,
        created_at: timestamp,
        updated_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        doc.preferences[preference.id] = preferenceWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist preference:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(preference.id);
    });
  }

  async updatePreference(id: string, updates: Partial<CRDTPreference>): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.preferences[id]) {
          const tx = doc.preferences[id] as any;

          for (const [key, value] of Object.entries(updates)) {
            tx[key] = value;
          }

          tx.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist preference update:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  getPreferences(): Record<string, CRDTPreference> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const preferences: Record<string, CRDTPreference> = {};

    for (const [id, preference] of Object.entries(currentDoc.preferences || {})) {
      const pref = preference as CRDTPreference;
      if (!pref.deleted_at) {
        preferences[id] = pref;
      }
    }

    return preferences;
  }

  async createRule(rule: Omit<CRDTRule, "created_at" | "updated_at">): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      logger.info("[CRDT] createRule called:", rule.id);
      const timestamp = new Date().toISOString();
      const ruleWithTimestamps: CRDTRule = {
        ...rule,
        created_at: timestamp,
        updated_at: timestamp,
      };

      logger.info("[CRDT] Step 1: Adding rule to Automerge document...");
      this.doc = Automerge.change(this.doc, (doc) => {
        doc.rules[rule.id] = ruleWithTimestamps;
        doc.updated_at = timestamp;
      });
      logger.info("[CRDT] Step 2: Rule added to CRDT, total rules:", Object.keys(this.doc.rules).length);

      logger.info("[CRDT] Step 3: Persisting to database...");
      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist rule:", persistResult.error);
        return err(persistResult.error);
      }
      logger.info("[CRDT] Step 4: Persisted successfully");

      logger.info("[CRDT] Step 5: Notifying sync service...");
      this.notifySyncService("create", "rule", ruleWithTimestamps);
      logger.info("[CRDT] ✅ createRule complete, returning ID:", rule.id);

      return ok(rule.id);
    });
  }

  async updateRule(id: string, updates: Partial<CRDTRule>): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      logger.info("[CRDT] updateRule called:", id, "updates:", updates);
      const timestamp = new Date().toISOString();

      logger.info("[CRDT] Step 1: Updating rule in Automerge document...");
      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.rules[id]) {
          const tx = doc.rules[id] as any;

          for (const [key, value] of Object.entries(updates)) {
            tx[key] = value;
          }

          tx.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });
      logger.info("[CRDT] Step 2: Rule updated in CRDT");

      logger.info("[CRDT] Step 3: Persisting to database...");
      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist rule update:", persistResult.error);
        return err(persistResult.error);
      }
      logger.info("[CRDT] Step 4: Persisted successfully");

      if (this.doc.rules[id]) {
        logger.info("[CRDT] Step 5: Notifying sync service...");
        this.notifySyncService("update", "rule", this.doc.rules[id]);
        logger.info("[CRDT] ✅ updateRule complete");
      }

      return ok(undefined);
    });
  }

  async deleteRule(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      logger.info("[CRDT] deleteRule called:", id);
      const timestamp = new Date().toISOString();

      logger.info("[CRDT] Step 1: Soft deleting rule in Automerge document...");
      this.doc = Automerge.change(this.doc, (doc) => {
        if (doc.rules[id]) {
          (doc.rules[id] as any).deleted_at = timestamp;
          doc.updated_at = timestamp;
        }
      });
      logger.info("[CRDT] Step 2: Rule soft deleted in CRDT");

      logger.info("[CRDT] Step 3: Persisting to database...");
      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist rule deletion:", persistResult.error);
        return err(persistResult.error);
      }
      logger.info("[CRDT] Step 4: Persisted successfully");

      logger.info("[CRDT] Step 5: Notifying sync service...");
      this.notifySyncService("delete", "rule", { id, deleted_at: timestamp });
      logger.info("[CRDT] ✅ deleteRule complete");

      return ok(undefined);
    });
  }

  getRules(): Record<string, CRDTRule> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const rules: Record<string, CRDTRule> = {};

    for (const [id, rule] of Object.entries(currentDoc.rules || {})) {
      const r = rule as CRDTRule;
      if (!r.deleted_at) {
        rules[id] = r;
      }
    }

    return rules;
  }

  getRule(id: string): CRDTRule | null {
    if (!this.doc) return null;

    const currentDoc = this.doc as any;
    const rule = currentDoc.rules?.[id] as CRDTRule;

    return rule && !rule.deleted_at ? rule : null;
  }

  async createRecurringTransaction(recurring: any): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const recurringWithTimestamps = {
        ...recurring,
        created_at: timestamp,
        updated_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        (doc as any).recurring_transactions[recurring.id] = recurringWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist recurring transaction:", persistResult.error);
        return err(persistResult.error);
      }

      this.notifySyncService("create", "transaction", recurringWithTimestamps);
      return ok(recurring.id);
    });
  }

  async updateRecurringTransaction(id: string, updates: any): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const recurring = (doc as any).recurring_transactions[id];
        if (recurring) {
          for (const [key, value] of Object.entries(updates)) {
            recurring[key] = value;
          }
          recurring.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist recurring transaction update:", persistResult.error);
        return err(persistResult.error);
      }

      const updatedRecurring = this.getRecurringTransaction(id);
      if (updatedRecurring) {
        this.notifySyncService("update", "transaction", updatedRecurring);
      }

      return ok(undefined);
    });
  }

  async deleteRecurringTransaction(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const recurring = (doc as any).recurring_transactions[id];
        if (recurring) {
          recurring.deleted_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist recurring transaction deletion:", persistResult.error);
        return err(persistResult.error);
      }

      this.notifySyncService("delete", "transaction", { id, deleted_at: timestamp });
      return ok(undefined);
    });
  }

  getRecurringTransactions(): Record<string, any> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const recurring: Record<string, any> = {};

    for (const [id, rt] of Object.entries(currentDoc.recurring_transactions || {})) {
      const r = rt as any;
      if (!r.deleted_at) {
        recurring[id] = r;
      }
    }

    return recurring;
  }

  getRecurringTransaction(id: string): any | null {
    if (!this.doc) return null;

    const currentDoc = this.doc as any;
    const recurring = currentDoc.recurring_transactions?.[id];

    return recurring && !recurring.deleted_at ? recurring : null;
  }

  async createNotification(notification: any): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const notificationWithTimestamps = {
        ...notification,
        created_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        (doc as any).notifications[notification.id] = notificationWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist notification:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(notification.id);
    });
  }

  async updateNotification(id: string, updates: any): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const notification = (doc as any).notifications[id];
        if (notification) {
          for (const [key, value] of Object.entries(updates)) {
            notification[key] = value;
          }
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist notification update:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  async deleteNotification(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const notification = (doc as any).notifications[id];
        if (notification) {
          notification.deleted_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist notification deletion:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  getNotifications(): Record<string, any> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const notifications: Record<string, any> = {};

    for (const [id, notif] of Object.entries(currentDoc.notifications || {})) {
      const n = notif as any;
      if (!n.deleted_at) {
        notifications[id] = n;
      }
    }

    return notifications;
  }

  getNotification(id: string): any | null {
    if (!this.doc) return null;

    const currentDoc = this.doc as any;
    const notification = currentDoc.notifications?.[id];

    return notification && !notification.deleted_at ? notification : null;
  }

  async createPlugin(plugin: any): Promise<Result<string, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const pluginWithTimestamps = {
        ...plugin,
        installed_at: timestamp,
        updated_at: timestamp,
      };

      this.doc = Automerge.change(this.doc, (doc) => {
        if (!(doc as any).plugins) {
          (doc as any).plugins = {};
        }
        if (!(doc as any).plugin_data) {
          (doc as any).plugin_data = {};
        }
        if (!(doc as any).plugin_migrations) {
          (doc as any).plugin_migrations = {};
        }
        (doc as any).plugins[plugin.id] = pluginWithTimestamps;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist plugin:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(plugin.id);
    });
  }

  async updatePlugin(id: string, updates: any): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const docAny = doc as any;
        if (docAny.plugins && docAny.plugins[id]) {
          const plugin = docAny.plugins[id];
          for (const [key, value] of Object.entries(updates)) {
            plugin[key] = value;
          }
          plugin.updated_at = timestamp;
          doc.updated_at = timestamp;
        }
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist plugin update:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  async deletePlugin(id: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const docAny = doc as any;
        if (docAny.plugins && docAny.plugins[id]) {
          delete docAny.plugins[id];
        }
        if (docAny.plugin_data && docAny.plugin_data[id]) {
          delete docAny.plugin_data[id];
        }
        if (docAny.plugin_migrations && docAny.plugin_migrations[id]) {
          delete docAny.plugin_migrations[id];
        }
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist plugin deletion:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  getPlugin(id: string): any | null {
    if (!this.doc) return null;

    const currentDoc = this.doc as any;
    return currentDoc.plugins?.[id] || null;
  }

  getPlugins(): Record<string, any> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    return (currentDoc.plugins || {}) as Record<string, any>;
  }

  getPluginData<T = any>(pluginId: string, collection: string): Record<string, T> {
    if (!this.doc) return {};

    const currentDoc = this.doc as any;
    const pluginData = currentDoc.plugin_data?.[pluginId] || {};
    const collectionData = pluginData[collection] || {};
    return JSON.parse(JSON.stringify(collectionData));
  }

  async setPluginData<T = any>(
    pluginId: string,
    collection: string,
    data: Record<string, T>
  ): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();
      const serializedData = JSON.parse(JSON.stringify(data));

      this.doc = Automerge.change(this.doc, (doc) => {
        const docAny = doc as any;

        if (!docAny.plugin_data) {
          docAny.plugin_data = {};
        }
        if (!docAny.plugin_data[pluginId]) {
          docAny.plugin_data[pluginId] = {};
        }

        docAny.plugin_data[pluginId][collection] = serializedData;
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to persist plugin data:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  async createPluginRecord<T = any>(
    pluginId: string,
    collection: string,
    id: string,
    record: T
  ): Promise<Result<void, ServiceError>> {
    const collectionData = this.getPluginData(pluginId, collection);
    collectionData[id] = record;
    return this.setPluginData(pluginId, collection, collectionData);
  }

  async updatePluginRecord<T = any>(
    pluginId: string,
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<Result<void, ServiceError>> {
    const collectionData = this.getPluginData<T>(pluginId, collection);
    const existing = collectionData[id];

    if (!existing) {
      return err(ServiceError.notFound(`plugin record`, id));
    }

    collectionData[id] = { ...existing, ...updates };
    return this.setPluginData(pluginId, collection, collectionData);
  }

  async deletePluginRecord(
    pluginId: string,
    collection: string,
    id: string
  ): Promise<Result<void, ServiceError>> {
    const collectionData = this.getPluginData(pluginId, collection);
    delete collectionData[id];
    return this.setPluginData(pluginId, collection, collectionData);
  }

  async initializePluginData(pluginId: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const docAny = doc as any;

        if (!docAny.plugin_data[pluginId]) {
          docAny.plugin_data[pluginId] = {};
        }

        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to initialize plugin data:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  async deletePluginData(pluginId: string): Promise<Result<void, ServiceError>> {
    return this.withMutationLock(async () => {
      if (!this.doc) throw new Error("CRDT document not initialized");

      const timestamp = new Date().toISOString();

      this.doc = Automerge.change(this.doc, (doc) => {
        const docAny = doc as any;
        if (docAny.plugin_data && docAny.plugin_data[pluginId]) {
          delete docAny.plugin_data[pluginId];
        }
        doc.updated_at = timestamp;
      });

      const persistResult = await this.persist();
      if (persistResult.isErr()) {
        logger.error("Failed to delete plugin data:", persistResult.error);
        return err(persistResult.error);
      }

      return ok(undefined);
    });
  }

  /**
   * Merge changes from another CRDT document (for sync)
   */
  async merge(otherDocBinary: Uint8Array): Promise<Result<void, ServiceError>> {
    if (!this.doc) {
      return err(ServiceError.initialization("CRDT document not initialized"));
    }

    return ResultAsync.fromPromise(
      (async () => {
        const otherDoc = Automerge.load<CRDTDocument>(otherDocBinary);
        this.doc = Automerge.merge(this.doc!, otherDoc);
        const persistResult = await this.persist();
        if (persistResult.isErr()) {
          throw persistResult.error;
        }
        logger.info("Successfully merged CRDT documents");
      })(),
      (error) => {
        logger.error("Failed to merge CRDT documents:", error);
        return ServiceError.merge("Failed to merge CRDT documents", error);
      }
    );
  }

  /**
   * Get binary representation for sync
   */
  getBinaryDocument(): Uint8Array | null {
    if (!this.doc) return null;
    return Automerge.save(this.doc);
  }

  async clear(): Promise<void> {
    if (this.currentUserId) {
      const deleteResult = await crdtStorage.deleteDocument(this.currentUserId);
      if (deleteResult.isErr()) {
        logger.error("Failed to delete CRDT document:", deleteResult.error);
      }
    }
    this.doc = null;
    this.currentUserId = null;
  }

  async switchUser(newUserId: string): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        if (this.currentUserId === newUserId) {
          return;
        }

        if (this.doc && this.currentUserId) {
          const persistResult = await this.persist();
          if (persistResult.isErr()) {
            throw persistResult.error;
          }
        }

        this.currentUserId = newUserId;

        const loadResult = await crdtStorage.loadDocument(newUserId);
        if (loadResult.isErr()) {
          throw loadResult.error;
        }

        if (loadResult.value) {
          this.doc = Automerge.load(loadResult.value);
          logger.info("Switched to existing CRDT document for user:", newUserId);
        } else {
          this.doc = Automerge.from<CRDTDocument>({
            version: "1.0.0",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: newUserId,
            transactions: {},
            accounts: {},
            categories: {},
            budgets: {},
            tags: {},
            preferences: {},
            rules: {},
            recurring_transactions: {},
            notifications: {},
            plugins: {},
            plugin_data: {},
            plugin_migrations: {},
            indices: {
              version: 1,
            },
          });

          logger.info("Created new CRDT document for user:", newUserId);
          const persistResult = await this.persist();
          if (persistResult.isErr()) {
            throw persistResult.error;
          }
        }
      })(),
      (error) => {
        logger.error("Failed to switch user:", error);
        return ServiceError.initialization("Failed to switch user", error);
      }
    );
  }

  async migrateAnonymousToAuthenticated(anonymousUserId: string, authenticatedUserId: string): Promise<Result<void, ServiceError>> {
    return ResultAsync.fromPromise(
      (async () => {
        logger.info(`Migrating CRDT data from anonymous user ${anonymousUserId} to authenticated user ${authenticatedUserId}`);

        const loadResult = await crdtStorage.loadDocument(anonymousUserId);
        if (loadResult.isErr()) {
          throw loadResult.error;
        }

        if (!loadResult.value) {
          logger.info("No anonymous CRDT document to migrate");
          return;
        }

        const anonymousDoc = Automerge.load<CRDTDocument>(loadResult.value);

        const authenticatedLoadResult = await crdtStorage.loadDocument(authenticatedUserId);
        if (authenticatedLoadResult.isErr()) {
          throw authenticatedLoadResult.error;
        }

        let mergedDoc: Automerge.Doc<CRDTDocument>;

        if (authenticatedLoadResult.value) {
          const authenticatedDoc = Automerge.load<CRDTDocument>(authenticatedLoadResult.value);
          mergedDoc = Automerge.merge(authenticatedDoc, anonymousDoc);
          logger.info("Merged anonymous document with existing authenticated document");
        } else {
          mergedDoc = anonymousDoc;
        }

        mergedDoc = Automerge.change(mergedDoc, (doc) => {
          doc.user_id = authenticatedUserId;
          doc.updated_at = new Date().toISOString();
        });

        const binaryDoc = Automerge.save(mergedDoc);
        const saveResult = await crdtStorage.saveDocument(authenticatedUserId, binaryDoc);
        if (saveResult.isErr()) {
          throw saveResult.error;
        }

        const deleteResult = await crdtStorage.deleteDocument(anonymousUserId);
        if (deleteResult.isErr()) {
          logger.warn("Failed to delete anonymous document after migration:", deleteResult.error);
        }

        this.doc = mergedDoc;
        this.currentUserId = authenticatedUserId;

        logger.info("Successfully migrated anonymous CRDT data to authenticated user");
      })(),
      (error) => {
        logger.error("Failed to migrate anonymous data:", error);
        return ServiceError.initialization("Failed to migrate anonymous data", error);
      }
    );
  }

  /**
   * Notify sync service about changes (lazy import to avoid circular dependency)
   * NOTE:  If sync service fails to load, changes are persisted locally but never synced to server.
   */
  private notifySyncService(operation: "create" | "update" | "delete", type: "transaction" | "account" | "category" | "rule", data: any): void {
    logger.info("[CRDT] notifySyncService:", operation, type, "ID:", data.id);

    import("./sync")
      .then(({ syncService }) => {
        logger.info("[CRDT] Adding to sync queue...");
        syncService.addToSyncQueue({ operation, type, data });
        logger.info("[CRDT] ✅ Added to sync queue successfully");
      })
      .catch((error) => {
        logger.error("[CRDT] ❌ Failed to notify sync service:", error);
      });
  }
}

// Export singleton instance
export const crdtService = new CRDTService();
