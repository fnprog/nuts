import { View } from 'react-native';
import { Text } from '../ui';
import Icon from 'react-native-remix-icon';

const chartData = [
  { label: 'Jan', value: 115000 },
  { label: 'Feb', value: 118000 },
  { label: 'Mar', value: 120000 },
  { label: 'Apr', value: 119500 },
  { label: 'May', value: 122000 },
  { label: 'Jun', value: 123715 },
];

export function NetWorthChartWidget() {
  const netWorth = 123715.76;
  const changePercent = 4.2;

  const maxValue = Math.max(...chartData.map((d) => d.value));
  const minValue = Math.min(...chartData.map((d) => d.value));

  return (
    <View className="flex-1">
      <View className="mb-4 items-center">
        <Text className="text-foreground mb-2 text-3xl font-bold">
          ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <View className="flex-row items-center">
          <Icon
            name={changePercent >= 0 ? 'arrow-up-line' : 'arrow-down-line'}
            size={14}
            color={changePercent >= 0 ? '#10B981' : '#EF4444'}
          />
          <Text
            className="ml-1 text-sm font-semibold"
            style={{ color: changePercent >= 0 ? '#10B981' : '#EF4444' }}>
            {Math.abs(changePercent).toFixed(1)}% this month
          </Text>
        </View>
      </View>

      <View className="flex-1 flex-row items-end justify-between px-1">
        {chartData.map((point, index) => {
          const heightPercent = ((point.value - minValue) / (maxValue - minValue)) * 100;
          const isLast = index === chartData.length - 1;
          return (
            <View key={index} className="flex-1 items-center">
              <View className="w-full px-0.5" style={{ height: 80 }}>
                <View className="flex-1 justify-end">
                  <View
                    className="w-full rounded-t-lg"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: isLast ? '#F97316' : '#FED7AA',
                    }}
                  />
                </View>
              </View>
              <Text className="text-muted-foreground mt-1 text-xs">{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
