
// ===================== WEBHOOKS =====================

export const useWebhooksQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.webhooks,
    queryFn: async () => {
      const result = await webhooksService.getWebhooks();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateWebhookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await webhooksService.createWebhook(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast.success("Webhook created successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to create webhook");
    },
  });
};

export const useUpdateWebhookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWebhookRequest }) => {
      const result = await webhooksService.updateWebhook(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast.success("Webhook updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update webhook");
    },
  });
};

export const useDeleteWebhookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await webhooksService.deleteWebhook(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhooks });
      toast.success("Webhook deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete webhook");
    },
  });
};
