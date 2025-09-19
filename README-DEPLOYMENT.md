# 🚀 Deployment Guide - Aplikasi E-Ijazah

## Railway Deployment (Recommended)

### Option 1: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "Login with GitHub"
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your repository
6. Railway will auto-detect Node.js and deploy

### Option 2: CLI Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Environment Variables to Set in Railway:
```
JWT_SECRET=your-jwt-secret-here
NODE_ENV=production
PORT=3000
```

### Auto-Deploy Setup:
- Connect your GitHub repo
- Every push to main branch = auto deploy
- Monitor with: `railway logs`

## Alternative: Render Deployment

1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Click "New" → "Web Service"
4. Select your repository
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Same as above

## File Structure Ready:
✅ server.js - Entry point
✅ package.json - Dependencies
✅ .env - Environment variables
✅ src/database/db.sqlite - Database with data
✅ railway.json - Railway configuration
✅ nixpacks.toml - Build configuration
✅ .gitignore - Git ignore rules

## Health Check:
Your app exposes `/api` endpoint for health checking.

## Database:
SQLite database is included and will persist on Railway.
No additional database setup required!

## Post-Deployment:
1. Visit your app URL
2. Test login functionality
3. Check admin dashboard
4. Verify all features work

## Monitoring:
```bash
railway logs -f    # Live logs
railway status     # Service status
railway open       # Open in browser
```

Ready to deploy! 🎉