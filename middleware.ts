import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname, href } = req.nextUrl

  // Allow auth page and static assets/api without redirect
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check for SSO auth tokens in cookies (primary method)
  const idToken = req.cookies.get('id_token')?.value;
  const accessToken = req.cookies.get('access_token')?.value;
  
  if (idToken || accessToken) {
    console.log('[Inkhub Middleware] User authenticated via SSO cookies, allowing access');
    return NextResponse.next();
  }

  // Redirect to centralized auth with return URL
  const nextUrl = encodeURIComponent(href);
  console.log('[Inkhub Middleware] No auth token found, redirecting to centralized auth');
  return NextResponse.redirect(`https://auth.brmh.in/login?next=${nextUrl}`);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}


