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
    const hasRunRef = { current: false };
    
    if (hasRunRef.current) return;
    hasRunRef.current = true;

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
      
      // Try to get tokens from localStorage or cookies (middleware/callback may have set both)
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken') || getCookie('access_token');
      const idToken = localStorage.getItem('id_token') || getCookie('id_token');

      // Sync cookies -> localStorage so client APIs can use them easily (always overwrite to avoid stale values)
      const cAccess = getCookie('access_token')
      const cId = getCookie('id_token')
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
            // If profile fetch fails, but we have an id token, decode it as a quick fallback
            const claims = decodeJwt(idToken)
            if (claims && isMounted) {
              setCurrentUser({
                id: claims.sub || 'user',
                name: claims.name || claims.given_name || claims.email || 'User',
                email: claims.email,
                role: 'admin',
              } as any)
            } else {
              throw new Error('Failed to fetch user profile')
            }
          }
        } catch (error) {
          // Only fall back to dev dummy user when no tokens available and in development
          const isDev = process.env.NODE_ENV === 'development'
          const hasAnyToken = Boolean(accessToken || idToken)
          if (isMounted && isDev && !hasAnyToken) {
            console.warn('[RequireAuth] Development mode with no tokens - using fallback user')
            setCurrentUser({ id: 'dev', name: 'Developer', email: 'dev@example.com', role: 'admin' } as any)
          } else {
            console.warn('[RequireAuth] Unable to resolve user profile:', error)
          }
        }

      // If still no user and no tokens, enforce login (production)
      const hasUser = Boolean(useAppStore.getState().currentUser)
      const hasToken = Boolean(accessToken || idToken)
      const isDev = process.env.NODE_ENV === 'development'
      if (!hasUser && !hasToken && !isDev) {
        const nextUrl = encodeURIComponent(window.location.href)
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


