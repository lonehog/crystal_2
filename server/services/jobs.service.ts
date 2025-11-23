import { db } from '../config/database.js';
import { jobs, scraperRuns, settings } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { Job, JobStats, ScraperStatus } from '../types/job.types.js';

/**
 * Get all jobs with optional filtering
 */
export async function getAllJobs(params: {
  source?: string;
  roleSlug?: string;
  isNew?: boolean;
  limit?: number;
}): Promise<Job[]> {
  const { source, roleSlug, isNew, limit = 1000 } = params;

  let query = db.select().from(jobs);

  // Apply filters
  const conditions = [];
  if (source) conditions.push(eq(jobs.source, source));
  if (roleSlug) conditions.push(eq(jobs.roleSlug, roleSlug));
  if (isNew) conditions.push(eq(jobs.isNewInLastHour, true));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query
    .orderBy(desc(jobs.createdAt))
    .limit(limit);

  return result as Job[];
}

/**
 * Get jobs by source (only new in last hour)
 */
export async function getJobsBySource(source: string): Promise<Job[]> {
  const result = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.source, source),
        eq(jobs.isNewInLastHour, true)
      )
    )
    .orderBy(desc(jobs.firstSeen));

  return result as Job[];
}

/**
 * Get job statistics
 */
export async function getJobStats(): Promise<JobStats> {
  // Total jobs
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs);
  
  const totalJobs = Number(totalResult[0]?.count || 0);

  // New jobs in last hour
  const newJobsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.isNewInLastHour, true));
  
  const newJobsLastHour = Number(newJobsResult[0]?.count || 0);

  // Jobs by source
  const sourceStatsResult = await db
    .select({
      source: jobs.source,
      count: sql<number>`count(*)`,
    })
    .from(jobs)
    .groupBy(jobs.source);

  const jobsBySource: Record<string, number> = {};
  sourceStatsResult.forEach((row: any) => {
    jobsBySource[row.source] = Number(row.count);
  });

  return {
    totalJobs,
    newJobsLastHour,
    jobsBySource,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get scraper status for all sources
 */
export async function getScraperStatus(): Promise<Record<string, ScraperStatus>> {
  const sources = ['linkedin', 'stepstone'];
  const status: Record<string, ScraperStatus> = {};

  for (const source of sources) {
    // Get last completed run
    const lastRuns = await db
      .select()
      .from(scraperRuns)
      .where(
        and(
          eq(scraperRuns.source, source),
          eq(scraperRuns.status, 'completed')
        )
      )
      .orderBy(desc(scraperRuns.completedAt))
      .limit(1);

    const lastRun = lastRuns[0] || null;

    // Calculate if can run
    let canRun = true;
    let minutesUntilNext = 0;

    if (lastRun && lastRun.completedAt) {
      const lastRunTime = new Date(lastRun.completedAt);
      const now = new Date();
      const minutesSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60);
      const requiredMinutes = 60; // 1 hour

      if (minutesSinceLastRun < requiredMinutes) {
        canRun = false;
        minutesUntilNext = Math.ceil(requiredMinutes - minutesSinceLastRun);
      }
    }

    status[source] = {
      source,
      lastRun: lastRun as any,
      canRun,
      minutesUntilNextRun: minutesUntilNext,
    };
  }

  return status;
}

/**
 * Get recent scraper runs
 */
export async function getRecentScraperRuns(source?: string, limit = 10) {
  let query = db.select().from(scraperRuns);

  if (source) {
    query = query.where(eq(scraperRuns.source, source));
  }

  const result = await query
    .orderBy(desc(scraperRuns.startedAt))
    .limit(limit);

  return result;
}

/**
 * Get job by ID
 */
export async function getJobById(id: number): Promise<Job | null> {
  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);

  return result[0] as Job || null;
}

/**
 * Search jobs by keyword
 */
export async function searchJobs(keyword: string, limit = 100): Promise<Job[]> {
  const result = await db
    .select()
    .from(jobs)
    .where(
      sql`LOWER(${jobs.title}) LIKE LOWER(${'%' + keyword + '%'}) OR LOWER(${jobs.company}) LIKE LOWER(${'%' + keyword + '%'})`
    )
    .orderBy(desc(jobs.createdAt))
    .limit(limit);

  return result as Job[];
}
