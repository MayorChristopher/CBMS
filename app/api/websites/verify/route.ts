import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const { websiteId, verificationCode } = await request.json()

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        if (!websiteId || !verificationCode) {
            return NextResponse.json({ error: 'Website ID and verification code are required' }, { status: 400 })
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

        // Verify the website using the database function
        const { data, error } = await supabaseClient
            .rpc('verify_website', {
                website_id: websiteId,
                verification_code: verificationCode
            })

        if (error) {
            console.error('Error verifying website:', error)
            return NextResponse.json({ error: 'Failed to verify website' }, { status: 500 })
        }

        if (!data) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: 'Website verified successfully' })

    } catch (error) {
        console.error('Error processing website verification:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 