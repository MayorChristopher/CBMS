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
    Target,
    Calendar,
    ArrowUpRight,
    Settings
} from "lucide-react"

interface CustomerData {
    totalSessions: number
    totalEvents: number
    activeWebsites: number
    conversionRate: number
    recentActivity: Array<{ event: string; timestamp: string; website: string }>
    monthlyTrends: Array<{ month: string; sessions: number }>
}

export default function CustomerDashboard() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [customerData, setCustomerData] = useState<CustomerData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const userProfile = await getCurrentUserProfile()
            setProfile(userProfile)

            if (!userProfile) {
                return
            }

            // Load customer-specific data
            const { data: sessionsData } = await supabase
                .from('sessions')
                .select('*')

            const { data: eventsData } = await supabase
                .from('tracking_events')
                .select('*')

            const { data: websitesData } = await supabase
                .from('websites')
                .select('*')
                .eq('user_id', userProfile.id)
                .eq('status', 'active')

            // Calculate customer metrics
            const totalSessions = sessionsData?.length || 0
            const totalEvents = eventsData?.length || 0
            const activeWebsites = websitesData?.length || 0

            // Calculate conversion rate
            const conversionEvents = eventsData?.filter(e => e.event_type === 'form_submit').length || 0
            const conversionRate = totalSessions > 0 ? (conversionEvents / totalSessions) * 100 : 0

            // Get recent activity (limited view)
            const recentActivity = eventsData
                ?.slice(0, 5)
                .map(event => ({
                    event: event.event_type,
                    timestamp: event.timestamp,
                    website: event.page_url
                })) || []

            // Mock monthly trends
            const monthlyTrends = [
                { month: 'Jan', sessions: 120 },
                { month: 'Feb', sessions: 150 },
                { month: 'Mar', sessions: 180 },
                { month: 'Apr', sessions: 200 },
                { month: 'May', sessions: 220 },
                { month: 'Jun', sessions: 250 }
            ]

            setCustomerData({
                totalSessions,
                totalEvents,
                activeWebsites,
                conversionRate,
                recentActivity,
                monthlyTrends
            })

        } catch (err) {
            console.error('Error loading customer data:', err)
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

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-gray-600">Please log in to access your dashboard.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {profile.first_name}!</h1>
                <p className="text-gray-600">Here's an overview of your website analytics</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customerData?.totalSessions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +12.5% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customerData?.totalEvents.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +8.2% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customerData?.activeWebsites}</div>
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
                        <div className="text-2xl font-bold">{customerData?.conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            +1.8% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Session Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Total Sessions</p>
                            <p className="text-2xl font-bold">1,320</p>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            +15.2%
                        </Badge>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {customerData?.monthlyTrends.map((trend, index) => (
                            <div key={index} className="text-center">
                                <div className="text-sm font-medium">{trend.month}</div>
                                <div className="text-lg font-bold">{trend.sessions}</div>
                                <div
                                    className="w-full bg-blue-100 rounded-full h-2 mt-1"
                                    style={{
                                        background: `linear-gradient(to top, #3b82f6 ${(trend.sessions / 300) * 100}%, #e5e7eb 0%)`
                                    }}
                                ></div>
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
                        {customerData?.recentActivity.length ? (
                            customerData.recentActivity.map((activity, index) => (
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
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No recent activity</p>
                                <p className="text-sm">Start tracking your website to see activity here</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                            <Globe className="h-6 w-6 mb-2" />
                            <span>Add Website</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                            <BarChart3 className="h-6 w-6 mb-2" />
                            <span>View Analytics</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                            <Settings className="h-6 w-6 mb-2" />
                            <span>Settings</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Upgrade Notice */}
            {profile.role === 'user' && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-blue-800">Upgrade to Analyst</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-700 mb-4">
                            Get access to advanced analytics, detailed reports, and export capabilities.
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Upgrade Now
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 