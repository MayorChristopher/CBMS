"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { analyticsEngine, type EngagementMetrics, type BehaviorPattern, type ConversionFunnel } from "@/lib/analytics"
import { BarChart3, TrendingUp, Users, Target, Activity, Brain } from "lucide-react"

export default function AnalyticsPage() {
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null)
  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPattern[]>([])
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([])
  const [dropOffRates, setDropOffRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Load all analytics data
      const [metrics, patterns, funnel, dropOffs] = await Promise.all([
        analyticsEngine.calculateEngagementMetrics(),
        analyticsEngine.identifyBehaviorPatterns(),
        analyticsEngine.generateConversionFunnel(['home', 'products', 'checkout', 'confirmation']),
        analyticsEngine.calculateDropOffRates()
      ])

      setEngagementMetrics(metrics)
      setBehaviorPatterns(patterns)
      setConversionFunnel(funnel)
      setDropOffRates(dropOffs)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Behavior analysis and insights</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">Behavior analysis and insights</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">Behavior Patterns</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="dropoff">Drop-off Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementMetrics?.engagement_score || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Based on activity diversity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementMetrics?.bounce_rate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Single-page sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementMetrics?.conversion_rate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Form completions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementMetrics?.avg_session_duration || 0}s</div>
                <p className="text-xs text-muted-foreground">
                  Time spent per session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pages per Session</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementMetrics?.pages_per_session || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Average page views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Return Visitor Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementMetrics?.return_visitor_rate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Repeat visitors
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Behavior Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {behaviorPatterns.length > 0 ? (
                <div className="space-y-4">
                  {behaviorPatterns.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">
                          {pattern.pattern_type.replace('_', ' ')}
                        </h3>
                        <Badge variant="secondary">
                          {pattern.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                      {pattern.metadata && (
                        <div className="text-xs text-gray-500">
                          <pre>{JSON.stringify(pattern.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No behavior patterns detected yet. Continue using the platform to generate insights.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversionFunnel.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionFunnel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visitors" fill="#0088FE" name="Visitors" />
                      <Bar dataKey="conversions" fill="#00C49F" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No conversion funnel data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dropoff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drop-off Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(dropOffRates).length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(dropOffRates).map(([page, rate]) => ({ page, rate }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="page" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#FF8042" name="Drop-off Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No drop-off data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 