import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SCREEN_NAMES, MainTabParamList } from '../types';
import { View, Text, StyleSheet } from 'react-native';
import BotListScreen from '../screens/BotListScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    [SCREEN_NAMES.BotList]: '🤖',
    [SCREEN_NAMES.Chat]: '💬',
    [SCREEN_NAMES.Settings]: '⚙️',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.iconEmoji, focused && styles.iconEmojiFocused]}>
        {icons[label] || '●'}
      </Text>
    </View>
  );
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName={SCREEN_NAMES.BotList}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#58a6ff',
        tabBarInactiveTintColor: '#6c7883',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen
        name={SCREEN_NAMES.BotList}
        component={BotListScreen}
        options={{ tabBarLabel: 'Agents' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.Chat}
        component={ChatScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.Settings}
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#17212b',
    borderTopColor: '#242f3d',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconEmojiFocused: {
    opacity: 1,
  },
  tabItem: {
    paddingTop: 2,
  },
});