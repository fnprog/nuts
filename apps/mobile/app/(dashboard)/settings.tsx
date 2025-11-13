import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { usePreferencesStore } from '../../stores/preferences.store';
import { Button, Text } from '../../components/ui';
import { triggerHaptic } from '../../lib/haptics';
import { SyncStatusIndicator } from '../../components/sync-status-indicator';
import { withUniwind } from 'uniwind';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-remix-icon';

export default function Settings() {
  const router = useRouter();
  const { user, isAnonymous, logout } = useAuthStore();
  const { initialize, preferences } = usePreferencesStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    triggerHaptic('medium');
    logout();
    router.replace('/(onboarding)');
  };

  const StyledSafe = withUniwind(SafeAreaView);

  return (
    <StyledSafe className="flex-1 pt-6">
      <ScrollView className="flex-1 px-6">
        <View>
          <Text variant="h3" className="mb-6">
            Settings
          </Text>

          {!isAnonymous && (
            <View className="bg-card border-border mb-4 rounded-xl border p-6">
              <Text className="text-muted-foreground mb-2 text-sm">Sync Status</Text>
              <SyncStatusIndicator />
            </View>
          )}

          <View className="bg-card border-border mb-4 rounded-xl border p-6">
            <Text className="text-muted-foreground mb-2 text-sm">Account</Text>
            {isAnonymous ? (
              <View>
                <Text className="text-foreground mb-2 text-lg font-semibold">Local Mode</Text>
                <Text className="text-muted-foreground mb-4 text-sm">
                  Your data is stored only on this device
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    triggerHaptic('light');
                    router.push('/(auth)/signup');
                  }}>
                  <Text>Create Account to Sync</Text>
                </Button>
              </View>
            ) : (
              <View>
                <Text className="text-foreground text-lg font-semibold">
                  {user?.name || 'User'}
                </Text>
                <Text className="text-muted-foreground text-sm">{user?.email}</Text>
              </View>
            )}
          </View>

          <View className="bg-card border-border mb-4 rounded-xl border">
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/(dashboard)/settings/appearance');
              }}
              className="border-border flex-row items-center justify-between border-b p-4">
              <View className="flex-row items-center">
                <Icon name="palette-line" size={20} color="#9ca3af" />
                <Text className="text-foreground ml-3">Appearance</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2 text-sm capitalize">
                  {preferences.theme}
                </Text>
                <Icon name="arrow-right-s-line" size={20} color="#9ca3af" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/(dashboard)/settings/currency');
              }}
              className="border-border flex-row items-center justify-between border-b p-4">
              <View className="flex-row items-center">
                <Icon name="money-dollar-circle-line" size={20} color="#9ca3af" />
                <Text className="text-foreground ml-3">Currency</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2 text-sm">{preferences.currency}</Text>
                <Icon name="arrow-right-s-line" size={20} color="#9ca3af" />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/(dashboard)/settings/localization');
              }}
              className="border-border flex-row items-center justify-between border-b p-4">
              <View className="flex-row items-center">
                <Icon name="global-line" size={20} color="#9ca3af" />
                <Text className="text-foreground ml-3">Localization</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2 text-sm">{preferences.locale}</Text>
                <Icon name="arrow-right-s-line" size={20} color="#9ca3af" />
              </View>
            </Pressable>

            <Pressable onPress={() => triggerHaptic('light')} className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Icon name="notification-line" size={20} color="#9ca3af" />
                  <Text className="text-foreground ml-3">Notifications</Text>
                </View>
                <Icon name="arrow-right-s-line" size={20} color="#9ca3af" />
              </View>
            </Pressable>
          </View>

          <View className="bg-card border-border mb-4 rounded-xl border">
            <Pressable
              onPress={() => triggerHaptic('light')}
              className="border-border border-b p-4">
              <Text className="text-foreground">About</Text>
            </Pressable>

            <Pressable
              onPress={() => triggerHaptic('light')}
              className="border-border border-b p-4">
              <Text className="text-foreground">Privacy Policy</Text>
            </Pressable>

            <Pressable onPress={() => triggerHaptic('light')} className="p-4">
              <Text className="text-foreground">Terms of Service</Text>
            </Pressable>
          </View>

          <Button variant="destructive" onPress={handleLogout} className="w-full">
            <Text>{isAnonymous ? 'Clear Data & Restart' : 'Sign Out'}</Text>
          </Button>

          <Text className="text-muted-foreground mt-4 text-center text-xs">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </StyledSafe>
  );
}
