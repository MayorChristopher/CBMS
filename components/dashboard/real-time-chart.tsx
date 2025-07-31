"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"

interface DataPoint {
  time: string
  visitors: number
  pageViews: number
}

export function RealTimeChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial data load
    loadInitialData()

    // Set up real-time subscription
    const channel = supabase
      .channel("activities")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activities" }, (payload) => {
        updateChartData()
      })
      .subscribe()

    // Update data every minute
    const interval = setInterval(updateChartData, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const loadInitialData = async () => {
    try {
      // Generate sample real-time data
      const now = new Date()
      const initialData: DataPoint[] = []

      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000)
        initialData.push({
          time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          visitors: Math.floor(Math.random() * 100) + 50,
          pageViews: Math.floor(Math.random() * 200) + 100,
        })
      }

      setData(initialData)
      setLoading(false)
    } catch (error) {
      console.error("Error loading initial data:", error)
      setLoading(false)
    }
  }

  const updateChartData = () => {
    setData((prevData) => {
      const newData = [...prevData]
      const now = new Date()

      // Add new data point
      newData.push({
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        visitors: Math.floor(Math.random() * 100) + 50,
        pageViews: Math.floor(Math.random() * 200) + 100,
      })

      // Keep only last 24 points
      return newData.slice(-24)
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Traffic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Traffic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="visitors" stroke="#0070f3" strokeWidth={2} name="Visitors" />
              <Line type="monotone" dataKey="pageViews" stroke="#00d4aa" strokeWidth={2} name="Page Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
