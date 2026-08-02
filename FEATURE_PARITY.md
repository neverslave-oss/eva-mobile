# Feature Parity — v2 vs kernel-evolving telegram_bot.py

## Reference
- **Telegram bot:** `kernel-evolving/src/services/channels/telegram_bot.py`
- **v2 mobile app:** `repositories/kernel-mobile-v2/`
- **Last updated:** 2026-08-03

---

## Legend
| Icon | Meaning |
|------|---------|
| ✅ | Fully implemented |
| ◐ | Partially implemented / needs wiring |
| ❌ | Not started |
| 🔜 | Planned |
| — | N/A to mobile |

---

## 1. Message Handling

### 1.1 Text Messages

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 1.1 | Send text reply | `send_message()` L68 | ✅ | `KernelApiClient` → `triage()` | Via `sendMessage()` in agentStore |
| 1.2 | Markdown rendering | `parse_mode="Markdown"` L74 | ✅ | `MarkdownRenderer.tsx` | Full dark/light theme support |
| 1.3 | Message streaming | `handle_message` L937 | ✅ | `SseStreamer.ts` + `StreamingBubble.tsx` | SSE via `/message/stream` |
| 1.4 | Edit message | `edit_message()` L88 | ◐ | — | v2 sends new bubble, doesn't edit existing |
| 1.5 | Typing indicator | `send_typing()` L126 | ◐ | `ConnectionBadge.tsx` | Shows connection status, no typing dots |
| 1.6 | Chat action keepalive | `TypingKeepAlive` class L287 | ❌ | — | Pulses typing indicator during long ops |

### 1.2 Image/Photo Messages

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 2.1 | Send image | `send_file()` L146 | ◐ | `MediaGrid.tsx` + `ComposerBar.tsx` | UI exists, upload via `kernelClient.sendFile()` |
| 2.2 | Image picker | Photo file_id handling | ◐ | `ImagePicker` in ChatScreen | Imported but untested without device |
| 2.3 | Vision analysis | `infer_with_image()` L978 | ❌ | — | v2 doesn't send images to vision API |
| 2.4 | Image attachment persistence | `_memory_mod.record_attachment()` L998 | ❌ | — | No memory module in v2 |

### 1.3 Voice Notes

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 3.1 | Record voice | Voice file_id handling L1009 | ✅ | `VoiceService.ts` → `ChatScreen.tsx` | Wired in v0.6.0 — voiceService.startRecording()/stopRecording() |
| 3.2 | STT transcription | `infer_with_audio()` L1028 | ❌ | — | No STT flow in v2 |
| 3.3 | Voice clone reply | `_clone_voice_reply()` L204 | ❌ | — | No voice clone endpoint call in v2 |
| 3.4 | Send voice to API | `kernelClient.sendVoice()` | ◐ | `KernelApiClient.ts` | Endpoint exists? Not verified |
| 3.5 | Voice playback in chat | Audio widget | ◐ | `VoiceService.playAudio()` | Method exists, not yet wired into message bubbles |
| 3.6 | Voice sample management | `_list_voice_samples()` L193 | ❌ | — | `/voices` feature not implemented |
| 3.7 | First-contact sample save | L1057-1070 | ❌ | — | No auto-sample collection |

### 1.4 Document/File Messages

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 4.1 | Document picker | Document file_id handling L1215 | ◐ | `expo-document-picker` in deps | Plugin added to app.json, not wired in UI |
| 4.2 | PDF processing | `kernel-doc-retrieval` skill L1277-1297 | ❌ | — | v2 doesn't route PDFs to skills |
| 4.3 | File upload to API | `kernelClient.sendFile()` L146 | ◐ | `KernelApiClient.ts` | Endpoint exists? Upload progress not implemented |
| 4.4 | Document persistence | `_memory_mod.record_attachment()` L1241 | ❌ | — | No memory module in v2 |

---

## 2. Slash Commands

### 2.1 Core Commands

| # | Command | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 5.1 | `/help` | `_sync_bot_commands()` L2866 | ✅ | `CommandSheet.tsx` | Shows all available commands |
| 5.2 | `/status` | Bot inline | ✅ | `SettingsScreen.tsx` | Shows system status |
| 5.3 | `/new` | Clear conversation L1385 | ✅ | `clearConversation()` in agentStore + `SLASH_DESCRIPTIONS` | Added `/new` to autocomplete list |
| 5.4 | `/skills` | List installed skills | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.5 | `/routines` | List installed routines | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.6 | `/models` | Model management | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.7 | `/thoughts` | Show internal thoughts | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.8 | `/evolve` | Trigger evolution | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.9 | `/voices` | Voice sample management | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.10 | `/voice-clone` | Clone voice from text | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.11 | `/verbose` | Toggle verbose mode | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.12 | `/version` | Show current version | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.13 | `/packages` | Ecosystem packages | ✅ | `SLASH_DESCRIPTIONS` | Added to autocomplete |
| 5.14 | `/replica` | Manage replicas | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.15 | `/init` | Initialize | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.16 | `/run <name>` | Run routine/skill | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.17 | `/update` | Check for updates | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.18 | `/restart` | Restart kernel | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.19 | `/stop` | Emergency stop | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |

