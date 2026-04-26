import { getSupabase } from '@/lib/supabase';
import type { App } from '@/lib/types';
import AutoSuggestToggle from '@/components/AutoSuggestToggle';

export const dynamic = 'force-dynamic';

export default async function AppsPage() {
  const { data, error } = await getSupabase()
    .from('apps')
    .select('id, name, github_repo, auto_suggest, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div className="rounded-md bg-red-950/40 border border-red-900 px-4 py-3 text-sm text-red-400">
        Failed to load apps: {error.message}
      </div>
    );
  }

  const apps = (data ?? []) as App[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Connected Apps</h1>
        <p className="mt-1 text-sm text-gray-400">
          {apps.length} {apps.length === 1 ? 'app' : 'apps'} connected
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">No apps connected yet. Add one in Supabase.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="rounded-lg border border-gray-800 bg-gray-900 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-base font-semibold text-white">{app.name}</p>
                  {app.github_repo ? (
                    <p className="text-xs text-gray-500 font-mono">{app.github_repo}</p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">No GitHub repo configured</p>
                  )}
                </div>

                <div className="shrink-0">
                  <p className="text-xs text-gray-500 mb-1.5">Auto-suggest fixes</p>
                  <AutoSuggestToggle appId={app.id} initial={app.auto_suggest} />
                </div>
              </div>

              {!app.github_repo && (
                <p className="mt-3 text-xs text-yellow-600/80">
                  Set <code className="font-mono">github_repo</code> in Supabase to enable fix suggestions.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
