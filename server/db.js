import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'dashboard.db');

let db;

export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS google_tokens (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      access_token TEXT,
      refresh_token TEXT,
      expiry_date INTEGER,
      email TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      data TEXT,
      fetched_at INTEGER
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS known_contacts (
      email TEXT PRIMARY KEY,
      display_name TEXT,
      last_seen INTEGER
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      gmail_id TEXT UNIQUE,
      created_at INTEGER,
      completed INTEGER DEFAULT 0
    )
  `);

  saveDb();
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function getDb() {
  return db;
}

export function getCache(key) {
  const stmt = db.prepare('SELECT data, fetched_at FROM cache WHERE key = ?');
  stmt.bind([key]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function setCache(key, data) {
  db.run(
    'INSERT OR REPLACE INTO cache (key, data, fetched_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(data), Date.now()]
  );
  saveDb();
}

// Helper: run a query that returns rows
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query that returns one row
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
export function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}
