import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { BugReportWithApp, BugStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_CLASSES } from '@/lib/statusConfig';
import { relativeTime } from '@/lib/relativeTime';
import QuickStatusSelect from '@/components/QuickStatusSelect';
import ExternalLink from '@/components/ExternalLink';
import BugsRealtimeRefresher from '@/components/BugsRealtimeRefresher';
import RefreshButton from '@/components/RefreshButton';

export const dynamic = 'force-dynamic';

const STATUS_ORDER: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

const STATUS_DOT: Record<BugStatus, string> = {
  open: 'bg-yellow-400',
  in_progress: 'bg-blue-400',
  resolved: 'bg-green-400',
  closed: 'bg-gray-500',
};

const STATUS_BORDER: Record<BugStatus, string> = {
  open: 'border-l-yellow-500/50',
  in_progress: 'border-l-blue-500/50',
  resolved: 'border-l-green-500/50',
  closed: 'border-l-gray-600/50',
};

export default async function BugsPage() {
  const { data, error } = await getSupabase()
    .from('bug_reports')
    .select('*, apps(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-400">
        Failed to load bug reports: {error.message}
      </div>
    );
  }

  const bugs = (data ?? []) as BugReportWithApp[];

  const grouped = STATUS_ORDER.reduce<Record<BugStatus, BugReportWithApp[]>>(
    (acc, s) => { acc[s] = []; return acc; },
    {} as Record<BugStatus, BugReportWithApp[]>,
  );
  for (const bug of bugs) {
    grouped[bug.status as BugStatus]?.push(bug);
  }

  const activeSections = STATUS_ORDER.filter((s) => grouped[s].length > 0);

  return (
    <div>
      <BugsRealtimeRefresher />
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Bug Reports</h1>
          <RefreshButton />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {bugs.length} {bugs.length === 1 ? 'report' : 'reports'} total
        </p>
      </div>

      {bugs.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">No bug reports yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {activeSections.map((status) => (
            <section key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                <h2 className="text-sm font-semibold text-gray-300">{STATUS_LABELS[status]}</h2>
                <span className="text-xs text-gray-600 font-mono">{grouped[status].length}</span>
              </div>

              <div className="space-y-2">
                {grouped[status].map((bug) => (
                  <div
                    key={bug.id}
                    className={`relative rounded-lg border border-gray-800 border-l-2 bg-gray-900 hover:bg-gray-800/60 transition-colors ${STATUS_BORDER[status]}`}
                  >
                    {/* Full-area link for navigation */}
                    <Link href={`/bugs/${bug.id}`} className="block px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">
                              {bug.apps?.name ?? <span className="italic">Unknown</span>}
                            </span>
                          </div>
                          <p className="text-sm text-gray-200 leading-snug">
                            {bug.description.length > 120
                              ? bug.description.slice(0, 120) + '…'
                              : bug.description}
                          </p>
                          {bug.url && (
                            <p className="text-xs text-gray-600 truncate max-w-sm">{bug.url}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap shrink-0 pt-0.5">
                          {relativeTime(bug.created_at)}
                        </span>
                      </div>
                    </Link>

                    {/* Status buttons — outside the Link so they don't trigger navigation */}
                    <div className="px-4 pb-3">
                      <QuickStatusSelect bugId={bug.id} initialStatus={bug.status as BugStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
