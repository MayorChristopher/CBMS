import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const { events } = await request.json()

        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid events data' }, { status: 400 })
        }

        // Process each event
        const processedEvents = events.map((event: any) => {
            const {
                event_type,
                session_id,
                page_url,
                timestamp,
                api_key,
                ...metadata
            } = event

            return {
                event_type,
                session_id,
                page_url,
                timestamp,
                metadata,
                // We'll need to get the user_id from the api_key (which is the profile id)
                // For now, we'll store the api_key and process it later
                api_key
            }
        })

        // Insert events into database
        const { error } = await supabase
            .from('tracking_events')
            .insert(processedEvents)

        if (error) {
            console.error('Error inserting tracking events:', error)
            return NextResponse.json({ error: 'Failed to store events' }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: events.length }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })

    } catch (error) {
        console.error('Error processing tracking request:', error)
        return NextResponse.json({ error: 'Internal server error' }, {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        })
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
} 