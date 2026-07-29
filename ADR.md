# ADR-001: Kernel Mobile v2 — React Native Architecture

**Project:** kernel-mobile-v2 — React Native mobile client for kernel-evolving
**Date:** 2026-07-29
**Author:** Fabio (pacificDev), Olly

## Decision

Rebuild kernel-mobile as a **React Native (Expo)** application. v1 (NativePHP + Livewire in WebView) proved unreliable — 100+ releases with persistent navigation bugs caused by Livewire's SPA runtime fighting the NativePHP WebView. React Native eliminates the WebView entirely, giving native navigation, gestures, and state management.

## Context

kernel-evolving is a self-evolving AI agent running locally on the user's machine (port 8779). v1 used Laravel 13 + Livewire 4 inside a NativePHP WebView. The core problem was architectural: Livewire intercepts page navigation as AJAX requests, and NativePHP's WebView doesn't reliably handle this SPA behavior. Navigation between screens (Welcome → Onboarding → BotList → Chat → Settings) broke repeatedly across 11+ tags, 17+ navigation-related commits, and multiple revert cycles. Each fix introduced new bugs because the root cause — Livewire as a full-page router in a WebView — was never addressed.

React Native v2 eliminates this by using React Navigation (native stack navigator). No WebView, no SPA routing, no PHP runtime on device.

## Mapping: v1 → v2

| kernel-mobile-v1 (NativePHP) | kernel-mobile-v2 (React Native) |
|---|---|
| Blade + Livewire components | React Native screens + components |
| `@extends` + routes/web.php | React Navigation (native stack) |
| `wire:navigate` / `$this->redirect()` | `navigation.navigate()` — native |
| Livewire forms + state | Zustand + React state |
| SSE via Livewire `$this->stream()` | EventSource / fetch streaming |
| SQLite via Eloquent | expo-sqlite / AsyncStorage |
| Laravel Artisan + composer | npm / npx expo |
| NativePHP Mobile build | EAS Build (Android + iOS) |
| PHP 8.4 WebView sandbox | Hermes engine (JS) |
| Gradle via WSL hacks | EAS Build cloud CI |
| Force-push/tag release 100x | Standard Expo EAS pipeline |

## Chosen platforms

- **Frontend:** React Native (Expo SDK 52+) — native UI, not a WebView
- **Navigation:** React Navigation (native stack navigator) — proven, stable, no SPA hacks
- **State:** Zustand — lightweight, TypeScript-native, persistent via AsyncStorage
- **Streaming:** EventSource polyfill or expo's fetch streaming API
- **Local storage:** expo-sqlite for conversation history + AppSettings
- **Build:** EAS Build (Android APK + iOS IPA via cloud CI)
- **Agent backend:** kernel-evolving (FastAPI, port 8779, LAN)
- **Proxy hub (optional):** kernel-central.neverslave.com (future)
- **HTTP client:** axios + fetch (raw) for SSE streaming
- **File picker:** expo-document-picker, expo-image-picker
- **Audio:** expo-av (voice playback), expo-audio (voice recording)

## Architecture

```
┌─────────────────────────────────────────────┐
│              User's Phone                    │
│  ┌───────────────────────────────────────┐   │
│  │          kernel-mobile-v2             │   │
│  │        React Native (Expo)            │   │
│  │                                       │   │
│  │  ┌─────────────────────────────────┐  │   │
│  │  │  Screens (native stack)         │  │   │
│  │  │                                 │  │   │
│  │  │  Welcome    → Onboarding        │  │   │
│  │  │  (static)      (wizard)         │  │   │
│  │  │                                 │  │   │
│  │  │  BotList    → ChatView          │  │   │
│  │  │  (agent list)  (messages, SSE)  │  │   │
│  │  │                                 │  │   │
│  │  │  Settings   → BotProfile         │  │   │
│  │  │  (config,      (avatar, media,  │  │   │
│  │  │   connection)   files links)    │  │   │
│  │  └─────────────────────────────────┘  │   │
│  │                                       │   │
│  │  ┌─────────────────────────────────┐  │   │
│  │  │  State (Zustand stores)         │  │   │
│  │  │  - chatStore: messages, stream  │  │   │
│  │  │  - agentStore: peers, discovery │  │   │
│  │  │  - settingsStore: config, mode  │  │   │
│  │  │  - appStore: onboarding status  │  │   │
│  │  └─────────────────────────────────┘  │   │
│  │                                       │   │
│  │  ┌─────────────────────────────────┐  │   │
│  │  │  Services                       │  │   │
│  │  │  - KernelApiClient (axios)      │  │   │
│  │  │  - SseStreamer (EventSource)    │  │   │
│  │  │  - VoiceService (expo-audio)    │  │   │
│  │  │  - SqlitePersistence            │  │   │
│  │  └─────────────────────────────────┘  │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     │
                     │ HTTP / SSE / WS
                     ▼
           ┌──────────────────┐
           │  User's Machine  │
           │  (same LAN)      │
           │                  │
           │ kernel-evolving  │
           │  :8779           │
           │  FastAPI         │
           │  Nemotron-3B     │
           │  Chat/Voice/     │
           │  Vision/Docs     │
           └──────────────────┘
```