### 2.2 Dynamic Commands

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 5.20 | `/skill_<slug>` | Dynamic skill dispatch L1339 | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |
| 5.21 | `/run_<slug>` | Dynamic routine dispatch L1362 | ✅ | `SLASH_DESCRIPTIONS` | Routed to kernel-evolving API via triage |

---

## 3. Inline Buttons & Callbacks

### 3.1 Core

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 6.1 | Send inline buttons | `send_buttons()` L107 | ✅ | `MessageBubble.tsx` + `InlineButtons.tsx` | Wired into bubble rendering |
| 6.2 | Handle button callbacks | `handle_callback()` L580 | ✅ | `MessageBubble.tsx` → `ChatScreen.handleButtonPress()` | Routes callback through sendMessage/sendSlashCommand |
| 6.3 | Edit message after callback | `edit_message()` L88 | ❌ | — | No message editing in v2 |

### 3.2 Provider Routing

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 6.4 | Cloud provider picker | `_show_cloud_provider_picker()` L410 | ❌ | — | v2 has direct/proxy toggle only |
| 6.5 | Modal provider picker | `_show_modal_provider_picker()` L423 | ❌ | — | Not implemented |
| 6.6 | Cloud model picker | `_show_cloud_model_picker()` L504 | ❌ | — | Not implemented |
| 6.7 | Modal model picker | `_show_modal_model_picker()` L446 | ❌ | — | Not implemented |
| 6.8 | Apply model routing | `_apply_modal_model()` L467 | ◐ | `ProviderSheet.tsx` | UI exists, API not wired |

### 3.3 Agent Actions

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 6.9 | Skill info callback | `skill_info_` prefix L661 | ❌ | — | Not implemented |
| 6.10 | Routine run callback | `routine_run_` prefix L637 | ❌ | — | Not implemented |
| 6.11 | Routine info callback | `routine_info_` prefix L640 | ❌ | — | Not implemented |
| 6.12 | Auth gate approval | `auth_allow_`/`auth_deny_` L584 | ❌ | — | Not implemented |
| 6.13 | Evolution feedback | `evo_confirm_` L710 | ❌ | — | Not implemented |
| 6.14 | Skill synthesis approval | `tier2_approve_`/`tier2_reject_` L748 | ❌ | — | Not implemented |
| 6.15 | Thoughts action | `thought_do_`/`thought_skip` L688 | ❌ | — | Not implemented |

---

## 4. Audio & Voice

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 7.1 | Local TTS (Qwen3) | `_clone_voice_reply()` L204 local path | ❌ | `VoiceService.ts` | Import from expo-av, no server call |
| 7.2 | Cloud TTS | `_clone_voice_reply()` cloud path L219 | ❌ | — | Not implemented |
| 7.3 | Voice sample listing | `_list_voice_samples()` L193 | ❌ | — | Not implemented |
| 7.4 | Voice sample switching | `handle_callback` L680 `set_voice_` | ❌ | — | Not implemented |
| 7.5 | Send voice file | `send_voice()` L162 | ❌ | — | Not implemented |
| 7.6 | Voice activity context | `voice_activity("clone")` L266 | ❌ | — | Not implemented |

---

## 5. Collective Memory

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 8.1 | Search collective memory | `_search_collective_memory()` L808 | ❌ | — | Not implemented |
| 8.2 | Write collective memory | `_write_collective_memory()` L840 | ❌ | — | Not implemented |

---

## 6. Evolution

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 9.1 | Trigger evolution | `/evolve` command | ◐ | `SlashCommandSheet.tsx` | Mock only |
| 9.2 | Evolution status | Evolution state display | ❌ | — | Not implemented |
| 9.3 | Failed request handling | `_fr.increment_retry()` L730 | ❌ | — | Not implemented |

---

## 7. System

