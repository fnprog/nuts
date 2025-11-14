import { crdtService } from "@/core/sync/crdt";
import { kyselyQueryService } from "@/core/sync/query";
import { CRDTCategory } from "@nuts/types";
import { Category, CategoryCreate } from "./category.types";
import { Result, ok, err, ServiceError } from "@/lib/result";
import { uuidV7 } from "@nuts/utils";

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

    const crdtResult = await crdtService.initialize();
    if (crdtResult.isErr()) return err(crdtResult.error);

    const kyselyResult = await kyselyQueryService.initialize();
    if (kyselyResult.isErr()) return err(kyselyResult.error);

    isInitialized = true;
    console.log("Category service initialized (offline-first)");
    return ok(undefined);
  };

  const getCategories = async (): Promise<Result<Category[], ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const crdtCategories = crdtService.getCategories();

    const categories = Object.values(crdtCategories).map((category) => convertFromCRDTFormat(category));

    return ok(categories.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const createCategory = async (categoryData: CategoryCreate): Promise<Result<Category, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const id = uuidV7();
    const crdtCategory = convertToCRDTFormat({
      parent_id: null,
      is_default: false,
      color: null,
      ...categoryData,
      id,
      updated_at: new Date().toISOString(),
    });

    const createResult = await crdtService.createCategory(crdtCategory);
    if (createResult.isErr()) return err(createResult.error);

    console.log("Created category:", id);
    return ok(convertFromCRDTFormat(crdtCategory));
  };

  const updateCategory = async (categoryId: string, categoryData: Partial<CategoryCreate>): Promise<Result<Category, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const existingCategories = crdtService.getCategories();
    const existingCategory = existingCategories[categoryId];

    if (!existingCategory) {
      return err(ServiceError.notFound("category", categoryId));
    }

    const crdtUpdates = convertToCRDTFormat({
      ...convertFromCRDTFormat(existingCategory),
      ...categoryData,
      id: categoryId,
      updated_at: new Date().toISOString(),
    });

    const { id, ...updates } = crdtUpdates;

    const updateResult = await crdtService.updateCategory(categoryId, updates);
    if (updateResult.isErr()) return err(updateResult.error);

    const categories = crdtService.getCategories();
    const updatedCategory = categories[categoryId];

    if (!updatedCategory) {
      return err(ServiceError.notFound("category", categoryId));
    }

    console.log("Updated category:", categoryId);
    return ok(convertFromCRDTFormat(updatedCategory));
  };

  const deleteCategory = async (id: string): Promise<Result<void, ServiceError>> => {
    const initResult = await ensureInitialized();
    if (initResult.isErr()) return err(initResult.error);

    const timestamp = new Date().toISOString();
    const updateResult = await crdtService.updateCategory(id, {
      deleted_at: timestamp,
      updated_at: timestamp,
    });
    if (updateResult.isErr()) return err(updateResult.error);

    console.log("Deleted category:", id);
    return ok(undefined);
  };

  const convertFromCRDTFormat = (crdtCategory: CRDTCategory): Category => {
    return {
      id: crdtCategory.id,
      name: crdtCategory.name,
      type: crdtCategory.type,
      parent_id: crdtCategory.parent_id || null,
      is_default: false,
      updated_at: crdtCategory.updated_at,
      icon: crdtCategory.icon || "",
      color: crdtCategory.color || null,
    };
  };

  const convertToCRDTFormat = (category: Category): CRDTCategory => {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color || "#000000",
      icon: category.icon || "",
      parent_id: category.parent_id || undefined,
      is_active: true,
      created_at: category.created_at || new Date().toISOString(),
      updated_at: category.updated_at || new Date().toISOString(),
    };
  };

  const createSubcategory = async (categoryId: string, subcategoryData: CategoryCreate): Promise<Result<Category, ServiceError>> => {
    return createCategory({ ...subcategoryData, parent_id: categoryId });
  };

  const updateSubcategory = async (
    categoryId: string,
    subcategoryId: string,
    subcategoryData: Partial<CategoryCreate>
  ): Promise<Result<Category, ServiceError>> => {
    return updateCategory(subcategoryId, { ...subcategoryData, parent_id: categoryId });
  };

  const deleteSubcategory = async (_categoryId: string, subcategoryId: string): Promise<Result<void, ServiceError>> => {
    return deleteCategory(subcategoryId);
  };

  return {
    initialize,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}

export const categoryService = createCategoryService();
