import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { analyticsEngine, type EngagementMetrics } from "@/lib/analytics";

interface CustomerEngagementDashboardProps {
  websiteId?: string;
}

export function CustomerEngagementDashboard({ websiteId }: CustomerEngagementDashboardProps) {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      const result = await analyticsEngine.calculateEngagementMetrics(undefined, '7d', websiteId);
      setMetrics(result);
      setLoading(false);
    }
    fetchMetrics();
  }, [websiteId]);

  if (loading) return <div>Loading customer engagement data...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Engagement (from tracking events)</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics ? (
          <ul className="space-y-2">
            <li>Engagement Score: {metrics.engagement_score}%</li>
            <li>Bounce Rate: {metrics.bounce_rate}%</li>
            <li>Conversion Rate: {metrics.conversion_rate}%</li>
            <li>Avg. Session Duration: {metrics.avg_session_duration} sec</li>
            <li>Pages per Session: {metrics.pages_per_session}</li>
            <li>Return Visitor Rate: {metrics.return_visitor_rate}%</li>
          </ul>
        ) : (
          <div>No engagement data available.</div>
        )}
      </CardContent>
    </Card>
  );
}
