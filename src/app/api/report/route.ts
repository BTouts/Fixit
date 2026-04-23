import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { getSupabase } from '@/lib/supabase';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type BugReportBody = {
  description: unknown;
  url?: unknown;
  user_agent?: unknown;
  context?: unknown;
};

type AppRow = {
  id: string;
  name: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  let body: BugReportBody;
  try {
    body = (await request.json()) as BugReportBody;
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

  const { data: report, error: insertError } = await getSupabase()
    .from('bug_reports')
    .insert({
      app_id: app.id,
      description: description.trim(),
      url: typeof url === 'string' ? url : null,
      user_agent: typeof user_agent === 'string' ? user_agent : null,
      context: context !== undefined ? context : {},
    })
    .select('id')
    .single<{ id: string }>();

  if (insertError || !report) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500, headers: CORS_HEADERS });
  }

  const timestamp = new Date().toUTCString();
  const emailBody = [
    `App:         ${app.name}`,
    `Description: ${description.trim()}`,
    `URL:         ${typeof url === 'string' ? url : '(not provided)'}`,
    `Timestamp:   ${timestamp}`,
  ].join('\n');

  await getResend().emails.send({
    from: 'fixit <onboarding@resend.dev>',
    to: process.env.OWNER_EMAIL!,
    subject: `[fixit] New bug report: ${app.name}`,
    text: emailBody,
  });

  return NextResponse.json({ id: report.id }, { status: 201, headers: CORS_HEADERS });
}