## Screen tree

```
App (NavigationContainer)
├── WelcomeScreen         → root, static logo + "Start Setup"
├── OnboardingScreen      → multi-step wizard (mode, server URL, test)
├── MainTabs              → bottom tab navigator
│   ├── BotListScreen     → agent list tab (home)
│   ├── SettingsScreen    → settings tab
│   └── ChatStack         → nested stack
│       ├── ChatScreen    → messages, streaming, composer
│       └── BotProfileScreen → avatar, media, files, links
```

**Welcome → Onboarding → MainTabs** is the first-boot flow. Once settings are saved, the app skips directly to MainTabs on subsequent launches.

## Components (shared, reusable)

| Component | Purpose | v1 equivalent |
|---|---|---|
| `MessageBubble` | User/assistant bubble with markdown | livewire.chat |
| `StreamingBubble` | Real-time token display | wire:stream="streamBuffer" |
| `InlineButtons` | Callback button grid | inline keyboard |
| `ComposerBar` | Text input + attach + voice + send | chat composer |
| `VoiceRecorder` | Hold-to-record UI + waveform | VoiceRecorder.php |
| `EmojiPicker` | 48-emoji grid panel | emoji picker |
| `SlashCommandSheet` | Autocomplete command list | slash commands |
| `CodeBlock` | Styled code with copy button | inline CSS |
| `Toast` | Notification overlay | Alpine.js toast |
| `ConnectionBadge` | Online/offline/checking indicator | CSS badge |
| `AgentAvatar` | Agent icon with status dot | avatar SVG |
| `MediaGrid` | Shared images/videos grid | bot profile media tab |
| `FileList` | Shared files list | bot profile files tab |
| `MarkdownRenderer` | Bold, italic, code, links, headings | PHP markdown renderer |

## Data flow

```
User types message
  → ComposerBar dispatches to chatStore
  → chatStore.sendMessage(text)
    → KernelApiClient.streamMessage(text, chatId, toolsEnabled)
      → GET /message/stream?text=...&chat_id=...&tools=...
      → SSE stream: data: {"event":"","text":"token"}
      → SseStreamer receives tokens
      → chatStore.appendStreamToken(token)
      → StreamingBubble re-renders
    → On [DONE]:
      → chatStore.finalizeMessage()
      → SqlitePersistence.saveMessage()
```

## Specs mapping (v1 features → v2)

| v1 Spec/Feature | v2 Implementation |
|---|---|
| Telegram chat UI | Native component: message bubbles, keyboard handling |
| Slash commands + inline buttons | Zustand store + autocomplete sheet |
| API client (dual-mode) | KernelApiClient class (axios, direct mode primary) |
| Voice notes | expo-audio record → upload → STT → cloned voice |
| Media messages | expo-image-picker + expo-document-picker |
| Bot profile page | BotProfileScreen (avatar, media grid, files list) |
| Settings persistence | expo-sqlite — AppSettings table |
| Streaming replies (SSE) | EventSource polyfill → Zustand stream buffer |
| SQLite conversation history | expo-sqlite — conversations + messages tables |
| CI/CD (GitHub Actions) | EAS Build on tag push |

## Key decisions

| Decision | v1 (wrong) | v2 (correct) | Rationale |
|---|---|---|---|
| Runtime | PHP 8.4 (embedded) | JavaScript (Hermes) | No WebView lean: PHP compiled into C lib → 200MB+ APK. JS is native. |
| UI framework | Livewire 4 (WebView) | React Native (native) | Livewire SPA routing fights WebView. React Navigation works first time. |
| State | Livewire component state | Zustand stores | Decoupled, testable, persistent. No page-reload state loss. |
| Navigation | Livewire `$this->redirect()` | React Navigation | Native stack = no 404s, no redirect loops, no asset_url hacks. |
| Streaming | `$this->stream()` via Livewire | EventSource → Zustand | Direct SSE handling, no Livewire middleware. |
| Build | NativePHP → Gradle (WSL hack) | EAS Build (cloud) | Works on real CI, not workarounds for WSL limitations. |
| Release cadence | 100+ tags, unverified | Standard EAS pipeline | Test before build, not build-then-pray. |

## What changes from v1

- **No Laravel** — no PHP on device. Just a React Native app talking directly to kernel-evolving.
- **No SQLite migrations** — expo-sqlite handles schema on init.
- **No composer** — `npm install` only.
- **No WebView** — native navigation, no Livewire/routing conflicts.
- **No NativePHP** — no desktop/mobile package conflicts.
- **No Gradle hacks** — EAS Build handles Android SDK setup.

