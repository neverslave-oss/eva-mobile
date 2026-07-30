# Feature: Agent Chat + Telegram Bot Pairing

## Status: 🟡 In progress

## Objective
Wire the mobile app to the real kernel-evolving agent API (http://localhost:8779) for all slash commands, and mirror the **Agent Chat tab** from `evolution_dashboard.html` + all Telegram bot features from `telegram_bot.py`.

## Architecture

```
Mobile App ──→ KernelApiClient ──→ http://localhost:8779 (LAN)
                │                      ├── /provider (routing, swap, status)
                │                      ├── /models (list, load Nemotron)
                │                      ├── /agent (triage, session)
                │                      ├── /skills, /routines
                │                      ├── /memories, /workspaces
                │                      ├── /system (uptime, VRAM)
                │                      ├── /replica (spawn, list)
                │                      └── /update, /version
                │
                └──→ http://kernel-central (proxy mode, future)
                └──→ http://127.0.0.1:8766 (voice clone)
```

## Slash Commands to Wire

All from `telegram_bot.py` handler:

| Command | API Route | Description |
|---------|-----------|-------------|
| `/status` | GET /system | Agent status, uptime, model info |
| `/help` | — | Inline menu: status/skills/routines/models |
| `/new` | POST /memory/clear | Clear conversation |
| `/skills` | GET /skills | List loaded skills with info/run buttons |
| `/routines` | GET /routines | List routines with run/info buttons |
| `/models` | GET /provider | Show routing + active model |
| `/local` | POST /provider/set | Switch all to local |
| `/cloud` | — | 6-step wizard (provider → model per call type) |
| `/provider` | GET/POST /provider | Routing table + inline swap buttons |
| `/evolve` | POST /evolve | Trigger evolution cycle |
| `/replica` | POST /replica | Spawn replica agent |
| `/voice-clone` | POST /tts/clone | Voice cloning via olly-voice-server |
| `/voices` | GET /voice/samples | List/switch voice samples |
| `/system` | GET /system | Diagnostics (CPU/GPU/RAM) |
| `/version` | GET /version | Agent version info |
| `/thoughts` | GET /thoughts | Show kernel's current thoughts |
| `/verbose` | POST /provider/verbose | Toggle verbose logging |
| `/workspaces` | GET /workspaces | List agent workspaces |
| `/init` | POST /init | Reinitialize agent |
| `/stop` | POST /agent/stop | Graceful shutdown |
| `/restart` | POST /agent/restart | Full restart |
| `/update` | POST /update | Pull latest version |
| `/rollback` | POST /rollback | Rollback version |
| `/run <name>` | POST /agent/triage | Run named routine |
| `/skill_<slug>` | POST /agent/triage | Run skill by slug |

## Agent Chat Tab Features (from evolution_dashboard.html)

### 1. Inspector Panel
- **System Prompt**: show current system prompt (GET /agent/config)
- **Conversation History**: rendered as message list with role labels
- **Tool Calls & Outputs**: expandable trace per turn
- **Recent Trajectories**: last 5 synthesis trajectories

### 2. Command Sheet (bottom sheet)
- Same chip layout as evolution_dashboard
- 13+ command chips: /help, /skills, /routines, /init, /system, /models, /thoughts, /verbose, /replica, /workspaces, /new, /evolve, /version
- Backdrop blur overlay, slide-up animation

### 3. Provider Sheet (side sheet)
- Call type selector (task_inference, synthesis, critic, planning, trajectory_teacher, vision, stt, tts)
- Provider selector (local, openai, openrouter, anthropic, hf, copilot)
- Model override input
- Persist checkbox
- Refresh + Apply buttons

### 4. Routing Indicator
- Display current provider+model for each call type
- Inline swap buttons in chat header or as overlay

### 5. Typing KeepAlive
- Multiple action types: typing, record_voice, upload_voice, upload_photo, upload_document
- Pulse every 4s while operation in flight

## Voice Clone Integration

### /voices command
- List available WAV/MP3 samples from ~/.openclaw/media/voice-samples/
- Show active sample highlighted
- Tap to switch

### /voice-clone
- Synthesise reply text as voice via olly-voice-server
- POST /tts/clone with sample + text
- Async delivery: status msg → audio file arrives after
- Fallback to cloud TTS (OpenAI/OpenRouter) if local unavailable

### Voice Sample Management
- First-contact: save first voice note as initial sample
- Sample picker with preview

## Dual-Mode Architecture

### Mode 1: Direct LAN
- Connect to kernel-evolving agent on local network
- API base: `http://localhost:8779`
- No auth needed (same machine)
- Default mode

### Mode 2: Kernel-Central Proxy
- Connect via proxy.kernel-central.com
- API base: `https://kernel-central/api/v1`
- Auth token required (stored in settings)
- Settings toggle: Settings → Connection → Proxy mode

## Typing/Action Indicators

Map Telegram `sendChatAction` types to mobile indicators:

| Action | Mobile Indicator | When |
|--------|-----------------|------|
| `typing` | ⌨️ Bouncing dots | Text reply coming |
| `record_voice` | 🎙️ Recording animation | Voice cloning |
| `upload_voice` | ⬆️ Progress bar | Uploading audio |
| `upload_photo` | 🖼️ Processing badge | Vision inference |
| `upload_document` | 📄 Processing badge | Document analysis |

## Implementation Plan

### Step 1: KernelApiClient — Wire real slash commands
- Replace all mock responses with real API calls
- Add error handling + retry logic
- Add request timeout (default 10s, voice 300s)

### Step 2: AgentProviderStore
- Store provider routing, voice samples, model state
- Persist to SQLite

### Step 3: Inspector Panel
- System prompt, conversation history, tool calls
- Collapsible sections (details/summary equivalent)

### Step 4: Command Sheet
- Bottom sheet overlay from evolution_dashboard
- 13+ command chips with tap-to-execute

### Step 5: Provider Sheet
- Side sheet with call type + provider + model
- Refresh/Apply/Persist controls

### Step 6: Voice Clone
- /voices sample picker
- /voice-clone via olly-voice-server
- Async audio delivery

### Step 7: Dual-Mode Settings
- Settings → Connection → LAN / Proxy toggle
- Proxy URL + auth token fields
- Connection health check

## Files Changed

| File | Change |
|------|--------|
| `services/KernelApiClient.ts` | Wire all slash command endpoints |
| `stores/agentStore.ts` | Add provider routing, voice samples |
| `stores/settingsStore.ts` | Add proxy mode settings |
| `screens/ChatScreen.tsx` | Replace mock replies with API calls |
| `components/CommandSheet.tsx` | NEW — bottom command chips |
| `components/ProviderSheet.tsx` | NEW — provider routing side sheet |
| `components/InspectorPanel.tsx` | NEW — system prompt, history, traces |
| `components/TypingIndicator.tsx` | Multiple action types |
| `components/VoiceSamplePicker.tsx` | NEW — voice sample list/switch |
| `screens/SettingsScreen.tsx` | Add dual-mode connection section |
