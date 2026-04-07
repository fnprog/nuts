import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { BottomModal } from './ui/bottom-modal';
import { Button, Text, Input, Label, DateTimePicker } from './ui';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import Icon from 'react-native-remix-icon';
import type { IconName } from 'react-native-remix-icon';
import { useQuery } from '@tanstack/react-query';
import { TRANSACTION_TYPES } from '../lib/constants/transaction-types';
import type { TransactionType } from '../lib/services/transactions/transaction.types';
import type { Account } from '../lib/services/accounts/account.types';
import type { Category } from '../lib/services/categories/category.types';
import { useCreateTransaction } from '../lib/services/transactions';
import { getAllAccounts } from '../lib/services/accounts';
import { useCategoriesByType } from '../lib/services/categories';
import { triggerHaptic } from '../lib/haptics';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: accounts = [] } = useQuery(getAllAccounts());
  const { data: categories = [] } = useCategoriesByType(selectedType);

  const createTransactionMutation = useCreateTransaction();

  const currency = accounts.find((acc: Account) => acc.id === accountId)?.currency || 'USD';

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    setCategoryId('');
  }, [selectedType]);

  const handleSubmit = async () => {
    if (!amount.trim() || parseFloat(amount) <= 0) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    if (!accountId) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Please select an account');
      return;
    }

    if (selectedType === 'transfer' && !destinationAccountId) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Please select a destination account for transfer');
      return;
    }

    if (selectedType === 'transfer' && accountId === destinationAccountId) {
      triggerHaptic('error');
      Alert.alert('Validation Error', 'Source and destination accounts must be different');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      await createTransactionMutation.mutateAsync({
        amount: parseFloat(amount),
        type: selectedType,
        account_id: accountId,
        category_id: selectedType === 'transfer' ? undefined : categoryId || undefined,
        destination_account_id: selectedType === 'transfer' ? destinationAccountId : undefined,
        transaction_datetime: transactionDate,
        description: description.trim(),
        transaction_currency: currency,
      });

      triggerHaptic('success');
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDestinationAccountId('');
      setTransactionDate(new Date());
      setSelectedType('expense');
      onClose();
    } catch {
      triggerHaptic('error');
      Alert.alert('Error', 'Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomModal visible={visible} onClose={onClose} className="pb-10">
      <ScrollView showsVerticalScrollIndicator={false} className="max-h-[85vh]">
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          exiting={FadeOutDown.duration(200)}
          className="gap-6">
          <View>
            <Text variant="h3" className="mb-2">
              Add Transaction
            </Text>
            <Text className="text-muted-foreground">Record your income, expense, or transfer</Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Label>Transaction Type</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="gap-2"
                contentContainerClassName="gap-2">
                {TRANSACTION_TYPES.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <Pressable
                      key={type.id}
                      onPress={() => {
                        setSelectedType(type.id);
                        triggerHaptic('light');
                      }}
                      className={`flex-row items-center gap-2 rounded-xl border px-4 py-3 ${
                        isSelected ? 'border-primary bg-primary' : 'border-border bg-card'
                      }`}>
                      <Icon
                        name={type.icon as IconName}
                        size="20"
                        color={isSelected ? 'white' : type.color}
                      />
                      <Text
                        className={`font-medium ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}>
                        {type.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View className="gap-2">
              <Label>Account</Label>
              <Select
                value={
                  accountId
                    ? {
                        value: accountId,
                        label: accounts.find((a) => a.id === accountId)?.name || '',
                      }
                    : undefined
                }
                onValueChange={(option) => {
                  if (option?.value) {
                    setAccountId(option.value);
                    triggerHaptic('light');
                  }
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollView className="max-h-60">
                    <SelectGroup>
                      {accounts.map((account: Account) => (
                        <SelectItem key={account.id} label={account.name} value={account.id} />
                      ))}
                    </SelectGroup>
                  </ScrollView>
                </SelectContent>
              </Select>
            </View>

            {selectedType === 'transfer' && (
              <View className="gap-2">
                <Label>Destination Account</Label>
                <Select
                  value={
                    destinationAccountId
                      ? {
                          value: destinationAccountId,
                          label: accounts.find((a) => a.id === destinationAccountId)?.name || '',
                        }
                      : undefined
                  }
                  onValueChange={(option) => {
                    if (option?.value) {
                      setDestinationAccountId(option.value);
                      triggerHaptic('light');
                    }
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollView className="max-h-60">
                      <SelectGroup>
                        {accounts
                          .filter((a: Account) => a.id !== accountId)
                          .map((account: Account) => (
                            <SelectItem key={account.id} label={account.name} value={account.id} />
                          ))}
                      </SelectGroup>
                    </ScrollView>
                  </SelectContent>
                </Select>
              </View>
            )}

            <View className="gap-2">
              <Label>Amount</Label>
              <View className="flex-row items-center gap-2">
                <View
                  className="bg-muted min-w-[48px] items-center justify-center rounded-xl px-3 py-4"
                  style={{
                    backgroundColor:
                      selectedType === 'expense'
                        ? '#fef2f2'
                        : selectedType === 'income'
                          ? '#f0fdf4'
                          : '#eff6ff',
                  }}>
                  <Text
                    className="font-semibold"
                    style={{
                      color:
                        selectedType === 'expense'
                          ? '#ef4444'
                          : selectedType === 'income'
                            ? '#10b981'
                            : '#3b82f6',
                    }}>
                    {currency === 'USD' ? '$' : currency}
                  </Text>
                </View>
                <Input
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="flex-1"
                />
              </View>
            </View>

            <View className="gap-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="What is this transaction for?"
                returnKeyType="done"
              />
            </View>

            {selectedType !== 'transfer' && (
              <View className="gap-2">
                <Label>Category (Optional)</Label>
                <Select
                  value={
                    categoryId
                      ? {
                          value: categoryId,
                          label: categories.find((c) => c.id === categoryId)?.name || '',
                        }
                      : undefined
                  }
                  onValueChange={(option) => {
                    if (option?.value) {
                      setCategoryId(option.value);
                      triggerHaptic('light');
                    }
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollView className="max-h-60">
                      <SelectGroup>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} label={category.name} value={category.id} />
                        ))}
                      </SelectGroup>
                    </ScrollView>
                  </SelectContent>
                </Select>
              </View>
            )}

            <DateTimePicker
              label="Date & Time"
              value={transactionDate}
              onChange={setTransactionDate}
            />
          </View>

          <View className="gap-3">
            <Button onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Text className="text-primary-foreground font-semibold">Creating...</Text>
              ) : (
                <>
                  <Icon name="add-line" size="20" color="white" />
                  <Text className="text-primary-foreground font-semibold">Create Transaction</Text>
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
