import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Define the schema for validation
const EventSchema = z.object({
    event_type: z.string(),
    session_id: z.string(),
    page_url: z.string().url(),
    timestamp: z.string().datetime(),
    api_key: z.string().min(3),
}).catchall(z.any()); // Allow additional properties

const EventsPayloadSchema = z.object({
    events: z.array(EventSchema)
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate with Zod
        const validationResult = EventsPayloadSchema.safeParse(body);

        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error);
            return NextResponse.json({
                error: 'Invalid events data',
                details: validationResult.error.format()
            }, { status: 400 });
        }

        const { events } = validationResult.data;

        // Validate the Supabase connection
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey ||
            supabaseUrl === 'https://placeholder.supabase.co' ||
            supabaseAnonKey === 'placeholder-key') {
            console.error('Supabase not properly configured');
            return NextResponse.json({
                error: 'Backend configuration error',
                message: 'The tracking service is not properly configured. Please contact support.'
            }, { status: 500 });
        }

        // Process each event
        const processedEvents = events.map((event) => {
            const {
                event_type,
                session_id,
                page_url,
                timestamp,
                api_key,
                ...metadata
            } = event;

            // Basic enrichment
            return {
                event_type,
                session_id,
                page_url,
                timestamp,
                customer_id: metadata.customer_id || null,
                element_id: metadata.element_id || null,
                metadata: {
                    ...metadata,
                    user_agent: request.headers.get('user-agent') || null,
                    referer: request.headers.get('referer') || null,
                    ip: request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        'unknown'
                }
            };
        });

        // Insert events into the database
        const { error } = await supabase
            .from('activities')
            .insert(processedEvents);

        if (error) {
            console.error('Error inserting events:', error);
            if (error.code === '42P01') {
                return NextResponse.json({
                    error: 'Configuration error',
                    message: 'The activities table does not exist. Database setup may be incomplete.'
                }, { status: 500 });
            }
            return NextResponse.json({
                error: 'Failed to store events',
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: processedEvents.length,
            message: 'Events tracked successfully'
        });
    } catch (error) {
        console.error('Error processing tracking events:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
// ...existing code...
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