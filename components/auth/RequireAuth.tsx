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

    const initializeUser = async () => {
      // NOTE: Authentication is already handled by middleware (which can read httpOnly cookies)
      // This component only needs to fetch/set user profile for the app state
      
      // Try to get tokens from localStorage (synced by middleware if available)
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      
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
            // If profile fetch fails, use fallback user
            throw new Error('Failed to fetch user profile');
          }
        } catch (error) {
          console.warn('[RequireAuth] Using fallback user profile:', error);
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


