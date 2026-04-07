import { NativeModule, requireNativeModule } from 'expo';

export interface CRDTNativeModule extends NativeModule {
  docNew(userId: string): string;
  docFree(handle: string): void;
  docGetJson(handle: string): string;
  docCreate(handle: string, collection: string, itemJson: string): string;
  docUpdate(handle: string, collection: string, itemId: string, itemJson: string): boolean;
  docDelete(handle: string, collection: string, itemId: string): boolean;
  docSave(handle: string): string;
  docLoad(base64Data: string): string;
  docMerge(handleA: string, handleB: string): boolean;
  stringFree(ptr: string): void;
}

const nativeModule = requireNativeModule<CRDTNativeModule>('ExpoAutomergeCrdt');

export class CRDTService {
  private handles: Map<string, string> = new Map();

  createDocument(userId: string): string {
    const handle = nativeModule.docNew(userId);
    if (!handle) {
      throw new Error('Failed to create CRDT document');
    }
    const docId = this.generateId();
    this.handles.set(docId, handle);
    return docId;
  }

  destroyDocument(docId: string): void {
    const handle = this.handles.get(docId);
    if (handle) {
      nativeModule.docFree(handle);
      this.handles.delete(docId);
    }
  }

  getDocument(docId: string): any {
    const handle = this.handles.get(docId);
    if (!handle) {
      throw new Error(`Document not found: ${docId}`);
    }
    const jsonStr = nativeModule.docGetJson(handle);
    return JSON.parse(jsonStr);
  }

  createItem(docId: string, collection: string, item: any): string {
    const handle = this.handles.get(docId);
    if (!handle) {
      throw new Error(`Document not found: ${docId}`);
    }
    const itemJson = JSON.stringify(item);
    const itemId = nativeModule.docCreate(handle, collection, itemJson);
    if (!itemId) {
      throw new Error(`Failed to create item in collection: ${collection}`);
    }
    return itemId;
  }

  updateItem(docId: string, collection: string, itemId: string, item: any): void {
    const handle = this.handles.get(docId);
    if (!handle) {
      throw new Error(`Document not found: ${docId}`);
    }
    const itemJson = JSON.stringify(item);
    const success = nativeModule.docUpdate(handle, collection, itemId, itemJson);
    if (!success) {
      throw new Error(`Failed to update item ${itemId} in collection: ${collection}`);
    }
  }

  deleteItem(docId: string, collection: string, itemId: string): void {
    const handle = this.handles.get(docId);
    if (!handle) {
      throw new Error(`Document not found: ${docId}`);
    }
    const success = nativeModule.docDelete(handle, collection, itemId);
    if (!success) {
      throw new Error(`Failed to delete item ${itemId} in collection: ${collection}`);
    }
  }

  saveDocument(docId: string): string {
    const handle = this.handles.get(docId);
    if (!handle) {
      throw new Error(`Document not found: ${docId}`);
    }
    return nativeModule.docSave(handle);
  }

  loadDocument(base64Data: string): string {
    const handle = nativeModule.docLoad(base64Data);
    if (!handle) {
      throw new Error('Failed to load CRDT document from base64');
    }
    const docId = this.generateId();
    this.handles.set(docId, handle);
    return docId;
  }

  mergeDocuments(docIdA: string, docIdB: string): void {
    const handleA = this.handles.get(docIdA);
    const handleB = this.handles.get(docIdB);
    if (!handleA || !handleB) {
      throw new Error('One or both documents not found');
    }
    const success = nativeModule.docMerge(handleA, handleB);
    if (!success) {
      throw new Error('Failed to merge documents');
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
