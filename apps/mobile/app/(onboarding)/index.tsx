import { useRef, useMemo, useCallback } from 'react';
import { View, Platform, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '../../components/ui';
import { Icon } from '../../components/ui/icon';
import { haptics } from '../../lib/haptics';
import { useAuthStore } from '../../stores/auth.store';
import { Mail } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps, BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SquircleView from 'react-native-fast-squircle';
import { AnimatedFinanceHero } from '../../components/icons/AnimatedFinanceHero';
import { Google } from '../../components/icons/google';
import { Apple } from '../../components/icons/apple';

export default function OnboardingIndex() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { setAnonymous } = useAuthStore();
  const snapPoints = useMemo(() => ['50%'], []);

  const handleGetStarted = () => {
    haptics.medium();
    setAnonymous(true);
    router.push('/(onboarding)/name');
  };

  const handleSignInPress = () => {
    haptics.light();
    bottomSheetRef.current?.expand();
  };

  const handleGoogleLogin = () => {
    haptics.medium();
    bottomSheetRef.current?.close();
  };

  const handleAppleLogin = () => {
    haptics.medium();
    bottomSheetRef.current?.close();
  };

  const handleEmailLogin = () => {
    haptics.light();
    bottomSheetRef.current?.close();
    setTimeout(() => router.push('/(auth)/login'), 300);
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

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-white px-6">
        <View className="flex-1 items-center justify-center">
          <View className="mb-8 items-center">
            <AnimatedFinanceHero width={280} height={200} />
          </View>

          <Text variant="h1" className="mb-2 text-center">
            Master Your Money
          </Text>
          <Text variant="muted" className="mb-10 text-center">
            Budget smarter. Save faster. Achieve your goals.
          </Text>
        </View>

        <View className="mb-8 gap-3">
          <Button onPress={handleGetStarted} size="lg" className="w-full">
            <Text variant="large" className="font-semibold">
              Get Started
            </Text>
          </Button>

          <Pressable onPress={handleSignInPress} className="mt-2 items-center">
            <Text variant="muted" className="text-center">
              Have an account already?{' '}
              <Text variant="muted" className="text-primary font-semibold">
                Sign in
              </Text>
            </Text>
          </Pressable>

          <Text variant="muted" className="mt-4 text-center text-xs leading-5">
            By using Nuts Finance, you agree to Nuts Finance{'\n'}
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
            .
          </Text>
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
                Sign In
              </Text>
              <Text variant="muted">Welcome back! Sign in to continue.</Text>
            </View>

            <View className="gap-3">
              <Button
                onPress={handleGoogleLogin}
                size="lg"
                variant="outline"
                className="border-border w-full border">
                <View className="h-5 w-5">
                  <Google width={20} height={20} />
                </View>
                <Text className="font-semibold">Continue with Google</Text>
              </Button>

              <Button
                onPress={handleAppleLogin}
                size="lg"
                variant="outline"
                className="border-border w-full border">
                <Apple width={20} height={20} />
                <Text className="font-semibold">Continue with Apple</Text>
              </Button>

              <Button
                onPress={handleEmailLogin}
                size="lg"
                variant="outline"
                className="border-border w-full border">
                <Icon as={Mail} size={20} className="text-foreground" />
                <Text className="font-semibold">Login with Email</Text>
              </Button>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
