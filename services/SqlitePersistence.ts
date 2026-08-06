/**
 * SqlitePersistence — local SQLite for conversation history + settings
 * Uses expo-sqlite (SQLite database via Expo SDK 57).
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('kernel-mobile-v2.db');
  }
  return db;
}

/** Schema version for migrations */
const SCHEMA_VERSION = 1;

interface ConversationRow {
  id: string;
  agent_id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

/** Cached agent row — mirrors DiscoveredPeer + Agent for offline read-only. */
export interface AgentRow {
  id: string;        // unique agent id (e.g. 'kernel-main')
  name: string;
  description: string;
  ip: string;        // last-known host (empty for proxy-only agents)
  port: number;      // last-known port
  status: string;     // 'online' | 'offline' | 'checking'
  source: string;    // 'lan' | 'proxy' | 'manual'
  updated_at: number; // last refresh timestamp
}

class SqlitePersistence {
  private initialized = false;

  /** Initialize the database schema */
  async init(): Promise<void> {
    if (this.initialized) return;

    const database = await getDb();

    // Schema version check
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS _meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const versionRow = await database.getFirstAsync<{ value: string }>(
      `SELECT value FROM _meta WHERE key = 'schema_version'`
    );

    if (!versionRow) {
      // Fresh database — run all migrations
      await this.migrateV1(database);
      await database.runAsync(
        `INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?)`,
        SCHEMA_VERSION.toString()
      );
    }

    this.initialized = true;
  }

  /** Ensures schema exists before any query — lazy-init guard for every public method. */
  private async ready(): Promise<SQLite.SQLiteDatabase> {
    await this.init();
    return getDb();
  }

  private async migrateV1(database: SQLite.SQLiteDatabase): Promise<void> {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Chat',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conv
        ON messages(conversation_id, timestamp);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        ip TEXT NOT NULL DEFAULT '',
        port INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'offline',
        source TEXT NOT NULL DEFAULT 'lan',
        updated_at INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_agents_source
        ON agents(source);
    `);
  }

  // ─── Conversations ───

  /** Get all conversations for an agent */
  async getConversations(agentId: string): Promise<ConversationRow[]> {
    const database = await this.ready();
    return database.getAllAsync<ConversationRow>(
      `SELECT * FROM conversations WHERE agent_id = ? ORDER BY updated_at DESC`,
      agentId
    );
  }

  /** Save or update a conversation */
  async saveConversation(conv: ConversationRow): Promise<void> {
    const database = await this.ready();
    await database.runAsync(
      `INSERT OR REPLACE INTO conversations (id, agent_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      conv.id,
      conv.agent_id,
      conv.title,
      conv.created_at,
      conv.updated_at
    );
  }

  /** Delete a conversation and all its messages */
  async deleteConversation(id: string): Promise<void> {
    const database = await this.ready();
    await database.runAsync(`DELETE FROM messages WHERE conversation_id = ?`, id);
    await database.runAsync(`DELETE FROM conversations WHERE id = ?`, id);
  }

  // ─── Messages ───

  /** Get messages for a conversation (oldest first) */
  async getMessages(conversationId: string): Promise<MessageRow[]> {
    const database = await this.ready();
    return database.getAllAsync<MessageRow>(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC`,
      conversationId
    );
  }

  /** Save a single message */
  async saveMessage(msg: MessageRow): Promise<void> {
    const database = await this.ready();
    await database.runAsync(
      `INSERT OR REPLACE INTO messages (id, conversation_id, role, text, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      msg.id,
      msg.conversation_id,
      msg.role,
      msg.text,
      msg.timestamp
    );
  }

  /** Save multiple messages in a transaction — all-or-nothing on failure */
  async saveMessages(msgs: MessageRow[]): Promise<void> {
    const database = await this.ready();
    await database.withTransactionAsync(async () => {
      for (const msg of msgs) {
        await database.runAsync(
          `INSERT OR REPLACE INTO messages (id, conversation_id, role, text, timestamp)
           VALUES (?, ?, ?, ?, ?)`,
          msg.id,
          msg.conversation_id,
          msg.role,
          msg.text,
          msg.timestamp
        );
      }
    });
  }

  // ─── Settings ───

  /** Get an app setting by key */
  async getSetting(key: string): Promise<string | null> {
    const database = await this.ready();
    const row = await database.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      key
    );
    return row?.value ?? null;
  }

  /** Set an app setting */
  async setSetting(key: string, value: string): Promise<void> {
    const database = await this.ready();
    await database.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
      key,
      value
    );
  }

  /** Delete a setting */
  async deleteSetting(key: string): Promise<void> {
    const database = await this.ready();
    await database.runAsync(`DELETE FROM app_settings WHERE key = ?`, key);
  }

  // ─── Agents (offline cache) ───

  /** Load all cached agents (offline read-only mode). */
  async getAgents(): Promise<AgentRow[]> {
    const database = await this.ready();
    return database.getAllAsync<AgentRow>(
      `SELECT * FROM agents ORDER BY updated_at DESC`
    );
  }

  /** Upsert a single agent into the cache. */
  async saveAgent(agent: AgentRow): Promise<void> {
    const database = await this.ready();
    await database.runAsync(
      `INSERT OR REPLACE INTO agents
         (id, name, description, ip, port, status, source, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      agent.id,
      agent.name,
      agent.description,
      agent.ip,
      agent.port,
      agent.status,
      agent.source,
      agent.updated_at
    );
  }

  /** Upsert many agents in one go (used after a LAN/proxy scan) — transactional */
  async saveAgents(agents: AgentRow[]): Promise<void> {
    const database = await this.ready();
    await database.withTransactionAsync(async () => {
      for (const a of agents) {
        await database.runAsync(
          `INSERT OR REPLACE INTO agents
             (id, name, description, ip, port, status, source, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          a.id,
          a.name,
          a.description,
          a.ip,
          a.port,
          a.status,
          a.source,
          a.updated_at
        );
      }
    });
  }

  /** Mark a cached agent's status (e.g. online → offline when unreachable). */
  async setAgentStatus(id: string, status: string): Promise<void> {
    const database = await this.ready();
    await database.runAsync(
      `UPDATE agents SET status = ?, updated_at = ? WHERE id = ?`,
      status,
      Date.now(),
      id
    );
  }

  /** Remove a cached agent by id. */
  async deleteAgent(id: string): Promise<void> {
    const database = await this.ready();
    await database.runAsync(`DELETE FROM agents WHERE id = ?`, id);
  }

  /** Clear all cached agents (e.g. on logout / mode switch). */
  async clearAgents(): Promise<void> {
    const database = await this.ready();
    await database.runAsync(`DELETE FROM agents`);
  }
}

export const sqlitePersistence = new SqlitePersistence();
export default SqlitePersistence;
