import { View, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useMemo, useCallback } from 'react';
import Icon from 'react-native-remix-icon';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Icon as LucideIcon } from '../../components/ui/icon';
import { Mail } from 'lucide-react-native';
import { haptics } from '../../lib/haptics';
import { useOnboardingStore } from '../../stores/onboarding.store';
import { BlurView } from 'expo-blur';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps, BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SquircleView from 'react-native-fast-squircle';
import { Google } from '../../components/icons/google';
import { Apple } from '../../components/icons/apple';

export default function ComplexityOnboarding() {
  const router = useRouter();
  const { setComplexFinance, completeOnboarding, firstName } = useOnboardingStore();
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);

  const handleSelectOption = (isComplex: boolean) => {
    haptics.light();
    setSelectedOption(isComplex);
  };

  const handleContinue = () => {
    if (selectedOption === null) return;
    setComplexFinance(selectedOption);
    haptics.success();
    setShowCompletion(true);
  };

  const handleShowSignupOptions = () => {
    haptics.light();
    bottomSheetRef.current?.expand();
  };

  const handleGoogleSignup = () => {
    haptics.medium();
    bottomSheetRef.current?.close();
  };

  const handleAppleSignup = () => {
    haptics.medium();
    bottomSheetRef.current?.close();
  };

  const handleEmailSignup = () => {
    haptics.light();
    bottomSheetRef.current?.close();
    setTimeout(() => router.push('/(auth)/signup'), 300);
  };

  const handleSignupLater = () => {
    completeOnboarding();
    haptics.success();
    bottomSheetRef.current?.close();
    setTimeout(() => router.replace('/(dashboard)'), 300);
  };

  const handleTermsPress = () => {
    haptics.light();
    Linking.openURL('https://nuts.finance/terms');
  };

  const handlePrivacyPress = () => {
    haptics.light();
    Linking.openURL('https://nuts.finance/privacy');
  };

  const handlePreContractualPress = () => {
    haptics.light();
    Linking.openURL('https://nuts.finance/pre-contractual');
  };

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 30 : 50}
          tint="dark"
          style={{ flex: 1 }}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        />
      </BottomSheetBackdrop>
    ),
    []
  );

  const renderBackground = useCallback(
    (props: BottomSheetBackgroundProps) => (
      <SquircleView
        style={[
          props.style,
          {
            backgroundColor: 'white',
            borderRadius: 24,
          },
        ]}
        cornerSmoothing={0.9}
      />
    ),
    []
  );

  if (showCompletion) {
    return (
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 items-center justify-center bg-neutral-50 px-6">
          <View className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-[#FFF5E6]">
              <Icon name="check-double-fill" size="48" color="#F97316" />
            </View>
            <Text className="text-foreground mb-3 text-center text-3xl font-bold">
              You&apos;re all set{firstName ? `, ${firstName}` : ''}!
            </Text>
            <Text className="text-muted-foreground mb-8 px-4 text-center text-base">
              Let&apos;s start building better financial habits together
            </Text>
            <Button onPress={handleShowSignupOptions} size="lg" className="w-full bg-[#F97316]">
              <Text className="font-semibold text-white">Continue</Text>
            </Button>
          </View>

          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            detached={true}
            bottomInset={40}
            aria-selected
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundComponent={renderBackground}
            handleIndicatorStyle={{ height: 0 }}
            style={{ marginHorizontal: 20 }}>
            <BottomSheetView className="px-6 pb-8">
              <View className="mb-6">
                <Text variant="h3" className="mb-2">
                  Create Your Account
                </Text>
                <Text variant="muted">
                  Sign up now to save your progress and sync across devices
                </Text>
              </View>

              <View className="gap-3">
                <Button
                  onPress={handleGoogleSignup}
                  size="lg"
                  variant="outline"
                  className="border-border w-full border">
                  <View className="h-5 w-5">
                    <Google width={20} height={20} />
                  </View>
                  <Text className="font-semibold">Continue with Google</Text>
                </Button>

                <Button
                  onPress={handleAppleSignup}
                  size="lg"
                  variant="outline"
                  className="border-border w-full border">
                  <Apple width={20} height={20} />
                  <Text className="font-semibold">Continue with Apple</Text>
                </Button>

                <Button
                  onPress={handleEmailSignup}
                  size="lg"
                  variant="outline"
                  className="border-border w-full border">
                  <LucideIcon as={Mail} size={20} className="text-foreground" />
                  <Text className="font-semibold">Sign up with Email</Text>
                </Button>

                <Button onPress={handleSignupLater} size="lg" variant="ghost" className="w-full">
                  <Text className="text-muted-foreground font-semibold">Sign up Later</Text>
                </Button>
              </View>

              <Text variant="muted" className="mt-6 text-center text-xs leading-5">
                By signing up, you agree to{'\n'}
                <Pressable onPress={handleTermsPress}>
                  <Text variant="muted" className="text-xs font-semibold underline">
                    Terms of Use
                  </Text>
                </Pressable>
                {', '}
                <Pressable onPress={handlePrivacyPress}>
                  <Text variant="muted" className="text-xs font-semibold underline">
                    Privacy Policy
                  </Text>
                </Pressable>
                {' and '}
                <Pressable onPress={handlePreContractualPress}>
                  <Text variant="muted" className="text-xs font-semibold underline">
                    Pre-contractual Terms
                  </Text>
                </Pressable>
              </Text>
            </BottomSheetView>
          </BottomSheet>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="px-6 pt-12 pb-8">
        <Pressable onPress={handleBack} className="mb-6">
          <Icon name="arrow-left-line" size="24" color="#000" />
        </Pressable>

        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#FFF5E6]">
            <Icon name="question-line" size="32" color="#F97316" />
          </View>
          <Text className="text-foreground mb-2 text-center text-2xl font-semibold">
            One last question
          </Text>
          <Text className="text-muted-foreground text-center text-base">
            How would you describe your financial situation?
          </Text>
        </View>

        <View className="mb-6 gap-3">
          <Pressable
            onPress={() => handleSelectOption(false)}
            className={`rounded-xl border-2 bg-white p-6 ${
              selectedOption === false ? 'border-[#F97316]' : 'border-gray-200'
            }`}>
            <View className="mb-2 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-[#FFF5E6]">
                <Icon name="user-smile-fill" size="24" color="#10B981" />
              </View>
              <Text className="text-foreground flex-1 text-lg font-semibold">
                Simple and straightforward
              </Text>
              {selectedOption === false && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-[#F97316]">
                  <Icon name="check-line" size="16" color="#FFF" />
                </View>
              )}
            </View>
            <Text className="text-muted-foreground ml-15">
              I have a few accounts, regular income, and want to keep things simple
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelectOption(true)}
            className={`rounded-xl border-2 bg-white p-6 ${
              selectedOption === true ? 'border-[#F97316]' : 'border-gray-200'
            }`}>
            <View className="mb-2 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-[#FFF5E6]">
                <Icon name="links-fill" size="24" color="#8B5CF6" />
              </View>
              <Text className="text-foreground flex-1 text-lg font-semibold">More complex</Text>
              {selectedOption === true && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-[#F97316]">
                  <Icon name="check-line" size="16" color="#FFF" />
                </View>
              )}
            </View>
            <Text className="text-muted-foreground ml-15">
              I have multiple accounts, investments, properties, or variable income
            </Text>
          </Pressable>
        </View>

        <Button
          onPress={handleContinue}
          size="lg"
          className="w-full bg-[#F97316]"
          disabled={selectedOption === null}>
          <Text className="font-semibold text-white">Continue</Text>
        </Button>

        <View className="mt-8 items-center">
          <View className="flex-row gap-2">
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
            <View className="h-2 w-2 rounded-full bg-[#F97316]" />
          </View>
          <Text className="text-muted-foreground mt-2 text-sm">Step 6 of 6</Text>
        </View>
      </View>
    </ScrollView>
  );
}
