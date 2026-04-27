import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/session';

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('fixit_session')?.value;
  if (!token || !(await verifySession(token))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Per-request nonce for CSP — eliminates unsafe-inline/unsafe-eval on scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  return response;
}

// Deny-by-default: protect everything except explicitly public paths.
// Any new page added to the app is automatically behind auth.
export const config = {
  matcher: [
    '/((?!login|api/auth|api/report|_next/static|_next/image|favicon\\.ico).*)',
  ],
};
