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
    google_id TEXT UNIQUE
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

// Create demo accounts if they don't exist
const demoPassword = bcrypt.hashSync('demo123', 10);

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password, name) VALUES (?, ?, ?, ?)');

insertUser.run('demo-user-1', 'demo1@example.com', demoPassword, 'Demo User One');
insertUser.run('demo-user-2', 'demo2@example.com', demoPassword, 'Demo User Two');

export default db;
