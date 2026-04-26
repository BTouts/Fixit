'use client';

import { useState, useTransition } from 'react';

interface AutoSuggestToggleProps {
  appId: string;
  initial: boolean;
}

export default function AutoSuggestToggle({ appId, initial }: AutoSuggestToggleProps) {
  const [enabled, setEnabled] = useState(initial);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setError('');

    startTransition(async () => {
      try {
        const res = await fetch(`/api/apps/${appId}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-fixit-csrf': '1' },
          body: JSON.stringify({ auto_suggest: next }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? 'Failed to update');
          return;
        }

        setEnabled(next);
      } catch {
        setError('Network error. Try again.');
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={isPending}
        role="switch"
        aria-checked={enabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? 'bg-red-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-gray-300">{enabled ? 'On' : 'Off'}</span>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
