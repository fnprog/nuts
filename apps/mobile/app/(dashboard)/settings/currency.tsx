import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useState } from 'react';
import { Text } from '../../../components/ui';
import { usePreferencesStore } from '../../../stores/preferences.store';
import { triggerHaptic } from '../../../lib/haptics';
import { CURRENCIES, Currency } from '../../../lib/constants/currencies';
import Icon from 'react-native-remix-icon';

export default function CurrencySettings() {
  const router = useRouter();
  const { preferences, updatePreferences, isLoading } = usePreferencesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const StyledSafe = withUniwind(SafeAreaView);

  const filteredCurrencies = CURRENCIES.filter(
    (currency) =>
      currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCurrencySelect = async (code: string) => {
    triggerHaptic('light');
    try {
      await updatePreferences({ currency: code });
      router.back();
    } catch (error) {
      console.error('Failed to update currency:', error);
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
          <Text variant="h3">Currency</Text>
        </View>

        <Text className="text-muted-foreground mb-4 text-xs">
          Select your default currency for transactions and reporting
        </Text>

        <View className="bg-card border-border mb-4 flex-row items-center rounded-xl border px-4 py-3">
          <Icon name="search-line" size={20} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search currencies..."
            placeholderTextColor="#9ca3af"
            className="text-foreground ml-2 flex-1"
          />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {filteredCurrencies.map((currency) => (
            <CurrencyItem
              key={currency.code}
              currency={currency}
              selected={preferences.currency === currency.code}
              onSelect={() => handleCurrencySelect(currency.code)}
              disabled={isLoading}
            />
          ))}
          {filteredCurrencies.length === 0 && (
            <View className="py-12">
              <Text className="text-muted-foreground text-center">No currencies found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </StyledSafe>
  );
}

interface CurrencyItemProps {
  currency: Currency;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function CurrencyItem({ currency, selected, onSelect, disabled }: CurrencyItemProps) {
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      className={`bg-card border-border mb-2 flex-row items-center justify-between rounded-xl border p-4 ${
        selected ? 'border-primary' : ''
      }`}>
      <View className="flex-row items-center">
        <View
          className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
            selected ? 'bg-primary/20' : 'bg-muted'
          }`}>
          <Text
            className={`text-lg font-bold ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
            {currency.symbol}
          </Text>
        </View>
        <View>
          <Text className="text-foreground font-semibold">{currency.name}</Text>
          <Text className="text-muted-foreground text-sm">{currency.code}</Text>
        </View>
      </View>
      {selected && <Icon name="check-line" size={24} color="currentColor" />}
    </Pressable>
  );
}
