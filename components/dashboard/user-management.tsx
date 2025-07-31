"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAllProfiles, updateUserRole, type Profile } from "@/lib/profiles"
import { Users, Shield, User, BarChart3, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const roleIcons = {
  admin: Shield,
  user: User,
  analyst: BarChart3,
}

const roleColors = {
  admin: "bg-red-100 text-red-800",
  user: "bg-blue-100 text-blue-800",
  analyst: "bg-green-100 text-green-800",
}

export function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const data = await getAllProfiles()
      setProfiles(data)
    } catch (err) {
      setError("Failed to load user profiles")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: "admin" | "user" | "analyst") => {
    setUpdating(userId)
    setError("")

    try {
      const { error } = await updateUserRole(userId, newRole)

      if (error) {
        setError("Failed to update user role")
      } else {
        // Update local state
        setProfiles(profiles.map((profile) => (profile.id === userId ? { ...profile, role: newRole } : profile)))
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
          <Badge variant="secondary" className="ml-auto">
            {profiles.length} users
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const RoleIcon = roleIcons[profile.role]
                const roleColorClass = roleColors[profile.role]

                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {profile.first_name || profile.last_name
                              ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                              : "No name"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColorClass}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {profile.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(value: "admin" | "user" | "analyst") => handleRoleChange(profile.id, value)}
                        disabled={updating === profile.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="analyst">
                            <div className="flex items-center">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analyst
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-2" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {profiles.length === 0 && <div className="text-center py-8 text-gray-500">No users found</div>}
      </CardContent>
    </Card>
  )
}
