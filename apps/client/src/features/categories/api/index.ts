// import { GroupedCategory, groupCategories } from "@/core/components/nested-select/utils";

//
// /**
//  * Create a subcategory within a category
//  */
// const createSubcategory = async (categoryId: string, subcategory: CreateSubcategoryRequest): Promise<GroupedCategory[]> => {
//   const requestData = {
//     ...subcategory,
//     parent_id: categoryId
//   };
//   await api.post(CATEGORIES_ENDPOINT, requestData);
//   // Return updated categories list
//   return getCategories();
// };
//
// /**
//  * Update a subcategory
//  */
// const updateSubcategory = async (_categoryId: string, subcategoryId: string, subcategory: CreateSubcategoryRequest): Promise<GroupedCategory[]> => {
//   await api.put(`${CATEGORIES_ENDPOINT}/${subcategoryId}`, subcategory);
//   // Return updated categories list
//   return getCategories();
// };
//
// /**
//  * Delete a subcategory
//  */
// const deleteSubcategory = async (_categoryId: string, subcategoryId: string): Promise<GroupedCategory[]> => {
//   await api.delete(`${CATEGORIES_ENDPOINT}/${subcategoryId}`);
//   // Return updated categories list
//   return getCategories();
// };
