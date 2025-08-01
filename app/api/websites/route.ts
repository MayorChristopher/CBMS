import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        // Create a Supabase client with the user's token
        const supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        )

        const { data: websites, error } = await supabaseClient
            .from('websites')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching websites:', error)
            return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 })
        }

        return NextResponse.json({ websites })

    } catch (error) {
        console.error('Error processing websites request:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const { name, url } = await request.json()

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        if (!name || !url) {
            return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
        }

        // Validate URL format
        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
        }

        // Create a Supabase client with the user's token
        const supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            }
        )

        // Generate verification code
        const verificationCode = Math.random().toString(36).substring(2, 10)

        const { data: website, error } = await supabaseClient
            .from('websites')
            .insert([{
                name,
                url,
                status: 'pending',
                verification_code: verificationCode,
                is_verified: false
            }])
            .select()
            .single()

        if (error) {
            console.error('Error creating website:', error)
            return NextResponse.json({ error: 'Failed to create website' }, { status: 500 })
        }

        return NextResponse.json({ website })

    } catch (error) {
        console.error('Error processing website creation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 