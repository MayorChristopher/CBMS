'use client';

import { analyticsEngine, type EngagementMetrics, type BehaviorPattern, type ConversionFunnel } from '@/lib/analytics';
import { useQuery } from '@tanstack/react-query';

export function useEngagementMetrics(customerId?: string, timeRange: string = '7d') {
  return useQuery({
    queryKey: ['engagement', customerId, timeRange],
    queryFn: () => analyticsEngine.calculateEngagementMetrics(customerId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBehaviorPatterns(customerId?: string) {
  return useQuery({
    queryKey: ['behavior', customerId],
    queryFn: () => analyticsEngine.identifyBehaviorPatterns(customerId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useConversionFunnel(funnelSteps: string[]) {
  return useQuery({
    queryKey: ['funnel', funnelSteps],
    queryFn: () => analyticsEngine.generateConversionFunnel(funnelSteps),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useDropOffRates() {
  return useQuery({
    queryKey: ['dropoff'],
    queryFn: () => analyticsEngine.calculateDropOffRates(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}