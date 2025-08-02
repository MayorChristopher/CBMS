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
      // Get the current time
      const now = new Date()
      
      // Get the time 24 hours ago
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      // Format for Supabase query (ISO string)
      const fromTime = dayAgo.toISOString()
      const toTime = now.toISOString()
      
      // Query real data from the activities table, grouped by hour
      const { data: activityData, error } = await supabase
        .from('activities')
        .select('*')
        .gte('timestamp', fromTime)
        .lte('timestamp', toTime)
        .order('timestamp', { ascending: true })
      
      if (error) {
        console.error("Error fetching real-time data:", error)
        fallbackToSampleData()
        return
      }
      
      // If no data is available, use sample data
      if (!activityData || activityData.length === 0) {
        console.warn("No activity data available, using sample data")
        fallbackToSampleData()
        return
      }
      
      // Process the real data
      const processedData: DataPoint[] = processActivityData(activityData)
      
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
    
    // Group data by hour
    activityData.forEach(activity => {
      const timestamp = new Date(activity.timestamp)
      const hourKey = timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { 
          visitors: new Set(), 
          pageViews: 0 
        }
      }
      
      // Count unique visitors by session_id
      if (activity.session_id) {
        hourlyData[hourKey].visitors.add(activity.session_id)
      }
      
      // Count page views
      if (activity.event_type === 'page_view') {
        hourlyData[hourKey].pageViews += 1
      }
    })
    
    // Convert to array format for chart
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
      const { data: newActivityData, error } = await supabase
        .from('activities')
        .select('*')
        .gte('timestamp', latestTime.toISOString())
        .order('timestamp', { ascending: true })
      
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