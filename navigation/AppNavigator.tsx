import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAMES, RootStackParamList } from '../types';
import { useAppStore } from '../stores/appStore';
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          hasCompletedOnboarding ? SCREEN_NAMES.MainTabs : SCREEN_NAMES.Welcome
        }
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0f0f1a' },
        }}
      >
        <Stack.Screen name={SCREEN_NAMES.Welcome} component={WelcomeScreen} />
        <Stack.Screen name={SCREEN_NAMES.Onboarding} component={OnboardingScreen} />
        <Stack.Screen
          name={SCREEN_NAMES.MainTabs}
          getComponent={() => {
            // Placeholder — MainTabs will be implemented in a later feature
            const { View, Text } = require('react-native');
            return () => (
              <View style={{ flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#ffffff', fontSize: 18 }}>Main Tabs</Text>
                <Text style={{ color: '#8b949e', fontSize: 12, marginTop: 8 }}>BotList · Chat · Settings</Text>
              </View>
            );
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
