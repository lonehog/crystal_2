import { Router, Request, Response } from 'express';
import * as jobsService from '../services/jobs.service.js';
import * as scraperService from '../services/scraper.service.js';
import { settings } from '../db/schema.js';
import { db } from '../config/database.js';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/jobs
 * Get all jobs with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { source, roleSlug, isNew, limit } = req.query;

    const jobs = await jobsService.getAllJobs({
      source: source as string | undefined,
      roleSlug: roleSlug as string | undefined,
      isNew: isNew === 'true',
      limit: limit ? parseInt(limit as string) : 1000,
    });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
    });
  }
});

/**
 * GET /api/jobs/stats
 * Get job statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await jobsService.getJobStats();
    const scraperStatus = await jobsService.getScraperStatus();

    res.json({
      success: true,
      stats,
      scraperStatus,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/jobs/source/:source
 * Get jobs from specific source (new in last hour)
 */
router.get('/source/:source', async (req: Request, res: Response) => {
  try {
    const { source } = req.params;

    if (!['linkedin', 'stepstone'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source. Must be linkedin or stepstone',
      });
    }

    const jobs = await jobsService.getJobsBySource(source);

    res.json({
      success: true,
      source,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs by source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
    });
  }
});

/**
 * GET /api/jobs/:id
 * Get job by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
      });
    }

    const job = await jobsService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
    });
  }
});

/**
 * GET /api/jobs/search/:keyword
 * Search jobs by keyword
 */
router.get('/search/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const { limit } = req.query;

    const jobs = await jobsService.searchJobs(
      keyword,
      limit ? parseInt(limit as string) : 100
    );

    res.json({
      success: true,
      keyword,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search jobs',
    });
  }
});

/**
 * POST /api/jobs/scrape
 * Trigger job scraper
 */
router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { source, keyword } = req.body;

    if (!source || !['linkedin', 'stepstone', 'all'].includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source. Must be linkedin, stepstone, or all',
      });
    }

    // Get keyword from settings if not provided
    let searchKeyword = keyword;
    if (!searchKeyword) {
      const keywordsSetting = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'keywords'))
        .limit(1);

      if (keywordsSetting.length > 0) {
        // Use first keyword from settings
        const keywords = keywordsSetting[0].value.split(',');
        searchKeyword = keywords[0].trim();
      } else {
        searchKeyword = 'embedded systems engineer'; // Default
      }
    }

    // Check if scraper can run
    const sources = source === 'all' ? ['linkedin', 'stepstone'] : [source];
    for (const src of sources) {
      const { canRun, minutesUntilNext } = await scraperService.canRunScraper(src);
      if (!canRun) {
        return res.status(429).json({
          success: false,
          error: `Must wait ${minutesUntilNext} more minutes before running ${src} scraper`,
          minutesUntilNext,
        });
      }
    }

    // Run scraper in background
    scraperService.runScraperWorkflow(source, searchKeyword).catch((error) => {
      console.error('Scraper workflow error:', error);
    });

    res.json({
      success: true,
      message: 'Scraper started',
      source,
      keyword: searchKeyword,
    });
  } catch (error) {
    console.error('Error triggering scraper:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scraper',
    });
  }
});

/**
 * GET /api/jobs/scraper/status
 * Get scraper status
 */
router.get('/scraper/status', async (req: Request, res: Response) => {
  try {
    const status = await jobsService.getScraperStatus();
    const recentRuns = await jobsService.getRecentScraperRuns(undefined, 10);

    res.json({
      success: true,
      status,
      recentRuns,
    });
  } catch (error) {
    console.error('Error fetching scraper status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraper status',
    });
  }
});

/**
 * GET /api/jobs/scraper/runs/:source?
 * Get recent scraper runs
 */
router.get('/scraper/runs/:source?', async (req: Request, res: Response) => {
  try {
    const { source } = req.params;
    const { limit } = req.query;

    const runs = await jobsService.getRecentScraperRuns(
      source,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      count: runs.length,
      runs,
    });
  } catch (error) {
    console.error('Error fetching scraper runs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraper runs',
    });
  }
});

export default router;
