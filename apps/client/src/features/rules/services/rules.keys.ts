// Query keys
export const rulesQueryKeys = {
  all: ["rules"] as const,
  list: () => [...rulesQueryKeys.all, "list"] as const,
  detail: (id: string) => [...rulesQueryKeys.all, "detail", id] as const,
  matches: (transactionId: string) => [...rulesQueryKeys.all, "matches", transactionId] as const,
};
