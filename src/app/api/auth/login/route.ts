import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = await checkRateLimit(`login:${ip}`, 5, 15 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const expected = process.env.DASHBOARD_PASSWORD ?? '';
  const submitted = Buffer.from(body.password);
  const reference = Buffer.from(expected);
  // Pad to equal length before comparing so password length isn't leaked via timing
  const padded = Buffer.alloc(reference.length);
  submitted.copy(padded, 0, 0, Math.min(submitted.length, reference.length));
  const match = timingSafeEqual(padded, reference) && submitted.length === reference.length;

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
