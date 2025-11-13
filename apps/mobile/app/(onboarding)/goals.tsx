import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Icon from 'react-native-remix-icon';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { haptics } from '../../lib/haptics';
import { useOnboardingStore } from '../../stores/onboarding.store';

const goalOptions = [
  {
    id: 'emergency-fund',
    icon: 'shield-check-fill' as const,
    title: 'Build an emergency fund',
    color: '#10B981',
  },
  {
    id: 'pay-debt',
    icon: 'delete-bin-fill' as const,
    title: 'Pay off debt',
    color: '#EF4444',
  },
  {
    id: 'buy-home',
    icon: 'home-heart-fill' as const,
    title: 'Buy a home',
    color: '#3B82F6',
  },
  {
    id: 'save-vacation',
    icon: 'plane-fill' as const,
    title: 'Save for a vacation',
    color: '#F59E0B',
  },
  {
    id: 'invest-future',
    icon: 'line-chart-fill' as const,
    title: 'Invest for the future',
    color: '#8B5CF6',
  },
  {
    id: 'buy-car',
    icon: 'car-fill' as const,
    title: 'Buy a car',
    color: '#06B6D4',
  },
  {
    id: 'save-education',
    icon: 'book-open-fill' as const,
    title: 'Save for education',
    color: '#EC4899',
  },
  {
    id: 'general-savings',
    icon: 'money-dollar-circle-fill' as const,
    title: 'Build general savings',
    color: '#F97316',
  },
];

export default function GoalsOnboarding() {
  const router = useRouter();
  const { selectedGoals, setGoals, setStep } = useOnboardingStore();
  const [localGoals, setLocalGoals] = useState<string[]>(selectedGoals);

  const toggleGoal = (goalId: string) => {
    haptics.light();
    setLocalGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    setGoals(localGoals);
    setStep(5);
    haptics.success();
    router.push('/(onboarding)/complexity');
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
            <Icon name="focus-3-fill" size="32" color="#F97316" />
          </View>
          <Text className="text-foreground mb-2 text-center text-2xl font-semibold">
            What are your financial goals?
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            Select all that apply. We&apos;ll help you track progress toward them.
          </Text>
        </View>

        <View className="mb-6 gap-3">
          {goalOptions.map((goal) => {
            const isSelected = localGoals.includes(goal.id);
            return (
              <Pressable
                key={goal.id}
                onPress={() => toggleGoal(goal.id)}
                className={`flex-row items-center gap-3 rounded-xl border-2 bg-white p-4 ${
                  isSelected ? 'border-[#F97316]' : 'border-gray-200'
                }`}>
                <View
                  className="h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: isSelected ? `${goal.color}20` : '#FFF5E6' }}>
                  <Icon name={goal.icon} size="24" color={isSelected ? goal.color : '#F97316'} />
                </View>
                <Text
                  className={`flex-1 ${isSelected ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                  {goal.title}
                </Text>
                {isSelected && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-[#F97316]">
                    <Icon name="check-line" size="16" color="#FFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Button
          onPress={handleContinue}
          size="lg"
          className="w-full bg-[#F97316]"
          disabled={localGoals.length === 0}>
          <Text className="font-semibold text-white">Continue</Text>
        </Button>

        <View className="mt-8 items-center">
          <View className="flex-row gap-2">
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
          </View>
          <Text className="text-muted-foreground mt-2 text-sm">Step 5 of 6</Text>
        </View>
      </View>
    </ScrollView>
  );
}
