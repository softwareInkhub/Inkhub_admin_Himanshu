"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useHydration } from '@/hooks/useHydration';
import { SSOUtils } from '@/lib/sso-utils';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useAppStore();
  const [isValidating, setIsValidating] = useState(true);
  const isHydrated = useHydration();

  useEffect(() => {
    // Allow the auth page itself
    if (pathname?.startsWith('/auth')) {
      setIsValidating(false);
      return;
    }

    // Wait for store hydration before making auth decisions
    if (!isHydrated) {
      return;
    }

    // Prevent multiple calls - only run once per mount
    let isMounted = true;
    const hasRunRef = { current: false };
    
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const initializeSSO = async () => {
      // Allow the auth page itself (if it still existed, though it's removed now)
      if (pathname?.startsWith('/auth')) {
        if (isMounted) setIsValidating(false);
        return;
      }

      // Wait for store hydration before making auth decisions
      if (!isHydrated) {
        return;
      }

      // Sync tokens from cookies to localStorage (for apps that expect localStorage)
      SSOUtils.syncTokensFromCookies();

      // Check if authenticated via cookies or localStorage
      if (!SSOUtils.isAuthenticated()) {
        console.log('[RequireAuth] Not authenticated, redirecting to centralized auth.');
        const nextUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://auth.brmh.in/login?next=${nextUrl}`;
        if (isMounted) setIsValidating(false);
        return;
      }

      // If authenticated and no current user in store, fetch user profile
      if (!currentUser) {
        try {
          const userProfile = await SSOUtils.fetchUserProfile(BACKEND);
          if (isMounted && userProfile) {
            setCurrentUser(userProfile);
          }
        } catch (error) {
          console.error('[RequireAuth] Failed to fetch user profile:', error);
          // Set fallback user for Inkhub admin
          const fallbackUser = {
            id: 'admin-user',
            name: 'Admin User',
            email: 'admin@inkhub.com',
            role: 'admin' as const,
            createdAt: new Date().toISOString(),
            preferences: {
              theme: 'light' as const,
              notifications: true,
              language: 'en'
            },
            permissions: {
              shopify: {
                orders: ['read', 'write', 'admin'],
                products: ['read', 'write', 'admin']
              },
              pinterest: {
                pins: ['read', 'write', 'admin'],
                boards: ['read', 'write', 'admin']
              },
              designLibrary: {
                designs: ['read', 'write', 'admin']
              }
            },
            lastLogin: new Date().toISOString(),
            analytics: {
              ordersViewed: 0,
              productsManaged: 0,
              pinsCreated: 0
            },
            designLibrary: {
              designs: []
            }
          };
          
          if (isMounted) {
            setCurrentUser(fallbackUser);
          }
        }
      }

      if (isMounted) setIsValidating(false);
    };

    initializeSSO();
    
    return () => {
      isMounted = false;
    };
  }, [router, pathname, isHydrated]); // Wait for hydration before running auth logic

  // Show loading state while validating
  if (isValidating && !pathname?.startsWith('/auth')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Authenticating...</div>
      </div>
    );
  }

  return <>{children}</>;
}


