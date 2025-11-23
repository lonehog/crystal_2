import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/api';

interface KeywordsData {
  general: string[];
  linkedin: string[];
  stepstone: string[];
}

/**
 * Hook for fetching keywords
 */
export function useKeywords() {
  return useQuery<KeywordsData>({
    queryKey: ['keywords'],
    queryFn: settingsApi.getKeywords,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook for updating source-specific keywords
 */
export function useUpdateSourceKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { linkedin: string[]; stepstone: string[] }) => {
      return settingsApi.updateSourceKeywords(data.linkedin, data.stepstone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

/**
 * Hook for adding a keyword (kept for backward compatibility)
 */
export function useAddKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyword: string) => {
      const currentData = queryClient.getQueryData<KeywordsData>(['keywords']);
      if (!currentData) return;
      const updatedKeywords = [...currentData.general, keyword];
      return settingsApi.updateKeywords(updatedKeywords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

/**
 * Hook for removing a keyword (kept for backward compatibility)
 */
export function useRemoveKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyword: string) => {
      const currentData = queryClient.getQueryData<KeywordsData>(['keywords']);
      if (!currentData) return;
      const updatedKeywords = currentData.general.filter((k) => k !== keyword);
      return settingsApi.updateKeywords(updatedKeywords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

/**
 * Hook for updating all keywords at once
 */
export function useUpdateKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keywords: string[]) => {
      return settingsApi.updateKeywords(keywords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}
