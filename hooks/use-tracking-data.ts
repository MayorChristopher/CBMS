'use client';

import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface TrackingEvent {
  id: string;
  event_type: string;
  session_id: string;
  page_url: string;
  timestamp: string;
  metadata: any;
  api_key: string;
}

interface TrackingStats {
  totalEvents: number;
  pageViews: number;
  uniqueSessions: number;
  uniquePages: string[];
}

async function fetchTrackingEvents(limit: number = 100): Promise<TrackingEvent[]> {
  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching tracking events:', error);
    throw new Error('Failed to fetch tracking events');
  }

  return data || [];
}

async function fetchTrackingStats(): Promise<TrackingStats> {
  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching tracking stats:', error);
    throw new Error('Failed to fetch tracking stats');
  }

  const events = data || [];
  const uniqueSessions = new Set(events.map(event => event.session_id)).size;
  const uniquePages = [...new Set(events.map(event => event.page_url))];
  const pageViews = events.filter(event => event.event_type === 'page_view').length;

  return {
    totalEvents: events.length,
    pageViews,
    uniqueSessions,
    uniquePages,
  };
}

export function useTrackingEvents(limit: number = 100) {
  return useQuery({
    queryKey: ['tracking-events', limit],
    queryFn: () => fetchTrackingEvents(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useTrackingStats() {
  return useQuery({
    queryKey: ['tracking-stats'],
    queryFn: fetchTrackingStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}