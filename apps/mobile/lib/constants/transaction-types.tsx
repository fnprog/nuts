export const TRANSACTION_TYPES = [
  {
    id: 'expense' as const,
    name: 'Expense',
    icon: 'arrow-down-line',
    color: '#ef4444',
    description: 'Money going out',
  },
  {
    id: 'income' as const,
    name: 'Income',
    icon: 'arrow-up-line',
    color: '#10b981',
    description: 'Money coming in',
  },
  {
    id: 'transfer' as const,
    name: 'Transfer',
    icon: 'arrow-left-right-line',
    color: '#3b82f6',
    description: 'Move between accounts',
  },
];

export type TransactionTypeId = (typeof TRANSACTION_TYPES)[number]['id'];

export const getTransactionType = (id: TransactionTypeId) => {
  return TRANSACTION_TYPES.find((type) => type.id === id);
};
