import { View } from 'react-native';
import { Text } from '../ui';
import Icon from 'react-native-remix-icon';

export function MonthlySummaryWidget() {
  const income = 4700;
  const expenses = 3300;
  const savings = income - expenses;
  const savingsRate = ((savings / income) * 100).toFixed(1);

  return (
    <View className="flex-1 justify-center gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="arrow-down-circle-line" size={16} color="#10B981" />
          <Text className="text-muted-foreground ml-2 text-sm">Income</Text>
        </View>
        <Text className="text-foreground text-base font-semibold">${income.toLocaleString()}</Text>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="arrow-up-circle-line" size={16} color="#EF4444" />
          <Text className="text-muted-foreground ml-2 text-sm">Expenses</Text>
        </View>
        <Text className="text-foreground text-base font-semibold">
          ${expenses.toLocaleString()}
        </Text>
      </View>

      <View className="border-border my-1 border-t" />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Icon name="wallet-line" size={16} color="#F97316" />
          <Text className="text-muted-foreground ml-2 text-sm">Saved</Text>
        </View>
        <View className="items-end">
          <Text className="text-foreground text-base font-bold">${savings.toLocaleString()}</Text>
          <Text className="text-muted-foreground text-xs">{savingsRate}% saved</Text>
        </View>
      </View>
    </View>
  );
}
