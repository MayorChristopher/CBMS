# CBMS Deployment Guide

## Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Supabase project set up

### Step 1: Push to GitHub

Run these commands in your terminal:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: CBMS with tracking integration"

# Create main branch
git branch -M main

# Add remote origin (replace with your GitHub username)
git remote add origin https://github.com/MayorChristopher/CBMS.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Select your CBMS repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Environment Variables**
   Add these environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Step 3: Update Tracking Script

After deployment, update your tracking script URLs to use your Vercel domain:

```html
<script src="https://your-vercel-domain.vercel.app/tracking.js?key=YOUR_API_KEY&api=https://your-vercel-domain.vercel.app/api/track"></script>
```

### Step 4: Test Integration

1. Visit your deployed CBMS application
2. Create an account and log in
3. Add a website and generate an API key
4. Test the tracking script on a test page
5. Verify analytics are being collected

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Database tables are created
- [ ] Authentication is working
- [ ] Tracking script is accessible
- [ ] API endpoints are responding
- [ ] Analytics data is being collected
- [ ] Role-based access is working

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel dashboard for environment variables
   - Redeploy after adding variables

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check database tables are created

3. **CORS Errors**
   - Ensure CORS headers are set in API routes
   - Check domain configuration

4. **Tracking Script Not Working**
   - Verify script URL is correct
   - Check browser console for errors
   - Ensure API key is valid

### Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Verify Supabase configuration
4. Open an issue on GitHub

## Production Considerations

1. **Custom Domain**
   - Add custom domain in Vercel
   - Update DNS settings
   - Update tracking script URLs

2. **SSL Certificate**
   - Vercel provides automatic SSL
   - Ensure HTTPS is used for all requests

3. **Performance**
   - Enable Vercel Edge Functions if needed
   - Optimize images and assets
   - Use CDN for static files

4. **Monitoring**
   - Set up Vercel Analytics
   - Monitor error rates
   - Track performance metrics 