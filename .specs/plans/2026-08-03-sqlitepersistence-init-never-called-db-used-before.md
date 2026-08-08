---
date: 2026-08-03
agent: scout
topic: SqlitePersistence.init() never called — DB used before schema exists
severity: high
tags: [scout, agent-ready]
status: resolved
---

# SqlitePersistence.init() never called — DB used before schema exists

SqlitePersistence exposes an explicit init() method that creates the tables (conversations, messages, agents, app_settings) and records the schema version. However, init() is never called anywhere in the codebase — not in App.tsx, not in any store, not in any screen. Every call to getDb() skips schema initialisation: agentStore.ts calls sqlitePersistence.saveAgents() (line 94) and sqlitePersistence.getAgents() (line 113) against an uninitialised database. At runtime this will throw 'no such table: agents' on a fresh install because migrateV1() was never executed. Fix: call sqlitePersistence.init() once before any other DB interaction, e.g. in App.tsx inside a useEffect on mount, or at the top of SqlitePersistence.getDb() as a lazy guard (call this.init() if !this.initialized).
