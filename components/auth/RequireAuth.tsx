"use client";

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useHydration } from '@/hooks/useHydration';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentUser } = useAppStore();
  const [isValidating, setIsValidating] = useState(true);
  const isHydrated = useHydration();

  useEffect(() => {
    // Wait for store hydration before making auth decisions
    if (!isHydrated) {
      return;
    }

    // Prevent multiple calls - only run once per mount
    let isMounted = true;

    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return undefined as string | undefined
      const match = document.cookie.match(new RegExp('(^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
      return match ? decodeURIComponent(match[2]) : undefined
    }

    const decodeJwt = (token?: string | null) => {
      try {
        if (!token) return undefined as any
        const [, payload] = token.split('.')
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(json)
      } catch { return undefined as any }
    }

    const initializeUser = async () => {
      // NOTE: Authentication is already handled by middleware (which can read httpOnly cookies)
      // This component only needs to fetch/set user profile for the app state
      
      // Check for auth flags set by middleware (non-httpOnly cookies)
      const authValid = getCookie('auth_valid')
      const authValidAdmin = getCookie('auth_valid_admin')
      
      // Prioritize cookies over localStorage (cookies are set by auth callback with proper domain)
      const cAccess = getCookie('access_token')
      const cId = getCookie('id_token')
      const accessToken = cAccess || localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      const idToken = cId || localStorage.getItem('id_token');
      
      console.log('[RequireAuth] Token check:', {
        hasAuthValid: !!authValid,
        hasAuthValidAdmin: !!authValidAdmin,
        hasCookieAccess: !!cAccess,
        hasCookieId: !!cId,
        hasLocalAccess: !!localStorage.getItem('access_token'),
        hasLocalId: !!localStorage.getItem('id_token'),
        finalAccess: !!accessToken,
        finalId: !!idToken,
        hostname: window.location.hostname
      });

      // Sync cookies -> localStorage so client APIs can use them easily (always overwrite to avoid stale values)
      if (cAccess) localStorage.setItem('access_token', cAccess)
      if (cId) localStorage.setItem('id_token', cId)
      
      // If authenticated and no current user in store, fetch user profile
      if (!currentUser) {
        try {
          // Try to fetch user profile
          const response = await fetch(`${BACKEND}/auth/profile`, {
            headers: {
              'Authorization': accessToken ? `Bearer ${accessToken}` : '',
              'Content-Type': 'application/json'
            },
            credentials: 'include', // Important: sends httpOnly cookies
          });

          if (response.ok) {
            const userProfile = await response.json();
            if (isMounted && userProfile) {
              setCurrentUser(userProfile);
            }
          } else {
            // If backend profile fails, fallback to ID token claims (if present)
            const claims = decodeJwt(idToken)
            if (claims && isMounted) {
              setCurrentUser({
                id: claims.sub || 'user',
                name: claims.name || claims.given_name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim() || claims.email || 'User',
                email: claims.email,
                role: (claims['role'] || claims['cognito:groups']?.[0] || 'admin') as any,
              } as any)
            } else {
              throw new Error('Failed to fetch user profile and no usable ID token claims')
            }
          }
        } catch (error) {
          // Do not set any dummy user. Attempt ID token decode as a final fallback.
          const claims = decodeJwt(idToken)
          if (claims && isMounted) {
            setCurrentUser({
              id: claims.sub || 'user',
              name: claims.name || claims.given_name || `${claims.given_name || ''} ${claims.family_name || ''}`.trim() || claims.email || 'User',
              email: claims.email,
              role: (claims['role'] || claims['cognito:groups']?.[0] || 'admin') as any,
            } as any)
          } else {
            console.warn('[RequireAuth] Unable to resolve user profile:', error)
          }
        }

      // If still no user and no tokens, enforce login (production)
      const hasUser = Boolean(useAppStore.getState().currentUser)
      const hasToken = Boolean(accessToken || idToken)
      const hasAuthFlag = Boolean(authValid || authValidAdmin)
      const isDev = process.env.NODE_ENV === 'development'
      
      console.log('[RequireAuth] Auth decision:', {
        hasUser,
        hasToken,
        hasAuthFlag,
        isDev,
        willRedirect: !hasUser && !hasToken && !hasAuthFlag && !isDev
      });
      
      if (!hasUser && !hasToken && !hasAuthFlag && !isDev) {
        const nextUrl = encodeURIComponent(window.location.href)
        console.log('[RequireAuth] Redirecting to auth:', `https://auth.brmh.in/login?next=${nextUrl}`)
        window.location.href = `https://auth.brmh.in/login?next=${nextUrl}`
        return
      }
      }

      if (isMounted) setIsValidating(false);
    };

    initializeUser();
    
    return () => {
      isMounted = false;
    };
  }, [isHydrated, currentUser, setCurrentUser]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}


