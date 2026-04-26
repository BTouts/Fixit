'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { BugStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_CLASSES } from '@/lib/statusConfig';

const ALL_STATUSES: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

interface QuickStatusSelectProps {
  bugId: string;
  initialStatus: BugStatus;
}

export default function QuickStatusSelect({ bugId, initialStatus }: QuickStatusSelectProps) {
  const [status, setStatus] = useState<BugStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.MouseEvent, next: BugStatus) {
    e.preventDefault();
    e.stopPropagation();
    if (next === status || isPending) return;

    startTransition(async () => {
      await fetch(`/api/bugs/${bugId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-fixit-csrf': '1' },
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_STATUSES.map((s) => (
        <button
          key={s}
          onClick={(e) => handleChange(e, s)}
          disabled={isPending}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-all disabled:opacity-50 ${
            status === s
              ? STATUS_CLASSES[s]
              : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
          }`}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
