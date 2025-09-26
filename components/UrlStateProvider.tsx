"use client";

import { Suspense } from 'react';
import { useUrlState } from '@/lib/url-state';

interface UrlStateProviderProps {
  children: (urlState: ReturnType<typeof useUrlState>) => React.ReactNode;
}

function UrlStateContent({ children }: UrlStateProviderProps) {
  const urlState = useUrlState();
  return <>{children(urlState)}</>;
}

export function UrlStateProvider({ children }: UrlStateProviderProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UrlStateContent>{children}</UrlStateContent>
    </Suspense>
  );
}
