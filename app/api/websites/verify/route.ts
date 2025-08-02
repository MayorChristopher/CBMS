import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const { websiteId, websiteUrl, verificationCode } = await request.json()

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        if (!websiteId || !verificationCode || !websiteUrl) {
            return NextResponse.json({ error: 'Website ID, URL, and verification code are required' }, { status: 400 })
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

        // Ensure the URL starts with http/https
        let url = websiteUrl;
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }

        // Fetch the website content to check for verification code
        let verified = false;
        try {
            const response = await fetch(url, { 
                headers: { 'User-Agent': 'CBMS-Verification-Bot' },
                // Set a reasonable timeout
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const html = await response.text();
                
                // Check for verification code in meta tag
                const metaTagRegex = new RegExp(
                    `<meta[^>]*name=["']cbms-verification["'][^>]*content=["']${verificationCode}["'][^>]*>`, 'i'
                );
                
                // Check for verification code in script tag
                const scriptTagRegex = new RegExp(
                    `window\\.CBMS_VERIFICATION\\s*=\\s*["']${verificationCode}["']`, 'i'
                );
                
                verified = metaTagRegex.test(html) || scriptTagRegex.test(html);
            }
        } catch (fetchError) {
            console.error('Error fetching website:', fetchError);
            return NextResponse.json({ 
                error: 'Could not access website. Please ensure it is publicly accessible.',
                verified: false 
            }, { status: 400 });
        }

        if (!verified) {
            return NextResponse.json({ 
                error: 'Verification code not found on website. Please check your implementation.',
                verified: false 
            }, { status: 400 });
        }

        // Update the website status in the database
        const { data, error } = await supabaseClient
            .from('websites')
            .update({
                status: 'active',
                is_verified: true,
                verification_code: null
            })
            .eq('id', websiteId)
            .select()
            .single();

        if (error) {
            console.error('Error updating website status:', error)
            return NextResponse.json({ error: 'Failed to update website status', verified: true }, { status: 500 })
        }

        return NextResponse.json({ 
            verified: true, 
            success: true, 
            message: 'Website verified successfully' 
        });

    } catch (error) {
        console.error('Error processing website verification:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 