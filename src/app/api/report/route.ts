import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_BODY_BYTES = 64 * 1024;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type AppRow = {
  id: string;
  name: string;
};

function validateUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

function validateContext(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  if (JSON.stringify(value).length > 4096) return {};
  return value as Record<string, unknown>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: CORS_HEADERS });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  const rawKey = match[1];
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const { data: app, error: appError } = await getSupabase()
    .from('apps')
    .select('id, name')
    .eq('api_key_hash', keyHash)
    .single<AppRow>();

  if (appError || !app) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  // Rate limit: 60 reports per hour per app
  const rl = await checkRateLimit(`report:${app.id}`, 60, 60 * 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfter) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const { description, url, user_agent, context } = body;

  if (typeof description !== 'string' || description.trim() === '') {
    return NextResponse.json(
      { error: '`description` is required and must be a non-empty string' },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (description.trim().length > 2000) {
    return NextResponse.json(
      { error: '`description` must be 2000 characters or fewer' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const safeUrl = validateUrl(url);
  const safeUserAgent = typeof user_agent === 'string' ? user_agent.slice(0, 512) : null;
  const safeContext = validateContext(context);

  const { data: report, error: insertError } = await getSupabase()
    .from('bug_reports')
    .insert({
      app_id: app.id,
      description: description.trim(),
      url: safeUrl,
      user_agent: safeUserAgent,
      context: safeContext,
    })
    .select('id')
    .single<{ id: string }>();

  if (insertError || !report) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500, headers: CORS_HEADERS });
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'fixit <onboarding@resend.dev>';
  const timestamp = new Date().toUTCString();
  const emailBody = [
    `App:         ${app.name}`,
    `Description: ${description.trim()}`,
    `URL:         ${safeUrl ?? '(not provided)'}`,
    `Timestamp:   ${timestamp}`,
  ].join('\n');

  await getResend().emails.send({
    from,
    to: process.env.OWNER_EMAIL!,
    subject: `[fixit] New bug report: ${app.name}`,
    text: emailBody,
  });

  return NextResponse.json({ id: report.id }, { status: 201, headers: CORS_HEADERS });
}
