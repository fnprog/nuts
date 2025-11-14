import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryService } from "./category.service.ts";
import { CategoryCreate } from "./category.types.ts";

const QUERY_KEYS = {
  categories: ["categories"] as const,
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryCreate) => {
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryCreate> }) => {
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
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: CategoryCreate }) => {
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
    mutationFn: async ({ categoryId, subcategoryId, data }: { categoryId: string; subcategoryId: string; data: Partial<CategoryCreate> }) => {
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
