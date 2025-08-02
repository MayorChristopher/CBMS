import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"

// Helper function to check if Supabase is properly configured
function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url === 'https://placeholder.supabase.co' || key === 'placeholder-key') {
    throw new Error(
      'Supabase is not properly configured. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly.'
    )
  }
}

// Helper function to add timeout to async operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ])
}

export async function signIn(email: string, password: string) {
  try {
    checkSupabaseConfig()

    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      })
    )
    return { data, error }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Authentication failed')
    }
  }
}

export async function signUp(email: string, password: string, metadata?: { first_name?: string; last_name?: string }) {
  try {
    checkSupabaseConfig()

    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: metadata || {},
        },
      })
    )
    return { data, error }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Registration failed')
    }
  }
}

export async function signOut() {
  try {
    checkSupabaseConfig()

    const { error } = await withTimeout(supabase.auth.signOut())
    return { error }
  } catch (error) {
    console.error('Sign out error:', error)
    return {
      error: error instanceof Error ? error : new Error('Sign out failed')
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    checkSupabaseConfig()

    const {
      data: { user },
    } = await withTimeout(supabase.auth.getUser())
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  try {
    checkSupabaseConfig()

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  } catch (error) {
    console.error('Auth state change error:', error)
    // Return a dummy subscription that can be unsubscribed
    return { data: { subscription: { unsubscribe: () => { } } } }
  }
}

export async function resetPassword(email: string) {
  try {
    checkSupabaseConfig()

    const { data, error } = await withTimeout(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
    )
    return { data, error }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Password reset failed')
    }
  }
}
