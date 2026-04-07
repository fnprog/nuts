import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { Text } from '../../../components/ui';
import { usePreferencesStore } from '../../../stores/preferences.store';
import { triggerHaptic } from '../../../lib/haptics';
import Icon from 'react-native-remix-icon';
import { Preferences } from '../../../lib/services/preferences/preferences.types';

const AVAILABLE_LOCALES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
];

const DATE_FORMATS: { value: Preferences['date_format']; label: string }[] = [
  { value: 'dd/mm/yyyy', label: '26/10/2024 (dd/mm/yyyy)' },
  { value: 'mm/dd/yyyy', label: '10/26/2024 (mm/dd/yyyy)' },
  { value: 'yyyy-mm-dd', label: '2024-10-26 (yyyy-mm-dd)' },
];

const TIME_FORMATS: { value: Preferences['time_format']; label: string }[] = [
  { value: '12h', label: '3:30 PM (12h)' },
  { value: '24h', label: '15:30 (24h)' },
];

export default function LocalizationSettings() {
  const router = useRouter();
  const { preferences, updatePreferences, isLoading } = usePreferencesStore();
  const StyledSafe = withUniwind(SafeAreaView);

  const handleUpdate = async (updates: Partial<Preferences>) => {
    triggerHaptic('light');
    try {
      await updatePreferences(updates);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const selectedLocale = AVAILABLE_LOCALES.find((l) => l.value === preferences.locale);

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
          <Text variant="h3">Localization</Text>
        </View>

        <SettingCard
          title="Language"
          description="Select your preferred language"
          value={selectedLocale?.label || 'Not set'}
          onPress={() => router.push('/(dashboard)/settings/localization/language')}
          disabled={isLoading}
        />

        <SettingCard
          title="Timezone"
          description="Set your local timezone"
          value={preferences.timezone}
          onPress={() => router.push('/(dashboard)/settings/localization/timezone')}
          disabled={isLoading}
        />

        <View className="mb-4">
          <Text className="text-foreground mb-3 font-semibold">Date Format</Text>
          {DATE_FORMATS.map((format) => (
            <RadioOption
              key={format.value}
              label={format.label}
              selected={preferences.date_format === format.value}
              onPress={() => handleUpdate({ date_format: format.value })}
              disabled={isLoading}
            />
          ))}
        </View>

        <View className="mb-4">
          <Text className="text-foreground mb-3 font-semibold">Time Format</Text>
          {TIME_FORMATS.map((format) => (
            <RadioOption
              key={format.value}
              label={format.label}
              selected={preferences.time_format === format.value}
              onPress={() => handleUpdate({ time_format: format.value })}
              disabled={isLoading}
            />
          ))}
        </View>

        <View className="bg-card border-border mb-4 rounded-xl border p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-foreground mb-1 font-semibold">Start Week on Monday</Text>
              <Text className="text-muted-foreground text-xs">
                Display Monday as the first day of the week
              </Text>
            </View>
            <Pressable
              onPress={() =>
                handleUpdate({ start_week_on_monday: !preferences.start_week_on_monday })
              }
              disabled={isLoading}
              className={`h-8 w-14 rounded-full ${
                preferences.start_week_on_monday ? 'bg-primary' : 'bg-muted'
              } items-center ${
                preferences.start_week_on_monday ? 'justify-end' : 'justify-start'
              } px-1`}>
              <View className="bg-background h-6 w-6 rounded-full" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </StyledSafe>
  );
}

interface SettingCardProps {
  title: string;
  description: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

function SettingCard({ title, description, value, onPress, disabled }: SettingCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="bg-card border-border mb-4 flex-row items-center justify-between rounded-xl border p-4">
      <View className="flex-1">
        <Text className="text-foreground mb-1 font-semibold">{title}</Text>
        <Text className="text-muted-foreground mb-2 text-xs">{description}</Text>
        <Text className="text-primary text-sm">{value}</Text>
      </View>
      <Icon name="arrow-right-s-line" size={24} color="#9ca3af" />
    </Pressable>
  );
}

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function RadioOption({ label, selected, onPress, disabled }: RadioOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="mb-2 flex-row items-center rounded-xl p-3">
      <View
        className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary' : 'border-muted-foreground'
        }`}>
        {selected && <View className="bg-primary h-3 w-3 rounded-full" />}
      </View>
      <Text className={`flex-1 ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
