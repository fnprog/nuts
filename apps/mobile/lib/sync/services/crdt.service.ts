import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireNativeModule } from 'expo';
import type {
  CRDTDocument,
  CRDTTransaction,
  CRDTAccount,
  CRDTCategory,
  CRDTBudget,
  CRDTTag,
  CRDTPreference,
  CRDTRule,
} from '@nuts/types';
import { ok, err, type Result, ServiceErrorFactory } from '../types/result.types';

type Collection =
  | 'transactions'
  | 'accounts'
  | 'categories'
  | 'budgets'
  | 'tags'
  | 'preferences'
  | 'rules';

type CollectionType<T extends Collection> = T extends 'transactions'
  ? CRDTTransaction
  : T extends 'accounts'
    ? CRDTAccount
    : T extends 'categories'
      ? CRDTCategory
      : T extends 'budgets'
        ? CRDTBudget
        : T extends 'tags'
          ? CRDTTag
          : T extends 'preferences'
            ? CRDTPreference
            : T extends 'rules'
              ? CRDTRule
              : never;

interface CRDTNativeModule {
  docNew(userId: string): string;
  docFree(handle: string): void;
  docGetJson(handle: string): string;
  docCreate(handle: string, collection: string, itemJson: string): string;
  docUpdate(handle: string, collection: string, itemId: string, itemJson: string): boolean;
  docDelete(handle: string, collection: string, itemId: string): boolean;
  docSave(handle: string): string;
  docLoad(base64Data: string): string;
  docMerge(handleA: string, handleB: string): boolean;
}

const nativeModule = requireNativeModule<CRDTNativeModule>('ExpoAutomergeCrdt');

const STORAGE_KEY = '@nuts-crdt-document';

export class CRDTService {
  private handle: string | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  static async initializeWasm(): Promise<void> {
    console.log('✅ Native Automerge module loaded (no WASM initialization needed)');
  }

  async initialize(): Promise<Result<void>> {
    return await this.loadDocument();
  }

  private async loadDocument(): Promise<Result<void>> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (stored) {
      const result = this.tryLoadDocument(stored);
      if (result.isErr()) {
        console.error('Failed to load CRDT document:', result.error);
        this.handle = this.createEmptyDocument();
      }
    } else {
      this.handle = this.createEmptyDocument();
    }

