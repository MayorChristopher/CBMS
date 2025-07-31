"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUserProfile, Profile } from "@/lib/profiles"
import { supabase } from "@/lib/supabase"
import {
    BarChart3,
    Users,
    MousePointer,
    TrendingUp,
    Activity,
    Eye,
    Clock,
    Globe,
    Target
} from "lucide-react"

interface AnalyticsData {
    totalSessions: number
    totalEvents: number
    activeWebsites: number
    conversionRate: number
    avgSessionDuration: number
    topPages: Array<{ page: string; views: number }>
    recentActivity: Array<{ event: string; timestamp: string; website: string }>
}

export default function AnalystDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const userProfile = await getCurrentUserProfile()
            setProfile(userProfile)

            if (!userProfile || userProfile.role !== 'analyst') {
                return
            }

            // Load analytics data for analyst view
            const { data: sessionsData } = await supabase
                .from('sessions')
                .select('*')

            const { data: eventsData } = await supabase
                .from('tracking_events')
                .select('*')

            const { data: websitesData } = await supabase
                .from('websites')
                .select('*')
                .eq('status', 'active')

            // Calculate analytics
            const totalSessions = sessionsData?.length || 0
            const totalEvents = eventsData?.length || 0
            const activeWebsites = websitesData?.length || 0

            // Calculate conversion rate (simplified)
            const conversionEvents = eventsData?.filter(e => e.event_type === 'form_submit').length || 0
            const conversionRate = totalSessions > 0 ? (conversionEvents / totalSessions) * 100 : 0

            // Calculate average session duration (simplified)
            const avgSessionDuration = totalSessions > 0 ? 180 : 0 // Mock data

            // Get top pages
            const pageViews = eventsData?.filter(e => e.event_type === 'page_view') || []
            const pageCounts = pageViews.reduce((acc: any, event) => {
                acc[event.page_url] = (acc[event.page_url] || 0) + 1
                return acc
            }, {})
            const topPages = Object.entries(pageCounts)
                .map(([page, views]) => ({ page, views: views as number }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)

            // Get recent activity
            const recentActivity = eventsData
                ?.slice(0, 10)
                .map(event => ({
                    event: event.event_type,
                    timestamp: event.timestamp,
                    website: event.page_url
                })) || []

            setAnalytics({
                totalSessions,
                totalEvents,
                activeWebsites,
                conversionRate,
                avgSessionDuration,
                topPages,
                recentActivity
            })

        } catch (err) {
            console.error('Error loading analyst data:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!profile || profile.role !== 'analyst') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access the analyst dashboard.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Analyst Dashboard</h1>
                <p className="text-gray-600">Comprehensive analytics and insights for data analysis</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalSessions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalEvents.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +15.3% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.activeWebsites}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently tracking
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            +2.1% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Pages by Views</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.topPages.map((page, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{page.page}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{page.views} views</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium capitalize">{activity.event.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500 truncate">{activity.website}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(activity.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Analytics */}
            <Card>
                <CardHeader>
                    <CardTitle>Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {analytics?.avgSessionDuration || 0}m
                            </div>
                            <p className="text-sm text-gray-600">Average Session Duration</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                {(analytics?.totalEvents / (analytics?.totalSessions || 1)).toFixed(1)}
                            </div>
                            <p className="text-sm text-gray-600">Events per Session</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {analytics?.topPages.length || 0}
                            </div>
                            <p className="text-sm text-gray-600">Active Pages</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Export</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Button variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Export Analytics Report
                        </Button>
                        <Button variant="outline">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Export Trends Data
                        </Button>
                        <Button variant="outline">
                            <MousePointer className="h-4 w-4 mr-2" />
                            Export User Behavior
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 