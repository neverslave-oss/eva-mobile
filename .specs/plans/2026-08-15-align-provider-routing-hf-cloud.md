# Plan: Align mobile app (kernel-mobile-v2) with kernel-evolving cloud/HF changes

## Objective
Update the mobile app's provider routing UI and API client so it reflects the
recent kernel-evolving changes made on 2026-08-15: the HF Router provider
(`providers.hf_provider` / `HF_ROUTER_PROVIDER`), the `google` provider, and the
new `/config/env` key-push endpoint.

## Background / why
On 2026-08-15 kernel-evolving gained:
- `providers.hf_provider` (env `HF_ROUTER_PROVIDER`, default `deepinfra`) — the
  HF Router inference provider selected via a `:provider` suffix on the model id
  (e.g. `deepseek-ai/DeepSeek-V4-Flash-0731:deepinfra`).
- `google` as a valid provider in `/provider/set` (already in the desktop).
- A new `/config/env` endpoint that persists provider/API keys to a JSON
  override store (workspace data/env_overrides.json) without rewriting `.env`.

The mobile app's `ProviderSheet` / `KernelApiClient` / `types` were built before
these changes and need alignment.

## Audit — what already works
- `CALL_TYPES` in `types/index.ts` includes all 8 roles (5 text + vision/stt/tts).
- `ProviderSheet.tsx` lets the user pick provider + model override + persist per
  call type, and calls `/provider/set` via `KernelApiClient.setProvider()`.
- `KernelApiClient` already calls `/provider`, `/provider/set`,
  `/provider/available`, `/provider/models`.

## Gaps to fix

### 1. HF Router provider (`hf_provider`) not exposed
- `ProviderSheet.tsx` has no way to set `hf_provider`. When the `hf` provider is
  selected for any role, the model id needs the correct `:provider` suffix
  (e.g. `:deepinfra`). 
- **Kernel-evolving side:** `/provider` GET does not return `hf_provider`; add it
  to the response so clients can read the current value.
- **Mobile side:** add an `hf_provider` field to `ProviderSheet` (shown when the
  `hf` provider is in use) and a way to push it via `/provider/set`
  (`KernelApiClient.setHfProvider(provider)` or extend `setProvider`).
- Add `hf_provider` to the `ProviderRouting` type.

### 2. `google` provider missing
- `PROVIDER_OPTIONS` in `ProviderSheet.tsx` = `['local','openai','openrouter',
  'anthropic','hf','copilot']` — missing `google` (valid in kernel-evolving).
- `PROVIDER_NAMES` in `types/index.ts` missing `google`.
- Add `google` to both. (`ollama` is NOT a kernel-evolving provider — leave out.)

### 3. Provider readiness / API-key visibility (nice-to-have)
- The mobile app doesn't surface which providers are "ready". It could call
  `/provider/available` and show a warning when a selected provider has no API
  key (e.g. selecting `hf` when `HF_TOKEN` is unset).
- Optionally add a minimal `/config/env` push from the mobile app, but this is
  lower priority — keys are normally set on the desktop/agent. Document as
  optional.

## Files to change (mobile)
- `components/ProviderSheet.tsx` — add `google` option, add `hf_provider` input,
  push `hf_provider` on apply.
- `types/index.ts` — add `google` to `PROVIDER_NAMES`; add `hf_provider` to
  `ProviderRouting` / routing types.
- `services/KernelApiClient.ts` — add `setHfProvider()` (or extend `setProvider`),
  optionally a `getProviderAvailability()` already exists as `getAllProviders()`.

## Files to change (kernel-evolving, supporting)
- `src/api.py` `get_provider_routing()` — include `hf_provider` in the `/provider`
  response (read from `providers.hf_provider`).

## Non-goals
- Not adding full API-key management UI to mobile (keys belong on desktop/agent).
- Not adding `ollama` (not a kernel-evolving provider).

## Status
[x] Completed

## Notes
- Exposed `hf_provider` in kernel-evolving `/provider` GET response (+ added
  `google` to the providers list) and added `openrouter`/`google` to
  `/provider/available` (plus improved the `copilot` readiness check to accept
  `GITHUB_COPILOT_TOKEN` or `GITHUB_TOKEN`).
- Mobile: added `hf_provider` to `ProviderRouting` type, `google` to
  `PROVIDER_NAMES`, an HF Router Provider input + provider-readiness warning to
  `ProviderSheet`, and `setHfProvider()` to `KernelApiClient`.
- Also fixed a pre-existing build-blocking bug: `SettingsScreen.tsx` called
  `pairDevice()` without destructuring it from `useSettingsStore()`.
- Verified: `tsc --noEmit` clean; 67/67 Jest tests pass; live /provider +
  /provider/available return the new fields.
