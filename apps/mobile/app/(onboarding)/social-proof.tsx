import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-remix-icon';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { haptics } from '../../lib/haptics';
import { useOnboardingStore } from '../../stores/onboarding.store';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Marketing Manager',
    content:
      'Nuts helped me reduce my expenses by 30% in just 3 months. The insights are incredible!',
    initial: 'S',
  },
  {
    name: 'James L.',
    role: 'Software Engineer',
    content: 'Finally, a financial app that actually makes sense. I can see where my money goes.',
    initial: 'J',
  },
  {
    name: 'Maria R.',
    role: 'Teacher',
    content:
      'The goal tracking feature motivated me to save for my dream vacation. Made it in 6 months!',
    initial: 'M',
  },
];

export default function SocialProofOnboarding() {
  const router = useRouter();
  const { setStep } = useOnboardingStore();

  const handleContinue = () => {
    setStep(3);
    haptics.success();
    router.push('/(onboarding)/features');
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
            <Icon name="user-star-fill" size="32" color="#F97316" />
          </View>
          <Text className="text-foreground mb-2 text-center text-2xl font-semibold">
            How Nuts has helped others
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            Join thousands of users who have transformed their financial lives
          </Text>
        </View>

        <View className="mb-6 gap-4">
          {testimonials.map((testimonial, index) => (
            <View key={index} className="rounded-xl border border-gray-200 bg-white p-4">
              <View className="flex-row gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#FFF5E6]">
                  <Text className="font-semibold text-[#F97316]">{testimonial.initial}</Text>
                </View>
                <View className="flex-1">
                  <View className="mb-1 flex-row gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon key={star} name="star-fill" size="14" color="#FBBF24" />
                    ))}
                  </View>
                  <Text className="text-foreground mb-2 text-sm">{testimonial.content}</Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-muted-foreground text-xs font-medium">
                      {testimonial.name}
                    </Text>
                    <Text className="text-muted-foreground text-xs">•</Text>
                    <Text className="text-muted-foreground text-xs">{testimonial.role}</Text>
                  </View>
                </View>
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
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
          </View>
          <Text className="text-muted-foreground mt-2 text-sm">Step 3 of 6</Text>
        </View>
      </View>
    </ScrollView>
  );
}
