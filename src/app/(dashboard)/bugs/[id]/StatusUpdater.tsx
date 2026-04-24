'use client';

import { useState, useTransition } from 'react';
import type { BugStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_CLASSES } from '@/lib/statusConfig';

const ALL_STATUSES: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

interface StatusUpdaterProps {
  bugId: string;
  initialStatus: BugStatus;
}

export default function StatusUpdater({ bugId, initialStatus }: StatusUpdaterProps) {
  const [status, setStatus] = useState<BugStatus>(initialStatus);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(next: BugStatus) {
    if (next === status) return;
    setError('');

    startTransition(async () => {
      try {
        const res = await fetch(`/api/bugs/${bugId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-fixit-csrf': '1' },
          body: JSON.stringify({ status: next }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Failed to update status');
          return;
        }

        setStatus(next);
      } catch {
        setError('Network error. Try again.');
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleChange(s)}
            disabled={isPending}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              status === s
                ? STATUS_CLASSES[s] + ' ring-2 ring-offset-2 ring-offset-gray-900'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 ring-1 ring-gray-700'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
