'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
    >
      {pending ? 'Refreshing…' : 'Refresh'}
    </button>
  );
}
