import { supabase } from "./supabase"

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: "admin" | "user" | "analyst"
  avatar_url: string | null
  created_at: string
  updated_at: string
  theme?: string | null
  notification_preferences?: {
    email: boolean
    sms: boolean
    push: boolean
  } | null
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    console.log("Getting current user...")
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("Current user:", user)

    if (!user) {
      console.log("No user found")
      return null
    }

    console.log("Fetching profile for user ID:", user.id)
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    console.log("Profile data:", data)
    return data
  } catch (error) {
    console.error("Error in getCurrentUserProfile:", error)
    return null
  }
}

export async function updateProfile(updates: Partial<Profile>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("No user found")

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return []
  }
}

export async function promoteToAdmin(userEmail: string) {
  try {
    const { data, error } = await supabase.rpc("promote_to_admin", {
      user_email: userEmail,
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

export async function updateUserRole(userId: string, role: "admin" | "user" | "analyst") {
  try {
    const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select().single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function isUserAdmin(): Promise<boolean> {
  try {
    const profile = await getCurrentUserProfile()
    return profile?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
