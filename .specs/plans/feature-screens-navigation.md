# Feature: Screens & Navigation

## Objective
Implement the full screen tree: WelcomeScreen, OnboardingScreen, BotListScreen, ChatScreen, SettingsScreen, BotProfileScreen, wired via React Navigation (native stack + bottom tabs).

## Dependencies
- Project Scaffold
- Zustand State Stores (for data binding)
- API & Services Layer (for ChatScreen SSE, BotListScreen discovery)
- Shared UI Components (for all screens)

## Stack
- React Navigation (native stack navigator + bottom tabs)
- React Native core components
- Zustand stores (data layer)

## Expected output
- `navigation/AppNavigator.tsx` — NavigationContainer with conditional root (Welcome → Onboarding → MainTabs)
- `screens/WelcomeScreen.tsx` — static logo + "Start Setup" button
- `screens/OnboardingScreen.tsx` — multi-step wizard (mode, server URL, test connection)
- `screens/BotListScreen.tsx` — scrollable agent list from agentStore
- `screens/ChatScreen.tsx` — messages list + StreamingBubble + ComposerBar
- `screens/SettingsScreen.tsx` — server URL, theme, about
- `screens/BotProfileScreen.tsx` — avatar, media grid, files list
- All screens typed, navigation flow works end-to-end
- Welcome → Onboarding → MainTabs on first boot, direct to MainTabs on subsequent

## Status
[ ] Not started
