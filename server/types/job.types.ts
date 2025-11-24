/**
 * Type Definitions for Jobs
 */

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  url: string;
  description: string | null;
  salary: string | null;
  jobType: string | null;
  postedAt: string | null;
  roleSlug: string | null;
  source: string;
  isNewInLastHour: boolean;
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScraperRun {
  id: number;
  source: string;
  status: 'running' | 'completed' | 'failed';
  jobsFound: number;
  newJobs: number;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types
export interface TriggerScraperRequest {
  source: 'linkedin' | 'stepstone' | 'all';
  keyword?: string;
}

export interface ScraperResult {
  success: boolean;
  keyword: string;
  timestamp: string;
  total_jobs: number;
  jobs: ScrapedJob[];
  error?: string;
}

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salary: string;
  job_type: string;
  posted_at: string;
  role_slug: string;
  source: string;
}

export interface JobStats {
  totalJobs: number;
  newJobsLastHour: number;
  jobsBySource: Record<string, number>;
  lastUpdated: string;
}

export interface ScraperStatus {
  source: string;
  lastRun: ScraperRun | null;
  canRun: boolean;
  minutesUntilNextRun: number;
}
