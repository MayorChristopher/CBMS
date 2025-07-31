"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { Activity, Clock, MapPin, Monitor, Smartphone, Tablet, Search, Filter, Eye } from "lucide-react"
import { formatDistanceToNow, formatDuration, intervalToDuration } from "date-fns"

interface Session {
    id: string
    customer_id: string | null
    session_start: string
    session_end: string | null
    duration: string | null
    pages_visited: number | null
    device_type: string | null
    ip_address: string | null
    user_agent: string | null
    referrer: string | null
    customer_email?: string
    activities_count?: number
    engagement_score?: number
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterBy, setFilterBy] = useState("all")
    const [sortBy, setSortBy] = useState("session_start")

    useEffect(() => {
        loadSessions()
    }, [])

    useEffect(() => {
        filterAndSortSessions()
    }, [sessions, searchTerm, filterBy, sortBy])

    const loadSessions = async () => {
        try {
            setLoading(true)

            // Load sessions with customer data
            const { data: sessionsData, error } = await supabase
                .from("sessions")
                .select(`
          *,
          customers!sessions_customer_id_fkey(email)
        `)
                .order("session_start", { ascending: false })

            if (error) throw error

            // Load activity counts and engagement scores for each session
            const sessionsWithDetails = await Promise.all(
                (sessionsData || []).map(async (session) => {
                    // Get activity count for this session
                    const { count: activityCount } = await supabase
                        .from("activities")
                        .select("*", { count: "exact", head: true })
                        .eq("session_id", session.id)

                    // Calculate engagement score based on activities
                    const { data: activities } = await supabase
                        .from("activities")
                        .select("*")
                        .eq("session_id", session.id)

                    const engagementScore = calculateSessionEngagement(activities || [])

                    return {
                        ...session,
                        customer_email: session.customers?.email,
                        activities_count: activityCount || 0,
                        engagement_score: engagementScore
                    }
                })
            )

            setSessions(sessionsWithDetails)
        } catch (error) {
            console.error('Error loading sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSessionEngagement = (activities: any[]): number => {
        if (activities.length === 0) return 0

        const activityTypes = new Set(activities.map(a => a.event_type))
        const pageViews = activities.filter(a => a.event_type === 'page_view').length
        const clicks = activities.filter(a => a.event_type === 'click').length
        const formSubmissions = activities.filter(a => a.event_type === 'form_submit').length

        // Calculate engagement score based on activity diversity and types
        let score = 0
        score += activityTypes.size * 10 // Diversity bonus
        score += pageViews * 5 // Page views
        score += clicks * 3 // Clicks
        score += formSubmissions * 20 // Form submissions (high value)

        return Math.min(100, score)
    }

    const filterAndSortSessions = () => {
        let filtered = [...sessions]

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(session =>
                session.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                session.ip_address?.includes(searchTerm) ||
                session.device_type?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Apply filter
        switch (filterBy) {
            case "active":
                filtered = filtered.filter(session => !session.session_end)
                break
            case "completed":
                filtered = filtered.filter(session => session.session_end)
                break
            case "high_engagement":
                filtered = filtered.filter(session => (session.engagement_score || 0) >= 70)
                break
            case "mobile":
                filtered = filtered.filter(session => session.device_type === 'mobile')
                break
            case "desktop":
                filtered = filtered.filter(session => session.device_type === 'desktop')
                break
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "duration":
                    return (parseInt(b.duration || '0') - parseInt(a.duration || '0'))
                case "pages_visited":
                    return (b.pages_visited || 0) - (a.pages_visited || 0)
                case "engagement":
                    return (b.engagement_score || 0) - (a.engagement_score || 0)
                case "activities":
                    return (b.activities_count || 0) - (a.activities_count || 0)
                default:
                    return new Date(b.session_start).getTime() - new Date(a.session_start).getTime()
            }
        })

        setFilteredSessions(filtered)
    }

    const getDeviceIcon = (deviceType: string | null) => {
        switch (deviceType) {
            case 'mobile':
                return <Smartphone className="h-4 w-4" />
            case 'tablet':
                return <Tablet className="h-4 w-4" />
            case 'desktop':
                return <Monitor className="h-4 w-4" />
            default:
                return <Activity className="h-4 w-4" />
        }
    }

    const getEngagementBadge = (score: number) => {
        if (score >= 70) return <Badge className="bg-green-100 text-green-800">High</Badge>
        if (score >= 30) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
        return <Badge className="bg-red-100 text-red-800">Low</Badge>
    }

    const formatDuration = (duration: string | null) => {
        if (!duration) return "N/A"

        try {
            // Parse PostgreSQL interval format
            const matches = duration.match(/(\d+):(\d+):(\d+)/)
            if (matches) {
                const hours = parseInt(matches[1])
                const minutes = parseInt(matches[2])
                const seconds = parseInt(matches[3])

                if (hours > 0) {
                    return `${hours}h ${minutes}m`
                } else if (minutes > 0) {
                    return `${minutes}m ${seconds}s`
                } else {
                    return `${seconds}s`
                }
            }
            return duration
        } catch {
            return duration
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
                    <p className="text-gray-600">Session management and analytics</p>
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
                    <Activity className="h-8 w-8 text-blue-600" />
                    Session Management
                </h1>
                <p className="text-gray-600">View and analyze user sessions</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessions.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {sessions.filter(s => !s.session_end).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(() => {
                                const completedSessions = sessions.filter(s => s.duration)
                                if (completedSessions.length === 0) return "0s"

                                const totalSeconds = completedSessions.reduce((sum, s) => {
                                    const matches = s.duration?.match(/(\d+):(\d+):(\d+)/)
                                    if (matches) {
                                        return sum + parseInt(matches[1]) * 3600 + parseInt(matches[2]) * 60 + parseInt(matches[3])
                                    }
                                    return sum
                                }, 0)

                                const avgSeconds = Math.round(totalSeconds / completedSessions.length)
                                const minutes = Math.floor(avgSeconds / 60)
                                const seconds = avgSeconds % 60
                                return `${minutes}m ${seconds}s`
                            })()}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Pages</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {sessions.length === 0 ? 0 : Math.round(
                                sessions.reduce((sum, s) => sum + (s.pages_visited || 0), 0) / sessions.length
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters & Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search sessions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Filter By</label>
                            <Select value={filterBy} onValueChange={setFilterBy}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sessions</SelectItem>
                                    <SelectItem value="active">Active Sessions</SelectItem>
                                    <SelectItem value="completed">Completed Sessions</SelectItem>
                                    <SelectItem value="high_engagement">High Engagement</SelectItem>
                                    <SelectItem value="mobile">Mobile</SelectItem>
                                    <SelectItem value="desktop">Desktop</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Sort By</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="session_start">Start Time</SelectItem>
                                    <SelectItem value="duration">Duration</SelectItem>
                                    <SelectItem value="pages_visited">Pages Visited</SelectItem>
                                    <SelectItem value="engagement">Engagement</SelectItem>
                                    <SelectItem value="activities">Activities</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button onClick={loadSessions} variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Session List ({filteredSessions.length} sessions)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Device</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Pages</TableHead>
                                    <TableHead>Engagement</TableHead>
                                    <TableHead>Started</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-sm">
                                                    {session.id.substring(0, 8)}...
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {session.ip_address || "No IP"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {session.customer_email || "Anonymous"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getDeviceIcon(session.device_type)}
                                                <span className="text-sm capitalize">
                                                    {session.device_type || "Unknown"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">
                                                {formatDuration(session.duration)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-3 w-3 text-gray-400" />
                                                <span className="text-sm font-medium">
                                                    {session.pages_visited || 0}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getEngagementBadge(session.engagement_score || 0)}
                                                <span className="text-sm">({session.engagement_score || 0}%)</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600">
                                                {formatDistanceToNow(new Date(session.session_start), { addSuffix: true })}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredSessions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No sessions found matching your criteria.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 