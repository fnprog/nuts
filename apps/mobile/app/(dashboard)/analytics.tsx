import { View, ScrollView } from 'react-native';
import { Text } from '../../components/ui';
import Icon from 'react-native-remix-icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export default function Analytics() {
  const StyledSafe = withUniwind(SafeAreaView);

  return (
    <StyledSafe className="flex-1 pt-6">
      <ScrollView className="flex-1 px-6">
        <View>
          <Text variant="h3" className="mb-6">
            Analytics
          </Text>

          <View className="bg-card border-border items-center rounded-xl border p-8">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-purple-500">
              <Icon name="bar-chart-box-fill" size="40" color="white" />
            </View>
            <Text className="mb-2 text-lg font-semibold">No data to analyze</Text>
            <Text variant="muted" className="text-center">
              Add transactions to see insights about your spending
            </Text>
          </View>
        </View>
      </ScrollView>
    </StyledSafe>
  );
}
