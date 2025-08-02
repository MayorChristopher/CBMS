'use client';

import { useTrackingStats } from '@/hooks/use-tracking-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TrackingStats() {
  const { data: stats, isLoading, error } = useTrackingStats();

  if (isLoading) {
    return <TrackingStatsLoading />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Stats</CardTitle>
          <CardDescription>Error loading tracking data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load tracking statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Stats</CardTitle>
        <CardDescription>Overview of tracking events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            description="Total tracked events"
          />
          <StatCard
            title="Page Views"
            value={stats?.pageViews || 0}
            description="Total page views"
          />
          <StatCard
            title="Unique Sessions"
            value={stats?.uniqueSessions || 0}
            description="Unique visitor sessions"
          />
          <StatCard
            title="Unique Pages"
            value={stats?.uniquePages?.length || 0}
            description="Unique pages visited"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

function TrackingStatsLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Stats</CardTitle>
        <CardDescription>Overview of tracking events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}