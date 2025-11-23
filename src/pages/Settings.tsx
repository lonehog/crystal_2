import { useState, useEffect } from 'react';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useKeywords, useUpdateSourceKeywords } from '../hooks/useKeywords';
import { useScraperStatus } from '../hooks/useJobs';

export function Settings() {
  const { data: keywordsData, isLoading: keywordsLoading } = useKeywords();
  const { data: scraperStatus } = useScraperStatus();
  const updateKeywords = useUpdateSourceKeywords();

  const [linkedinKeywords, setLinkedinKeywords] = useState<string[]>([]);
  const [stepstoneKeywords, setStepstoneKeywords] = useState<string[]>([]);
  const [linkedinInput, setLinkedinInput] = useState('');
  const [stepstoneInput, setStepstoneInput] = useState('');

  // Initialize keywords when data loads
  useEffect(() => {
    if (keywordsData) {
      setLinkedinKeywords(keywordsData.linkedin);
      setStepstoneKeywords(keywordsData.stepstone);
    }
  }, [keywordsData]);

  const handleAddLinkedinKeyword = () => {
    if (linkedinInput.trim() && !linkedinKeywords.includes(linkedinInput.trim())) {
      setLinkedinKeywords([...linkedinKeywords, linkedinInput.trim()]);
      setLinkedinInput('');
    }
  };

  const handleRemoveLinkedinKeyword = (keyword: string) => {
    setLinkedinKeywords(linkedinKeywords.filter(k => k !== keyword));
  };

  const handleAddStepstoneKeyword = () => {
    if (stepstoneInput.trim() && !stepstoneKeywords.includes(stepstoneInput.trim())) {
      setStepstoneKeywords([...stepstoneKeywords, stepstoneInput.trim()]);
      setStepstoneInput('');
    }
  };

  const handleRemoveStepstoneKeyword = (keyword: string) => {
    setStepstoneKeywords(stepstoneKeywords.filter(k => k !== keyword));
  };

  const handleSaveKeywords = async () => {
    await updateKeywords.mutateAsync({
      linkedin: linkedinKeywords,
      stepstone: stepstoneKeywords,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Container>
        <div className="py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">
              Configure job search keywords separately for each source
            </p>
          </div>

          {/* Keywords Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LinkedIn Keywords */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">LinkedIn Keywords</h2>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={linkedinInput}
                    onChange={(e) => setLinkedinInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLinkedinKeyword()}
                    placeholder="e.g., embedded systems engineer"
                    className="flex-1"
                  />
                  <Button onClick={handleAddLinkedinKeyword}>Add</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {linkedinKeywords.length > 0 ? (
                    linkedinKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="primary"
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveLinkedinKeyword(keyword)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm py-4">No keywords added yet</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Stepstone Keywords */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Stepstone Keywords</h2>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={stepstoneInput}
                    onChange={(e) => setStepstoneInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStepstoneKeyword()}
                    placeholder="e.g., firmware developer"
                    className="flex-1"
                  />
                  <Button onClick={handleAddStepstoneKeyword}>Add</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {stepstoneKeywords.length > 0 ? (
                    stepstoneKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="warning"
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveStepstoneKeyword(keyword)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm py-4">No keywords added yet</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSaveKeywords}
              className="px-8 py-3"
              disabled={updateKeywords.isPending}
            >
              {updateKeywords.isPending ? 'Saving...' : 'Save All Keywords'}
            </Button>
          </div>

          {/* Scraper Status */}
          {scraperStatus && (
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">Scraper Status</h2>
                
                <div className="space-y-3">
                  {scraperStatus.recentRuns && scraperStatus.recentRuns.length > 0 ? (
                    scraperStatus.recentRuns.slice(0, 5).map((run: any) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            run.status === 'completed' ? 'bg-green-400' :
                            run.status === 'running' ? 'bg-blue-400 animate-pulse' :
                            'bg-red-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium capitalize">{run.source}</p>
                            <p className="text-sm text-gray-400">
                              {run.status === 'completed' && `${run.jobsFound} jobs found, ${run.newJobs} new`}
                              {run.status === 'running' && 'Scraping in progress...'}
                              {run.status === 'failed' && run.error}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(run.startedAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p>No scraper runs yet</p>
                      <p className="text-xs mt-1">Trigger a scrape from the Dashboard to see status here</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scraper Info */}
            <Card>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">About Scrapers</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Crystal uses Python scrapers to collect job postings from LinkedIn and Stepstone.
                  Scrapers enforce a 1-hour cooldown between runs to avoid rate limiting.
                  New jobs are identified by comparing hourly runs.
                </p>
              </div>
            </Card>

            {/* Keywords Info */}
            <Card>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Keyword Tips</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Use specific job titles for better results. Examples: "embedded systems engineer",
                  "firmware developer", "hardware engineer". Avoid generic terms like "engineer"
                  or "developer" alone.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
