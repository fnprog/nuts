import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-remix-icon';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { haptics } from '../../lib/haptics';
import { useOnboardingStore } from '../../stores/onboarding.store';

const features = [
  {
    icon: 'pie-chart-fill' as const,
    title: 'Expense Tracking',
    description: 'Automatically categorize your transactions and see where your money goes',
    color: '#F97316',
  },
  {
    icon: 'focus-3-fill' as const,
    title: 'Goal Setting',
    description: 'Set and track financial goals like saving for vacation or emergency fund',
    color: '#10B981',
  },
  {
    icon: 'line-chart-fill' as const,
    title: 'Net Worth Tracking',
    description: 'Monitor your wealth over time by connecting all your accounts',
    color: '#3B82F6',
  },
  {
    icon: 'bar-chart-box-fill' as const,
    title: 'Budget Management',
    description: 'Create flexible budgets that adapt to your lifestyle',
    color: '#8B5CF6',
  },
  {
    icon: 'bank-card-fill' as const,
    title: 'Account Aggregation',
    description: 'Connect checking, savings, credit cards, and investment accounts',
    color: '#06B6D4',
  },
  {
    icon: 'calendar-check-fill' as const,
    title: 'Bill Reminders',
    description: 'Never miss a payment again with smart reminders',
    color: '#EF4444',
  },
];

export default function FeaturesOnboarding() {
  const router = useRouter();
  const { setStep } = useOnboardingStore();

  const handleContinue = () => {
    setStep(4);
    haptics.success();
    router.push('/(onboarding)/goals');
  };

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="px-6 pt-12 pb-8">
        <Pressable onPress={handleBack} className="mb-6">
          <Icon name="arrow-left-line" size="24" color="#000" />
        </Pressable>

        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#FFF5E6]">
            <Icon name="apps-fill" size="32" color="#F97316" />
          </View>
          <Text className="text-foreground mb-2 text-center text-2xl font-semibold">
            Here&apos;s how Nuts can help you
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            Powerful features designed to simplify your financial life
          </Text>
        </View>

        <View className="mb-6 gap-3">
          {features.map((feature, index) => (
            <View
              key={index}
              className="flex-row gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-[#FFF5E6]">
                <Icon name={feature.icon} size="24" color={feature.color} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground mb-1 font-semibold">{feature.title}</Text>
                <Text className="text-muted-foreground text-sm">{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button onPress={handleContinue} size="lg" className="w-full bg-[#F97316]">
          <Text className="font-semibold text-white">Continue</Text>
        </Button>

        <View className="mt-8 items-center">
          <View className="flex-row gap-2">
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
          </View>
          <Text className="text-muted-foreground mt-2 text-sm">Step 4 of 6</Text>
        </View>
      </View>
    </ScrollView>
  );
}
