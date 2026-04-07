import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useState, useMemo } from 'react';
import { Text } from '../../../../components/ui';
import { usePreferencesStore } from '../../../../stores/preferences.store';
import { triggerHaptic } from '../../../../lib/haptics';
import Icon from 'react-native-remix-icon';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
  { value: 'America/New_York', label: 'America/New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST/PDT)' },
  { value: 'America/Toronto', label: 'America/Toronto (EST/EDT)' },
  { value: 'America/Mexico_City', label: 'America/Mexico City (CST/CDT)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao Paulo (BRT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (MSK)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (EET)' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (HKT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT)' },
];

export default function TimezoneSettings() {
  const router = useRouter();
  const { preferences, updatePreferences, isLoading } = usePreferencesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const StyledSafe = withUniwind(SafeAreaView);

  const filteredTimezones = useMemo(
    () =>
      COMMON_TIMEZONES.filter(
        (tz) =>
          tz.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tz.value.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const handleTimezoneSelect = async (timezone: string) => {
    triggerHaptic('light');
    try {
      await updatePreferences({ timezone });
      router.back();
    } catch (error) {
      console.error('Failed to update timezone:', error);
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
          <Text variant="h3">Timezone</Text>
        </View>

        <Text className="text-muted-foreground mb-4 text-xs">
          Select your local timezone for accurate time display
        </Text>

        <View className="bg-card border-border mb-4 flex-row items-center rounded-xl border px-4 py-3">
          <Icon name="search-line" size={20} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search timezones..."
            placeholderTextColor="#9ca3af"
            className="text-foreground ml-2 flex-1"
          />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {filteredTimezones.map((timezone) => (
            <Pressable
              key={timezone.value}
              onPress={() => handleTimezoneSelect(timezone.value)}
              disabled={isLoading}
              className={`bg-card border-border mb-2 flex-row items-center justify-between rounded-xl border p-4 ${
                preferences.timezone === timezone.value ? 'border-primary' : ''
              }`}>
              <View className="flex-1">
                <Text
                  className={`text-foreground ${
                    preferences.timezone === timezone.value ? 'font-semibold' : ''
                  }`}>
                  {timezone.label}
                </Text>
              </View>
              {preferences.timezone === timezone.value && (
                <Icon name="check-line" size={24} color="currentColor" />
              )}
            </Pressable>
          ))}
          {filteredTimezones.length === 0 && (
            <View className="py-12">
              <Text className="text-muted-foreground text-center">No timezones found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </StyledSafe>
  );
}
