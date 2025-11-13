import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { useOnboardingStore } from '../stores/onboarding.store';
import { initializeSyncServices } from '../lib/sync';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isAnonymous } = useAuthStore();
  const { isCompleted: isOnboardingCompleted } = useOnboardingStore();
  const [_isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await initializeSyncServices();
        console.log('✅ Sync services initialized on app start');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize sync services:', error);
        setIsInitialized(true);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isAuthenticated || isAnonymous) {
        if (isOnboardingCompleted) {
          router.replace('/(dashboard)');
        } else {
          router.replace('/(onboarding)/name');
        }
      } else {
        router.replace('/(onboarding)');
      }
    };

    checkAuth();
  }, [isAuthenticated, isAnonymous, isOnboardingCompleted, router]);

  return (
    <View className="bg-background flex-1 items-center justify-center">
      <ActivityIndicator size="large" className="text-primary" />
    </View>
  );
}
