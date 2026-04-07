import { useQuery } from "@tanstack/react-query";
import { tagsService } from "./tags.service.ts";

const QUERY_KEYS = {
  tags: ["tags"] as const,
};

export const useTagsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: async () => {
      const result = await tagsService.getTags();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 1000 * 60 * 5,
  });
};
