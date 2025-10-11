"use client"

import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [cookies, setCookies] = useState<Record<string, string>>({})

  useEffect(() => {
    // Get all cookies
    const cookieObj: Record<string, string> = {}
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) {
          cookieObj[key] = decodeURIComponent(value)
        }
      })
    }
    setCookies(cookieObj)

    // Get debug information
    const info: any = {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      origin: typeof window !== 'undefined' ? window.location.origin : 'server',
      href: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasAccessToken: !!cookieObj.access_token,
      hasIdToken: !!cookieObj.id_token,
      hasRefreshToken: !!cookieObj.refresh_token,
      hasAuthValid: !!cookieObj.auth_valid,
      accessTokenLength: cookieObj.access_token?.length || 0,
      idTokenLength: cookieObj.id_token?.length || 0,
    }

    // Try to decode ID token if present
    if (cookieObj.id_token) {
      try {
        const [, payload] = cookieObj.id_token.split('.')
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        info.idTokenPayload = {
          sub: decoded.sub,
          email: decoded.email,
          exp: decoded.exp,
          iat: decoded.iat,
          name: decoded.name,
          given_name: decoded.given_name,
          family_name: decoded.family_name,
        }
        info.tokenExpired = decoded.exp ? (Date.now() / 1000) > decoded.exp : false
      } catch (e) {
        info.idTokenError = e instanceof Error ? e.message : String(e)
      }
    }

    setDebugInfo(info)
  }, [])

  const testAuthFlow = async () => {
    try {
      // Test middleware endpoint
      const response = await fetch('/api/test-auth', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      setDebugInfo((prev: any) => ({
        ...prev,
        middlewareTest: result
      }))
    } catch (error) {
      setDebugInfo((prev: any) => ({
        ...prev,
        middlewareTestError: error instanceof Error ? error.message : String(error)
      }))
    }
  }

  const clearCookies = () => {
    const cookiesToClear = ['access_token', 'id_token', 'refresh_token', 'auth_valid']
    cookiesToClear.forEach(cookieName => {
      // Clear for current domain
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      // Clear for .brmh.in domain
      document.cookie = `${cookieName}=; domain=.brmh.in; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Environment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
              <div><strong>Origin:</strong> {debugInfo.origin}</div>
              <div><strong>Current URL:</strong> {debugInfo.href}</div>
              <div><strong>Environment:</strong> {debugInfo.environment}</div>
              <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
            </div>
          </div>

          {/* Cookie Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cookie Status</h2>
            <div className="space-y-2 text-sm">
              <div className={`${debugInfo.hasAccessToken ? 'text-green-600' : 'text-red-600'}`}>
                <strong>Access Token:</strong> {debugInfo.hasAccessToken ? 'Present' : 'Missing'} 
                {debugInfo.accessTokenLength > 0 && ` (${debugInfo.accessTokenLength} chars)`}
              </div>
              <div className={`${debugInfo.hasIdToken ? 'text-green-600' : 'text-red-600'}`}>
                <strong>ID Token:</strong> {debugInfo.hasIdToken ? 'Present' : 'Missing'}
                {debugInfo.idTokenLength > 0 && ` (${debugInfo.idTokenLength} chars)`}
              </div>
              <div className={`${debugInfo.hasRefreshToken ? 'text-green-600' : 'text-red-600'}`}>
                <strong>Refresh Token:</strong> {debugInfo.hasRefreshToken ? 'Present' : 'Missing'}
              </div>
              <div className={`${debugInfo.hasAuthValid ? 'text-green-600' : 'text-red-600'}`}>
                <strong>Auth Valid Flag:</strong> {debugInfo.hasAuthValid ? 'Present' : 'Missing'}
              </div>
            </div>
          </div>

          {/* ID Token Details */}
          {debugInfo.idTokenPayload && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">ID Token Details</h2>
              <div className="space-y-2 text-sm">
                <div><strong>User ID:</strong> {debugInfo.idTokenPayload.sub}</div>
                <div><strong>Email:</strong> {debugInfo.idTokenPayload.email}</div>
                <div><strong>Name:</strong> {debugInfo.idTokenPayload.name || 'Not provided'}</div>
                <div><strong>Given Name:</strong> {debugInfo.idTokenPayload.given_name || 'Not provided'}</div>
                <div><strong>Family Name:</strong> {debugInfo.idTokenPayload.family_name || 'Not provided'}</div>
                <div><strong>Issued At:</strong> {debugInfo.idTokenPayload.iat ? new Date(debugInfo.idTokenPayload.iat * 1000).toISOString() : 'Unknown'}</div>
                <div><strong>Expires At:</strong> {debugInfo.idTokenPayload.exp ? new Date(debugInfo.idTokenPayload.exp * 1000).toISOString() : 'Unknown'}</div>
                <div className={`${debugInfo.tokenExpired ? 'text-red-600' : 'text-green-600'}`}>
                  <strong>Token Status:</strong> {debugInfo.tokenExpired ? 'EXPIRED' : 'VALID'}
                </div>
              </div>
            </div>
          )}

          {/* All Cookies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">All Cookies</h2>
            <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {Object.entries(cookies).map(([key, value]) => (
                <div key={key} className="border-b pb-1">
                  <div className="font-mono text-xs break-all">
                    <strong>{key}:</strong> {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testAuthFlow}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Middleware Auth
            </button>
            <button
              onClick={clearCookies}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear All Auth Cookies
            </button>
            <button
              onClick={() => window.location.href = 'https://auth.brmh.in/login?next=' + encodeURIComponent(window.location.href)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Go to Auth Login
            </button>
          </div>
        </div>

        {/* Raw Debug Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Debug Information</h2>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
