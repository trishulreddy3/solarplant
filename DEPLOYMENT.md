# Deployment Guide

## Overview
- **Backend**: Deployed on Render at https://solarplant.onrender.com
- **Frontend**: To be deployed on Netlify

## Backend Deployment (Render)

### Prerequisites
1. Account on Render.com
2. Git repository connected to Render

### Configuration
1. **Environment Variables** (Set in Render Dashboard):
   ```
   NODE_ENV=production
   PORT=5000 (Render sets this automatically)
   ```

2. **Build Command**: `cd backend && npm install`
3. **Start Command**: `cd backend && npm start`
4. **Region**: Choose closest to your users

### Persistent Storage
⚠️ **Important**: Render's free tier uses ephemeral storage. Company data in `backend/companies/` folder will be lost on restart.

**Solutions**:
1. Upgrade to Render's paid plan with persistent disks
2. Use external database (MongoDB, PostgreSQL) instead of file system
3. Use cloud storage (AWS S3, Google Cloud Storage)

## Frontend Deployment (Netlify)

### Step 1: Prepare for Deployment

1. **Build the project locally to test**:
   ```bash
   npm run build
   ```

2. **Verify environment variables**:
   - `.env.production` already configured with Render backend URL
   - Netlify will use environment variables from `netlify.toml`

### Step 2: Deploy to Netlify

#### Option A: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site
netlify init

# Deploy
netlify deploy --prod
```

#### Option B: Deploy via Netlify Dashboard
1. Go to https://app.netlify.com
2. Click "Add new site" > "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `20.19.3`

5. Environment variables are already set in `netlify.toml`

6. Click "Deploy site"

### Step 3: Configure Custom Domain (Optional)
1. Go to "Domain settings" in Netlify dashboard
2. Add your custom domain
3. Update DNS records as instructed

## Post-Deployment Checklist

### Backend (Render)
- [ ] Server is running and accessible at https://solarplant.onrender.com
- [ ] Test API endpoint: https://solarplant.onrender.com/api/status
- [ ] Test companies endpoint: https://solarplant.onrender.com/api/companies
- [ ] CORS configured to accept requests from Netlify
- [ ] Company data persisted (or backup plan in place)

### Frontend (Netlify)
- [ ] Build successful
- [ ] Site accessible at Netlify URL
- [ ] All routes working (SPA redirects configured)
- [ ] API calls reaching Render backend
- [ ] Authentication working
- [ ] Can login as Super Admin
- [ ] Can login as Plant Admin
- [ ] Can login as User
- [ ] Company monitor working
- [ ] Plant view working
- [ ] Panel images loading

## Testing Production Environment

### 1. Test Backend API
```bash
# Test server status
curl https://solarplant.onrender.com/api/status

# Test get companies
curl https://solarplant.onrender.com/api/companies

# Test get plant details
curl https://solarplant.onrender.com/api/companies/{companyId}/plant-details
```

### 2. Test Frontend
1. Visit your Netlify URL
2. Test login flows:
   - Super Admin: `super_admin@microsyslogic.com` / `super_admin_password`
   - Plant Admin: Use credentials from backend
   - User: Use credentials from backend

3. Test key features:
   - Create new company
   - Add tables
   - View plant
   - Monitor activity

## Environment Variables Reference

### Backend (.env on Render)
```env
NODE_ENV=production
PORT=5000
```

### Frontend (netlify.toml)
```env
VITE_API_BASE_URL=https://solarplant.onrender.com/api
```

## Troubleshooting

### Frontend can't connect to backend
1. Check CORS configuration in `backend/server.js`
2. Verify Netlify domain is allowed in CORS origins
3. Check browser console for errors
4. Verify backend is running: https://solarplant.onrender.com/api/status

### Backend data loss after restart
- Render free tier has ephemeral storage
- Consider upgrading to paid plan or using external database

### Build fails on Netlify
1. Check build logs in Netlify dashboard
2. Verify `package.json` has all dependencies
3. Check Node version matches (20.19.3)
4. Try local build: `npm run build`

### Authentication not working
1. Check if backend is accessible
2. Verify credentials in backend `admin.json` files
3. Check browser console for API errors
4. Verify CORS headers in network tab

## Performance Optimization

### Backend
- Enable Render's CDN
- Use connection pooling for database (if migrating from file system)
- Implement caching for frequently accessed data
- Monitor response times in Render dashboard

### Frontend
- Assets are automatically cached (configured in `netlify.toml`)
- Images are served with optimal compression
- SPA routing configured for fast navigation
- Bundle size optimized by Vite

## Monitoring

### Backend (Render)
- View logs in Render dashboard
- Set up uptime monitoring
- Configure alerts for errors

### Frontend (Netlify)
- View deploy logs in Netlify dashboard
- Monitor with Netlify Analytics (optional)
- Set up error tracking (Sentry, etc.)

## Backup Strategy

⚠️ **Critical**: Company data backup

### Current Setup (File-based)
```bash
# Backup companies folder from Render
# Note: Need to implement periodic backups or use persistent storage
```

### Recommended: Migrate to Database
For production, consider migrating from file system to:
- MongoDB Atlas (free tier available)
- PostgreSQL on Render
- Firebase/Firestore

## Security Recommendations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Restrict to specific domains in production
3. **Rate Limiting**: Implement on backend API
4. **Input Validation**: Sanitize all user inputs
5. **HTTPS**: Ensure all traffic is encrypted (default on Render/Netlify)
6. **Authentication**: Implement JWT tokens for session management
7. **Password Hashing**: Hash passwords instead of storing plain text

## Cost Estimation

### Free Tier
- **Render**: Free tier available (with limitations)
- **Netlify**: 100GB bandwidth/month free
- **Total**: $0/month

### Recommended Production Setup
- **Render**: Starter plan ~$7/month (persistent storage)
- **Netlify**: Pro plan ~$19/month (better performance)
- **Database**: MongoDB Atlas free tier or ~$9/month
- **Total**: ~$35/month

## Support

For issues:
1. Check logs in Render/Netlify dashboards
2. Review this deployment guide
3. Test locally with production environment variables
4. Contact support if needed

## Useful Commands

```bash
# Test production build locally
npm run build
npx serve dist

# Deploy to Netlify
netlify deploy --prod

# View backend logs (Render CLI)
render logs

# Clear Netlify cache
netlify build --clear-cache
```
