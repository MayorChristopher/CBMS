import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`
    ⚠️  Supabase environment variables are not configured!
    
    Please create a .env.local file in your project root with the following variables:
    
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    You can find these values in your Supabase project dashboard under Settings > API.
    
    Example:
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  `)
  
  // Provide fallback values for development (these won't work but prevent crashes)
  if (typeof window !== 'undefined') {
    console.warn('Using fallback Supabase configuration. Authentication and database operations will fail.')
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          device_info: any
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          device_info?: any
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          device_info?: any
          location?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
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
        }
        Insert: {
          id?: string
          customer_id?: string | null
          session_start?: string
          session_end?: string | null
          duration?: string | null
          pages_visited?: number | null
          device_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          session_start?: string
          session_end?: string | null
          duration?: string | null
          pages_visited?: number | null
          device_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
        }
      }
      activities: {
        Row: {
          id: string
          session_id: string | null
          customer_id: string | null
          event_type: string
          page_url: string
          element_id: string | null
          timestamp: string
          metadata: any
        }
        Insert: {
          id?: string
          session_id?: string | null
          customer_id?: string | null
          event_type: string
          page_url: string
          element_id?: string | null
          timestamp?: string
          metadata?: any
        }
        Update: {
          id?: string
          session_id?: string | null
          customer_id?: string | null
          event_type?: string
          page_url?: string
          element_id?: string | null
          timestamp?: string
          metadata?: any
        }
      }
      engagement_metrics: {
        Row: {
          id: string
          customer_id: string | null
          engagement_score: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          last_updated: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          engagement_score?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          last_updated?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          engagement_score?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          last_updated?: string
        }
      }
    }
  }
}
