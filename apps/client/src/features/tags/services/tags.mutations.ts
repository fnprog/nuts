import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tagsService } from "./tags.service.ts";
import { TagCreate } from "./tags.types.ts";

const QUERY_KEYS = {
  tags: ["tags"] as const,
};

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TagCreate) => {
      const result = await tagsService.createTag(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      toast.success("Tag created successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to create tag");
    },
  });
};

export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TagCreate> }) => {
      const result = await tagsService.updateTag(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      toast.success("Tag updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update tag");
    },
  });
};

export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await tagsService.deleteTag(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
      toast.success("Tag deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete tag");
    },
  });
};
