---
date: 2026-08-03
agent: scout
topic: No tests for core store logic, API client, or screen flows — only NetworkDiscovery covered
severity: normal
tags: [scout, agent-ready]
status: open
---

# No tests for core store logic, API client, or screen flows — only NetworkDiscovery covered

The entire __tests__/ directory contains exactly one test file: NetworkDiscovery.test.ts. None of the following are tested: agentStore.ts (sendMessage, sendSlashCommand, feedDiscoveredPeers, clearConversation), settingsStore.ts (login/logout, persist/rehydrate), KernelApiClient.ts (streamMessage, dual-mode routing, relayMessage), SqlitePersistence.ts (schema migration, saveMessage, getMessages), or any screen component. The CI pipeline defined in ADR.md runs npx jest --ci as a required gate before any APK build — with 0% coverage on critical paths, the gate provides no real quality signal. Fix: add Jest unit tests for at minimum agentStore sendMessage (mock kernelClient.streamMessage), settingsStore login (mock fetch), and SqlitePersistence schema migration.
