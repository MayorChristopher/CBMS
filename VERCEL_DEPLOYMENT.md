# Vercel Deployment Checklist for CBMS

## Pre-Deployment Checklist

### ✅ Database Setup
- [ ] All SQL scripts executed in Supabase (01-10)
- [ ] API keys table created and functional
- [ ] Test API key creation locally
- [ ] Verify database functions exist

### ✅ Code Preparation
- [ ] All files committed to GitHub
- [ ] Environment variables documented
- [ ] Vercel configuration files added
- [ ] Build scripts verified

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import CBMS repository
5. Configure project settings

### 3. Set Environment Variables
Add these in Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rzqoxxgeiwsvdmcckzbu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Deploy
- Click "Deploy"
- Wait for build to complete
- Check deployment logs for errors

## Post-Deployment Verification

### ✅ Core Functionality
- [ ] Homepage loads correctly
- [ ] Authentication works (login/signup)
- [ ] Dashboard accessible
- [ ] Role-based routing works

### ✅ API Endpoints
- [ ] `/api/track` - Tracking endpoint
- [ ] `/api/api-keys` - API key management
- [ ] `/api/websites` - Website management
- [ ] CORS headers working

### ✅ Integration Features
- [ ] Website addition works
- [ ] API key generation works
- [ ] Tracking script accessible
- [ ] Cross-origin requests allowed

### ✅ Analytics
- [ ] Data collection working
- [ ] Dashboard displays data
- [ ] Real-time updates functional
- [ ] Role-based dashboards working

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel
   - Verify all dependencies installed
   - Check TypeScript errors

2. **Environment Variables**
   - Verify all variables set correctly
   - Check for typos in keys
   - Redeploy after adding variables

3. **Database Connection**
   - Verify Supabase URL and keys
   - Check database tables exist
   - Test API endpoints

4. **CORS Issues**
   - Check CORS headers in vercel.json
   - Verify tracking script accessibility
   - Test cross-origin requests

### Performance Optimization

1. **Enable Edge Functions**
   - API routes can use edge functions
   - Faster response times
   - Better global performance

2. **Image Optimization**
   - Use Next.js Image component
   - Optimize static assets
   - Enable CDN

3. **Caching**
   - Set appropriate cache headers
   - Use Vercel's edge caching
   - Optimize database queries

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics
- Monitor performance metrics
- Track error rates

### Application Monitoring
- Check Supabase logs
- Monitor API response times
- Track user engagement

## Security

### Environment Variables
- Keep service role key secret
- Use environment-specific variables
- Regularly rotate keys

### CORS Configuration
- Limit CORS origins in production
- Use specific domains instead of *
- Monitor for abuse

## Support

If deployment fails:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first
4. Check database connectivity
5. Review error messages

## Success Indicators

✅ Application loads without errors
✅ Authentication system working
✅ API endpoints responding
✅ Tracking script functional
✅ Analytics data collecting
✅ Role-based access working
✅ Cross-origin requests allowed

---

**Ready for Production! 🚀** 