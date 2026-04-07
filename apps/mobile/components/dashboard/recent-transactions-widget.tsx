import { View } from 'react-native';
import { Text } from '../ui';
import Icon from 'react-native-remix-icon';

const mockTransactions = [
  { name: 'Starbucks', amount: -5.45, category: 'Food', icon: 'cup-line' as const },
  {
    name: 'Salary Deposit',
    amount: 3500.0,
    category: 'Income',
    icon: 'money-dollar-circle-line' as const,
  },
  { name: 'Uber', amount: -15.32, category: 'Transport', icon: 'taxi-line' as const },
  { name: 'Netflix', amount: -15.99, category: 'Entertainment', icon: 'tv-line' as const },
];

export function RecentTransactionsWidget() {
  return (
    <View className="flex-1">
      {mockTransactions.map((transaction, index) => (
        <View key={index} className="border-border mb-2 flex-row items-center border-b pb-2">
          <View className="bg-muted mr-3 h-10 w-10 items-center justify-center rounded-full">
            <Icon name={transaction.icon} size={18} color="#666" />
          </View>
          <View className="flex-1">
            <Text className="text-foreground mb-0.5 text-sm font-semibold">{transaction.name}</Text>
            <Text className="text-muted-foreground text-xs">{transaction.category}</Text>
          </View>
          <Text
            className={`text-sm font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}
