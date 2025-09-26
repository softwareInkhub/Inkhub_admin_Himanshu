"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow the auth page itself
    if (pathname?.startsWith('/auth')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) router.replace('/auth');
  }, [router, pathname]);

  return <>{children}</>;
}


