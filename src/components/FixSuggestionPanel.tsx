'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import type { FixSuggestion } from '@/lib/types';
import DiffViewer from '@/components/DiffViewer';

interface FixSuggestionPanelProps {
  bugReportId: string;
  initial: FixSuggestion | null;
}

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 120_000;

export default function FixSuggestionPanel({ bugReportId, initial }: FixSuggestionPanelProps) {
  const [suggestion, setSuggestion] = useState<FixSuggestion | null>(initial);
  const [error, setError] = useState('');
  const [isGenerating, startTransition] = useTransition();

  const fetchSuggestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/suggest?bugId=${bugReportId}`);
      if (!res.ok) return null;
      return (await res.json()) as FixSuggestion | null;
    } catch {
      return null;
    }
  }, [bugReportId]);

  // Poll while pending
  useEffect(() => {
    if (suggestion?.status !== 'pending') return;

    const start = Date.now();
    const interval = setInterval(async () => {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        clearInterval(interval);
        setSuggestion((prev) =>
          prev ? { ...prev, status: 'failed', error: 'Timed out waiting for suggestion' } : prev,
        );
        return;
      }

      const updated = await fetchSuggestion();
      if (updated && updated.status !== 'pending') {
        setSuggestion(updated);
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [suggestion?.status, fetchSuggestion]);

  function triggerGenerate() {
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-fixit-csrf': '1' },
          body: JSON.stringify({ bug_report_id: bugReportId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? 'Failed to start generation');
          return;
        }

        const { id } = (await res.json()) as { id: string };
        setSuggestion({ id, bug_report_id: bugReportId, status: 'pending', diff: null, files_used: [], model: null, error: null, created_at: new Date().toISOString() });
      } catch {
        setError('Network error. Try again.');
      }
    });
  }

  function triggerRetry() {
    setSuggestion(null);
    triggerGenerate();
  }

  if (!suggestion) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fix Suggestion</p>
        <p className="text-sm text-gray-500">No fix suggestion yet.</p>
        <button
          onClick={triggerGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Fix Suggestion
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (suggestion.status === 'pending') {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fix Suggestion</p>
        <div className="flex items-center gap-2.5 text-sm text-gray-400">
          <svg className="w-4 h-4 animate-spin text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating fix suggestion…
        </div>
      </div>
    );
  }

  if (suggestion.status === 'failed') {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fix Suggestion</p>
        <p className="text-sm text-red-400">Generation failed: {suggestion.error ?? 'Unknown error'}</p>
        <button
          onClick={triggerRetry}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Retry
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  // status === 'ready'
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fix Suggestion</p>
        {suggestion.model && (
          <span className="text-xs text-gray-600 font-mono">{suggestion.model}</span>
        )}
      </div>

      {suggestion.files_used.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Files used</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestion.files_used.map((f) => (
              <span key={f} className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 font-mono">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestion.diff ? (
        <DiffViewer diff={suggestion.diff} />
      ) : (
        <p className="text-sm text-gray-500 italic">No diff generated.</p>
      )}
    </div>
  );
}
