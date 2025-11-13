import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { BottomModal } from './ui/bottom-modal';
import { Button, Text, Input, Label } from './ui';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import Icon from 'react-native-remix-icon';
import { CURRENCIES, getCurrencySymbol } from '../lib/constants/currencies';
import { ACCOUNT_TYPES } from '../lib/constants/account-types';
import { useCreateAccount } from '../lib/services/accounts';
import { triggerHaptic } from '../lib/haptics';
import type { AccountType } from '../lib/services/accounts/account.types';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddAccountModal({ visible, onClose }: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAccountMutation = useCreateAccount();

  const handleSubmit = async () => {
    if (!name.trim()) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Please enter an account name');
      return;
    }

    if (isNaN(parseFloat(balance))) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Please enter a valid balance');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await createAccountMutation.mutateAsync({
        name: name.trim(),
        type: selectedType,
        balance: parseFloat(balance),
        currency: currency,
      });

      triggerHaptic('success');
      setName('');
      setSelectedType('checking');
      setBalance('0');
      setCurrency('USD');
      onClose();
    } catch {
      triggerHaptic('error');
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <BottomModal visible={visible} onClose={onClose} className="pb-10">
      <ScrollView showsVerticalScrollIndicator={false} className="max-h-[80vh]">
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          exiting={FadeOutDown.duration(200)}
          className="gap-6">
          <View>
            <Text variant="h3" className="mb-2">
              Add Account
            </Text>
            <Text className="text-muted-foreground">
              Create a new account to track your finances
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Label>Account Name</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Enter account name"
                autoFocus
                returnKeyType="next"
              />
            </View>

            <View className="gap-2">
              <Label>Account Type</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="gap-2"
                contentContainerClassName="gap-2">
                {ACCOUNT_TYPES.map((type) => {
                  const isSelected = selectedType === type.value;
                  return (
                    <Pressable
                      key={type.value}
                      onPress={() => {
                        setSelectedType(type.value);
                        triggerHaptic('light');
                      }}
                      className={`flex-row items-center gap-2 rounded-xl border px-4 py-3 ${
                        isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                      }`}>
                      <Icon name={type.icon} size="20" color={isSelected ? 'white' : type.color} />
                      <Text
                        className={`font-medium ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}>
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View className="gap-2">
              <Label>Currency</Label>
              <Select
                value={{ value: currency, label: currency }}
                onValueChange={(option) => {
                  if (option?.value) {
                    setCurrency(option.value);
                    triggerHaptic('light');
                  }
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollView className="max-h-60">
                    <SelectGroup>
                      {CURRENCIES.map((curr) => (
                        <SelectItem
                          key={curr.code}
                          label={`${curr.symbol} ${curr.code} - ${curr.name}`}
                          value={curr.code}
                        />
                      ))}
                    </SelectGroup>
                  </ScrollView>
                </SelectContent>
              </Select>
            </View>

            <View className="gap-2">
              <Label>Initial Balance</Label>
              <View className="flex-row items-center gap-2">
                <View className="bg-muted min-w-[48px] items-center justify-center rounded-xl px-3 py-4">
                  <Text className="text-foreground font-semibold">{currencySymbol}</Text>
                </View>
                <Input
                  value={balance}
                  onChangeText={setBalance}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="flex-1"
                />
              </View>
            </View>
          </View>

          <View className="gap-3">
            <Button onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Text className="text-primary-foreground font-semibold">Creating...</Text>
              ) : (
                <>
                  <Icon name="add-line" size="20" color="white" />
                  <Text className="text-primary-foreground font-semibold">Create Account</Text>
                </>
              )}
            </Button>
            <Button variant="ghost" onPress={onClose} disabled={isSubmitting}>
              <Text className="text-foreground">Cancel</Text>
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </BottomModal>
  );
}
