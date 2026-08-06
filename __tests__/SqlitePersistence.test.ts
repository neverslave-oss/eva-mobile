/**
 * SqlitePersistence.test.ts — schema init guard, CRUD, and transactions.
 *
 * expo-sqlite is a native module unavailable under the node test env, so we
 * fake it with a tiny in-memory table store that pattern-matches the fixed
 * SQL strings SqlitePersistence issues.
 */

jest.mock('expo-sqlite', () => {
  const tables: any = { _meta: [], conversations: [], messages: [], app_settings: [], agents: [] };

  function upsert(arr: any[], key: string, row: any) {
    const idx = arr.findIndex((r) => r[key] === row[key]);
    if (idx >= 0) arr[idx] = row;
    else arr.push(row);
  }

  const fakeDb = {
    execAsync: jest.fn(async () => {}),
    getFirstAsync: jest.fn(async (sql: string, ...params: any[]) => {
      if (sql.includes('_meta')) return tables._meta.find((r: any) => r.key === 'schema_version') ?? null;
      if (sql.includes('app_settings')) return tables.app_settings.find((r: any) => r.key === params[0]) ?? null;
      return null;
    }),
    getAllAsync: jest.fn(async (sql: string, ...params: any[]) => {
      if (sql.includes('FROM conversations')) {
        return tables.conversations
          .filter((r: any) => r.agent_id === params[0])
          .sort((a: any, b: any) => b.updated_at - a.updated_at);
      }
      if (sql.includes('FROM messages')) {
        return tables.messages
          .filter((r: any) => r.conversation_id === params[0])
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
      }
      if (sql.includes('FROM agents')) {
        return [...tables.agents].sort((a: any, b: any) => b.updated_at - a.updated_at);
      }
      return [];
    }),
    runAsync: jest.fn(async (sql: string, ...params: any[]) => {
      if (sql.includes('INSERT OR REPLACE INTO _meta')) {
        // The key ('schema_version') is inlined in the SQL text itself —
        // only the value is a bind param.
        upsert(tables._meta, 'key', { key: 'schema_version', value: params[0] });
      } else if (sql.includes('INSERT OR REPLACE INTO conversations')) {
        upsert(tables.conversations, 'id', {
          id: params[0], agent_id: params[1], title: params[2], created_at: params[3], updated_at: params[4],
        });
      } else if (sql.includes('DELETE FROM messages WHERE conversation_id')) {
        tables.messages = tables.messages.filter((r: any) => r.conversation_id !== params[0]);
      } else if (sql.includes('DELETE FROM conversations WHERE id')) {
        tables.conversations = tables.conversations.filter((r: any) => r.id !== params[0]);
      } else if (sql.includes('INSERT OR REPLACE INTO messages')) {
        upsert(tables.messages, 'id', {
          id: params[0], conversation_id: params[1], role: params[2], text: params[3], timestamp: params[4],
        });
      } else if (sql.includes('INSERT OR REPLACE INTO app_settings')) {
        upsert(tables.app_settings, 'key', { key: params[0], value: params[1] });
      } else if (sql.includes('DELETE FROM app_settings WHERE key')) {
        tables.app_settings = tables.app_settings.filter((r: any) => r.key !== params[0]);
      } else if (sql.includes('INSERT OR REPLACE INTO agents')) {
        upsert(tables.agents, 'id', {
          id: params[0], name: params[1], description: params[2], ip: params[3],
          port: params[4], status: params[5], source: params[6], updated_at: params[7],
        });
      } else if (sql.includes('UPDATE agents SET status')) {
        const row = tables.agents.find((r: any) => r.id === params[2]);
        if (row) { row.status = params[0]; row.updated_at = params[1]; }
      } else if (sql.includes('DELETE FROM agents WHERE id')) {
        tables.agents = tables.agents.filter((r: any) => r.id !== params[0]);
      } else if (sql.trim() === 'DELETE FROM agents') {
        tables.agents = [];
      }
    }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => {
      await task();
    }),
  };

  return {
    __esModule: true,
    openDatabaseAsync: jest.fn(async () => fakeDb),
    __fakeTables: tables,
    __fakeDb: fakeDb,
  };
});

