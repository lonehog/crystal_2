import { Router, Request, Response } from 'express';
import { db } from '../config/database.js';
import { settings } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/settings/keywords
 * Get job search keywords (supports source-specific keywords)
 */
router.get('/keywords', async (req: Request, res: Response) => {
  try {
    const { source } = req.query;

    // If source is specified, get source-specific keywords
    if (source && typeof source === 'string') {
      const key = `keywords_${source}`;
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (result.length > 0) {
        const keywords = result[0].value.split(',').map((k) => k.trim());
        return res.json({
          success: true,
          source,
          keywords,
        });
      }
    }

    // Get general keywords or all source-specific keywords
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'keywords'))
      .limit(1);

    // Also get source-specific keywords
    const linkedinResult = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'keywords_linkedin'))
      .limit(1);

    const stepstoneResult = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'keywords_stepstone'))
      .limit(1);

    const defaultKeywords = ['embedded systems engineer', 'embedded hardware', 'firmware engineer'];
    
    const keywords = result.length > 0 
      ? result[0].value.split(',').map((k) => k.trim())
      : defaultKeywords;

    const linkedinKeywords = linkedinResult.length > 0
      ? linkedinResult[0].value.split(',').map((k) => k.trim())
      : keywords;

    const stepstoneKeywords = stepstoneResult.length > 0
      ? stepstoneResult[0].value.split(',').map((k) => k.trim())
      : keywords;

    res.json({
      success: true,
      keywords,
      linkedin: linkedinKeywords,
      stepstone: stepstoneKeywords,
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch keywords',
    });
  }
});

/**
 * PUT /api/settings/keywords
 * Update job search keywords (supports source-specific keywords)
 */
router.put('/keywords', async (req: Request, res: Response) => {
  try {
    const { keywords, linkedin, stepstone, source } = req.body;

    // Validate and update source-specific keywords if provided
    if (source && typeof source === 'string') {
      if (!keywords || !Array.isArray(keywords)) {
        return res.status(400).json({
          success: false,
          error: 'Keywords must be an array',
        });
      }

      const validKeywords = keywords.filter((k) => typeof k === 'string' && k.trim().length > 0);
      if (validKeywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid keywords provided',
        });
      }

      const key = `keywords_${source}`;
      const keywordsString = validKeywords.join(',');

      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({
            value: keywordsString,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({
          key,
          value: keywordsString,
        });
      }

      return res.json({
        success: true,
        source,
        keywords: validKeywords,
        message: `${source} keywords updated successfully`,
      });
    }

    // Update all keywords
    const updates: { key: string; keywords: string[] }[] = [];

    if (keywords && Array.isArray(keywords)) {
      const validKeywords = keywords.filter((k) => typeof k === 'string' && k.trim().length > 0);
      if (validKeywords.length > 0) {
        updates.push({ key: 'keywords', keywords: validKeywords });
      }
    }

    if (linkedin && Array.isArray(linkedin)) {
      const validKeywords = linkedin.filter((k) => typeof k === 'string' && k.trim().length > 0);
      if (validKeywords.length > 0) {
        updates.push({ key: 'keywords_linkedin', keywords: validKeywords });
      }
    }

    if (stepstone && Array.isArray(stepstone)) {
      const validKeywords = stepstone.filter((k) => typeof k === 'string' && k.trim().length > 0);
      if (validKeywords.length > 0) {
        updates.push({ key: 'keywords_stepstone', keywords: validKeywords });
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid keywords provided',
      });
    }

    // Perform updates
    for (const { key, keywords: kws } of updates) {
      const keywordsString = kws.join(',');
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(settings)
          .set({
            value: keywordsString,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({
          key,
          value: keywordsString,
        });
      }
    }

    res.json({
      success: true,
      message: 'Keywords updated successfully',
      updated: updates.map(u => u.key),
    });
  } catch (error) {
    console.error('Error updating keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update keywords',
    });
  }
});

/**
 * GET /api/settings
 * Get all settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(settings);

    const settingsObj: Record<string, string> = {};
    result.forEach((setting: any) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      settings: settingsObj,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    });
  }
});

export default router;
