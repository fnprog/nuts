import { queryOptions } from "@tanstack/react-query";
import { categoryService } from "./category.service.ts";


// ===================== CATEGORIES =====================

export const useCategoriesQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const result = await categoryService.getCategories();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await categoryService.createCategory(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to create category");
    },
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryRequest }) => {
      const result = await categoryService.updateCategory(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update category");
    },
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await categoryService.deleteCategory(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete category");
    },
  });
};

export const useCreateSubcategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: CreateSubcategoryRequest }) => {
      const result = await categoryService.createSubcategory(categoryId, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Subcategory created successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to create subcategory");
    },
  });
};

export const useUpdateSubcategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, subcategoryId, data }: { categoryId: string; subcategoryId: string; data: CreateSubcategoryRequest }) => {
      const result = await categoryService.updateSubcategory(categoryId, subcategoryId, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Subcategory updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update subcategory");
    },
  });
};

export const useDeleteSubcategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, subcategoryId }: { categoryId: string; subcategoryId: string }) => {
      const result = await categoryService.deleteSubcategory(categoryId, subcategoryId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Subcategory deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete subcategory");
    },
  });
};
