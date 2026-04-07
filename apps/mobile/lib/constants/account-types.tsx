import type { IconName } from 'react-native-remix-icon';
import type { AccountType } from '../services/accounts/account.types';

export interface AccountTypeOption {
  value: AccountType;
  label: string;
  icon: IconName;
  color: string;
}

export const ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    value: 'checking',
    label: 'Checking',
    icon: 'building-line',
    color: '#3b82f6',
  },
  {
    value: 'savings',
    label: 'Savings',
    icon: 'safe-line',
    color: '#10b981',
  },
  {
    value: 'credit',
    label: 'Credit Card',
    icon: 'bank-card-line',
    color: '#64748b',
  },
  {
    value: 'investment',
    label: 'Investment',
    icon: 'line-chart-line',
    color: '#a855f7',
  },
  {
    value: 'cash',
    label: 'Cash',
    icon: 'wallet-line',
    color: '#f59e0b',
  },
  {
    value: 'loan',
    label: 'Loan',
    icon: 'hand-coin-line',
    color: '#ef4444',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'more-line',
    color: '#6b7280',
  },
];

export const getAccountTypeOption = (type: AccountType): AccountTypeOption | undefined => {
  return ACCOUNT_TYPES.find((t) => t.value === type);
};
