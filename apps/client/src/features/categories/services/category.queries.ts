import { useQuery } from "@tanstack/react-query";
import { categoryService } from "./category.service.ts";

const QUERY_KEYS = {
  categories: ["categories"] as const,
};

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const result = await categoryService.getCategories();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 1000 * 60 * 5,
  });
};
