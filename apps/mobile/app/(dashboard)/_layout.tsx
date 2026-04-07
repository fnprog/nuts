import { Tabs } from 'expo-router';
import Icon from 'react-native-remix-icon';

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'hsl(145, 63%, 49%)',
        tabBarInactiveTintColor: 'hsl(286, 7%, 45%)',
        tabBarStyle: {
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'home-5-fill' : 'home-5-line'} size="24" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'bank-card-fill' : 'bank-card-line'} size="24" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'file-list-3-fill' : 'file-list-3-line'}
              size="24"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={focused ? 'bar-chart-box-fill' : 'bar-chart-box-line'}
              size="24"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'settings-3-fill' : 'settings-3-line'} size="24" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
