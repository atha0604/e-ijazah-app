# 🚀 VERCEL + SUPABASE DEPLOYMENT GUIDE

## 📋 CHECKLIST DEPLOYMENT

### ✅ PHASE 1: SETUP SUPABASE (Database)

**Step 1: Create Supabase Project**

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** `e-ijazah-production`
   - **Database Password:** Create strong password (SAVE THIS!)
   - **Region:** Singapore (closest to Indonesia)
4. Click **"Create new project"**
5. **Wait 2-3 minutes** for provisioning

**Step 2: Run Database Schema**

1. In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy entire content from `supabase-schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Should see: ✅ "Success. No rows returned"

**Step 3: Get Connection String**

1. Click **"Settings"** (⚙️ icon, bottom left)
2. Click **"Database"**
3. Scroll to **"Connection string"** section
4. Click **"URI"** tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password
7. **SAVE THIS!** You'll need it for Vercel

---

### ✅ PHASE 2: SETUP VERCEL (Hosting)

**Step 1: Create Vercel Account**

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

**Step 2: Import Project**

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Find your repository: `e-ijazah-app`
3. Click **"Import"**
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm install` (or leave empty)
   - **Output Directory:** (leave empty)

**Step 3: Set Environment Variables**

⚠️ **IMPORTANT:** Before clicking "Deploy", add these variables!

Click **"Environment Variables"** and add:

| Name | Value | Notes |
|------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `DATABASE_URL` | `postgresql://postgres:...` | From Supabase Step 3 |
| `JWT_SECRET` | (generate random) | Use password generator |
| `PORT` | `3000` | Optional |

**Generate JWT_SECRET:**
```bash
# Run this in terminal to generate random secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Step 4: Deploy!**

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Should see: 🎉 "Congratulations!"
4. Your app URL: `https://e-ijazah-xxx.vercel.app`

---

### ✅ PHASE 3: TEST DEPLOYMENT

**Test 1: API Health Check**

Open in browser:
```
https://your-app.vercel.app/api
```

Expected response:
```json
{"message":"Selamat datang di API E-Ijazah!"}
```

**Test 2: Database Connection**

Open Vercel Dashboard → Your Project → **"Logs"**

Look for:
```
✅ Connected to Supabase PostgreSQL
```

**Test 3: Login**

1. Go to: `https://your-app.vercel.app/`
2. Should redirect to E-ijazah.html
3. Try login with:
   - **Kode Aplikasi:** `admin`
   - **Kurikulum:** Merdeka
4. Should see admin dashboard

---

### ✅ PHASE 4: IMPORT DATA (Optional)

**If you have existing SQLite data:**

**Option A: Manual via Supabase Dashboard**

1. Export from SQLite:
   ```bash
   sqlite3 src/database/db.sqlite .dump > data-export.sql
   ```

2. Convert to PostgreSQL format (find/replace):
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
   - Remove SQLite-specific syntax

3. Import to Supabase:
   - Supabase Dashboard → SQL Editor
   - Paste cleaned SQL
   - Run

**Option B: Use Migration Script** (I can create this if needed)

---

## 🔧 TROUBLESHOOTING

### Build Failed on Vercel

**Error:** `Cannot find module 'sqlite3'`

**Solution:**
- This is OK! We're using PostgreSQL in production
- Check that `DATABASE_URL` environment variable is set
- Code automatically switches to PostgreSQL when detected

### Database Connection Error

**Error:** `Connection timeout` or `ECONNREFUSED`

**Check:**
1. DATABASE_URL format correct?
2. Password has special characters? → URL encode them
3. Supabase project status (might be paused on free tier)

**Fix:**
```javascript
// URL encode password if it has special chars
const password = "p@ssw0rd!";
const encoded = encodeURIComponent(password);
// Use encoded in DATABASE_URL
```

### App Works But Database Empty

**Check:**
1. Did you run `supabase-schema.sql`?
2. Check Supabase Dashboard → Table Editor
3. Should see tables: sekolah, siswa, nilai, users

**Fix:**
- Re-run schema SQL in Supabase SQL Editor

### Cold Start Slow (First Request)

**This is normal!** Vercel serverless has cold start ~1-3 seconds.

**Solutions:**
- Keep app warm with uptime monitor (uptimerobot.com - free)
- Upgrade to Vercel Pro ($20/mo) for better performance

---

## 📊 MONITORING

**Vercel Dashboard:**
- **Analytics:** View traffic & performance
- **Logs:** Real-time error logs
- **Deployments:** History of all deploys

**Supabase Dashboard:**
- **Table Editor:** View/edit data
- **SQL Editor:** Run queries
- **Database:** Monitor connections & performance

---

## 🎯 CUSTOM DOMAIN (Optional)

**Add Your Domain:**

1. Buy domain (Niagahoster, Namecheap, etc.)
2. Vercel Dashboard → Your Project → **"Settings"** → **"Domains"**
3. Add domain: `eijazah.yourdomain.com`
4. Update DNS records (Vercel will show instructions)
5. Wait 5-10 minutes for propagation
6. ✅ Done! HTTPS automatic via Vercel

---

## 💰 COST ESTIMATE

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth/month
- Enough for: ~5,000 siswa, ~256 sekolah
- Cost: **$0/month**

**Vercel:**
- Free tier: 100GB bandwidth, unlimited deploys
- Cost: **$0/month** for hobby use

**Total:** **$0/month** for moderate usage! 🎉

---

## 🆘 NEED HELP?

**Common Issues:**
- Check Vercel logs: Dashboard → Logs
- Check Supabase logs: Dashboard → Logs
- Test database: Supabase → SQL Editor → `SELECT * FROM sekolah LIMIT 10;`

**Still stuck?**
- Vercel Discord: https://vercel.com/discord
- Supabase Discord: https://discord.supabase.com

---

## ✅ SUCCESS CHECKLIST

- [ ] Supabase project created
- [ ] Database schema imported (run supabase-schema.sql)
- [ ] Connection string obtained
- [ ] Vercel project created
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET, NODE_ENV)
- [ ] Deployment successful
- [ ] `/api` endpoint returns JSON
- [ ] Logs show "Connected to Supabase PostgreSQL"
- [ ] Login works with 'admin' code
- [ ] Data can be added via dashboard

**ALL DONE?** 🎉 Your E-Ijazah app is now LIVE!

---

**App URL:** https://your-app.vercel.app
**Admin Login:** Use code "admin" with any kurikulum
