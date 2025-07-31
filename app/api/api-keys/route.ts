import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

        const { data: apiKeys, error } = await supabaseClient
            .from('api_keys')
            .select(`
                *,
                websites (
                    id,
                    name,
                    url
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching API keys:', error)
            return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
        }

        return NextResponse.json({ apiKeys })

    } catch (error) {
        console.error('Error processing API keys request:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const { websiteId, name } = await request.json()

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        if (!websiteId || !name) {
            return NextResponse.json({ error: 'Website ID and name are required' }, { status: 400 })
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

        // Get user ID from token
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Generate API key
        const apiKey = `cbms_${crypto.randomBytes(32).toString('base64')}`
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
        const keyPrefix = apiKey.substring(0, 8)

        const { data: apiKeyRecord, error } = await supabaseClient
            .from('api_keys')
            .insert([{
                user_id: user.id,
                website_id: websiteId,
                name,
                key_hash: keyHash,
                key_prefix: keyPrefix
            }])
            .select(`
                *,
                websites (
                    id,
                    name,
                    url
                )
            `)
            .single()

        if (error) {
            console.error('Error creating API key:', error)
            return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
        }

        // Return the API key only once (it won't be stored in the database)
        return NextResponse.json({
            apiKey,
            apiKeyRecord: {
                ...apiKeyRecord,
                key_hash: undefined // Don't return the hash
            }
        })

    } catch (error) {
        console.error('Error processing API key creation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const keyId = searchParams.get('id')

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        if (!keyId) {
            return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
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

        const { error } = await supabaseClient
            .from('api_keys')
            .delete()
            .eq('id', keyId)

        if (error) {
            console.error('Error deleting API key:', error)
            return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error processing API key deletion:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 