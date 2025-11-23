import { JobCard } from './JobCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Job } from '../../types';

interface JobListProps {
  jobs: Job[];
  loading?: boolean;
  error?: string;
}

export function JobList({ jobs, loading, error }: JobListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Jobs</h3>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">No Jobs Found</h3>
            <p className="text-gray-400">Try adjusting your filters or trigger a new scrape</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          title={job.title}
          company={job.company}
          location={job.location || undefined}
          url={job.url}
          source={job.source}
          roleSlug={job.roleSlug || undefined}
          postedAt={job.postedAt || undefined}
          isNew={job.isNewInLastHour}
          salary={job.salary || undefined}
          jobType={job.jobType || undefined}
        />
      ))}
    </div>
  );
}