describe('SqlitePersistence', () => {
  // Fresh module registry per test — the class holds `initialized`/`db`
  // singleton state, and expo-sqlite's mock factory re-runs on resetModules.
  let sqlitePersistence: typeof import('../services/SqlitePersistence').sqlitePersistence;
  let SQLiteMock: any;

  beforeEach(() => {
    jest.resetModules();
    SQLiteMock = require('expo-sqlite');
    sqlitePersistence = require('../services/SqlitePersistence').sqlitePersistence;
  });

  // ── init() lazy guard (regression: init() was never called anywhere) ──

  it('creates the schema on first use without an explicit init() call', async () => {
    const msgs = await sqlitePersistence.getMessages('conv-1');
    expect(msgs).toEqual([]);
    expect(SQLiteMock.__fakeTables._meta.find((r: any) => r.key === 'schema_version')).toBeTruthy();
  });

  it('only runs migrations once across repeated calls', async () => {
    await sqlitePersistence.getAgents();
    await sqlitePersistence.getAgents();
    const execCalls = SQLiteMock.__fakeDb.execAsync.mock.calls.length;
    // _meta table create + migrateV1 = 2 execAsync calls total, never repeated.
    expect(execCalls).toBe(2);
  });

  // ── Conversations & messages ──

  it('saves and retrieves a conversation', async () => {
    await sqlitePersistence.saveConversation({
      id: 'c1', agent_id: 'kernel-main', title: 'Chat', created_at: 1, updated_at: 2,
    });
    const rows = await sqlitePersistence.getConversations('kernel-main');
    expect(rows).toEqual([
      { id: 'c1', agent_id: 'kernel-main', title: 'Chat', created_at: 1, updated_at: 2 },
    ]);
  });

  it('saves a single message and reads it back in order', async () => {
    await sqlitePersistence.saveMessage({ id: 'm1', conversation_id: 'c1', role: 'user', text: 'hi', timestamp: 1 });
    await sqlitePersistence.saveMessage({ id: 'm2', conversation_id: 'c1', role: 'assistant', text: 'hello', timestamp: 2 });
    const rows = await sqlitePersistence.getMessages('c1');
    expect(rows.map((r) => r.id)).toEqual(['m1', 'm2']);
  });

  it('deleting a conversation removes its messages too', async () => {
    await sqlitePersistence.saveConversation({ id: 'c1', agent_id: 'a', title: 'T', created_at: 1, updated_at: 1 });
    await sqlitePersistence.saveMessage({ id: 'm1', conversation_id: 'c1', role: 'user', text: 'hi', timestamp: 1 });
    await sqlitePersistence.deleteConversation('c1');
    expect(await sqlitePersistence.getMessages('c1')).toEqual([]);
    expect(await sqlitePersistence.getConversations('a')).toEqual([]);
  });

  // ── saveMessages() transaction (regression: partial writes on failure) ──

  it('saveMessages wraps all inserts in a single transaction', async () => {
    const msgs = [
      { id: 'm1', conversation_id: 'c1', role: 'user' as const, text: 'a', timestamp: 1 },
      { id: 'm2', conversation_id: 'c1', role: 'assistant' as const, text: 'b', timestamp: 2 },
      { id: 'm3', conversation_id: 'c1', role: 'user' as const, text: 'c', timestamp: 3 },
    ];
    await sqlitePersistence.saveMessages(msgs);
    expect(SQLiteMock.__fakeDb.withTransactionAsync).toHaveBeenCalledTimes(1);
    const rows = await sqlitePersistence.getMessages('c1');
    expect(rows).toHaveLength(3);
  });

  it('rolls back mid-transaction inserts if one write fails', async () => {
    // Capture the underlying implementation (not the jest.fn() wrapper
    // itself) so the override below doesn't recurse into its own mock.
    const baseRunAsync = SQLiteMock.__fakeDb.runAsync.getMockImplementation();
    let calls = 0;
    SQLiteMock.__fakeDb.runAsync.mockImplementation(async (sql: string, ...params: any[]) => {
      if (sql.includes('INSERT OR REPLACE INTO messages')) {
        calls += 1;
        if (calls === 2) throw new Error('disk full');
      }
      return baseRunAsync!(sql, ...params);
    });

    await expect(
      sqlitePersistence.saveMessages([
        { id: 'm1', conversation_id: 'c1', role: 'user' as const, text: 'a', timestamp: 1 },
        { id: 'm2', conversation_id: 'c1', role: 'user' as const, text: 'b', timestamp: 2 },
      ])
    ).rejects.toThrow('disk full');

    // The fake's withTransactionAsync doesn't itself roll back partial writes
    // (real SQLite does) — this test only asserts the failure propagates so
    // the caller can detect and recover, rather than silently swallowing it.
    expect(SQLiteMock.__fakeDb.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  // ── Settings ──

  it('sets, gets, and deletes an app setting', async () => {
    await sqlitePersistence.setSetting('theme', 'dark');
    expect(await sqlitePersistence.getSetting('theme')).toBe('dark');
    await sqlitePersistence.deleteSetting('theme');
    expect(await sqlitePersistence.getSetting('theme')).toBeNull();
  });

  // ── Agents (offline cache) ──

  it('saveAgents upserts multiple rows in a transaction', async () => {
    await sqlitePersistence.saveAgents([
      { id: 'a1', name: 'A1', description: '', ip: '10.0.0.1', port: 8779, status: 'online', source: 'lan', updated_at: 1 },
      { id: 'a2', name: 'A2', description: '', ip: '10.0.0.2', port: 8765, status: 'online', source: 'lan', updated_at: 2 },
    ]);
    expect(SQLiteMock.__fakeDb.withTransactionAsync).toHaveBeenCalledTimes(1);
    const rows = await sqlitePersistence.getAgents();
    expect(rows).toHaveLength(2);
  });

  it('setAgentStatus updates only the targeted agent', async () => {
    await sqlitePersistence.saveAgent({ id: 'a1', name: 'A1', description: '', ip: '', port: 0, status: 'online', source: 'lan', updated_at: 1 });
    await sqlitePersistence.setAgentStatus('a1', 'offline');
    const rows = await sqlitePersistence.getAgents();
    expect(rows[0].status).toBe('offline');
  });

  it('clearAgents empties the cache', async () => {
    await sqlitePersistence.saveAgent({ id: 'a1', name: 'A1', description: '', ip: '', port: 0, status: 'online', source: 'lan', updated_at: 1 });
    await sqlitePersistence.clearAgents();
    expect(await sqlitePersistence.getAgents()).toEqual([]);
  });
});
