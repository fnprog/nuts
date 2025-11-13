import { View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Button, Text, Card } from '../../components/ui';
import { AddTransactionModal } from '../../components/add-transaction-modal';
import Icon from 'react-native-remix-icon';
import type { IconName } from 'react-native-remix-icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useRecentTransactions } from '../../lib/services/transactions';
import type { Transaction } from '../../lib/services/transactions/transaction.types';
import { getTransactionType } from '../../lib/constants/transaction-types';
import { triggerHaptic } from '../../lib/haptics';

export default function Records() {
  const StyledSafe = withUniwind(SafeAreaView);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: transactions = [], isLoading } = useRecentTransactions(50);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};

    transactions.forEach((transaction: Transaction) => {
      const dateKey = formatDate(transaction.transaction_datetime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return Object.entries(grouped).sort(([dateA], [dateB]) => {
      if (dateA === 'Today') return -1;
      if (dateB === 'Today') return 1;
      if (dateA === 'Yesterday') return -1;
      if (dateB === 'Yesterday') return 1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  return (
    <StyledSafe className="flex-1 pt-6">
      <ScrollView className="flex-1 px-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text variant="h3">Records</Text>
          <Pressable
            onPress={() => {
              setShowAddModal(true);
              triggerHaptic('light');
            }}
            className="bg-primary h-12 w-12 items-center justify-center rounded-xl">
            <Icon name="add-line" size="24" color="white" />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="bg-card border-border items-center rounded-xl border p-8">
            <Text className="text-muted-foreground">Loading transactions...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View className="bg-card border-border items-center rounded-xl border p-8">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-green-500">
              <Icon name="file-list-3-fill" size="40" color="white" />
            </View>
            <Text className="text-foreground mb-2 text-lg font-semibold">No transactions yet</Text>
            <Text variant="muted" className="mb-6 text-center">
              Start recording your income and expenses
            </Text>
            <Button
              onPress={() => {
                setShowAddModal(true);
                triggerHaptic('light');
              }}>
              <Text className="text-primary-foreground">Add Transaction</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-6 pb-6">
            {groupTransactionsByDate().map(([date, dateTransactions]) => (
              <View key={date} className="gap-3">
                <Text className="text-muted-foreground text-sm font-semibold uppercase">
                  {date}
                </Text>
                {dateTransactions.map((transaction: Transaction) => {
                  const typeInfo = getTransactionType(transaction.type);
                  const isExpense = transaction.amount < 0;
                  const isIncome = transaction.type === 'income';
                  const isTransfer = transaction.type === 'transfer';

                  return (
                    <Card key={transaction.id} className="flex-row items-center gap-4 p-4">
                      <View
                        className="h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: isExpense ? '#fef2f2' : isIncome ? '#f0fdf4' : '#eff6ff',
                        }}>
                        <Icon
                          name={(typeInfo?.icon as IconName) || 'money-dollar-circle-line'}
                          size="24"
                          color={typeInfo?.color || '#888'}
                        />
                      </View>

                      <View className="flex-1 gap-1">
                        <Text className="text-foreground font-semibold">
                          {transaction.description}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                          {formatTime(transaction.transaction_datetime)}
                        </Text>
                      </View>

                      <View className="items-end gap-1">
                        <Text
                          className="text-base font-bold"
                          style={{
                            color: isExpense ? '#ef4444' : isIncome ? '#10b981' : '#3b82f6',
                          }}>
                          {isExpense ? '-' : isIncome ? '+' : ''}
                          {formatAmount(transaction.amount, transaction.transaction_currency)}
                        </Text>
                        {isTransfer && (
                          <View className="flex-row items-center gap-1">
                            <Icon name="arrow-right-line" size="14" color="#888" />
                            <Text className="text-muted-foreground text-xs">Transfer</Text>
                          </View>
                        )}
                      </View>
                    </Card>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AddTransactionModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
    </StyledSafe>
  );
}
