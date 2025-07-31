"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { analyticsEngine } from "@/lib/analytics"
import { Users, Search, Filter, Eye, Activity, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Customer {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  device_info: any
  location: string | null
  created_at: string
  engagement_score?: number
  total_sessions?: number
  last_activity?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    filterAndSortCustomers()
  }, [customers, searchTerm, filterBy, sortBy])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      
      // Load customers
      const { data: customersData, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Load engagement data for each customer
      const customersWithEngagement = await Promise.all(
        (customersData || []).map(async (customer) => {
          const engagementMetrics = await analyticsEngine.calculateEngagementMetrics(customer.id)
          
          // Get session count
          const { count: sessionCount } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("customer_id", customer.id)

          // Get last activity
          const { data: lastActivity } = await supabase
            .from("activities")
            .select("timestamp")
            .eq("customer_id", customer.id)
            .order("timestamp", { ascending: false })
            .limit(1)

          return {
            ...customer,
            engagement_score: engagementMetrics.engagement_score,
            total_sessions: sessionCount || 0,
            last_activity: lastActivity?.[0]?.timestamp
          }
        })
      )

      setCustomers(customersWithEngagement)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCustomers = () => {
    let filtered = [...customers]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply engagement filter
    switch (filterBy) {
      case "high_engagement":
        filtered = filtered.filter(customer => (customer.engagement_score || 0) >= 70)
        break
      case "medium_engagement":
        filtered = filtered.filter(customer => 
          (customer.engagement_score || 0) >= 30 && (customer.engagement_score || 0) < 70
        )
        break
      case "low_engagement":
        filtered = filtered.filter(customer => (customer.engagement_score || 0) < 30)
        break
      case "active":
        filtered = filtered.filter(customer => (customer.total_sessions || 0) > 0)
        break
      case "inactive":
        filtered = filtered.filter(customer => (customer.total_sessions || 0) === 0)
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "engagement":
          return (b.engagement_score || 0) - (a.engagement_score || 0)
        case "sessions":
          return (b.total_sessions || 0) - (a.total_sessions || 0)
        case "last_activity":
          return new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime()
        case "name":
          return (a.first_name || "").localeCompare(b.first_name || "")
        case "email":
          return a.email.localeCompare(b.email)
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredCustomers(filtered)
  }

  const getEngagementBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-100 text-green-800">High</Badge>
    if (score >= 30) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
    return <Badge className="bg-red-100 text-red-800">Low</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Customer management and analytics</p>
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
          <Users className="h-8 w-8 text-blue-600" />
          Customer Management
        </h1>
        <p className="text-gray-600">View and analyze customer behavior</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => (c.total_sessions || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => (c.engagement_score || 0) >= 70).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                customers.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / customers.length
              )}%
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
                  placeholder="Search customers..."
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
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="high_engagement">High Engagement</SelectItem>
                  <SelectItem value="medium_engagement">Medium Engagement</SelectItem>
                  <SelectItem value="low_engagement">Low Engagement</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
                  <SelectItem value="created_at">Date Joined</SelectItem>
                  <SelectItem value="engagement">Engagement Score</SelectItem>
                  <SelectItem value="sessions">Total Sessions</SelectItem>
                  <SelectItem value="last_activity">Last Activity</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadCustomers} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({filteredCustomers.length} customers)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {customer.first_name && customer.last_name
                            ? `${customer.first_name} ${customer.last_name}`
                            : "No name"}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEngagementBadge(customer.engagement_score || 0)}
                        <span className="text-sm">({customer.engagement_score || 0}%)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{customer.total_sessions || 0}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {customer.location || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {customer.last_activity
                          ? formatDistanceToNow(new Date(customer.last_activity), { addSuffix: true })
                          : "Never"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(customer.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 