"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MetricCard } from "@/components/dashboard/metric-card"
import { RealTimeChart } from "@/components/dashboard/real-time-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DeviceBreakdown } from "@/components/dashboard/device-breakdown"
import { CustomerEngagementDashboard } from "@/components/dashboard/CustomerEngagementDashboard"
import { WebsiteSelector } from "@/components/dashboard/WebsiteSelector"
import { Users, Activity, TrendingUp, Eye, MousePointer } from "lucide-react"

interface DashboardMetrics {
  engagement: any | null
  totalCustomers: number
  totalSessions: number
  totalPageViews: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    engagement: null,
    totalCustomers: 0,
    totalSessions: 0,
    totalPageViews: 0,
  })
  const [loading, setLoading] = useState(true)
  const [websiteId, setWebsiteId] = useState<string>("")

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true)
      // Fetch engagement metrics from analytics engine
      const { analyticsEngine } = await import("@/lib/analytics")
      const engagement = await analyticsEngine.calculateEngagementMetrics(undefined, '7d', websiteId || undefined)

      // Fetch total customers, sessions, and page views from Supabase
      const { supabase } = await import("@/lib/supabase")
      // Total customers (not filtered by websiteId)
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
      // Total sessions
      let sessionsQuery = supabase
        .from('tracking_events')
        .select('session_id', { count: 'exact', head: true })
        .neq('session_id', null)
        .eq('event_type', 'session_start')
      if (websiteId) sessionsQuery = sessionsQuery.eq('website_id', websiteId)
      const { data: sessions, error: sessionsError } = await sessionsQuery
      // Total page views
      let pageViewsQuery = supabase
        .from('tracking_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
      if (websiteId) pageViewsQuery = pageViewsQuery.eq('website_id', websiteId)
      const { data: pageViews, error: pageViewsError } = await pageViewsQuery

      setMetrics({
        engagement,
        totalCustomers: customers?.length || 0,
        totalSessions: sessions?.length || 0,
        totalPageViews: pageViews?.length || 0,
      })
      setLoading(false)
    }
    fetchMetrics()
  }, [websiteId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Customer Behaviour Monitoring System</p>
        </div>
        <div>
          <WebsiteSelector value={websiteId} onChange={setWebsiteId} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers.toLocaleString()}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Total Sessions"
          value={metrics.totalSessions.toLocaleString()}
          change="+5% from yesterday"
          changeType="positive"
          icon={Activity}
          loading={loading}
        />
        <MetricCard
          title="Page Views"
          value={metrics.totalPageViews.toLocaleString()}
          change="+18% from last week"
          changeType="positive"
          icon={Eye}
          loading={loading}
        />
        <MetricCard
          title="Engagement Score"
          value={metrics.engagement?.engagement_score != null ? `${metrics.engagement.engagement_score}%` : "-"}
          change=""
          changeType="positive"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Bounce Rate"
          value={metrics.engagement?.bounce_rate != null ? `${metrics.engagement.bounce_rate}%` : "-"}
          change=""
          changeType="positive"
          icon={MousePointer}
          loading={loading}
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.engagement?.conversion_rate != null ? `${metrics.engagement.conversion_rate}%` : "-"}
          change=""
          changeType="positive"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RealTimeChart websiteId={websiteId} />
        <ActivityFeed websiteId={websiteId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DeviceBreakdown websiteId={websiteId} />
        <div>
          <CustomerEngagementDashboard websiteId={websiteId} />
        </div>
      </div>
    </div>
  )
}