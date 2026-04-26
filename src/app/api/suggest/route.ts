import { after } from 'next/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { getSupabase } from '@/lib/supabase';
import { runFixSuggestion } from '@/lib/fixSuggestion';
import type { FixSuggestion } from '@/lib/types';

async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('fixit_session')?.value;
  return !!token && (await verifySession(token));
}

// GET /api/suggest?bugId=<id> — poll for current suggestion
export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bugId = request.nextUrl.searchParams.get('bugId');
  if (!bugId) {
    return NextResponse.json({ error: 'bugId is required' }, { status: 400 });
  }

  const { data } = await getSupabase()
    .from('fix_suggestions')
    .select('*')
    .eq('bug_report_id', bugId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<FixSuggestion>();

  return NextResponse.json(data ?? null);
}

type AppRow = { github_repo: string | null };
type BugRow = { app_id: string };

// POST /api/suggest — manually trigger fix suggestion for a bug
export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csrfHeader = request.headers.get('x-fixit-csrf');
  if (csrfHeader !== '1') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.bug_report_id !== 'string') {
    return NextResponse.json({ error: 'bug_report_id is required' }, { status: 400 });
  }

  const bugReportId: string = body.bug_report_id;
  const supabase = getSupabase();

  // Look up the bug + app
  const { data: bug } = await supabase
    .from('bug_reports')
    .select('app_id')
    .eq('id', bugReportId)
    .single<BugRow>();

  if (!bug) {
    return NextResponse.json({ error: 'Bug report not found' }, { status: 404 });
  }

  const { data: app } = await supabase
    .from('apps')
    .select('github_repo')
    .eq('id', bug.app_id)
    .single<AppRow>();

  if (!app?.github_repo) {
    return NextResponse.json(
      { error: 'App has no GitHub repo configured' },
      { status: 422 },
    );
  }

  // Don't double-generate if one is already pending
  const { data: existing } = await supabase
    .from('fix_suggestions')
    .select('id, status')
    .eq('bug_report_id', bugReportId)
    .eq('status', 'pending')
    .maybeSingle<{ id: string; status: string }>();

  if (existing) {
    return NextResponse.json({ error: 'Fix suggestion already generating' }, { status: 409 });
  }

  // Create pending record
  const { data: suggestion, error: insertError } = await supabase
    .from('fix_suggestions')
    .insert({ bug_report_id: bugReportId, status: 'pending' })
    .select('id')
    .single<{ id: string }>();

  if (insertError || !suggestion) {
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }

  const { id: suggestionId } = suggestion;
  const repo = app.github_repo;

  after(async () => {
    await runFixSuggestion(suggestionId, bugReportId, repo);
  });

  return NextResponse.json({ id: suggestionId }, { status: 202 });
}
