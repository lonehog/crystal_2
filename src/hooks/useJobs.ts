import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../services/api';
import type { Job, JobStats } from '../types';

/**
 * Hook for fetching all jobs with optional filters
 */
export function useJobs(source?: string, showOnlyNew?: boolean) {
  return useQuery<Job[]>({
    queryKey: ['jobs', source, showOnlyNew],
    queryFn: async () => {
      if (source && source !== 'all') {
        const jobs = await jobsApi.getBySource(source);
        if (showOnlyNew) {
          return jobs.filter((job) => job.isNewInLastHour);
        }
        return jobs;
      }
      
      const jobs = await jobsApi.getAll();
      if (showOnlyNew) {
        return jobs.filter((job) => job.isNewInLastHour);
      }
      return jobs;
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Hook for fetching job statistics
 */
export function useJobStats() {
  return useQuery<JobStats>({
    queryKey: ['job-stats'],
    queryFn: jobsApi.getStats,
    refetchInterval: 60000, // Refetch every 60 seconds
  });
}

/**
 * Hook for triggering scraper
 */
export function useTriggerScraper() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { source: string; keyword: string }) => {
      return jobsApi.triggerScraper(params.source, params.keyword);
    },
    onSuccess: () => {
      // Invalidate and refetch jobs after successful scrape
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
      queryClient.invalidateQueries({ queryKey: ['scraper-status'] });
    },
  });
}

/**
 * Hook for fetching scraper status
 */
export function useScraperStatus() {
  return useQuery({
    queryKey: ['scraper-status'],
    queryFn: jobsApi.getScraperStatus,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook for searching jobs by keyword
 */
export function useJobSearch(keyword: string, enabled = true) {
  return useQuery<Job[]>({
    queryKey: ['jobs', 'search', keyword],
    queryFn: () => jobsApi.search(keyword),
    enabled: enabled && keyword.length > 0,
    staleTime: 30000,
  });
}
