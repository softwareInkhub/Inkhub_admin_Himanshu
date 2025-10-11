import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookieStore = cookies()
    const idToken = cookieStore.get('id_token')?.value
    const accessToken = cookieStore.get('access_token')?.value
    const authValid = cookieStore.get('auth_valid')?.value

    // Get all cookies for debugging
    const allCookies: Record<string, string> = {}
    cookieStore.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value
    })

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      hostname: request.nextUrl.hostname,
      origin: request.nextUrl.origin,
      hasIdToken: !!idToken,
      hasAccessToken: !!accessToken,
      hasAuthValid: !!authValid,
      idTokenLength: idToken?.length || 0,
      accessTokenLength: accessToken?.length || 0,
      allCookies: Object.keys(allCookies),
      cookieCount: Object.keys(allCookies).length,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    }

    // Try to decode ID token if present
    if (idToken) {
      try {
        const [, payload] = idToken.split('.')
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        debugInfo.idTokenPayload = {
          sub: decoded.sub,
          email: decoded.email,
          exp: decoded.exp,
          iat: decoded.iat,
          name: decoded.name,
          given_name: decoded.given_name,
          family_name: decoded.family_name,
        }
        debugInfo.tokenExpired = decoded.exp ? (Date.now() / 1000) > decoded.exp : false
      } catch (e) {
        debugInfo.idTokenError = e instanceof Error ? e.message : String(e)
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: !!(idToken || accessToken),
      debugInfo
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      debugInfo: {
        timestamp: new Date().toISOString(),
        hostname: request.nextUrl.hostname,
        origin: request.nextUrl.origin,
      }
    }, { status: 500 })
  }
}
