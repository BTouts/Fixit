'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

export default function BugsRealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const channel = supabaseClient
      .channel('bug_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, () => {
        router.refresh();
      })
      .subscribe();

    const onVisible = () => { if (document.visibilityState === 'visible') router.refresh(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabaseClient.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  return null;
}
