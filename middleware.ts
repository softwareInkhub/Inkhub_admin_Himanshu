import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname, href } = req.nextUrl
  const hostname = req.nextUrl.hostname
  const origin = req.nextUrl.origin

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
  
  // Debug: Log all cookies
  const allCookies = req.cookies.getAll();
  console.log('[Inkhub Middleware] All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })));
  console.log('[Inkhub Middleware] Auth check:', { hasIdToken: !!idToken, hasAccessToken: !!accessToken, hostname });
  
  if (idToken || accessToken) {
    console.log('[Inkhub Middleware] User authenticated via SSO cookies, allowing access');
    
    // Create response and set a non-httpOnly auth flag cookie so client-side knows user is authenticated
    const response = NextResponse.next();
    
    // Set a client-readable flag (not httpOnly) so client-side code knows auth is valid
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    response.cookies.set('auth_valid', '1', {
      path: '/',
      // Don't set domain on localhost or the cookie will be dropped by the browser
      domain: isLocalhost ? undefined : '.brmh.in',
      // Cookies must be secure on HTTPS domains, but not on localhost (HTTP)
      secure: !isLocalhost,
      sameSite: isLocalhost ? 'lax' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false, // Important: client-side can read this
    });
    
    return response;
  }

  // Redirect to centralized auth with return URL
  // Use a dedicated callback on this app so we can capture hash tokens and set cookies for localhost
  const redirectTarget = `${origin}/auth/callback?redirect=${encodeURIComponent(href)}`;
  const nextUrl = encodeURIComponent(redirectTarget);
  console.log('[Inkhub Middleware] No auth token found, redirecting to centralized auth with callback:', redirectTarget);
  console.log('[Inkhub Middleware] Redirect URL:', `https://auth.brmh.in/login?next=${nextUrl}`);
  return NextResponse.redirect(`https://auth.brmh.in/login?next=${nextUrl}`);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}