    return ok(undefined);
  }

  private tryLoadDocument(stored: string): Result<void> {
    try {
      this.handle = nativeModule.docLoad(stored);
      return ok(undefined);
    } catch (error) {
      return err(
        ServiceErrorFactory.storage('Failed to load CRDT document from storage', error)
      );
    }
  }

  private createEmptyDocument(): string {
    const handle = nativeModule.docNew(this.userId);
    const doc = this.getDocumentInternal(handle);

    doc.version = '1.0.0';
    doc.created_at = new Date().toISOString();
    doc.updated_at = new Date().toISOString();
    doc.user_id = this.userId;
    doc.transactions = doc.transactions || {};
    doc.accounts = doc.accounts || {};
    doc.categories = doc.categories || {};
    doc.budgets = doc.budgets || {};
    doc.tags = doc.tags || {};
    doc.preferences = doc.preferences || {};
    doc.rules = doc.rules || {};
    doc.indices = doc.indices || { version: 0 };

    return handle;
  }

  private getDocumentInternal(handle: string): CRDTDocument {
    const jsonStr = nativeModule.docGetJson(handle);
    return JSON.parse(jsonStr) as CRDTDocument;
  }

  async saveDocument(): Promise<Result<void>> {
    if (!this.handle) {
      return err(ServiceErrorFactory.initialization('CRDT handle not initialized'));
    }

    try {
      const base64Data = nativeModule.docSave(this.handle);
      await AsyncStorage.setItem(STORAGE_KEY, base64Data);
      return ok(undefined);
    } catch (error) {
      return err(ServiceErrorFactory.storage('Failed to save CRDT document', error));
    }
  }

  getDocument(): CRDTDocument | null {
    if (!this.handle) return null;
    return this.getDocumentInternal(this.handle);
  }

  getAutomergeDoc(): string | null {
    return this.handle;
  }

  async mergeChanges(base64Data: string): Promise<Result<void>> {
    if (!this.handle) {
      const loadResult = await this.loadDocument();
      if (loadResult.isErr()) {
        return err(loadResult.error);
      }
    }

    if (!this.handle) {
      return err(ServiceErrorFactory.initialization('Failed to initialize CRDT handle'));
    }

    try {
      const otherHandle = nativeModule.docLoad(base64Data);
      nativeModule.docMerge(this.handle, otherHandle);
      nativeModule.docFree(otherHandle);
      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }
      return ok(undefined);
    } catch (error) {
      return err(ServiceErrorFactory.merge('Failed to merge CRDT changes', error));
    }
  }

  getChanges(): string {
    if (!this.handle) return '';
    return nativeModule.docSave(this.handle);
  }

  async create<T extends Collection>(
    collection: T,
    id: string,
    data: CollectionType<T>
  ): Promise<Result<void>> {
    if (!this.handle) {
      return err(ServiceErrorFactory.initialization('CRDT handle not initialized'));
    }

    try {
      const itemWithMeta = {
        ...data,
        id,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const itemJson = JSON.stringify(itemWithMeta);
      const createdId = nativeModule.docCreate(this.handle, collection, itemJson);

      if (!createdId) {
        return err(
          ServiceErrorFactory.database(`Failed to create item in ${collection}`)
        );
      }

      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceErrorFactory.database(`Failed to create item in ${collection}`, error)
      );
    }
  }

  async update<T extends Collection>(
    collection: T,
    id: string,
    updates: Partial<CollectionType<T>>
  ): Promise<Result<void>> {
    if (!this.handle) {
      return err(ServiceErrorFactory.initialization('CRDT handle not initialized'));
    }

    try {
      const doc = this.getDocumentInternal(this.handle);
      const existingItem = (doc[collection] as any)[id];

      if (!existingItem) {
        return err(ServiceErrorFactory.notFound(collection, id));
      }

      const updatedItem = {
        ...existingItem,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const itemJson = JSON.stringify(updatedItem);
      const success = nativeModule.docUpdate(this.handle, collection, id, itemJson);

      if (!success) {
        return err(
          ServiceErrorFactory.database(`Failed to update item ${id} in ${collection}`)
        );
      }

      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceErrorFactory.database(`Failed to update item ${id} in ${collection}`, error)
      );
    }
  }

  async delete<T extends Collection>(collection: T, id: string): Promise<Result<void>> {
    if (!this.handle) {
      return err(ServiceErrorFactory.initialization('CRDT handle not initialized'));
    }

    try {
      const doc = this.getDocumentInternal(this.handle);
      const existingItem = (doc[collection] as any)[id];

      if (!existingItem) {
        return err(ServiceErrorFactory.notFound(collection, id));
      }

      const updatedItem = {
        ...existingItem,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const itemJson = JSON.stringify(updatedItem);
      const success = nativeModule.docUpdate(this.handle, collection, id, itemJson);

      if (!success) {
        return err(
          ServiceErrorFactory.database(`Failed to delete item ${id} in ${collection}`)
        );
      }

      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceErrorFactory.database(`Failed to delete item ${id} in ${collection}`, error)
      );
    }
  }

  async hardDelete<T extends Collection>(collection: T, id: string): Promise<Result<void>> {
    if (!this.handle) {
      return err(ServiceErrorFactory.initialization('CRDT handle not initialized'));
    }

    try {
      const success = nativeModule.docDelete(this.handle, collection, id);

      if (!success) {
        return err(
          ServiceErrorFactory.database(`Failed to hard delete item ${id} in ${collection}`)
        );
      }

      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }

      return ok(undefined);
    } catch (error) {
      return err(
        ServiceErrorFactory.database(
          `Failed to hard delete item ${id} in ${collection}`,
          error
        )
      );
    }
  }

  getAll<T extends Collection>(collection: T, includeDeleted = false): CollectionType<T>[] {
    if (!this.handle) return [];

    const doc = this.getDocumentInternal(this.handle);
    const items = Object.values(doc[collection] || {}) as CollectionType<T>[];

    if (includeDeleted) {
      return items;
    }

    return items.filter((item: any) => !item.deleted_at);
  }

  getById<T extends Collection>(collection: T, id: string): CollectionType<T> | null {
    if (!this.handle) return null;

    const doc = this.getDocumentInternal(this.handle);
    const item = (doc[collection] as any)[id];

    if (!item || item.deleted_at) {
      return null;
    }

    return item as CollectionType<T>;
  }

  async replaceDocument(base64Data: string): Promise<Result<void>> {
    try {
      if (this.handle) {
        nativeModule.docFree(this.handle);
      }
      this.handle = nativeModule.docLoad(base64Data);
      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }
      return ok(undefined);
    } catch (error) {
      return err(ServiceErrorFactory.storage('Failed to replace CRDT document', error));
    }
  }

  async clear(): Promise<Result<void>> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      if (this.handle) {
        nativeModule.docFree(this.handle);
      }
      this.handle = this.createEmptyDocument();
      const saveResult = await this.saveDocument();
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }
      return ok(undefined);
    } catch (error) {
      return err(ServiceErrorFactory.storage('Failed to clear CRDT document', error));
    }
  }
}
