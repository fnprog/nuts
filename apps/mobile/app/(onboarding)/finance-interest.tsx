import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-remix-icon';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { haptics } from '../../lib/haptics';
import { useOnboardingStore } from '../../stores/onboarding.store';

export default function FinanceInterestOnboarding() {
  const router = useRouter();
  const { setBetterFinance, setStep } = useOnboardingStore();

  const handleYes = () => {
    setBetterFinance(true);
    setStep(2);
    haptics.success();
    router.push('/(onboarding)/social-proof');
  };

  const handleNo = () => {
    setBetterFinance(false);
    setStep(2);
    haptics.success();
    router.push('/(onboarding)/social-proof');
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
            <Icon name="line-chart-fill" size="32" color="#F97316" />
          </View>
          <Text className="text-foreground mb-2 text-center text-2xl font-semibold">
            Do you want to better understand your personal finance?
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            We can help you gain insights into your spending patterns, savings goals, and financial
            health
          </Text>
        </View>

        <View className="gap-4">
          <Button onPress={handleYes} size="lg" className="w-full bg-[#F97316]">
            <Text className="text-base font-semibold text-white">Yes, I want to learn more</Text>
          </Button>

          <Button onPress={handleNo} size="lg" variant="outline" className="w-full border-2">
            <Text className="text-foreground text-base font-semibold">
              No, I&apos;m already comfortable
            </Text>
          </Button>
        </View>

        <View className="mt-8 items-center">
          <View className="flex-row gap-2">
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
          </View>
          <Text className="text-muted-foreground mt-2 text-sm">Step 2 of 6</Text>
        </View>
      </View>
    </ScrollView>
  );
}
