"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useHydration } from '@/hooks/useHydration';

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

    const validateAndFetchUser = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        if (isMounted) {
          router.replace('/auth');
          setIsValidating(false);
        }
        return;
      }

      // If we already have a persisted user, no need to set fallback
      if (currentUser) {
        if (isMounted) setIsValidating(false);
        return;
      }

      // Set fallback user immediately to prevent multiple API calls
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
        setIsValidating(false);
      }

      // Try to fetch real profile data from backend
      try {
        const response = await fetch(`${BACKEND}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null); // Silently fail

        if (response && response.ok) {
          const data = await response.json();
          
          // Update user with real profile data
          if (isMounted) {
            const userData = {
              id: data.sub || data.id || 'user-' + Date.now(),
              name: `${data.given_name || data.first_name || ''} ${data.family_name || data.last_name || ''}`.trim() || 
                     data.username || data.preferred_username || 'User',
              email: data.email || 'user@inkhub.com',
              role: (data.role === 'admin' || data.role === 'editor' || data.role === 'viewer') 
                ? data.role 
                : 'admin' as const,
              avatar: data.picture,
              createdAt: data.created_at || data.joinedAt || new Date().toISOString(),
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
              lastLogin: data.last_login || new Date().toISOString(),
              analytics: {
                ordersViewed: 0,
                productsManaged: 0,
                pinsCreated: 0
              },
              designLibrary: {
                designs: []
              }
            };
            
            setCurrentUser(userData);
          }
        } else if (response && response.status === 401) {
          // Token invalid, clear it and redirect
          if (isMounted) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('id_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('token_expires');
            document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            setCurrentUser(null);
            router.replace('/auth');
          }
        }
        // If profile API fails, keep the fallback user
      } catch (error) {
        // Keep fallback user if profile fetch fails
        console.warn('Profile fetch failed, using fallback user:', error);
      }
    };

    validateAndFetchUser();
    
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


