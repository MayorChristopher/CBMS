'use client';

import { useEffect } from 'react';

export function ClientTrackingInit() {
  useEffect(() => {
    // Dynamically import the tracking to avoid SSR issues
    import('@/lib/tracking').then(({ trackingService }) => {
      // Initialize tracking on the client side
      if (typeof window !== 'undefined') {
        trackingService.initialize();
      }
    }).catch(err => {
      console.warn('Failed to initialize tracking:', err);
    });
  }, []);

  return null; // This component doesn't render anything
}