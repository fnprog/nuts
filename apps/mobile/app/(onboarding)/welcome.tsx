import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useAuthStore } from '../../stores/auth.store';

export default function Welcome() {
  const router = useRouter();
  const { setAnonymous } = useAuthStore();

  const handleLogin = () => {
    haptics.light();
    router.push('/(auth)/login');
  };

  const handleSignup = () => {
    haptics.light();
    router.push('/(auth)/signup');
  };

  const handleLocalMode = () => {
    haptics.medium();
    setAnonymous(true);
    router.replace('/(dashboard)');
  };

  return (
    <View className="bg-background/95 flex-1">
      <Pressable
        className="flex-1"
        onPress={() => {
          haptics.light();
          router.back();
        }}
      />

      <View className="bg-card border-border rounded-t-3xl border-t px-6 pt-6 pb-8">
        <View className="bg-muted mb-6 h-1 w-12 self-center rounded-full" />

        <Text className="text-foreground mb-2 text-2xl font-bold">Choose how to continue</Text>

        <Text className="text-muted-foreground mb-6">
          Sign in to sync your data across devices, or work locally on this device only
        </Text>

        <View className="space-y-3">
          <Button onPress={handleSignup} size="lg" className="w-full">
            <Text>Create Account</Text>
          </Button>

          <Button onPress={handleLogin} size="lg" variant="outline" className="w-full">
            <Text>Sign In</Text>
          </Button>

          <View className="my-4 flex-row items-center gap-3">
            <View className="bg-border h-px flex-1" />
            <Text className="text-muted-foreground text-sm">OR</Text>
            <View className="bg-border h-px flex-1" />
          </View>

          <Button onPress={handleLocalMode} size="lg" variant="ghost" className="w-full">
            <Text>Work Locally (No Account)</Text>
          </Button>

          <Text className="text-muted-foreground mt-2 text-center text-xs">
            Local mode stores data on your device only. You can create an account later to sync.
          </Text>
        </View>
      </View>
    </View>
  );
}
