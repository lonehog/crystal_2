import { db, sqlite, checkDatabaseConnection } from '../server/config/database.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Setup Script
 * Creates tables and initializes default data
 */

async function setupDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  Crystal Database Setup');
  console.log('='.repeat(60) + '\n');

  try {
    // Check connection
    console.log('📡 Testing database connection...');
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create tables using SQL
    console.log('\n📋 Creating tables...');
    
    // Jobs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        url TEXT NOT NULL UNIQUE,
        description TEXT,
        salary TEXT,
        job_type TEXT,
        posted_at TEXT,
        role_slug TEXT,
        source TEXT NOT NULL,
        is_new_in_last_hour INTEGER DEFAULT 0,
        first_seen TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_seen TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('  ✅ Jobs table created');

    // Scraper runs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS scraper_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        jobs_found INTEGER DEFAULT 0,
        new_jobs INTEGER DEFAULT 0,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completed_at TEXT,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('  ✅ Scraper runs table created');

    // Settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log('  ✅ Settings table created');

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source)
    `);
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)
    `);
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_jobs_is_new ON jobs(is_new_in_last_hour)
    `);
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_scraper_runs_source ON scraper_runs(source)
    `);
    
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON scraper_runs(started_at DESC)
    `);
    
    console.log('  ✅ Indexes created');

    // Insert default settings
    console.log('\n⚙️  Initializing default settings...');
    
    const defaultKeywords = process.env.DEFAULT_KEYWORDS || 'embedded systems engineer,embedded hardware,firmware engineer';
    
    await db.run(sql`
      INSERT OR IGNORE INTO settings (key, value)
      VALUES ('keywords', ${defaultKeywords})
    `);
    
    console.log('  ✅ Default keywords set:', defaultKeywords);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database setup completed successfully!');
    console.log('='.repeat(60) + '\n');

    console.log('📝 Next steps:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Visit http://localhost:5173');
    console.log('  3. Trigger scrapers from the dashboard\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    process.exit(0);
  }
}

// Run setup
setupDatabase();
