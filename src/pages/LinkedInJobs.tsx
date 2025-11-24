import { Container } from '../components/layout/Container';
import { JobCard } from '../components/jobs/JobCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useJobs } from '../hooks/useJobs';
import type { Job } from '../types';

export function LinkedInJobs() {
  const { data: jobs = [], isLoading, error } = useJobs('linkedin');

  // Group jobs by hour
  const groupJobsByHour = (jobs: Job[]) => {
    const grouped: Record<string, Job[]> = {};
    const now = new Date();

    jobs.forEach((job) => {
      const jobDate = new Date(job.createdAt);
      const hoursDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60));
      
      let timeLabel: string;
      if (hoursDiff < 1) {
        timeLabel = 'Less than 1 hour ago';
      } else if (hoursDiff === 1) {
        timeLabel = '1 hour ago';
      } else if (hoursDiff < 24) {
        timeLabel = `${hoursDiff} hours ago`;
      } else {
        const daysDiff = Math.floor(hoursDiff / 24);
        timeLabel = daysDiff === 1 ? '1 day ago' : `${daysDiff} days ago`;
      }

      if (!grouped[timeLabel]) {
        grouped[timeLabel] = [];
      }
      grouped[timeLabel].push(job);
    });

    return grouped;
  };

  const groupedJobs = groupJobsByHour(jobs);
  const timeLabels = Object.keys(groupedJobs).sort((a, b) => {
    // Sort by time (most recent first)
    const getHours = (label: string) => {
      if (label.includes('Less than')) return 0;
      if (label.includes('day')) {
        const days = parseInt(label);
        return days * 24;
      }
      return parseInt(label);
    };
    return getHours(a) - getHours(b);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Container>
          <div className="py-16 flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="text-gray-400 mt-4">Loading LinkedIn jobs...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Container>
          <div className="py-16">
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Failed to load jobs</h3>
              <p className="text-gray-400">{String(error)}</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Container>
        <div className="py-8 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white">LinkedIn Jobs</h1>
            </div>
            <p className="text-gray-400 text-lg">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} found from LinkedIn
            </p>
          </div>

          {/* Jobs grouped by time */}
          {jobs.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No LinkedIn jobs yet</h3>
              <p className="text-gray-400">
                Trigger the scraper from the dashboard to start finding jobs
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {timeLabels.map((timeLabel) => (
                <div key={timeLabel} className="space-y-4">
                  {/* Time Divider */}
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent flex-1" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-purple-400 font-medium text-sm">{timeLabel}</span>
                      <span className="text-purple-400/60 text-sm">({groupedJobs[timeLabel].length})</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-purple-500/30 via-transparent to-transparent flex-1" />
                  </div>

                  {/* Jobs in this time period */}
                  <div className="grid gap-4">
                    {groupedJobs[timeLabel].map((job) => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
