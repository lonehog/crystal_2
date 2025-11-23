/**
 * Frontend Type Definitions
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

export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}
