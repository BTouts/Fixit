import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import type { BugReportWithApp } from '@/lib/types';
import { relativeTime } from '@/lib/relativeTime';
import { STATUS_LABELS, STATUS_CLASSES } from '@/lib/statusConfig';

export const dynamic = 'force-dynamic';

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Bug Reports</h1>
        <p className="mt-1 text-sm text-gray-400">
          {bugs.length} {bugs.length === 1 ? 'report' : 'reports'} total
        </p>
      </div>

      {bugs.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">No bug reports yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-400">App</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">URL</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 whitespace-nowrap">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {bugs.map((bug) => (
                <tr
                  key={bug.id}
                  className="bg-gray-900/50 hover:bg-gray-800/60 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    <Link href={`/bugs/${bug.id}`} className="block hover:text-white transition-colors">
                      {bug.apps?.name ?? <span className="text-gray-500 italic">Unknown</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs">
                    <Link href={`/bugs/${bug.id}`} className="block hover:text-white transition-colors">
                      {bug.description.length > 80
                        ? bug.description.slice(0, 80) + '…'
                        : bug.description}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[bug.status]}`}
                    >
                      {STATUS_LABELS[bug.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                    {bug.url ? (
                      <a
                        href={bug.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline text-xs"
                        title={bug.url}
                      >
                        {bug.url}
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {relativeTime(bug.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