## What stays the same

- Talks to **kernel-evolving** on port 8779 (direct mode, primary)
- Same **SSE streaming** protocol (`/message/stream`)
- Same **file upload** endpoints
- Same **inline button callback** mechanism
- Same **dual-mode** architecture (direct LAN + future proxy)
- Same **Telegram-replica** UI pattern (message bubbles, agent list)
- Same **local SQLite** persistence approach

## Constraints

- Must work on Android (APK) and iOS (IPA) from day one
- Direct mode connects to kernel-evolving on LAN (port 8779 default)
- Must handle SSE streaming with real-time token display
- Voice recording + playback must feel native
- File uploads (image, document) must work via native pickers
- Must work offline (view cached conversations + draft messages)
- No push notifications in v2 (app must be open)
- Must handle connection loss gracefully (badge indicator + retry)
- Expo SDK 52+ for latest stable features
- TypeScript throughout

## What is NOT in scope (v2)

- Multi-user / multi-account
- End-to-end encryption
- Video calling / WebRTC
- Push notifications
- Offline agent inference
- kernel-central proxy integration (v3)
- Evolution dashboard (kernel-desktop)

## CI/CD Pipeline (GitHub Actions + EAS Build)

### Trigger
On every `v*` tag push to GitHub:

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx expo-doctor  # check for Expo config issues
      - run: npx tsc --noEmit  # TypeScript type-check
      - run: npx jest --ci  # Run unit + integration tests

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Build APK via EAS
        run: npx eas build --platform android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      - name: Download APK from EAS
        run: |
          BUILD_ID=$(npx eas build:list --platform android --status finished --json --limit 1 | jq -r '.[0].id')
          npx eas build:download $BUILD_ID --output kernel-mobile-v2.apk
      - uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: kernel-mobile-v2.apk

  build-ios:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Build IPA via EAS
        run: npx eas build --platform ios --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      - name: Download IPA from EAS
        run: |
          BUILD_ID=$(npx eas build:list --platform ios --status finished --json --limit 1 | jq -r '.[0].id')
          npx eas build:download $BUILD_ID --output kernel-mobile-v2.ipa
      - uses: actions/upload-artifact@v4
        with:
          name: ios-ipa
          path: kernel-mobile-v2.ipa

  release:
    needs: [build-android, build-ios]
    runs-on: ubuntu-latest
    permissions:
      contents: write
      actions: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          merge-multiple: true
      - name: Create GitHub Release
        run: |
          gh release create ${{ github.ref_name }} \
            kernel-mobile-v2.apk \
            kernel-mobile-v2.ipa \
            --title "${{ github.ref_name }}" \
            --generate-notes
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Required Secrets

| Secret | Source | Purpose |
|---|---|---|
| `EXPO_TOKEN` | Expo dashboard → Account → Access Tokens | Authenticates EAS Build from CI |
| `GITHUB_TOKEN` | Automatic (provided by GitHub Actions) | Creates GitHub Release |

### EAS Build Profiles (`eas.json`)

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "autoIncrement": true
      },
      "env": {
        "APP_VARIANT": "production"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Versioning

- Version numbers come from `app.json` (`expo.version`)
- Tag format: `v<major>.<minor>.<patch>` (e.g., `v1.0.0`)
- Tag triggers: automatic APK + IPA build + GitHub Release
- No manual build steps — push tag, CI handles the rest

### Test gate

All builds are gated on:
1. **`npx expo-doctor`** — validates Expo config, dependencies, native module compatibility
2. **`npx tsc --noEmit`** — TypeScript type-check (strict mode)
3. **`npx jest --ci`** — unit + integration tests (minimum 80% coverage on core services)

If any gate fails, the build is cancelled before EAS is invoked. No wasted build credits on broken code.

### Release artifact naming

| Platform | Artifact | Format |
|---|---|---|
| Android | `kernel-mobile-v2-<version>.apk` | Signed APK (EAS Build) |
| iOS | `kernel-mobile-v2-<version>.ipa` | Signed IPA (EAS Build) |

### Difference from v1 CI

| Aspect | v1 (NativePHP) | v2 (React Native + EAS) |
|---|---|---|
| Build server | GitHub Actions runner (self-setup JDK/Android SDK) | EAS Build cloud (managed) |
| Build command | `./gradlew assembleDebug` (after Laravel bundle) | `eas build --platform android` |
| WSL workarounds | Required for Gradle + composer | None — EAS runs on macOS/Linux native |
| APK signing | Debug-only (no keystore) | Production signed via EAS credentials |
| Test gate | Pest tests (PHP) | Jest tests (TypeScript) |
| Build duration | ~20-30 min (full Laravel + Gradle) | ~5-10 min (npm + EAS Build) |

## Status

**2026-07-29** — ADR written, repository scaffolded. Next: Expo project init, install dependencies, build WelcomeScreen.
