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
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Migration function to ensure schema is up to date
export function syncDatabase() {
  console.log('Syncing database schema...');
  try {
    // Users table migrations
    const userTableInfo = db.prepare("PRAGMA table_info(users)").all();

    const hasRole = userTableInfo.some(col => col.name === 'role');
    if (!hasRole) {
      db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
      console.log('Added role column to users table');
    }

    const hasCreatedAt = userTableInfo.some(col => col.name === 'created_at');
    if (!hasCreatedAt) {
      db.prepare("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      console.log('Added created_at column to users table');
    }

    // Designs table migrations
    const designTableInfo = db.prepare("PRAGMA table_info(designs)").all();

    const hasDesignCreatedAt = designTableInfo.some(col => col.name === 'created_at');
    if (!hasDesignCreatedAt) {
      db.prepare("ALTER TABLE designs ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      console.log('Added created_at column to designs table');
    }

    const hasDesignUpdatedAt = designTableInfo.some(col => col.name === 'updated_at');
    if (!hasDesignUpdatedAt) {
      db.prepare("ALTER TABLE designs ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      console.log('Added updated_at column to designs table');
    }

    console.log('Database schema sync complete.');
    return { success: true, message: 'Database synced successfully' };
  } catch (error) {
    console.error("Migration Error:", error);
    throw error;
  }
}

// Initial sync on startup
syncDatabase();

// Create demo accounts if they don't exist
const demoPassword = bcrypt.hashSync('demo123', 10);
const adminPassword = bcrypt.hashSync('admin123', 10);

// Ensure Admin User Exists with Correct Role/Password
const adminEmail = 'admin@example.com';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (existingAdmin) {
  // User exists (possibly from manual sign up), FORCE update their role and password
  db.prepare('UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?')
    .run(adminPassword, 'admin', 'Super Admin', adminEmail);
  console.log('Admin account updated.');
} else {
  // User does not exist, insert fresh
  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run('admin-user', adminEmail, adminPassword, 'Super Admin', 'admin');
  console.log('Admin account created.');
}

// Demo users (keep as ignore to not overwrite user changes)
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)');
insertUser.run('demo-user-1', 'demo1@example.com', demoPassword, 'Demo User One', 'user');
insertUser.run('demo-user-2', 'demo2@example.com', demoPassword, 'Demo User Two', 'user');

export default db;
