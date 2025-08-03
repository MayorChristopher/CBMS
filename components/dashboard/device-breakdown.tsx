"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { supabase } from "@/lib/supabase"
import { Monitor, Smartphone, Tablet } from "lucide-react"

interface DeviceData {
  name: string
  value: number
  color: string
  icon: React.ComponentType<any>
}

const COLORS = ["#0070f3", "#00d4aa", "#ff6b6b", "#4ecdc4"]

interface DeviceBreakdownProps {
  websiteId?: string
}

export function DeviceBreakdown({ websiteId }: DeviceBreakdownProps) {
  const [data, setData] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeviceData()
  }, [websiteId])

  const loadDeviceData = async () => {
    try {
      let query = supabase
        .from("tracking_events")
        .select("metadata, website_id")
        .eq("event_type", "session_start")
      if (websiteId) query = query.eq("website_id", websiteId)
      const { data: events, error } = await query
      if (error) throw error

      // Count device types from metadata.device_type
      const deviceCounts =
        events?.reduce((acc, event) => {
          const device = event.metadata?.device_type || "unknown"
          acc[device] = (acc[device] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

      // Format data for chart
      const chartData = [
        {
          name: "Desktop",
          value: deviceCounts.desktop || 0,
          color: COLORS[0],
          icon: Monitor,
        },
        {
          name: "Mobile",
          value: deviceCounts.mobile || 0,
          color: COLORS[1],
          icon: Smartphone,
        },
        {
          name: "Tablet",
          value: deviceCounts.tablet || 0,
          color: COLORS[2],
          icon: Tablet,
        },
      ].filter((item): item is DeviceData => item.value > 0)

      setData(chartData)
    } catch (error) {
      console.error("Error loading device data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const Icon = item.icon
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} aria-label={item.name + ' color'} />
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.value} ({percentage}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
