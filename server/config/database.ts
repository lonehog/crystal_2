import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
import * as schema from '../db/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - stored in project root
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'crystal.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create SQLite connection
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

console.log('✅ Connected to SQLite database');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export connection for direct queries if needed
export { sqlite };

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    sqlite.prepare('SELECT 1').get();
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
