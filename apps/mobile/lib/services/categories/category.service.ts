import { getCRDTService } from '@/lib/sync';
import type { CRDTCategory } from '@nuts/types';
import type { Category, CategoryCreate, Result, ServiceError } from './category.types';
import { ok, err, ServiceErrorFactory as ServiceErr } from './category.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createCategoryService() {
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
      console.error('❌ Failed to initialize category service:', initResult.error);
      return err(ServiceErr.initialization('Failed to initialize category service', initResult.error));
    }

    isInitialized = true;
    console.log('✅ Category service initialized');
    return ok(undefined);
  };

  const getCategories = async (): Promise<Result<Category[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtService = getCRDTService();
    const crdtCategories = crdtService.getAll('categories');
    const categories = crdtCategories
      .map((crdtCategory: CRDTCategory) => convertFromCRDTFormat(crdtCategory))
      .filter((cat) => cat.is_active)
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok(categories);
  };

  const getCategoryById = async (id: string): Promise<Result<Category, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtService = getCRDTService();
    const crdtCategory = crdtService.getById('categories', id);

    if (!crdtCategory) {
      return err(ServiceErr.notFound('Category', id));
    }

    return ok(convertFromCRDTFormat(crdtCategory));
  };

  const getCategoriesByType = async (
    type: 'income' | 'expense'
  ): Promise<Result<Category[], ServiceError>> => {
    const categoriesResult = await getCategories();
    if (categoriesResult.isErr()) return err(categoriesResult.error);

    const filtered = categoriesResult.value.filter((cat) => cat.type === type);
    return ok(filtered);
  };

  const createCategory = async (
    categoryData: CategoryCreate
  ): Promise<Result<Category, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const id = generateId();
    console.log('[CATEGORY] Creating category with ID:', id);

    const crdtCategory = convertToCRDTFormat({
      ...categoryData,
      id,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    const crdtService = getCRDTService();
    const createResult = await crdtService.create('categories', id, crdtCategory);
    
    if (createResult.isErr()) {
      console.error('[CATEGORY] ❌ Error creating category:', createResult.error);
      return err(ServiceErr.database('Failed to create category', createResult.error));
    }

    console.log('[CATEGORY] ✅ Category created:', id);
    return ok(convertFromCRDTFormat(crdtCategory));
  };

  const updateCategory = async (
    id: string,
    categoryData: CategoryCreate
  ): Promise<Result<Category, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log('[CATEGORY] Updating category:', id);

    const crdtUpdates = convertToCRDTFormat({
      ...categoryData,
      id,
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    const { id: _id, ...updates } = crdtUpdates;

    const crdtService = getCRDTService();
    const updateResult = await crdtService.update('categories', id, updates);
    
    if (updateResult.isErr()) {
      console.error('[CATEGORY] ❌ Error updating category:', updateResult.error);
      return err(ServiceErr.database('Failed to update category', updateResult.error));
    }

    const updatedCategory = crdtService.getById('categories', id);

    if (!updatedCategory) {
      return err(ServiceErr.notFound('Category', id));
    }

    console.log('[CATEGORY] ✅ Category updated:', id);
    return ok(convertFromCRDTFormat(updatedCategory));
  };

  const deleteCategory = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    console.log('[CATEGORY] Deleting category:', id);

    const crdtService = getCRDTService();
    const deleteResult = await crdtService.delete('categories', id);
    
    if (deleteResult.isErr()) {
      console.error('[CATEGORY] ❌ Error deleting category:', deleteResult.error);
      return err(ServiceErr.database('Failed to delete category', deleteResult.error));
    }

    console.log('[CATEGORY] ✅ Category deleted:', id);
    return ok(undefined);
  };

  const convertFromCRDTFormat = (crdtCategory: CRDTCategory): Category => {
    return {
      id: crdtCategory.id,
      name: crdtCategory.name,
      type: crdtCategory.type,
      color: crdtCategory.color,
      icon: crdtCategory.icon,
      parent_id: crdtCategory.parent_id,
      is_active: crdtCategory.is_active,
      updated_at: crdtCategory.updated_at,
    };
  };

  const convertToCRDTFormat = (category: any): CRDTCategory => {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon ?? undefined,
      parent_id: category.parent_id ?? undefined,
      is_active: category.is_active !== undefined ? category.is_active : true,
      created_at: category.created_at || new Date().toISOString(),
      updated_at: category.updated_at || new Date().toISOString(),
      deleted_at: category.deleted_at ?? undefined,
    };
  };

  return {
    initialize,
    getCategories,
    getCategoryById,
    getCategoriesByType,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export const categoryService = createCategoryService();
