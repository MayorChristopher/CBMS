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

export function DeviceBreakdown() {
  const [data, setData] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeviceData()
  }, [])

  const loadDeviceData = async () => {
    try {
      const { data: sessions, error } = await supabase.from("sessions").select("device_type")

      if (error) throw error

      // Count device types
      const deviceCounts =
        sessions?.reduce(
          (acc, session) => {
            const device = session.device_type || "unknown"
            acc[device] = (acc[device] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ) || {}

      // Format data for chart
      const chartData: DeviceData[] = [
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
      ].filter((item) => item.value > 0)

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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
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
