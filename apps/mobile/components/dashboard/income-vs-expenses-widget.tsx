import { View } from 'react-native';
import { Text } from '../ui';

const mockData = [
  { month: 'Jan', income: 4500, expenses: 3200 },
  { month: 'Feb', income: 4200, expenses: 3500 },
  { month: 'Mar', income: 4800, expenses: 3100 },
  { month: 'Apr', income: 4500, expenses: 3400 },
  { month: 'May', income: 5000, expenses: 3600 },
  { month: 'Jun', income: 4700, expenses: 3300 },
];

export function IncomeVsExpensesWidget() {
  const maxValue = Math.max(...mockData.flatMap((d) => [d.income, d.expenses]));

  return (
    <View className="flex-1">
      <View className="mb-3 flex-row justify-center gap-4">
        <View className="flex-row items-center">
          <View className="mr-1 h-3 w-3 rounded-full bg-green-500" />
          <Text className="text-muted-foreground text-xs">Income</Text>
        </View>
        <View className="flex-row items-center">
          <View className="mr-1 h-3 w-3 rounded-full bg-red-500" />
          <Text className="text-muted-foreground text-xs">Expenses</Text>
        </View>
      </View>

      <View className="flex-1 flex-row items-end justify-between">
        {mockData.map((point, index) => {
          const incomeHeight = (point.income / maxValue) * 100;
          const expensesHeight = (point.expenses / maxValue) * 100;

          return (
            <View key={index} className="flex-1 items-center">
              <View className="w-full" style={{ height: 100 }}>
                <View className="flex-1 flex-row items-end justify-center gap-0.5">
                  <View
                    className="w-1/3 rounded-t bg-green-500"
                    style={{ height: `${incomeHeight}%` }}
                  />
                  <View
                    className="w-1/3 rounded-t bg-red-500"
                    style={{ height: `${expensesHeight}%` }}
                  />
                </View>
              </View>
              <Text className="text-muted-foreground mt-1 text-xs">{point.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
