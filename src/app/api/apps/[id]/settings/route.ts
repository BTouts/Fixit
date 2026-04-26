import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { getSupabase } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('fixit_session')?.value;
  return !!token && (await verifySession(token));
}

// PATCH /api/apps/[id]/settings — update app settings (auto_suggest)
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csrfHeader = request.headers.get('x-fixit-csrf');
  if (csrfHeader !== '1') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.auto_suggest !== 'boolean') {
    return NextResponse.json({ error: 'auto_suggest (boolean) is required' }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from('apps')
    .update({ auto_suggest: body.auto_suggest })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
