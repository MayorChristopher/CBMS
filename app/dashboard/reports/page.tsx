"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { analyticsEngine, type EngagementMetrics } from "@/lib/analytics"
import { supabase } from "@/lib/supabase"
import { FileText, Download, Calendar, BarChart3, Users, TrendingUp } from "lucide-react"

interface ReportData {
  engagementMetrics: EngagementMetrics
  totalCustomers: number
  totalSessions: number
  totalActivities: number
  topPages: Array<{ page: string; views: number }>
  deviceBreakdown: Array<{ device: string; count: number }>
  timeRange: string
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState("engagement")
  const [timeRange, setTimeRange] = useState("7d")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    generateReport()
  }, [timeRange, startDate, endDate])

  const generateReport = async () => {
    try {
      setLoading(true)
      
      // Get engagement metrics
      const engagementMetrics = await analyticsEngine.calculateEngagementMetrics(undefined, timeRange)
      
      // Get customer count
      const { count: customerCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })

      // Get session count
      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })

      // Get activity count
      const { count: activityCount } = await supabase
        .from("tracking_events")
        .select("*", { count: "exact", head: true })

      // Get top pages
      const { data: activities } = await supabase
        .from("tracking_events")
        .select("page_url")
        .eq("event_type", "page_view")

      const pageViews = activities?.reduce((acc, activity) => {
        const page = activity.page_url
        acc[page] = (acc[page] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const topPages = Object.entries(pageViews)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)

      // Get device breakdown
      const { data: sessions } = await supabase
        .from("sessions")
        .select("device_type")

      const deviceCounts = sessions?.reduce((acc, session) => {
        const device = session.device_type || "unknown"
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const deviceBreakdown = Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }))

      setReportData({
        engagementMetrics,
        totalCustomers: customerCount || 0,
        totalSessions: sessionCount || 0,
        totalActivities: activityCount || 0,
        topPages,
        deviceBreakdown,
        timeRange
      })
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!reportData) return

    try {
      // Create PDF content
      const pdfContent = generatePDFContent(reportData)
      
      // For now, we'll create a downloadable text file
      // In a real implementation, you'd use a library like jsPDF
      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cbms-report-${reportType}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  const exportToExcel = async () => {
    if (!reportData) return

    try {
      // Create CSV content (simplified Excel export)
      const csvContent = generateCSVContent(reportData)
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cbms-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting Excel:', error)
    }
  }

  const generatePDFContent = (data: ReportData): string => {
    return `
CBMS - Customer Behaviour Monitoring System
Report Generated: ${new Date().toLocaleDateString()}
Time Range: ${data.timeRange}

ENGAGEMENT METRICS
=================
Engagement Score: ${data.engagementMetrics.engagement_score}%
Bounce Rate: ${data.engagementMetrics.bounce_rate}%
Conversion Rate: ${data.engagementMetrics.conversion_rate}%
Average Session Duration: ${data.engagementMetrics.avg_session_duration}s
Pages per Session: ${data.engagementMetrics.pages_per_session}
Return Visitor Rate: ${data.engagementMetrics.return_visitor_rate}%

OVERVIEW STATISTICS
==================
Total Customers: ${data.totalCustomers}
Total Sessions: ${data.totalSessions}
Total Activities: ${data.totalActivities}

TOP PAGES
=========
${data.topPages.map((page, index) => `${index + 1}. ${page.page}: ${page.views} views`).join('\n')}

DEVICE BREAKDOWN
===============
${data.deviceBreakdown.map(device => `${device.device}: ${device.count} sessions`).join('\n')}
    `.trim()
  }

  const generateCSVContent = (data: ReportData): string => {
    const rows = [
      ['Metric', 'Value'],
      ['Engagement Score', `${data.engagementMetrics.engagement_score}%`],
      ['Bounce Rate', `${data.engagementMetrics.bounce_rate}%`],
      ['Conversion Rate', `${data.engagementMetrics.conversion_rate}%`],
      ['Avg Session Duration', `${data.engagementMetrics.avg_session_duration}s`],
      ['Pages per Session', data.engagementMetrics.pages_per_session.toString()],
      ['Return Visitor Rate', `${data.engagementMetrics.return_visitor_rate}%`],
      ['Total Customers', data.totalCustomers.toString()],
      ['Total Sessions', data.totalSessions.toString()],
      ['Total Activities', data.totalActivities.toString()],
      [''],
      ['Top Pages', 'Views'],
      ...data.topPages.map(page => [page.page, page.views.toString()]),
      [''],
      ['Device Type', 'Sessions'],
      ...data.deviceBreakdown.map(device => [device.device, device.count.toString()])
    ]

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export analytics reports</p>
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
          <FileText className="h-8 w-8 text-blue-600" />
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Generate and export comprehensive reports</p>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement Report</SelectItem>
                  <SelectItem value="behavior">Behavior Analysis</SelectItem>
                  <SelectItem value="conversion">Conversion Report</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate?.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate?.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={generateReport} disabled={loading}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button onClick={exportToPDF} disabled={!reportData}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={exportToExcel} disabled={!reportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Engagement Score</p>
                  <p className="text-2xl font-bold">{reportData.engagementMetrics.engagement_score}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bounce Rate</p>
                  <p className="text-2xl font-bold">{reportData.engagementMetrics.bounce_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{reportData.engagementMetrics.conversion_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Session Duration</p>
                  <p className="text-2xl font-bold">{reportData.engagementMetrics.avg_session_duration}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Overview Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold">{reportData.totalCustomers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{reportData.totalSessions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold">{reportData.totalActivities.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pages per Session</p>
                  <p className="text-2xl font-bold">{reportData.engagementMetrics.pages_per_session}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportData.topPages.map((page, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm truncate">{page.page}</span>
                    <span className="text-sm font-medium">{page.views} views</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportData.deviceBreakdown.map((device, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{device.device}</span>
                    <span className="text-sm font-medium">{device.count} sessions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 