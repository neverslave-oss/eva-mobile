# Feature: Project Scaffold

## Objective
Initialize the Expo React Native project, install dependencies, and configure TypeScript, ESLint, and the folder structure declared in ADR.

## Dependencies
None — this is the foundation.

## Stack
- React Native (Expo SDK 52+)
- TypeScript (strict mode)
- Prettier + ESLint
- Folder structure: `screens/`, `components/`, `stores/`, `services/`, `types/`, `navigation/`

## Expected output
- `npx create-expo-app kernel-mobile-v2 --template blank-typescript` runs
- Dependencies installed: `react-navigation`, `zustand`, `axios`, `expo-sqlite`, `expo-document-picker`, `expo-image-picker`, `expo-av`, `expo-audio`
- `tsconfig.json` with strict mode
- Folder structure created
- `npx expo-doctor` passes
- `npx tsc --noEmit` passes

## Status
[ ] Not started
