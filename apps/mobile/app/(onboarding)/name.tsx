import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-remix-icon';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { haptics } from '../../lib/haptics';
import { useOnboardingStore } from '../../stores/onboarding.store';

export default function NameOnboarding() {
  const router = useRouter();
  const {
    firstName: savedFirstName,
    lastName: savedLastName,
    setName,
    setStep,
  } = useOnboardingStore();

  const [firstName, setFirstName] = useState(savedFirstName);
  const [lastName, setLastName] = useState(savedLastName);
  const [errors, setErrors] = useState({ firstName: '', lastName: '' });

  const handleContinue = () => {
    const newErrors = { firstName: '', lastName: '' };

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.length > 50) {
      newErrors.firstName = 'First name must be at most 50 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.length > 50) {
      newErrors.lastName = 'Last name must be at most 50 characters';
    }

    if (newErrors.firstName || newErrors.lastName) {
      setErrors(newErrors);
      haptics.error();
      return;
    }

    setName(firstName.trim(), lastName.trim());
    setStep(1);
    haptics.success();
    router.push('/(onboarding)/finance-interest');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-50">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-12 pb-8">
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#FFF5E6]">
            <Icon name="user-3-fill" size="32" color="#F97316" />
          </View>
          <Text variant="h3" className="mb-2 text-center">
            What should we call you?
          </Text>
          <Text variant="muted" className="text-center text-base">
            We&apos;ll use this information to personalize your experience
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-foreground mb-2 font-medium">First Name</Text>
            <Input
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
            />
            {errors.firstName ? (
              <Text className="mt-1 text-sm text-red-600">{errors.firstName}</Text>
            ) : null}
          </View>

          <View>
            <Text className="text-foreground mb-2 font-medium">Last Name</Text>
            <Input
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
            />
            {errors.lastName ? (
              <Text className="mt-1 text-sm text-red-600">{errors.lastName}</Text>
            ) : null}
          </View>

          <Button onPress={handleContinue} size="lg" className="mt-6 w-full">
            <Text className="text-primary-foreground font-semibold">Continue</Text>
          </Button>
        </View>

        <View className="mt-8 items-center">
          <View className="flex-row gap-2">
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
            <View className="h-2 w-2 rounded-full bg-gray-300" />
          </View>
          <Text className="text-muted-foreground mt-2 text-sm">Step 1 of 6</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
