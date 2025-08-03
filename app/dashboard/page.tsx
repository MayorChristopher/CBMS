"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MetricCard } from "@/components/dashboard/metric-card"
import { RealTimeChart } from "@/components/dashboard/real-time-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DeviceBreakdown } from "@/components/dashboard/device-breakdown"
import { CustomerEngagementDashboard } from "@/components/dashboard/CustomerEngagementDashboard"
import { getCurrentUserProfile, Profile } from "@/lib/profiles"
import { supabase } from "@/lib/supabase"
import { Users, Activity, Clock, TrendingUp, Eye, MousePointer } from "lucide-react"

interface DashboardMetrics {
  totalCustomers: number
  activeSessions: number
  avgSessionDuration: string
  totalPageViews: number
  bounceRate: number
  conversionRate: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    activeSessions: 0,
    avgSessionDuration: "0m",
    totalPageViews: 0,
    bounceRate: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      // Route based on user role
      if (profile.role === 'analyst') {
        router.push('/dashboard/analyst')
        return
      } else if (profile.role === 'user') {
        router.push('/dashboard/customer')
        return
      }

      // Admin stays on main dashboard
      loadDashboardMetrics()

      // Set up real-time updates
      const interval = setInterval(loadDashboardMetrics, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [profile, router])

  const loadUserProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const loadDashboardMetrics = async () => {
    try {
      // Load total customers
      const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true })

      // Load active sessions (last 24 hours)
      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .gte("session_start", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Load total page views
      const { count: pageViewCount } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "page_view")

      // Calculate average session duration
      const { data: sessions } = await supabase.from("sessions").select("duration").not("duration", "is", null)

      let avgDuration = "0m"
      if (sessions && sessions.length > 0) {
        // Simple average calculation (in reality, you'd parse the interval)
        avgDuration = "5m 30s" // Placeholder
      }

      // Load engagement metrics for bounce rate and conversion rate
      const { data: engagementData } = await supabase.from("engagement_metrics").select("bounce_rate, conversion_rate")

      let avgBounceRate = 0
      let avgConversionRate = 0

      if (engagementData && engagementData.length > 0) {
        avgBounceRate =
          engagementData.reduce((sum, metric) => sum + (metric.bounce_rate || 0), 0) / engagementData.length
        avgConversionRate =
          engagementData.reduce((sum, metric) => sum + (metric.conversion_rate || 0), 0) / engagementData.length
      }

      setMetrics({
        totalCustomers: customerCount || 0,
        activeSessions: sessionCount || 0,
        avgSessionDuration: avgDuration,
        totalPageViews: pageViewCount || 0,
        bounceRate: Math.round(avgBounceRate * 100) / 100,
        conversionRate: Math.round(avgConversionRate * 100) / 100,
      })
    } catch (error) {
      console.error("Error loading dashboard metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Customer Behaviour Monitoring System</p>
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
          title="Active Sessions"
          value={metrics.activeSessions.toLocaleString()}
          change="+5% from yesterday"
          changeType="positive"
          icon={Activity}
          loading={loading}
        />
        <MetricCard
          title="Avg Session Duration"
          value={metrics.avgSessionDuration}
          change="+2m from last week"
          changeType="positive"
          icon={Clock}
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
          title="Bounce Rate"
          value={`${metrics.bounceRate}%`}
          change="-3% from last month"
          changeType="positive"
          icon={MousePointer}
          loading={loading}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change="+1.2% from last month"
          changeType="positive"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RealTimeChart />
        <ActivityFeed />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DeviceBreakdown />
        <div>
          <CustomerEngagementDashboard />
        </div>
      </div>
    </div>
  )
}