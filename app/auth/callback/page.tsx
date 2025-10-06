"use client"

import { useEffect, useMemo } from 'react'

function setCookie(name: string, value: string, options: { days?: number; domain?: string; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none'; path?: string } = {}) {
  const days = options.days ?? 30
  const path = options.path ?? '/'
  const sameSite = options.sameSite ?? 'lax'
  const secure = options.secure ?? false
  const domain = options.domain ? `; domain=${options.domain}` : ''
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}${secure ? '; Secure' : ''}${domain}`
}

export default function AuthCallbackPage() {
  const { isLocalhost, cookieDomain } = useMemo(() => {
    if (typeof window === 'undefined') return { isLocalhost: false, cookieDomain: undefined as string | undefined }
    const host = window.location.hostname
    const isLocal = host === 'localhost' || host === '127.0.0.1'
    return { isLocalhost: isLocal, cookieDomain: isLocal ? undefined : '.brmh.in' }
  }, [])

  useEffect(() => {
    try {
      // Cognito Hosted UI returns tokens in the URL hash fragment
      const hash = window.location.hash || ''
      const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash)

      const accessToken = params.get('access_token')
      const idToken = params.get('id_token')
      const refreshToken = params.get('refresh_token')
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/'

      if (accessToken) setCookie('access_token', accessToken, { days: 1, path: '/', sameSite: 'lax', secure: !isLocalhost, domain: cookieDomain })
      if (idToken) setCookie('id_token', idToken, { days: 1, path: '/', sameSite: 'lax', secure: !isLocalhost, domain: cookieDomain })
      if (refreshToken) setCookie('refresh_token', refreshToken, { days: 30, path: '/', sameSite: 'lax', secure: !isLocalhost, domain: cookieDomain })

      // Client-readable flag for apps that need to detect auth without httpOnly read
      setCookie('auth_valid', '1', { days: 7, path: '/', sameSite: 'lax', secure: !isLocalhost, domain: cookieDomain })

      // Clean hash and redirect to original page
      window.location.replace(redirect)
    } catch (e) {
      console.error('[Auth Callback] Failed to process tokens:', e)
      // Fallback to home
      window.location.replace('/')
    }
  }, [cookieDomain, isLocalhost])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p>Completing sign-in...</p>
      </div>
    </div>
  )
}


