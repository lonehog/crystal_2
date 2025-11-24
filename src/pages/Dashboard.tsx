import { useState, useEffect } from 'react';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { JobFilters, type FilterState } from '../components/jobs/JobFilters';
import { useJobStats, useTriggerScraper } from '../hooks/useJobs';
import { useKeywords } from '../hooks/useKeywords';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    source: 'all',
    showOnlyNew: false,
  });

  const { data: keywords } = useKeywords();
  const { data: stats, isLoading: statsLoading } = useJobStats();
  const triggerScraper = useTriggerScraper();

  // Generate mock data for jobs over 7 days
  const [jobsOverTimeData, setJobsOverTimeData] = useState<any[]>([]);
  const [uptimeData, setUptimeData] = useState<any[]>([]);
  const [hourlyScrapedData, setHourlyScrapedData] = useState<any[]>([]);

  useEffect(() => {
    // Jobs over 7 days data
    const days = ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'];
    const jobsData = days.map((day, index) => ({
      day,
      jobs: Math.floor(Math.random() * 50) + 10 + (index * 5),
      linkedin: Math.floor(Math.random() * 30) + 5,
      stepstone: Math.floor(Math.random() * 25) + 5,
    }));
    setJobsOverTimeData(jobsData);

    // Uptime over 24 hours (hourly)
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date().getHours() - 23 + i + 24) % 24;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
    const uptimeDataGenerated = hours.map((hour) => ({
      hour,
      uptime: Math.random() > 0.05 ? 100 : Math.floor(Math.random() * 30) + 70, // Mostly 100%, occasionally dips
    }));
    setUptimeData(uptimeDataGenerated);

    // Hourly scraped jobs over 24 hours
    const scrapedData = hours.map((hour) => ({
      hour,
      scraped: Math.floor(Math.random() * 15) + 1,
    }));
    setHourlyScrapedData(scrapedData);
  }, []);

  const handleTriggerScraper = async () => {
    const keyword = keywords?.general && keywords.general.length > 0 
      ? keywords.general[0] 
      : 'embedded systems engineer';
    
    try {
      await triggerScraper.mutateAsync({
        source: 'all',
        keyword,
      });
    } catch (err) {
      console.error('Failed to trigger scraper:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <Container>
        <div className="py-8 space-y-8">
          {/* Stats Cards */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Jobs */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Total Jobs</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.totalJobs}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              {/* New Jobs */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">New in Last Hour</p>
                      <p className="text-3xl font-bold text-green-400 mt-1">{stats.newJobsLastHour}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              {/* LinkedIn Jobs */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">LinkedIn</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.jobsBySource.linkedin || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Stepstone Jobs */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Stepstone</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.jobsBySource.stepstone || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <JobFilters
            onFilterChange={setFilters}
            onTriggerScraper={handleTriggerScraper}
            scraperLoading={triggerScraper.isPending}
            totalJobs={stats?.totalJobs || 0}
          />

          {/* Charts Section */}
          <div className="space-y-6">
            {/* Chart 1: Jobs Found Over 7 Days */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Jobs Found Over Last 7 Days</h2>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                      <span className="text-gray-400">Total Jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-gray-400">LinkedIn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-gray-400">Stepstone</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={jobsOverTimeData}>
                    <defs>
                      <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0075FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0075FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStepstone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="jobs" stroke="#0075FF" fillOpacity={1} fill="url(#colorJobs)" strokeWidth={2} />
                    <Area type="monotone" dataKey="linkedin" stroke="#9333ea" fillOpacity={1} fill="url(#colorLinkedin)" strokeWidth={2} />
                    <Area type="monotone" dataKey="stepstone" stroke="#f97316" fillOpacity={1} fill="url(#colorStepstone)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Application Uptime Over 24 Hours */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Application Uptime (Last 24 Hours)</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-400">Uptime %</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={uptimeData}>
                    <defs>
                      <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      itemStyle={{ color: '#F3F4F6' }}
                      formatter={(value: any) => [`${value}%`, 'Uptime']}
                    />
                    <Area type="monotone" dataKey="uptime" stroke="#10b981" fillOpacity={1} fill="url(#colorUptime)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 3: Jobs Scraped Per Hour (Last 24 Hours) */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Jobs Scraped Per Hour (Last 24 Hours)</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-400">Jobs Scraped</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={hourlyScrapedData}>
                    <defs>
                      <linearGradient id="colorScraped" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="scraped" stroke="#eab308" fillOpacity={1} fill="url(#colorScraped)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
