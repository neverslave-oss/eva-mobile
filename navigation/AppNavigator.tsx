import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SCREEN_NAMES, RootStackParamList } from '../types';
import { useAppStore } from '../stores/appStore';
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BotProfileScreen from '../screens/BotProfileScreen';
import MainTabs from './MainTabs';

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
        <Stack.Screen name={SCREEN_NAMES.MainTabs} component={MainTabs} />
        <Stack.Screen name={SCREEN_NAMES.BotProfile} component={BotProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
