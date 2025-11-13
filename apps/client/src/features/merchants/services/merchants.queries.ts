// ===================== MERCHANTS =====================

export const useMerchantsQuery = () => {
  return useAuthenticatedQuery({
    queryKey: QUERY_KEYS.merchants,
    queryFn: async () => {
      const result = await merchantsService.getMerchants();
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateMerchantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await merchantsService.createMerchant(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.merchants });
      toast.success("Merchant created successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to create merchant");
    },
  });
};

export const useUpdateMerchantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMerchantRequest }) => {
      const result = await merchantsService.updateMerchant(id, data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.merchants });
      toast.success("Merchant updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to update merchant");
    },
  });
};

export const useDeleteMerchantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await merchantsService.deleteMerchant(id);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.merchants });
      toast.success("Merchant deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete merchant");
    },
  });
};
