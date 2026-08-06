---
date: 2026-08-03
agent: scout
topic: SqlitePersistence.saveMessages() missing transaction — partial writes on failure
severity: normal
tags: [scout, agent-ready]
status: open
---

# SqlitePersistence.saveMessages() missing transaction — partial writes on failure

saveMessages() at lines 182-195 of SqlitePersistence.ts iterates over an array of MessageRow objects and issues individual runAsync() calls inside a plain for loop. There is no wrapping transaction. If the process is interrupted mid-loop (e.g. the app is backgrounded or the DB errors on row N), the conversation ends up with a partial history — some messages persisted, others lost, with no way to detect or recover the gap. The same problem exists in saveAgents() at lines 254-271. Fix: wrap multi-row inserts in a single transaction using database.withTransactionAsync() as documented by expo-sqlite, e.g.: await database.withTransactionAsync(async () => { for (const msg of msgs) { await database.runAsync(...); } });
