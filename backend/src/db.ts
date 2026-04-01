import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';

const DB_DIR = process.env.DB_PATH || path.join(os.homedir(), '.production-guard');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operador',
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS label_sequence (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_value INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    imported_at TEXT NOT NULL,
    imported_by TEXT NOT NULL,
    total_parts INTEGER NOT NULL,
    total_quantity INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS part_numbers (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL REFERENCES shipments(id),
    part_number TEXT NOT NULL,
    description TEXT NOT NULL,
    declared_qty INTEGER NOT NULL,
    labeled_qty INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente'
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    part_number_id TEXT NOT NULL REFERENCES part_numbers(id),
    workstation_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    label_seq_id TEXT NOT NULL DEFAULT '',
    composite_id TEXT NOT NULL,
    part_number_id TEXT NOT NULL REFERENCES part_numbers(id),
    part_number TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    workstation_id INTEGER NOT NULL,
    printed_at TEXT NOT NULL,
    printed_by TEXT NOT NULL,
    zpl_command TEXT NOT NULL DEFAULT '',
    qr_validated INTEGER NOT NULL DEFAULT 0,
    print_job_id TEXT NOT NULL DEFAULT '',
    msl TEXT,
    expiry_date TEXT,
    label_type TEXT NOT NULL DEFAULT 'normal'
  );

  CREATE TABLE IF NOT EXISTS print_jobs (
    id TEXT PRIMARY KEY,
    label_id TEXT NOT NULL REFERENCES labels(id),
    status TEXT NOT NULL DEFAULT 'queued',
    printer_ip TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    retries INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS workstations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    printer_ip TEXT NOT NULL,
    printer_port INTEGER NOT NULL DEFAULT 9100,
    is_online INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS divergences (
    id TEXT PRIMARY KEY,
    part_number_id TEXT NOT NULL REFERENCES part_numbers(id),
    part_number TEXT NOT NULL,
    declared_qty INTEGER NOT NULL,
    labeled_qty INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quality_checks (
    id TEXT PRIMARY KEY,
    label_id TEXT NOT NULL REFERENCES labels(id),
    composite_id TEXT NOT NULL,
    scanned_data TEXT NOT NULL,
    is_valid INTEGER NOT NULL DEFAULT 0,
    checked_at TEXT NOT NULL,
    checked_by TEXT NOT NULL
  );
`);

// ── Migrations (safe column additions for existing DBs) ───────────────────────
const migrateSafe = (sql: string) => { try { db.exec(sql); } catch {} };
migrateSafe('ALTER TABLE labels ADD COLUMN label_seq_id TEXT NOT NULL DEFAULT ""');
migrateSafe('ALTER TABLE labels ADD COLUMN msl TEXT');
migrateSafe('ALTER TABLE labels ADD COLUMN expiry_date TEXT');
migrateSafe('ALTER TABLE labels ADD COLUMN label_type TEXT NOT NULL DEFAULT "normal"');

// ── Seeds ─────────────────────────────────────────────────────────────────────
const wsCount = (db.prepare('SELECT COUNT(*) as c FROM workstations').get() as { c: number }).c;
if (wsCount === 0) {
  const ins = db.prepare('INSERT INTO workstations (id, name, printer_ip, printer_port, is_online) VALUES (?, ?, ?, ?, ?)');
  ins.run(1, 'Bancada 1', '192.168.1.101', 9100, 1);
  ins.run(2, 'Bancada 2', '192.168.1.102', 9100, 1);
  ins.run(3, 'Bancada 3', '192.168.1.103', 9100, 0);
  ins.run(4, 'Bancada 4', '192.168.1.104', 9100, 1);
}

const seqCount = (db.prepare('SELECT COUNT(*) as c FROM label_sequence').get() as { c: number }).c;
if (seqCount === 0) {
  db.prepare('INSERT INTO label_sequence (id, last_value) VALUES (1, 0)').run();
}

// Admin default user (first run only)
const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
if (userCount === 0) {
  const adminId = crypto.randomUUID();
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.prepare('INSERT INTO users (id, username, password, name, role, is_blocked, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .run(adminId, 'admin', hash, 'Administrador', 'admin', new Date().toISOString());
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function nextLabelSeqId(): string {
  const row = db.prepare('UPDATE label_sequence SET last_value = last_value + 1 WHERE id = 1 RETURNING last_value').get() as { last_value: number };
  return String(row.last_value).padStart(12, '0');
}

export function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

export default db;
