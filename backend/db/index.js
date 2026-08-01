import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "thanal.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('mom','family')),
  invite_code TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_links (
  id TEXT PRIMARY KEY,
  mom_id TEXT NOT NULL REFERENCES users(id),
  family_id TEXT NOT NULL REFERENCES users(id),
  relation TEXT DEFAULT 'family member',
  share_journal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(mom_id, family_id)
);

CREATE TABLE IF NOT EXISTS epds_responses (
  id TEXT PRIMARY KEY,
  mom_id TEXT NOT NULL REFERENCES users(id),
  answers TEXT NOT NULL,
  score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  self_harm_flag INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  mom_id TEXT NOT NULL REFERENCES users(id),
  mood INTEGER NOT NULL,
  sleep INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crisis_logs (
  id TEXT PRIMARY KEY,
  mom_id TEXT NOT NULL REFERENCES users(id),
  sender TEXT NOT NULL CHECK(sender IN ('user','bot')),
  message TEXT NOT NULL,
  risk_flag TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_nurse_scans (
  id TEXT PRIMARY KEY,
  mom_id TEXT NOT NULL REFERENCES users(id),
  mood TEXT NOT NULL,
  confidence REAL NOT NULL,
  instructions TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS anon_identities (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  alias TEXT NOT NULL,
  avatar_seed TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS anon_messages (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL DEFAULT 'general',
  user_id TEXT NOT NULL REFERENCES users(id),
  alias TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_to_id TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  reported INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  edited_at TEXT
);

CREATE TABLE IF NOT EXISTS anon_reactions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES anon_messages(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);
`);

export function genId(prefix) {
  return `${prefix}_${nanoid(12)}`;
}

export default db;
