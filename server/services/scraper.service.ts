import { spawn } from 'child_process';
import { db } from '../config/database.js';
import { jobs, scraperRuns } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { ScraperResult, ScrapedJob } from '../types/job.types.js';
import dotenv from 'dotenv';

dotenv.config();

const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const SCRAPER_PATH = process.env.SCRAPER_PATH || './scraper/main.py';
const MIN_INTERVAL_HOURS = parseInt(process.env.MIN_SCRAPER_INTERVAL_HOURS || '2');

// In-memory storage for active schedules (in production, use Redis or database)
let activeSchedules: Map<string, NodeJS.Timeout> = new Map();

/**
 * Schedule scraper to run again after specified hours
 */
function scheduleNextRun(
  source: 'linkedin' | 'stepstone' | 'all',
  keyword: string,
  hours: number = MIN_INTERVAL_HOURS
): void {
  const scheduleKey = `${source}-${keyword}`;
  
  // Clear any existing schedule for this key
  const existingSchedule = activeSchedules.get(scheduleKey);
  if (existingSchedule) {
    clearTimeout(existingSchedule);
  }

  // Schedule next run
  const timeout = setTimeout(async () => {
    try {
      console.log(`🔄 Running scheduled scraper: ${source} - ${keyword}`);
      await runScraperWorkflow(source, keyword, false); // This is an automatic scheduled run
      // Schedule the next run
      scheduleNextRun(source, keyword, MIN_INTERVAL_HOURS);
    } catch (error) {
      console.error(`❌ Scheduled scraper failed for ${scheduleKey}:`, error);
    }
  }, hours * 60 * 60 * 1000); // Convert hours to milliseconds

  activeSchedules.set(scheduleKey, timeout);
  console.log(`⏰ Scheduled next ${source} scraper in ${hours} hours`);
}

/**
 * Clear all active schedules (call this on server startup)
 */
export function clearAllSchedules(): void {
  console.log('🧹 Clearing all active scraper schedules...');
  for (const [key, timeout] of activeSchedules.entries()) {
    clearTimeout(timeout);
    console.log(`  - Cleared schedule: ${key}`);
  }
  activeSchedules.clear();
}

/**
 * Run Python scraper and capture JSON output
 */
