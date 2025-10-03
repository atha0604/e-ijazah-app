# Dinas Central Server

Server pusat untuk mengagregasi data dari seluruh sekolah.

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Termudah)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login ke Railway**
   ```bash
   railway login
   ```

3. **Deploy**
   ```bash
   cd server-dinas
   railway init
   railway up
   ```

4. **Setup Database**
   - Railway akan otomatis menyediakan PostgreSQL
   - Jalankan migration:
   ```bash
   railway run npm run db:setup
   ```

5. **Get URL**
   ```bash
   railway domain
   ```

### Option 2: VPS Manual (Niagahoster, IDCloudhost, dll)

1. **SSH ke VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt-get install -y nodejs
   ```

3. **Install PostgreSQL**
   ```bash
   apt-get install -y postgresql postgresql-contrib
   ```

4. **Setup Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE dinas_db;
   CREATE USER dinas_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE dinas_db TO dinas_user;
   \q
   ```

5. **Clone & Deploy**
   ```bash
   git clone https://github.com/your-repo/your-project.git
   cd your-project/server-dinas
   npm install
   ```

6. **Setup Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your database credentials
   ```

7. **Run Database Migration**
   ```bash
   npm run db:setup
   ```

8. **Install PM2**
   ```bash
   npm install -g pm2
   ```

9. **Start Server**
   ```bash
   pm2 start server.js --name dinas-server
   pm2 save
   pm2 startup
   ```

### Option 3: Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login & Create App**
   ```bash
   heroku login
   cd server-dinas
   heroku create your-app-name
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

5. **Setup Database**
   ```bash
   heroku run npm run db:setup
   ```

## 📊 API Endpoints

### Health Check
```
GET /api/health
```

### Sync Endpoints
```
GET  /api/sync/ping          - Test connection
POST /api/sync/receive       - Receive data from schools
```

### Admin Endpoints
```
GET /api/admin/sekolah       - Get all schools with sync status
GET /api/admin/siswa         - Get all students (with filters)
GET /api/admin/nilai         - Get all grades (with filters)
GET /api/admin/stats         - Get overall statistics
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
```

## 📝 Database Schema

Run the migration to create tables:

```bash
npm run db:setup
```

Tables created:
- `sekolah_master` - Master data sekolah
- `siswa_pusat` - Data siswa teragregasi
- `nilai_pusat` - Data nilai teragregasi
- `sync_logs` - Log sinkronisasi

## 🧪 Testing

Test the server locally:

```bash
npm install
npm run dev
```

Test connection:
```bash
curl http://localhost:3001/api/health
```

## 📱 Connecting Schools

Di aplikasi sekolah, set URL server di pengaturan sinkronisasi:

```
URL Server: https://e-ijazah-app-test.up.railway.app
```

**Catatan:** Ini adalah URL production server yang sudah di-deploy ke Railway dengan PostgreSQL database.

## 🔒 Security

1. **Database**: Gunakan strong password
2. **CORS**: Konfigurasi allowed origins di environment
3. **HTTPS**: Pastikan menggunakan HTTPS di production

## 💰 Biaya Estimasi

- Railway: $5/bulan (dengan database)
- VPS Indonesia: Rp 50.000 - 100.000/bulan
- Heroku: $7/bulan (Eco Dyno + Mini Postgres)

## 📞 Support

Jika ada masalah deployment, cek:
1. Logs: `railway logs` atau `pm2 logs`
2. Database connection: Test dengan `psql $DATABASE_URL`
3. Port: Pastikan port tidak terblokir firewall
