/**
 * SQLite database for daily fee values per chain (using sql.js — no native deps).
 * One value per day per chain (date = UTC YYYY-MM-DD).
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.GAS_SURFER_DB || join(__dirname, 'gas-surfer.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_fees (
      chain_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      value REAL NOT NULL,
      updated_at INTEGER,
      PRIMARY KEY (chain_id, date)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_fees_date ON daily_fees(date)`);
  db.run(`
    CREATE TABLE IF NOT EXISTS fee_ticks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      payload TEXT NOT NULL
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_fee_ticks_created ON fee_ticks(created_at)`);
  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

/**
 * Record one day's value for a chain. Only the first sample per (chain_id, date) is stored;
 * later samples for the same day are ignored to avoid spamming the database.
 * @param {number} chainId
 * @param {number} value - fee (gwei or sat/vB)
 * @param {number} timestamp - ms since epoch
 */
export async function upsertDaily(chainId, value, timestamp) {
  const d = await getDb();
  const date = new Date(timestamp).toISOString().slice(0, 10);
  d.run(
    `INSERT OR IGNORE INTO daily_fees (chain_id, date, value, updated_at) VALUES (?, ?, ?, ?)`,
    [chainId, date, value, timestamp]
  );
  persist();
}

/**
 * Record multiple samples. One value per (chain_id, date) — first sample of the day wins;
 * subsequent samples for the same day are ignored.
 * @param {{ chainId: number, value: number, timestamp: number }[]} samples
 */
export async function upsertSamples(samples) {
  const d = await getDb();
  for (const { chainId, value, timestamp } of samples) {
    if (!Number.isFinite(chainId) || !Number.isFinite(value) || !Number.isFinite(timestamp)) continue;
    const date = new Date(timestamp).toISOString().slice(0, 10);
    d.run(
      `INSERT OR IGNORE INTO daily_fees (chain_id, date, value, updated_at) VALUES (?, ?, ?, ?)`,
      [chainId, date, value, timestamp]
    );
  }
  persist();
}

function dateDaysAgo(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Get 7d, 30d, 90d, 180d averages for a chain.
 * @param {number} chainId
 * @returns {{ avg7d: number|null, avg30d: number|null, avg90d: number|null, avg180d: number|null }}
 */
export async function getAverages(chainId) {
  const d = await getDb();
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const d7 = dateDaysAgo(today, 7);
  const d30 = dateDaysAgo(today, 30);
  const d90 = dateDaysAgo(today, 90);
  const d180 = dateDaysAgo(today, 180);

  const stmt = d.prepare(`
    SELECT date, value FROM daily_fees
    WHERE chain_id = ? AND date <= ? AND date >= ?
    ORDER BY date
  `);
  stmt.bind([chainId, today, d180]);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();

  const avg = (fromDate) => {
    const sub = rows.filter((r) => r.date >= fromDate).map((r) => r.value);
    return sub.length ? sub.reduce((a, b) => a + b, 0) / sub.length : null;
  };

  return {
    avg7d: avg(d7),
    avg30d: avg(d30),
    avg90d: avg(d90),
    avg180d: avg(d180),
  };
}

/**
 * Get averages for multiple chains.
 * @param {number[]} chainIds
 * @returns {Promise<Record<number, { avg7d: number|null, avg30d: number|null, avg90d: number|null, avg180d: number|null }>>}
 */
export async function getAllAverages(chainIds) {
  const result = {};
  for (const chainId of chainIds) {
    result[chainId] = await getAverages(chainId);
  }
  return result;
}

/**
 * Store a validated snapshot JSON string (from POST /api/ticks).
 * @param {string} jsonStr
 */
export async function insertFeeTick(jsonStr) {
  const d = await getDb();
  d.run(`INSERT INTO fee_ticks (created_at, payload) VALUES (?, ?)`, [Date.now(), jsonStr]);
  persist();
}

/**
 * @returns {string|null} Latest snapshot JSON or null
 */
export async function getLatestSnapshotJson() {
  const d = await getDb();
  const stmt = d.prepare(`SELECT payload FROM fee_ticks ORDER BY id DESC LIMIT 1`);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return typeof row.payload === 'string' ? row.payload : null;
}

export function close() {
  if (db) {
    db.close();
    db = null;
  }
}
