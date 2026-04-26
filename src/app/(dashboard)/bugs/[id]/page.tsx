import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { BugReportWithApp, BugStatus, FixSuggestion } from '@/lib/types';
import { STATUS_LABELS, STATUS_CLASSES } from '@/lib/statusConfig';
import StatusUpdater from './StatusUpdater';
import ExternalLink from '@/components/ExternalLink';
import FixSuggestionPanel from '@/components/FixSuggestionPanel';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default async function BugDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from('bug_reports')
    .select('*, apps(name)')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const bug = data as BugReportWithApp;

  const { data: suggestionData } = await getSupabase()
    .from('fix_suggestions')
    .select('*')
    .eq('bug_report_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const suggestion = (suggestionData ?? null) as FixSuggestion | null;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/bugs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          All bugs
        </Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">App</p>
              <p className="text-base font-semibold text-white">
                {bug.apps?.name ?? <span className="text-gray-500 italic">Unknown</span>}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASSES[bug.status as BugStatus]}`}
            >
              {STATUS_LABELS[bug.status as BugStatus]}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{bug.description}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
            <StatusUpdater bugId={bug.id} initialStatus={bug.status as BugStatus} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">URL</p>
            {bug.url ? (
              <ExternalLink
                href={bug.url}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
              >
                {bug.url}
              </ExternalLink>
            ) : (
              <p className="text-sm text-gray-600">Not provided</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">User Agent</p>
            {bug.user_agent ? (
              <p className="text-xs text-gray-400 font-mono break-all leading-relaxed">{bug.user_agent}</p>
            ) : (
              <p className="text-sm text-gray-600">Not provided</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Created</p>
            <p className="text-sm text-gray-300">{formatDateTime(bug.created_at)}</p>
          </div>
        </div>

        {bug.context !== null && (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Context</p>
            <pre className="text-xs text-gray-300 font-mono bg-gray-950 rounded-md p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(bug.context, null, 2)}
            </pre>
          </div>
        )}

        <FixSuggestionPanel bugReportId={bug.id} initial={suggestion} />
      </div>
    </div>
  );
}
