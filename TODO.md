# kernel-mobile-v2 — Development TODO

> Index of `.specs/plans/` features + current progress.
> Updated automatically as features are worked on.

## Feature Progress

| # | Feature | Status | Branch | Notes |
|---|---------|--------|--------|-------|
| 1 | **Project Scaffold** | 🟢 Completed | `feature/initial-scaffold` | Expo init, deps, TS strict, folder skeleton |
| 2 | **State Stores** | 🟢 Completed | (cherry-picked) | appStore + settingsStore on dev |
| 3 | **API & Services** | 🟢 Completed | `feature/api-services` | KernelApiClient, SseStreamer, SqlitePersistence, VoiceService |
| 4 | **Shared Components** | 🟢 Completed | `feature/shared-components` | 14 UI components: MessageBubble, ComposerBar, Toast, etc. |
| 5 | **Screens & Navigation** | 🟢 Completed | `feature/screens-navigation` | BotListScreen, ChatScreen, SettingsScreen, BotProfileScreen, MainTabs — all wired |
| 6 | **CI/CD Pipeline** | 🔴 Not started | — | GHA workflow + self-hosted runner |

## Legend

- 🔴 Not started
- 🟡 In progress
- 🟢 Completed
- ⏸ Blocked

## Specs Files

- `.specs/plans/feature-project-scaffold.md`
- `.specs/plans/feature-state-stores.md`
- `.specs/plans/feature-api-services.md`
- `.specs/plans/feature-shared-components.md`
- `.specs/plans/feature-screens-navigation.md`
- `.specs/plans/feature-ci-cd-pipeline.md`

## ADR

See `ADR.md` for the full architecture decision record.
