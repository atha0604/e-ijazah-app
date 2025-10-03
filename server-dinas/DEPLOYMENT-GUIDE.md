# 🚀 Server Dinas - Deployment Guide

## 📋 Persiapan

### 1. Prerequisites
- ✅ Node.js 14+ terinstall
- ✅ Git terinstall
- ✅ Akun Railway.app (gratis)
- ✅ PostgreSQL database (otomatis dari Railway)

---

## 🌐 OPSI 1: Deploy ke Railway (Recommended)

### A. Via Railway Web Interface (Paling Mudah)

#### Step 1: Setup Repository
```bash
# Push ke GitHub dulu (jika belum)
cd "C:\ProyekWeb\web 2\2"
git add server-dinas/
git commit -m "Add server dinas deployment config"
git push origin feature/ui-simplify
```

#### Step 2: Buat Project di Railway
1. Buka https://railway.app
2. Sign up / Login dengan GitHub
3. Klik "New Project"
4. Pilih "Deploy from GitHub repo"
5. Pilih repository kamu
6. **PENTING**: Set root directory ke `server-dinas`

#### Step 3: Tambah PostgreSQL Database
1. Di project Railway, klik "New"
2. Pilih "Database" → "PostgreSQL"
3. Database otomatis terhubung dengan environment variable `DATABASE_URL`

#### Step 4: Setup Database Schema
1. Klik PostgreSQL service → "Data" tab
2. Klik "Query"
3. Copy-paste isi file `schema.sql`
4. Run query untuk membuat tables

Atau via CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migration
railway run psql $DATABASE_URL -f schema.sql
```

#### Step 5: Environment Variables
Railway otomatis set `DATABASE_URL`, tapi kamu bisa tambah custom vars:
1. Klik service → "Variables" tab
2. Tambahkan:
   - `PORT` = 3000 (optional, otomatis)
   - `NODE_ENV` = production

#### Step 6: Deploy!
- Railway otomatis deploy setiap kali ada push ke GitHub
- Atau manual deploy: klik "Deploy" button

#### Step 7: Get Public URL
1. Klik service → "Settings" tab
2. Scroll ke "Domains"
3. Klik "Generate Domain"
4. Salin URL (contoh: `https://dinas-server-production-xxxx.up.railway.app`)

---

### B. Via Railway CLI

#### Step 1: Install & Login
```bash
npm install -g @railway/cli
railway login
```

#### Step 2: Deploy dari folder server-dinas
```bash
cd server-dinas

# Initialize Railway project
railway init

# Link ke database PostgreSQL
railway add --database postgres

# Deploy
railway up
```

#### Step 3: Setup Database
```bash
# Run migration
railway run psql $DATABASE_URL -f schema.sql

# Atau connect manual
railway run psql $DATABASE_URL
# Kemudian copy-paste isi schema.sql
```

#### Step 4: Get URL
```bash
railway domain
```

---

## 🖥️ OPSI 2: Deploy ke VPS (Manual)

### Persiapan VPS
- Ubuntu 20.04 atau lebih baru
- Minimal 1GB RAM
- PostgreSQL terinstall

### Step 1: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 untuk process management
sudo npm install -g pm2
```

### Step 2: Setup Database
```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Create database dan user
CREATE DATABASE dinas_db;
CREATE USER dinas_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dinas_db TO dinas_user;
\q

# Import schema
psql -U dinas_user -d dinas_db -f schema.sql
```

### Step 3: Clone & Setup Aplikasi
```bash
# Clone repository
git clone <your-repo-url>
cd server-dinas

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
```

Edit `.env`:
```env
PORT=3000
DATABASE_URL=postgresql://dinas_user:your_secure_password@localhost:5432/dinas_db
NODE_ENV=production
```

### Step 4: Start dengan PM2
```bash
# Start aplikasi
pm2 start server.js --name dinas-server

# Setup auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 logs dinas-server
pm2 monit
```

### Step 5: Setup Nginx Reverse Proxy (Optional)
```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/dinas-server
```

Isi config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dinas-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL dengan Let's Encrypt (Optional)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🧪 Testing Deployment

### Test Health Check
```bash
curl https://your-server-url.com/api/ping
# Expected: {"status":"OK","timestamp":"..."}
```

### Test Sync Endpoint
```bash
curl -X POST https://your-server-url.com/api/sync/receive \
  -H "Content-Type: application/json" \
  -d '{
    "npsn": "12345678",
    "sekolah": [],
    "siswa": [],
    "nilai": []
  }'
```

### Access Admin Dashboard
Buka browser: `https://your-server-url.com/admin-dashboard.html`

---

## 📊 Monitoring & Maintenance

### Railway
- Dashboard: https://railway.app/project/your-project
- Logs: Klik service → "Logs" tab
- Metrics: Lihat CPU, Memory, Network usage

### VPS dengan PM2
```bash
# Logs
pm2 logs dinas-server

# Restart
pm2 restart dinas-server

# Status
pm2 status

# Monitor real-time
pm2 monit
```

### Database Backup (PostgreSQL)
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250103.sql
```

### Update Aplikasi
```bash
# Railway: Otomatis via GitHub push

# VPS Manual:
cd server-dinas
git pull
npm install
pm2 restart dinas-server
```

---

## 🔒 Security Checklist

- [ ] Database password yang kuat
- [ ] Environment variables tersimpan aman (tidak di-commit ke git)
- [ ] CORS configured dengan allowed origins
- [ ] Rate limiting untuk API endpoints
- [ ] SSL/HTTPS enabled
- [ ] Database backup scheduled
- [ ] Monitoring & alerting setup

---

## 🆘 Troubleshooting

### Server tidak bisa diakses
```bash
# Check logs
railway logs  # Railway
pm2 logs dinas-server  # VPS

# Check port
netstat -tulpn | grep 3000

# Check firewall
sudo ufw status
sudo ufw allow 3000
```

### Database connection error
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql  # VPS
```

### Memory issues
```bash
# Railway: Upgrade plan
# VPS: Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📝 Next Steps Setelah Deploy

1. ✅ Catat URL server dinas
2. ✅ Test semua endpoint API
3. ✅ Konfigurasi aplikasi sekolah dengan URL ini
4. ✅ Test sync dari 1 sekolah dulu
5. ✅ Monitor logs & performance
6. ✅ Scale jika diperlukan

---

**Deployment berhasil? URL server akan digunakan di aplikasi sekolah untuk sinkronisasi data! 🎉**
