# Feature: API & Services Layer

## Objective
Implement KernelApiClient (axios HTTP client), SseStreamer (EventSource SSE handler), VoiceService (expo-audio recording/playback), and SqlitePersistence (expo-sqlite conversation storage).

## Dependencies
- Project Scaffold
- Zustand State Stores (for store integration in SseStreamer)

## Stack
- axios (HTTP client)
- EventSource polyfill (SSE streaming)
- expo-sqlite (database)
- expo-av / expo-audio (voice)

## Expected output
- `services/KernelApiClient.ts` — GET/POST to `{serverUrl}/message/stream`, file upload, agent discovery
- `services/SseStreamer.ts` — connect to SSE endpoint, parse events, emit tokens to chatStore
- `services/VoiceService.ts` — record audio, upload to kernel-evolving, play response
- `services/SqlitePersistence.ts` — schema init, CRUD for conversations + messages tables
- Services unit tests pass

## Status
[ ] Not started
