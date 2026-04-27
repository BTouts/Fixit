'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BugsRealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource('/api/bugs/stream');
    es.onmessage = () => router.refresh();

    const onVisible = () => { if (document.visibilityState === 'visible') router.refresh(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      es.close();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  return null;
}
