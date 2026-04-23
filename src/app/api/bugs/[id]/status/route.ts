import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { BugStatus } from '@/lib/types';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const VALID_STATUSES: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // Verify session
  const cookieStore = await cookies();
  const token = cookieStore.get('fixit_session')?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CSRF: reject cross-origin requests
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from('bug_reports')
    .update({ status: body.status })
    .eq('id', id);

  if (error) {
    console.error('status update failed', { error, id });
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
