import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface KeywordManagerProps {
  keywords: string[];
  onAddKeyword: (keyword: string) => Promise<void>;
  onRemoveKeyword: (keyword: string) => Promise<void>;
  loading?: boolean;
}

export function KeywordManager({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  loading,
}: KeywordManagerProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [error, setError] = useState('');

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      setError('Keyword cannot be empty');
      return;
    }

    if (keywords.includes(newKeyword.trim())) {
      setError('Keyword already exists');
      return;
    }

    setError('');
    setAddingKeyword(true);

    try {
      await onAddKeyword(newKeyword.trim());
      setNewKeyword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add keyword');
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    try {
      await onRemoveKeyword(keyword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove keyword');
    }
  };

  return (
    <Card>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Search Keywords</h2>
          <p className="text-gray-400 text-sm">
            Manage keywords used for job searches. Scrapers will look for jobs matching these terms.
          </p>
        </div>

        {/* Add Keyword Form */}
        <div className="space-y-3">
          <Input
            label="Add New Keyword"
            placeholder="e.g., embedded systems engineer"
            value={newKeyword}
            onChange={(e) => {
              setNewKeyword(e.target.value);
              setError('');
            }}
            error={error}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddKeyword();
              }
            }}
          />
          <Button
            variant="primary"
            onClick={handleAddKeyword}
            disabled={addingKeyword || !newKeyword.trim()}
            className="w-full"
          >
            {addingKeyword ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Keyword
              </>
            )}
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : keywords.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-sm">No keywords configured</p>
              <p className="text-xs mt-1">Add your first keyword to start tracking jobs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-white font-medium">{keyword}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove keyword"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-cyan-300 font-medium mb-1">Tip</p>
              <p className="text-cyan-200/70">
                Keywords are used across all job sources. Be specific to get better results (e.g., "embedded systems engineer" instead of just "engineer").
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
