import axios from 'axios';
import type { Job, JobStats, ScraperStatus, ScraperRun } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Jobs API
 */
export const jobsApi = {
  // Get all jobs
  getAll: async (params?: {
    source?: string;
    roleSlug?: string;
    isNew?: boolean;
    limit?: number;
  }) => {
    const response = await api.get<{ success: boolean; jobs: Job[]; count: number }>('/jobs', { params });
    return response.data.jobs;
  },

  // Get jobs by source
  getBySource: async (source: string) => {
    const response = await api.get<{ success: boolean; jobs: Job[]; count: number }>(`/jobs/source/${source}`);
    return response.data.jobs;
  },

  // Get job by ID
  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; job: Job }>(`/jobs/${id}`);
    return response.data.job;
  },

  // Search jobs
  search: async (keyword: string, limit = 100) => {
    const response = await api.get<{ success: boolean; jobs: Job[]; count: number }>(`/jobs/search/${keyword}`, {
      params: { limit },
    });
    return response.data.jobs;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get<{
      success: boolean;
      stats: JobStats;
      scraperStatus: Record<string, ScraperStatus>;
    }>('/jobs/stats');
    return response.data.stats;
  },

  // Trigger scraper
  triggerScraper: async (source: 'linkedin' | 'stepstone' | 'all', keyword?: string) => {
    const response = await api.post<{ success: boolean; message: string }>('/jobs/scrape', {
      source,
      keyword,
    });
    return response.data;
  },

  // Get scraper status
  getScraperStatus: async () => {
    const response = await api.get<{
      success: boolean;
      status: Record<string, ScraperStatus>;
      recentRuns: ScraperRun[];
    }>('/jobs/scraper/status');
    return response.data;
  },

  // Get scraper runs
  getScraperRuns: async (source?: string, limit = 10) => {
    const response = await api.get<{ success: boolean; runs: ScraperRun[]; count: number }>(
      `/jobs/scraper/runs/${source || ''}`,
      { params: { limit } }
    );
    return response.data;
  },
};

/**
 * Settings API
 */
export const settingsApi = {
  // Get keywords
  getKeywords: async () => {
    const response = await api.get<{ 
      success: boolean; 
      keywords: string[];
      linkedin?: string[];
      stepstone?: string[];
    }>('/settings/keywords');
    return {
      general: response.data.keywords,
      linkedin: response.data.linkedin || response.data.keywords,
      stepstone: response.data.stepstone || response.data.keywords,
    };
  },

  // Update keywords (supports source-specific updates)
  updateKeywords: async (keywords: string[], source?: string) => {
    const body: any = source ? { source, keywords } : { keywords, linkedin: keywords, stepstone: keywords };
    const response = await api.put<{ success: boolean; keywords?: string[]; message: string }>(
      '/settings/keywords',
      body
    );
    return response.data.keywords || keywords;
  },

  // Update source-specific keywords
  updateSourceKeywords: async (linkedin: string[], stepstone: string[]) => {
    const response = await api.put<{ success: boolean; message: string }>(
      '/settings/keywords',
      { linkedin, stepstone }
    );
    return response.data;
  },

  // Get all settings
  getAll: async () => {
    const response = await api.get<{ success: boolean; settings: Record<string, string> }>('/settings');
    return response.data.settings;
  },
};

export default api;
