# Feature: Zustand State Stores

## Objective
Implement four Zustand stores (chatStore, agentStore, settingsStore, appStore) with TypeScript types, AsyncStorage persistence, and no UI dependencies.

## Dependencies
- Project Scaffold

## Stack
- Zustand (state management)
- AsyncStorage (persistence middleware)
- TypeScript types in `types/`

## Expected output
- `stores/chatStore.ts` — messages array, streaming state, `sendMessage()`, `appendStreamToken()`, `finalizeMessage()`
- `stores/agentStore.ts` — peer list, discovery state, `addAgent()`, `removeAgent()`
- `stores/settingsStore.ts` — server URL, mode, theme, `persist` middleware
- `stores/appStore.ts` — onboarding completed flag, first-boot detection
- `types/index.ts` — shared types (Agent, Message, AppSettings, etc.)
- Tests pass: `npx jest --ci`

## Status
[ ] Not started
