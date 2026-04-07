import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Text } from '../../components/ui';
import Icon from 'react-native-remix-icon';
import { getAllAccounts } from '../../lib/services/accounts';
import { triggerHaptic } from '../../lib/haptics';
import { getCurrencySymbol } from '../../lib/constants/currencies';
import { getAccountTypeOption } from '../../lib/constants/account-types';
import { AddAccountModal } from '../../components/add-account-modal';
import type { Account } from '../../lib/services/accounts/account.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export default function Accounts() {
  const { data: accounts, isLoading, error } = useQuery(getAllAccounts());
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const StyledSafe = withUniwind(SafeAreaView);

  const handleAddAccount = () => {
    triggerHaptic('medium');
    setIsAddModalVisible(true);
  };

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <Text className="text-destructive mb-4 text-center">Failed to load accounts</Text>
        <Text className="text-muted-foreground text-center text-sm">{error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6">
      <StyledSafe className="flex-1 pt-6">
        <View className="mb-6 flex-row items-center justify-between">
          <Text variant="h3">Accounts</Text>
          <Button size="sm" onPress={handleAddAccount}>
            <Icon name="add-line" size="20" color="white" />
            <Text className="text-primary-foreground ml-2">Add</Text>
          </Button>
        </View>

        {accounts && accounts.length === 0 ? (
          <View className="bg-card border-border items-center rounded-xl border p-8">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-blue-500">
              <Icon name="bank-card-fill" size="40" color="white" />
            </View>
            <Text className="text-foreground mb-2 text-lg font-semibold">No accounts yet</Text>
            <Text className="text-muted-foreground mb-6 text-center">
              Add your first account to start tracking your finances
            </Text>
            <Button onPress={handleAddAccount}>
              <Text className="text-primary-foreground">Add Account</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-4">
            {accounts?.map((account: Account) => {
              const accountType = getAccountTypeOption(account.type);
              const currencySymbol = getCurrencySymbol(account.currency);

              return (
                <Pressable
                  key={account.id}
                  onPress={() => triggerHaptic('light')}
                  className="bg-card border-border rounded-xl border p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center gap-3">
                      {accountType && (
                        <View
                          className="h-12 w-12 items-center justify-center rounded-xl"
                          style={{ backgroundColor: accountType.color + '20' }}>
                          <Icon name={accountType.icon} size="24" color={accountType.color} />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-foreground mb-1 text-lg font-semibold">
                          {account.name}
                        </Text>
                        <Text className="text-muted-foreground text-sm capitalize">
                          {account.type}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-foreground text-xl font-bold">
                        {currencySymbol}
                        {account.balance.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </StyledSafe>

      <AddAccountModal visible={isAddModalVisible} onClose={() => setIsAddModalVisible(false)} />
    </ScrollView>
  );
}
