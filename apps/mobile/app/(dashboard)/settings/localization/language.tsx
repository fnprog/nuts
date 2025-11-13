import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { Text } from '../../../../components/ui';
import { usePreferencesStore } from '../../../../stores/preferences.store';
import { triggerHaptic } from '../../../../lib/haptics';
import Icon from 'react-native-remix-icon';

const AVAILABLE_LOCALES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
];

export default function LanguageSettings() {
  const router = useRouter();
  const { preferences, updatePreferences, isLoading } = usePreferencesStore();
  const StyledSafe = withUniwind(SafeAreaView);

  const handleLanguageSelect = async (locale: string) => {
    triggerHaptic('light');
    try {
      await updatePreferences({ locale });
      router.back();
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  return (
    <StyledSafe className="flex-1 pt-6">
      <View className="flex-1 px-6">
        <View className="mb-4 flex-row items-center">
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            className="mr-3">
            <Icon name="arrow-left-line" size={24} color="currentColor" />
          </Pressable>
          <Text variant="h3">Language</Text>
        </View>

        <Text className="text-muted-foreground mb-4 text-xs">
          Select your preferred language for the app
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {AVAILABLE_LOCALES.map((locale) => (
            <Pressable
              key={locale.value}
              onPress={() => handleLanguageSelect(locale.value)}
              disabled={isLoading}
              className={`bg-card border-border mb-2 flex-row items-center justify-between rounded-xl border p-4 ${
                preferences.locale === locale.value ? 'border-primary' : ''
              }`}>
              <Text
                className={`text-foreground ${
                  preferences.locale === locale.value ? 'font-semibold' : ''
                }`}>
                {locale.label}
              </Text>
              {preferences.locale === locale.value && (
                <Icon name="check-line" size={24} color="currentColor" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </StyledSafe>
  );
}
