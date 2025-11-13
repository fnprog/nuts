import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { Text } from '../../../components/ui';
import { usePreferencesStore } from '../../../stores/preferences.store';
import { triggerHaptic } from '../../../lib/haptics';
import Icon, { IconName } from 'react-native-remix-icon';

export default function AppearanceSettings() {
  const router = useRouter();
  const { preferences, updatePreferences, isLoading } = usePreferencesStore();
  const StyledSafe = withUniwind(SafeAreaView);

  const handleThemeChange = async (theme: 'system' | 'light' | 'dark') => {
    triggerHaptic('light');
    try {
      await updatePreferences({ theme });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleDarkSidebarToggle = async () => {
    triggerHaptic('light');
    try {
      await updatePreferences({ dark_sidebar: !preferences.dark_sidebar });
    } catch (error) {
      console.error('Failed to toggle dark sidebar:', error);
    }
  };

  return (
    <StyledSafe className="flex-1 pt-6">
      <ScrollView className="flex-1 px-6">
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            className="mr-3">
            <Icon name="arrow-left-line" size={24} color="currentColor" />
          </Pressable>
          <Text variant="h3">Appearance</Text>
        </View>

        <View className="mb-6">
          <Text className="text-muted-foreground mb-4 text-sm">Theme</Text>
          <Text className="text-muted-foreground mb-4 text-xs">
            Customize the look and feel of the application
          </Text>

          <View className="flex-row justify-between gap-3">
            <ThemeOption
              title="System"
              icon="contrast-2-line"
              selected={preferences.theme === 'system'}
              onPress={() => handleThemeChange('system')}
              disabled={isLoading}
            />
            <ThemeOption
              title="Light"
              icon="sun-line"
              selected={preferences.theme === 'light'}
              onPress={() => handleThemeChange('light')}
              disabled={isLoading}
            />
            <ThemeOption
              title="Dark"
              icon="moon-line"
              selected={preferences.theme === 'dark'}
              onPress={() => handleThemeChange('dark')}
              disabled={isLoading}
            />
          </View>
        </View>

        <View className="bg-card border-border rounded-xl border p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground mb-1 font-semibold">Dark Sidebar</Text>
              <Text className="text-muted-foreground text-xs">
                Display dark sidebar regardless of selected theme
              </Text>
            </View>
            <Pressable
              onPress={handleDarkSidebarToggle}
              disabled={isLoading}
              className={`h-8 w-14 rounded-full ${
                preferences.dark_sidebar ? 'bg-primary' : 'bg-muted'
              } items-center ${preferences.dark_sidebar ? 'justify-end' : 'justify-start'} px-1`}>
              <View className="bg-background h-6 w-6 rounded-full" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </StyledSafe>
  );
}

interface ThemeOptionProps {
  title: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function ThemeOption({ title, icon, selected, onPress, disabled }: ThemeOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`bg-card border-2 ${
        selected ? 'border-primary' : 'border-border'
      } flex-1 items-center justify-center rounded-xl p-6`}>
      <View className="relative">
        <Icon name={icon} size={32} color={selected ? 'currentColor' : '#9ca3af'} />
        {selected && (
          <View className="bg-primary absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full">
            <Icon name="check-line" size={12} color="white" />
          </View>
        )}
      </View>
      <Text
        className={`mt-3 text-sm font-medium ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
        {title}
      </Text>
    </Pressable>
  );
}
