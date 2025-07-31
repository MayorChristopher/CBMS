"use client"

import { useEffect, useState } from "react"
import { UserManagement } from "@/components/dashboard/user-management"
import { getCurrentUserProfile, type Profile } from "@/lib/profiles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle } from "lucide-react"

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      console.log("Loading profile...")
      const userProfile = await getCurrentUserProfile()
      console.log("Profile result:", userProfile)
      setProfile(userProfile)
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Administrative controls and user management</p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You need admin privileges to view this page. Current role: {profile?.role || "unknown"}
          </AlertDescription>
        </Alert>

        {/* Debug info */}
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold">Debug Info:</h3>
          <p>Profile exists: {profile ? "Yes" : "No"}</p>
          <p>Profile role: {profile?.role || "null"}</p>
          <p>Profile ID: {profile?.id || "null"}</p>
          <p>Profile email: {profile?.email || "null"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Admin Panel
        </h1>
        <p className="text-gray-600">Administrative controls and user management</p>
      </div>

      <UserManagement />
    </div>
  )
}
