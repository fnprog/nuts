
export const useTagsQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: async () => {
      const result = await tagsService.getTags();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateTagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateTagRequest }) => {
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
