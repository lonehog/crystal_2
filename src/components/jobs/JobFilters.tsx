import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface JobFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onTriggerScraper: () => void;
  scraperLoading?: boolean;
  totalJobs: number;
}

export interface FilterState {
  source: 'all' | 'linkedin' | 'stepstone';
  showOnlyNew: boolean;
  roleSlug?: string;
}

export function JobFilters({
  onFilterChange,
  onTriggerScraper,
  scraperLoading,
  totalJobs,
}: JobFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    source: 'all',
    showOnlyNew: false,
  });

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const sources = [
    { value: 'all' as const, label: 'All Sources' },
    { value: 'linkedin' as const, label: 'LinkedIn' },
    { value: 'stepstone' as const, label: 'Stepstone' },
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <p className="text-sm text-gray-400">{totalJobs} jobs found</p>
        </div>
        <Button
          variant="primary"
          onClick={onTriggerScraper}
          disabled={scraperLoading}
        >
          {scraperLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scraping...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Now
            </>
          )}
        </Button>
      </div>

      {/* Source Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Source
        </label>
        <div className="flex flex-wrap gap-2">
          {sources.map((source) => (
            <button
              key={source.value}
              onClick={() => updateFilters({ source: source.value })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.source === source.value
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {source.label}
            </button>
          ))}
        </div>
      </div>

      {/* New Jobs Toggle */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="text-sm font-medium text-gray-300">New Jobs Only</span>
            <p className="text-xs text-gray-500">Show jobs posted in last hour</p>
          </div>
          <button
            onClick={() => updateFilters({ showOnlyNew: !filters.showOnlyNew })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              filters.showOnlyNew ? 'bg-cyan-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                filters.showOnlyNew ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Active Filters */}
      {(filters.source !== 'all' || filters.showOnlyNew) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Active Filters</span>
            <button
              onClick={() => updateFilters({ source: 'all', showOnlyNew: false })}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.source !== 'all' && (
              <Badge variant="primary">{filters.source}</Badge>
            )}
            {filters.showOnlyNew && (
              <Badge variant="success">New Only</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
