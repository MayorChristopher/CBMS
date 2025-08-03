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

interface RealTimeChartProps {
  websiteId?: string;
}

export function RealTimeChart({ websiteId }: RealTimeChartProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial data load
    loadInitialData()

    // Set up real-time subscription
    const channel = supabase
      .channel("tracking_events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tracking_events" }, (payload) => {
        updateChartData()
      })
      .subscribe()

    // Update data every minute
    const interval = setInterval(updateChartData, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [websiteId])

  const loadInitialData = async () => {
    try {
      // Use last 30 days for broader data
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const fromTime = monthAgo.toISOString()
      const toTime = now.toISOString()
      let query = supabase
        .from('tracking_events')
        .select('*')
        .gte('timestamp', fromTime)
        .lte('timestamp', toTime)
        .order('timestamp', { ascending: true })
      if (websiteId && websiteId !== "") query = query.eq('website_id', websiteId)
      const { data: activityData, error } = await query
      console.log('RealTimeChart raw activityData:', activityData, 'error:', error)
      if (error) {
        console.error("Error fetching real-time data:", error)
        fallbackToSampleData()
        return
      }
      if (!activityData || activityData.length === 0) {
        console.warn("No activity data available, using sample data")
        fallbackToSampleData()
        return
      }
      const processedData: DataPoint[] = processActivityData(activityData)
      console.log('RealTimeChart processedData:', processedData)
      setData(processedData)
      setLoading(false)
    } catch (error) {
      console.error("Error loading initial data:", error)
      fallbackToSampleData()
    }
  }

  // Process real activity data into chart points
  const processActivityData = (activityData: any[]) => {
    const hourlyData: Record<string, { visitors: Set<string>, pageViews: number }> = {}
    activityData.forEach(activity => {
      if (!activity.timestamp) return // skip if missing
      const timestampObj = new Date(activity.timestamp)
      if (isNaN(timestampObj.getTime())) return // skip if invalid
      const hourKey = timestampObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { visitors: new Set(), pageViews: 0 }
      }
      if (activity.session_id) {
        hourlyData[hourKey].visitors.add(activity.session_id)
      }
      if (activity.event_type === 'page_view') {
        hourlyData[hourKey].pageViews += 1
      }
    })
    return Object.entries(hourlyData).map(([time, data]) => ({
      time,
      visitors: data.visitors.size,
      pageViews: data.pageViews
    }))
  }

  // Fallback to sample data if real data isn't available
  const fallbackToSampleData = () => {
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
  }

  const updateChartData = async () => {
    try {
      // Get the latest timestamp from our data (or fallback to 1 hour ago)
      const latestTime = data.length > 0 
        ? new Date(data[data.length - 1].time) 
        : new Date(Date.now() - 60 * 60 * 1000)
      
      // Query for new activity data since the latest time
      let query = supabase
        .from('tracking_events')
        .select('*')
        .gte('timestamp', latestTime.toISOString())
        .order('timestamp', { ascending: true })
      if (websiteId) query = query.eq('website_id', websiteId)
      const { data: newActivityData, error } = await query
      
      if (error) {
        console.error("Error fetching real-time updates:", error)
        fallbackToRandomUpdate()
        return
      }
      
      // If no new data, leave the chart as is
      if (!newActivityData || newActivityData.length === 0) {
        return
      }
      
      // Process the new data
      const newDataPoints = processActivityData(newActivityData)
      
      // Update chart with new data points
      setData(prevData => {
        const combinedData = [...prevData, ...newDataPoints]
        // Keep only the last 24 points
        return combinedData.slice(-24)
      })
    } catch (error) {
      console.error("Error updating chart data:", error)
      fallbackToRandomUpdate()
    }
  }
  
  // Fallback random update when real data can't be fetched
  const fallbackToRandomUpdate = () => {
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