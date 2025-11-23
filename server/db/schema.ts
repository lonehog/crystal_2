import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Jobs Table
 * Stores all scraped job listings
 */
export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  url: text('url').notNull().unique(),
  description: text('description'),
  salary: text('salary'),
  jobType: text('job_type'), // full-time, part-time, contract, etc.
  postedAt: text('posted_at'), // Original posted date from scraper
  roleSlug: text('role_slug'), // embedded-systems, firmware, hardware, etc.
  source: text('source').notNull(), // linkedin, stepstone, glassdoor
  
  // Tracking fields
  isNewInLastHour: integer('is_new_in_last_hour', { mode: 'boolean' }).default(false),
  firstSeen: text('first_seen').default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastSeen: text('last_seen').default(sql`CURRENT_TIMESTAMP`).notNull(),
  
  // Metadata
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Scraper Runs Table
 * Tracks scraper execution history and statistics
 */
export const scraperRuns = sqliteTable('scraper_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(), // linkedin, stepstone, etc.
  status: text('status').notNull(), // running, completed, failed
  
  // Statistics
  jobsFound: integer('jobs_found').default(0),
  newJobs: integer('new_jobs').default(0),
  
  // Timing
  startedAt: text('started_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: text('completed_at'),
  
  // Error handling
  error: text('error'),
  
  // Metadata
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Settings Table
 * Key-value store for application settings
 */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  
  // Metadata
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Export types for TypeScript
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type ScraperRun = typeof scraperRuns.$inferSelect;
export type NewScraperRun = typeof scraperRuns.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
