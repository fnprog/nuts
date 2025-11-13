import { View } from 'react-native';
import { Text } from '../ui';

const mockData = [
  { category: 'Food & Dining', amount: 450, color: '#EF4444', percent: 30 },
  { category: 'Transportation', amount: 200, color: '#F59E0B', percent: 13 },
  { category: 'Shopping', amount: 350, color: '#10B981', percent: 23 },
  { category: 'Entertainment', amount: 150, color: '#3B82F6', percent: 10 },
  { category: 'Other', amount: 350, color: '#6B7280', percent: 24 },
];

export function SpendingByCategoryWidget() {
  const total = mockData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View className="flex-1">
      <View className="mb-3 h-3 flex-row overflow-hidden rounded-full">
        {mockData.map((item, index) => (
          <View
            key={index}
            style={{
              width: `${item.percent}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </View>

      <View className="flex-1">
        {mockData.map((item, index) => (
          <View key={index} className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <Text className="text-foreground text-sm">{item.category}</Text>
            </View>
            <Text className="text-foreground text-sm font-semibold">${item.amount.toFixed(0)}</Text>
          </View>
        ))}
      </View>

      <View className="border-border mt-2 border-t pt-2">
        <View className="flex-row justify-between">
          <Text className="text-foreground font-semibold">Total Spending</Text>
          <Text className="text-foreground font-bold">${total.toFixed(0)}</Text>
        </View>
      </View>
    </View>
  );
}