### 7.1 Infrastructure

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 10.1 | Direct LAN connection | — | ✅ | `kernelClient` direct mode | Default mode |
| 10.2 | Proxy mode (kernel-central) | — | ✅ | `kernelClient` proxy mode | Settings toggle |
| 10.3 | Peer discovery | `/peers` API | ✅ | `NetworkDiscovery.ts` | LAN scanning |
| 10.4 | Conversation persistence | Memory module | ✅ | `SqlitePersistence.ts` | SQLite auto-save/load |
| 10.5 | Settings persistence | — | ✅ | `settingsStore.ts` | Zustand + AsyncStorage |
| 10.6 | Error notifications | Exception handling | ◐ | `Toast.tsx` | Basic, no retry logic |
| 10.7 | Offline queue | — | ❌ | — | Future |

### 7.2 Agent & Model

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 11.1 | Agent list | — | ✅ | `BotListScreen.tsx` | LAN discovery + API |
| 11.2 | Agent profile | — | ✅ | `BotProfileScreen.tsx` | Avatar, status, edit |
| 11.3 | Model info | `_get_current_model_label()` L344 | ❌ | — | Not implemented |
| 11.4 | Provider routing | Provider management flow | ◐ | `ProviderSheet.tsx` | UI exists, API not wired |
| 11.5 | Agent inference | `triage()` L1117 | ◐ | `sendMessage()` in agentStore | Routes to `kernelClient.triage()` |

### 7.3 Updates & Maintenance

| # | Feature | telegram_bot.py | v2 Status | v2 Location | Notes |
|---|---------|-----------------|-----------|-------------|-------|
| 12.1 | Update check | `_check_for_update()` L2778 | ❌ | — | Not implemented |
| 12.2 | Update loop | `_update_check_loop()` L2794 | ❌ | — | Not implemented |
| 12.3 | Restart handler | `_handle_restart()` L2818 | ❌ | — | Not implemented |
| 12.4 | Stop handler | `_handle_stop()` L2802 | ❌ | — | Not implemented |
| 12.5 | Rollback handler | `_handle_rollback()` L2835 | ❌ | — | Not implemented |
| 12.6 | Auth gate | `handle_callback` auth L584 | ❌ | — | Not implemented |

---

## 8. Build & CI

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 13.1 | TypeScript compiles | ✅ | Zero errors |
| 13.2 | Native plugins configured | ✅ | expo-sqlite, expo-image-picker, expo-document-picker |
| 13.3 | Android permissions | ✅ | INTERNET, RECORD_AUDIO, CAMERA, WIFI |
| 13.4 | Android manifest | ✅ | Full permission set |
| 13.5 | Assets (icon, splash) | ✅ | 6 files present |
| 13.6 | CI build on tag | 🔜 | Not configured yet |
| 13.7 | iOS build | ❌ | Not configured |

---

## Summary

| Category | Total | ✅ | ◐ | ❌ | Completion |
|----------|-------|---|----|----|------------|
| 1. Text Messages | 6 | 2 | 2 | 2 | 33% |
| 2. Image/Photo | 4 | 0 | 2 | 2 | 25% |
| 3. Voice Notes | 7 | 0 | 2 | 5 | 14% |
| 4. Documents | 4 | 0 | 2 | 2 | 25% |
| 5. Slash Commands | 21 | 3 | 5 | 13 | 26% |
| 6. Inline Buttons | 15 | 1 | 2 | 12 | 12% |
| 7. Audio & Voice | 6 | 0 | 0 | 6 | 0% |
| 8. Collective Memory | 2 | 0 | 0 | 2 | 0% |
| 9. Evolution | 3 | 0 | 1 | 2 | 11% |
| 10. Infrastructure | 7 | 5 | 1 | 1 | 78% |
| 11. Agent & Model | 5 | 2 | 2 | 1 | 50% |
| 12. Updates | 6 | 0 | 0 | 6 | 0% |
| 13. Build & CI | 7 | 5 | 0 | 2 | 71% |
| **Total** | **93** | **18** | **19** | **56** | **28%** |

---

## Next Priority Work

### P0 — Fix crash, enable core features
1. **Fix `expo-av` v16 + RN 0.86.2 compatibility** — either migrate to `expo-audio` v57 API or test that v16 works
2. **Wire VoiceService into ChatScreen** — currently dead code, nobody imports it
3. **Connect voice clone endpoint** — `POST /tts/clone` to olly-voice-server

### P1 — Feature parity with Telegram bot
4. **Slash commands passthrough** — route unknown commands to kernel-evolving API
5. **Voice sample management** — list, switch, playback
6. **Provider routing UI** — connect `ProviderSheet.tsx` to real API

### P2 — Polish
7. **Typing indicator animation** — pulsing dots during inference
8. **Message editing** — update existing bubbles on stream completion
9. **Audio playback widget** — play cloned voice in chat
