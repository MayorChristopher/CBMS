# CBMS Tracking Integration Guide

## Overview

This guide explains how to integrate CBMS tracking into external websites to collect analytics data.

---

**Before you start:**

1. Double-check your `.env.local` for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Ensure the `activities` table exists in your Supabase project (see database setup below).
3. Make sure the client is authenticated if required by your RLS policies.
4. If you see errors, check the browser console for detailed error logs.

---

## Issues Fixed

1. **CORS Headers**: Added proper CORS headers to allow cross-origin requests
2. **API URL Configuration**: Made the API URL configurable instead of hardcoded to localhost
3. **Error Handling**: Improved error handling and event re-queuing
4. **Debugging**: Added console logging for better debugging

## Prerequisites

1. Your CBMS application must be deployed to a publicly accessible domain (not localhost)
2. You need a valid API key for authentication

## Deployment Steps

### 1. Deploy Your CBMS Application

Make sure your CBMS application is deployed to a public domain (e.g., `https://your-cbms-domain.com`).

#### Environment Setup

1. Create a `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Get your Supabase credentials from your Supabase dashboard (Settings → API).
3. Restart your development server after updating `.env.local`.

#### Database Setup

1. Run the SQL scripts in the `scripts/` directory in your Supabase SQL editor:
   - `01-create-tables.sql` (creates `activities` and other tables)
   - `02-rls-policies.sql` (sets up Row Level Security)
   - Other scripts as needed for your project.
2. Confirm the `activities` table exists in your Supabase project.

### 2. Get Your API Key

1. Log into your CBMS dashboard.
2. Go to the Integration page.
3. Add your website URL and verify ownership if required.
4. Generate or copy your API key for the website.

### 3. Integration Code

Add this script tag to the `<head>` or `<body>` of your website:

```html
<script src="https://your-cbms-domain.com/tracking.js?key=YOUR_API_KEY&api=https://your-cbms-domain.com/api/track"></script>
```

**Parameters:**

- `key`: Your API key (required)
- `api`: The API endpoint URL (optional, defaults to your domain)

**Tip:**
If you see errors like `Error tracking event: {}` or `Request timeout`, check your `.env.local` and database setup as described above.

### 4. Example Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Your Website</title>
    <!-- CBMS Tracking Script -->
    <script src="https://your-cbms-domain.com/tracking.js?key=abc123&api=https://your-cbms-domain.com/api/track"></script>
  </head>
  <body>
    <h1>Welcome to My Website</h1>
    <button onclick="trackCustomEvent()">Click Me</button>
    <script>
      function trackCustomEvent() {
        // Manual tracking
        if (window.CBMS) {
          window.CBMS.track("button_click", {
            button_id: "custom_button",
            page: "homepage",
          });
        }
      }
    </script>
  </body>
</html>
```

## Automatic Tracking

The script automatically tracks:

- Page views
- Clicks on any element
- Form submissions
- Scroll events (throttled)
- Session start/end
- Time on page

## Manual Tracking

You can manually track custom events:

```javascript
window.CBMS.track("custom_event", {
  category: "user_action",
  value: 100,
  metadata: { custom: "data" },
});
```

## Testing

1. Open the test page: `https://your-cbms-domain.com/test-tracking.html`
2. Check browser console for tracking logs
3. Verify events appear in your CBMS dashboard

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure your CBMS domain is publicly accessible
   - Check that CORS headers are properly set (already fixed in this update)

2. **API Key Errors**

   - Verify your API key is correct
   - Make sure the key parameter is included in the script URL

3. **Events Not Appearing**

   - Check browser console for error messages
   - Verify network requests are reaching your API
   - Check your CBMS dashboard for incoming events
   - Double-check your `.env.local` and database setup (see above)

4. **Localhost Issues**
   - The tracking script cannot work with localhost for external sites
   - Deploy your CBMS application to a public domain

### Debug Mode

The script now includes console logging. Check your browser's developer console for:

- Initialization messages
- Event tracking confirmations
- Error messages
- API response status

### Network Tab

In browser developer tools, check the Network tab for:

- Requests to your API endpoint
- Response status codes
- Request/response payloads

## Security Considerations

1. API keys should be kept secure
2. Consider implementing rate limiting
3. Validate and sanitize incoming data
4. Use HTTPS for all communications

## Performance

- Events are batched to reduce API calls
- Scroll events are throttled to prevent spam
- Failed events are re-queued and retried
- Minimal impact on page load time

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your API key and domain configuration
3. Test with the provided test page
4. Check your CBMS dashboard for incoming events
