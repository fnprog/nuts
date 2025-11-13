import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../category.service';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await categoryService.getCategories();
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const result = await categoryService.getCategoryById(id);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
    enabled: !!id,
  });
}

export function useCategoriesByType(type: 'income' | 'expense' | 'transfer') {
  return useQuery({
    queryKey: ['categories', 'type', type],
    queryFn: async () => {
      if (type === 'transfer') {
        return [];
      }
      const result = await categoryService.getCategoriesByType(type);
      if (result.isErr()) throw new Error(result.error.message);
      return result.value;
    },
  });
}
