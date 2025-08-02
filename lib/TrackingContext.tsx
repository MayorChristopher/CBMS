'use client';

import { createContext, useContext, ReactNode, useCallback } from 'react';

type TrackingContextType = {
  trackEvent: (eventType: string, metadata?: Record<string, any>) => void;
  isAvailable: boolean;
};

const TrackingContext = createContext<TrackingContextType>({
  trackEvent: () => {},
  isAvailable: false,
});

export function TrackingProvider({ children }: { children: ReactNode }) {
  // Check if CBMS is available in the window object
  const isAvailable = typeof window !== 'undefined' && 'CBMS' in window;

  // Function to track events
  const trackEvent = useCallback((eventType: string, metadata?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.CBMS) {
      window.CBMS.track(eventType, metadata);
    } else {
      console.warn('CBMS tracking not available');
    }
  }, []);

  return (
    <TrackingContext.Provider value={{ trackEvent, isAvailable }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  return useContext(TrackingContext);
}

// Add TypeScript declarations for the CBMS global object
declare global {
  interface Window {
    CBMS?: {
      track: (eventType: string, data?: Record<string, any>) => void;
      init: () => void;
      config: {
        apiUrl: string;
        debug: boolean;
        [key: string]: any;
      };
      debug: () => void;
    };
  }
}