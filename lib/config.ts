// Configuration for CBMS - automatically switches between dev and production
export const config = {
    // Base URL - automatically detects environment
    baseUrl: process.env.NODE_ENV === 'production'
        ? 'https://cbmsystem.vercel.app'
        : 'http://localhost:3000',

    // API URL
    apiUrl: process.env.NODE_ENV === 'production'
        ? 'https://cbmsystem.vercel.app/api'
        : 'http://localhost:3000/api',

    // Tracking script URL
    trackingScriptUrl: process.env.NODE_ENV === 'production'
        ? 'https://cbmsystem.vercel.app/tracking.js'
        : 'http://localhost:3000/tracking.js',

    // Environment detection
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',

    // Supabase configuration
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rzqoxxgeiwsvdmcckzbu.supabase.co',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
}// Helper function to get tracking script with API key
export function getTrackingScript(apiKey: string, customApiUrl?: string) {
    const apiUrl = customApiUrl || config.apiUrl
    // Embed the API key directly in the script tag for easier integration
    return `<!-- CBMS Tracking Code - Start -->
<script>
  window.CBMS_API_KEY = "${apiKey}";
  window.CBMS_API_ENDPOINT = "${apiUrl}/track";
</script>
<script async src="${config.trackingScriptUrl}"></script>
<!-- CBMS Tracking Code - End -->`
}

// Helper function to get API endpoint URL
export function getApiUrl(endpoint: string) {
    return `${config.apiUrl}/${endpoint}`
} 