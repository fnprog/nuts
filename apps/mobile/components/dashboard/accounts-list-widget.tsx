import { View, Pressable } from 'react-native';
import { Text } from '../ui';
import Icon, { IconName } from 'react-native-remix-icon';

const mockAccounts = [
  {
    name: 'Chase Checking',
    balance: 12450.32,
    change: 2.5,
    icon: 'bank-fill' as IconName,
    color: '#3B82F6',
  },
  {
    name: 'Ally Savings',
    balance: 25000.0,
    change: 1.2,
    icon: 'safe-fill' as IconName,
    color: '#10B981',
  },
  {
    name: 'Chase Credit Card',
    balance: -1234.56,
    change: -12.3,
    icon: 'bank-card-fill' as IconName,
    color: '#EF4444',
  },
];

export function AccountsListWidget() {
  return (
    <View className="flex-1">
      {mockAccounts.map((account, index) => (
        <Pressable
          key={index}
          className="border-border mb-2 flex-row items-center rounded-lg border bg-white p-3">
          <View
            className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${account.color}20` }}>
            <Icon name={account.icon} size={20} color={account.color} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground mb-0.5 text-sm font-semibold">{account.name}</Text>
            <View className="flex-row items-center">
              <Icon
                name={account.change >= 0 ? 'arrow-up-line' : 'arrow-down-line'}
                size={10}
                color={account.change >= 0 ? '#10B981' : '#EF4444'}
              />
              <Text
                className="ml-1 text-xs font-medium"
                style={{ color: account.change >= 0 ? '#10B981' : '#EF4444' }}>
                {Math.abs(account.change).toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text
            className={`text-sm font-semibold ${account.balance < 0 ? 'text-red-600' : 'text-foreground'}`}>
            ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
