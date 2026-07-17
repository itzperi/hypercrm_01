import Database from "better-sqlite3";
import os from "os";
import path from "path";
import fs from "fs";

const DATA_DIR = process.env.NODE_ENV === "production" ? os.tmpdir() : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "hyperwrike.db");

type QueryValue = string | number | bigint | Buffer | Uint8Array | null;

let db: Database | null = null;

function ensureDataDir() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initSchema(database: Database) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      manager_id TEXT REFERENCES users(id),
      client_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      offer TEXT,
      retainer_amount REAL DEFAULT 0,
      setup_fee REAL DEFAULT 0,
      stage TEXT DEFAULT 'lead',
      contract_start TEXT,
      renewal_date TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      last_payment_date TEXT,
      account_owner_id TEXT REFERENCES users(id),
      project_lead_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      stage TEXT DEFAULT 'lead',
      offer TEXT,
      value REAL DEFAULT 0,
      assigned_to TEXT REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      name TEXT NOT NULL,
      scope_summary TEXT,
      status TEXT DEFAULT 'active',
      percent_complete INTEGER DEFAULT 0,
      health TEXT DEFAULT 'on_track',
      start_date TEXT,
      deadline TEXT,
      lead_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL REFERENCES projects(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL,
      description TEXT,
      assignee_id TEXT REFERENCES users(id),
      due_date TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      signed INTEGER DEFAULT 0,
      file_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      document_id TEXT REFERENCES documents(id),
      line_items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      gst_amount REAL NOT NULL,
      total REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'unpaid',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      invoice_id TEXT REFERENCES invoices(id),
      amount REAL NOT NULL,
      gst_amount REAL NOT NULL,
      type TEXT DEFAULT 'client_payment',
      description TEXT,
      paid_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      paid_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      lead_id TEXT REFERENCES leads(id),
      outcome TEXT NOT NULL,
      notes TEXT,
      logged_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      lead_id TEXT REFERENCES leads(id),
      sent_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      sentiment TEXT,
      logged_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      lead_id TEXT REFERENCES leads(id),
      client_id TEXT REFERENCES clients(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      outcome TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT DEFAULT 'idea',
      owner_id TEXT REFERENCES users(id),
      due_date TEXT,
      brief_json TEXT,
      keyword TEXT,
      ranking TEXT,
      last_checked TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales_targets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      month TEXT NOT NULL,
      target_amount REAL DEFAULT 0,
      achieved_amount REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales_strategy (
      id TEXT PRIMARY KEY,
      offer TEXT NOT NULL,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_updates (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      project_id TEXT REFERENCES projects(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export function getDb(): Database {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    initSchema(db);
  }
  return db;
}

export function logActivity(
  entityType: string,
  entityId: string,
  userId: string | null,
  action: string,
  details?: string
) {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO activity_logs (id, entity_type, entity_id, user_id, action, details)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      crypto.randomUUID(),
      entityType,
      entityId,
      userId,
      action,
      details ?? null
    );
}

export function sqlGet<T>(sql: string, ...params: QueryValue[]): T | undefined {
  return getDb().prepare(sql).get(...params) as unknown as T | undefined;
}

export function sqlAll<T>(sql: string, ...params: QueryValue[]): T[] {
  return getDb().prepare(sql).all(...params) as unknown as T[];
}
