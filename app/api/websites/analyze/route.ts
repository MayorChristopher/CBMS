import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { url } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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
    );

    // Ensure the URL starts with http/https
    let siteUrl = url;
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }

    try {
      const response = await fetch(siteUrl, {
        headers: { 'User-Agent': 'CBMS-Analysis-Bot' },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        return NextResponse.json({
          error: 'Could not access website. Please ensure it is publicly accessible.',
          success: false
        }, { status: 400 });
      }

      const html = await response.text();

      // Basic analysis of the website
      const analysis = {
        title: extractTitle(html),
        metaTags: extractMetaTags(html),
        headings: extractHeadings(html),
        links: extractLinks(html),
        analytics: detectAnalytics(html),
        technologies: detectTechnologies(html),
        pageSize: html.length,
        hasImages: html.includes('<img'),
        hasVideos: html.includes('<video') || html.includes('youtube.com') || html.includes('vimeo.com'),
        hasForms: html.includes('<form'),
        hasTracking: detectTracking(html),
        hasCookieConsent: detectCookieConsent(html),
        socialMedia: detectSocialMedia(html),
        performance: {
          resourceCount: countResources(html),
          scriptCount: countScripts(html),
          cssCount: countStylesheets(html)
        }
      };

      return NextResponse.json({
        success: true,
        analysis
      });
    } catch (fetchError) {
      console.error('Error fetching website:', fetchError);
      return NextResponse.json({
        error: 'Error analyzing website. Please check the URL and try again.',
        success: false
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in website analysis API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for website analysis
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1] : 'No title found';
}

function extractMetaTags(html: string): Record<string, string> {
  const metaTags: Record<string, string> = {};
  
  // Extract meta description
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i);
  if (descriptionMatch) {
    metaTags.description = descriptionMatch[1];
  }
  
  // Extract meta keywords
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["'](.*?)["'][^>]*>/i);
  if (keywordsMatch) {
    metaTags.keywords = keywordsMatch[1];
  }
  
  // Extract Open Graph title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["'][^>]*>/i);
  if (ogTitleMatch) {
    metaTags['og:title'] = ogTitleMatch[1];
  }
  
  // Extract Open Graph description
  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["'][^>]*>/i);
  if (ogDescriptionMatch) {
    metaTags['og:description'] = ogDescriptionMatch[1];
  }
  
  return metaTags;
}

function extractHeadings(html: string): Record<string, number> {
  const headings: Record<string, number> = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0
  };
  
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>.*?<\/h${i}>`, 'gi');
    const matches = html.match(regex);
    headings[`h${i}`] = matches ? matches.length : 0;
  }
  
  return headings;
}

function extractLinks(html: string): { internal: number, external: number } {
  const linkMatches = html.match(/<a[^>]*href=["'](.*?)["'][^>]*>/gi) || [];
  let internal = 0;
  let external = 0;
  
  // Simple heuristic - links that don't start with http are likely internal
  for (const link of linkMatches) {
    if (link.includes('href="http') || link.includes("href='http")) {
      external++;
    } else {
      internal++;
    }
  }
  
  return { internal, external };
}

function detectAnalytics(html: string): string[] {
  const analytics: string[] = [];
  
  if (html.includes('google-analytics.com') || html.includes('GoogleAnalyticsObject')) {
    analytics.push('Google Analytics');
  }
  
  if (html.includes('analytics.js') || html.includes('gtag')) {
    analytics.push('Google Tag Manager');
  }
  
  if (html.includes('hotjar')) {
    analytics.push('Hotjar');
  }
  
  if (html.includes('facebook.com/tr')) {
    analytics.push('Facebook Pixel');
  }
  
  if (html.includes('script.crazyegg.com')) {
    analytics.push('Crazy Egg');
  }
  
  return analytics;
}

function detectTechnologies(html: string): string[] {
  const technologies: string[] = [];
  
  if (html.includes('react')) {
    technologies.push('React');
  }
  
  if (html.includes('angular')) {
    technologies.push('Angular');
  }
  
  if (html.includes('vue')) {
    technologies.push('Vue.js');
  }
  
  if (html.includes('bootstrap')) {
    technologies.push('Bootstrap');
  }
  
  if (html.includes('tailwind')) {
    technologies.push('Tailwind CSS');
  }
  
  if (html.includes('wordpress')) {
    technologies.push('WordPress');
  }
  
  if (html.includes('shopify')) {
    technologies.push('Shopify');
  }
  
  if (html.includes('wix')) {
    technologies.push('Wix');
  }
  
  return technologies;
}

function detectTracking(html: string): boolean {
  // Check for common tracking technologies
  return (
    html.includes('google-analytics.com') || 
    html.includes('googletagmanager.com') || 
    html.includes('facebook.com/tr') ||
    html.includes('tracking') ||
    html.includes('analytics') ||
    html.includes('pixel')
  );
}

function detectCookieConsent(html: string): boolean {
  return (
    html.toLowerCase().includes('cookie consent') || 
    html.toLowerCase().includes('cookie policy') ||
    html.toLowerCase().includes('cookie banner') ||
    html.toLowerCase().includes('gdpr')
  );
}

function detectSocialMedia(html: string): string[] {
  const socialMedia: string[] = [];
  
  if (html.includes('facebook.com')) {
    socialMedia.push('Facebook');
  }
  
  if (html.includes('twitter.com') || html.includes('x.com')) {
    socialMedia.push('Twitter/X');
  }
  
  if (html.includes('instagram.com')) {
    socialMedia.push('Instagram');
  }
  
  if (html.includes('linkedin.com')) {
    socialMedia.push('LinkedIn');
  }
  
  if (html.includes('tiktok.com')) {
    socialMedia.push('TikTok');
  }
  
  if (html.includes('youtube.com')) {
    socialMedia.push('YouTube');
  }
  
  return socialMedia;
}

function countResources(html: string): number {
  const scriptMatches = html.match(/<script[^>]*>/gi) || [];
  const linkMatches = html.match(/<link[^>]*>/gi) || [];
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  
  return scriptMatches.length + linkMatches.length + imgMatches.length;
}

function countScripts(html: string): number {
  const scriptMatches = html.match(/<script[^>]*>/gi) || [];
  return scriptMatches.length;
}

function countStylesheets(html: string): number {
  const styleMatches = html.match(/<style[^>]*>/gi) || [];
  const linkStyleMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  
  return styleMatches.length + linkStyleMatches.length;
}