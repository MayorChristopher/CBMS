"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { Activity, MousePointer, Eye, FileText, ArrowDown } from "lucide-react"

interface ActivityItem {
  id: string
  event_type: string
  page_url: string
  timestamp: string
  customer_email?: string
  metadata: any
}

const eventIcons = {
  page_view: Eye,
  click: MousePointer,
  form_submit: FileText,
  scroll: ArrowDown,
}

const eventColors = {
  page_view: "bg-blue-100 text-blue-800",
  click: "bg-green-100 text-green-800",
  form_submit: "bg-purple-100 text-purple-800",
  scroll: "bg-orange-100 text-orange-800",
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentActivities()

    // Set up real-time subscription
    const channel = supabase
      .channel("activity_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tracking_events" }, (payload) => {
        const newActivity = payload.new as ActivityItem
        setActivities((prev) => [newActivity, ...prev.slice(0, 49)]) // Keep last 50
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("tracking_events")
        .select(`
          *,
          customers:customer_id(email)
        `)
        .order("timestamp", { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedActivities =
        data?.map((activity) => ({
          ...activity,
          customer_email: activity.customers?.email,
        })) || []

      setActivities(formattedActivities)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
          <Badge variant="secondary" className="ml-auto">
            {activities.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = eventIcons[activity.event_type as keyof typeof eventIcons] || Activity
              const colorClass =
                eventColors[activity.event_type as keyof typeof eventColors] || "bg-gray-100 text-gray-800"

              return (
                <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.event_type.replace("_", " ").toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{activity.page_url}</p>
                    {activity.customer_email && <p className="text-xs text-gray-500">{activity.customer_email}</p>}
                  </div>
                </div>
              )
            })}

            {activities.length === 0 && <div className="text-center py-8 text-gray-500">No recent activity</div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
