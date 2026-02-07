import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use environment variable for DB path if provided (Docker friendly), otherwise default to local
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../database.db');

// Ensure directory exists
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    google_id TEXT UNIQUE,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    template_id TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add role column if it doesn't exist (Migration)
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasRole = tableInfo.some(col => col.name === 'role');
  if (!hasRole) {
    db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
  }
} catch (error) {
  console.error("Migration Error:", error);
}

// Create demo accounts if they don't exist
const demoPassword = bcrypt.hashSync('demo123', 10);
const adminPassword = bcrypt.hashSync('admin123', 10);

// Ensure Admin User Exists with Correct Role/Password
const upsertAdmin = db.prepare(`
    INSERT INTO users (id, email, password, name, role) 
    VALUES (?, ?, ?, ?, ?) 
    ON CONFLICT(id) DO UPDATE SET 
        password = excluded.password,
        role = excluded.role,
        name = excluded.name
`);

upsertAdmin.run('admin-user', 'admin@example.com', adminPassword, 'Super Admin', 'admin');

// Demo users (keep as ignore to not overwrite user changes)
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)');
insertUser.run('demo-user-1', 'demo1@example.com', demoPassword, 'Demo User One', 'user');
insertUser.run('demo-user-2', 'demo2@example.com', demoPassword, 'Demo User Two', 'user');

export default db;
