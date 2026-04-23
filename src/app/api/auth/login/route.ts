import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const expected = process.env.DASHBOARD_PASSWORD ?? '';
  const submitted = Buffer.from(body.password);
  const reference = Buffer.from(expected);
  const match =
    submitted.length === reference.length && timingSafeEqual(submitted, reference);

  if (!match) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = await signSession();
  const isProd = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ ok: true });
  response.cookies.set('fixit_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
