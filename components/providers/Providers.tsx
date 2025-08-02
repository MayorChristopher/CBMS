'use client';

import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from '../theme-provider';
import { ClientTrackingInit } from '../client-tracking-init';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <ClientTrackingInit />
      </ThemeProvider>
    </QueryProvider>
  );
}