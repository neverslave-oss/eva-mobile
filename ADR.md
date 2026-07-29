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

## Status

**2026-07-29** — ADR written, repository scaffolded. Next: Expo project init, install dependencies, build WelcomeScreen.