export async function runPythonScraper(
  keyword: string,
  source: 'linkedin' | 'stepstone' | 'all' = 'all'
): Promise<ScraperResult> {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Starting Python scraper: keyword="${keyword}", source="${source}"`);
    
    const pythonProcess = spawn(PYTHON_PATH, [
      SCRAPER_PATH,
      `--keyword=${keyword}`,
      `--source=${source}`,
    ]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      // Log progress messages from Python
      console.log(`  📊 ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Python scraper exited with code ${code}`);
        console.error(`stderr: ${stderrData}`);
        reject(new Error(`Scraper failed with code ${code}: ${stderrData}`));
        return;
      }

      try {
        const result: ScraperResult = JSON.parse(stdoutData);
        
        if (!result.success) {
          reject(new Error(result.error || 'Scraper failed'));
          return;
        }
        
        console.log(`✅ Scraper completed: ${result.total_jobs} jobs found`);
        resolve(result);
      } catch (error) {
        console.error(`❌ Failed to parse scraper output:`, error);
        console.error(`stdout: ${stdoutData}`);
        reject(new Error('Failed to parse scraper JSON output'));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`❌ Failed to start Python scraper:`, error);
      reject(error);
    });
  });
}

/**
 * Check if enough time has passed since last scraper run
 */
export async function canRunScraper(source: string): Promise<{
  canRun: boolean;
  minutesUntilNext: number;
}> {
  const lastRun = await db
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

  if (lastRun.length === 0 || !lastRun[0].completedAt) {
    return { canRun: true, minutesUntilNext: 0 };
  }

  const lastRunTime = new Date(lastRun[0].completedAt);
  const now = new Date();
  const minutesSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60);
  const requiredMinutes = MIN_INTERVAL_HOURS * 60;

  if (minutesSinceLastRun < requiredMinutes) {
    return {
      canRun: false,
      minutesUntilNext: Math.ceil(requiredMinutes - minutesSinceLastRun),
    };
  }

  return { canRun: true, minutesUntilNext: 0 };
}

/**
 * Upsert jobs from scraper result into database
 */
export async function upsertJobs(result: ScraperResult, source: string): Promise<{
  totalJobs: number;
  newJobs: number;
}> {
  console.log(`💾 Upserting ${result.jobs.length} jobs from ${source}...`);
  
  let newJobsCount = 0;
  const totalJobs = result.jobs.length;

  // First, mark all existing jobs from this source as not new
  await db
    .update(jobs)
    .set({ isNewInLastHour: false })
    .where(eq(jobs.source, source));

  // Upsert each job
  for (const scrapedJob of result.jobs) {
    try {
      // Check if job exists by URL
      const existing = await db
        .select()
        .from(jobs)
        .where(eq(jobs.url, scrapedJob.url))
        .limit(1);

      if (existing.length > 0) {
        // Update existing job
        const nowIso = new Date().toISOString();

        await db
          .update(jobs)
          .set({
            lastSeen: nowIso,
            isNewInLastHour: false,
            updatedAt: nowIso,
          })
          .where(eq(jobs.url, scrapedJob.url));
      } else {
        // Insert new job
        const nowIso = new Date().toISOString();

        await db.insert(jobs).values({
          title: scrapedJob.title,
          company: scrapedJob.company,
          location: scrapedJob.location || null,
          url: scrapedJob.url,
          description: scrapedJob.description || null,
          salary: scrapedJob.salary || null,
          jobType: scrapedJob.job_type || null,
          postedAt: scrapedJob.posted_at || null,
          roleSlug: scrapedJob.role_slug || 'other',
          source: scrapedJob.source,
          isNewInLastHour: true,
          firstSeen: nowIso,
          lastSeen: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        newJobsCount++;
      }
    } catch (error) {
      console.error(`Error upserting job: ${scrapedJob.title}`, error);
      continue;
    }
  }

  console.log(`✅ Upserted ${totalJobs} jobs (${newJobsCount} new)`);
  return { totalJobs, newJobs: newJobsCount };
}

/**
 * Run scraper workflow: check timing, scrape, upsert
 * @param isManualTrigger - if true, schedule next run after completion
 */
export async function runScraperWorkflow(
  source: 'linkedin' | 'stepstone' | 'all',
  keyword: string,
  isManualTrigger: boolean = false
): Promise<{ success: boolean; message: string; stats?: any }> {
  // Check if we can run
  const sources = source === 'all' ? ['linkedin', 'stepstone'] : [source];
  
  for (const src of sources) {
    const { canRun, minutesUntilNext } = await canRunScraper(src);
    if (!canRun) {
      return {
        success: false,
        message: `Must wait ${minutesUntilNext} more minutes before running ${src} scraper`,
      };
    }
  }

  // Create scraper run record
  const startedAtIso = new Date().toISOString();
  const [runRecord] = await db
    .insert(scraperRuns)
    .values({
      source: source,
      status: 'running',
      startedAt: startedAtIso,
    })
    .returning();

  try {
    // Run Python scraper
    const result = await runPythonScraper(keyword, source);

    // Upsert jobs to database
    const stats = await upsertJobs(result, source);

    // Update scraper run record
    await db
      .update(scraperRuns)
      .set({
        status: 'completed',
        completedAt: new Date().toISOString(),
        jobsFound: stats.totalJobs,
        newJobs: stats.newJobs,
      })
      .where(eq(scraperRuns.id, runRecord.id));

    // Schedule the next run only if this was a manual trigger (2 hours from now)
    if (isManualTrigger) {
      scheduleNextRun(source, keyword);
      console.log(`⏰ Scheduled next ${source} scraper in ${MIN_INTERVAL_HOURS} hours (manual trigger)`);
    } else {
      console.log(`⏰ Skipping scheduling - this was an automatic run`);
    }

    return {
      success: true,
      message: `Scraper completed successfully`,
      stats,
    };
  } catch (error) {
    // Update scraper run with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await db
      .update(scraperRuns)
      .set({
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: errorMessage,
      })
      .where(eq(scraperRuns.id, runRecord.id));

    return {
      success: false,
      message: `Scraper failed: ${errorMessage}`,
    };
  }
}
