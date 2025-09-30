# 🚀 Production Deployment Checklist

## Aplikasi Nilai E-Ijazah - Deployment Guide

Complete step-by-step guide untuk deploy ke production.

---

## ⚡ Quick Deploy (5 Steps)

```bash
# 1. Clone & Install
git clone <repository>
cd aplikasi-nilai-e-ijazah
npm install

# 2. Configure Environment
node generate-jwt-secret.js
# Edit .env with your settings

# 3. Setup Database
node src/setup.js
node run-migrations.js

# 4. Test
npm test
npm start  # Test locally

# 5. Deploy
# Follow deployment method below
```

---

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration ✅

**REQUIRED**:
```bash
# .env file
JWT_SECRET=<generated-secure-secret>
PORT=3000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
NODE_ENV=production
```

**Verify**:
```bash
# Test JWT secret
node -e "console.log(process.env.JWT_SECRET ? '✅' : '❌ Missing')"

# Test CORS
node -e "console.log(process.env.CORS_ORIGINS ? '✅' : '❌ Using default')"
```

---

### 2. Security Checklist 🔒

- [ ] JWT_SECRET generated with `generate-jwt-secret.js`
- [ ] CORS_ORIGINS configured with production domain
- [ ] NODE_ENV set to `production`
- [ ] .env file NOT committed to git
- [ ] Database file NOT committed to git
- [ ] HTTPS enabled (recommended)
- [ ] Security headers configured (helmet)
- [ ] Rate limiting enabled (optional)
- [ ] File upload size limits configured
- [ ] SQL injection prevention verified (parameterized queries)

---

### 3. Database Setup 🗄️

```bash
# Create database
node src/setup.js

# Run migrations
node run-migrations.js

# Verify
node analyze-db.js

# Backup (optional but recommended)
cp src/database/db.sqlite src/database/db.sqlite.backup
```

---

### 4. Testing ✅

```bash
# Run all tests
npm test

# Check for errors
npm run test:coverage

# Build production bundle (optional)
npm run build

# Security audit
npm audit --audit-level=high
```

---

### 5. Performance Optimization 🚀

**Optional but recommended**:

```bash
# Build optimized assets
npm run build

# Enable compression
npm install compression
# Add to server.js: app.use(compression())
```

**Server Configuration**:
```javascript
// Add to server.js
const compression = require('compression');
app.use(compression());
```

---

## 🌐 Deployment Methods

### Method 1: Traditional VPS (DigitalOcean, Linode, etc.)

**Requirements**:
- Ubuntu 20.04+ or similar
- Node.js 18+
- Nginx (reverse proxy)
- PM2 (process manager)

**Steps**:

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Clone repository
git clone <repository>
cd aplikasi-nilai-e-ijazah

# 4. Install dependencies
npm install --production

# 5. Setup environment
node generate-jwt-secret.js
# Edit .env

# 6. Setup database
node src/setup.js
node run-migrations.js

# 7. Start with PM2
pm2 start server.js --name e-ijazah
pm2 save
pm2 startup

# 8. Configure Nginx
sudo nano /etc/nginx/sites-available/e-ijazah
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/e-ijazah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Method 2: Docker

**Requirements**:
- Docker
- Docker Compose (optional)

**Dockerfile** (already exists):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - PORT=3000
    volumes:
      - ./src/database:/app/src/database
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
```

**Deploy**:
```bash
# Build
docker build -t e-ijazah .

# Run
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET=<your-secret> \
  -e CORS_ORIGINS=https://yourdomain.com \
  -e NODE_ENV=production \
  -v $(pwd)/src/database:/app/src/database \
  --name e-ijazah \
  --restart unless-stopped \
  e-ijazah

# Or with docker-compose
docker-compose up -d
```

---

### Method 3: Platform as a Service (Railway, Render, etc.)

**Railway.app**:

1. Connect GitHub repository
2. Add environment variables:
   - `JWT_SECRET`
   - `CORS_ORIGINS`
   - `NODE_ENV=production`
3. Railway auto-detects Node.js and deploys

**Render.com**:

```yaml
# render.yaml (already exists)
services:
  - type: web
    name: e-ijazah
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        sync: false
      - key: CORS_ORIGINS
        sync: false
```

**Vercel/Netlify**:
- Not recommended for this app (backend required)
- Better for static frontend only

---

### Method 4: Kubernetes

**Requirements**:
- Kubernetes cluster
- kubectl configured

**k8s/deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: e-ijazah
spec:
  replicas: 3
  selector:
    matchLabels:
      app: e-ijazah
  template:
    metadata:
      labels:
        app: e-ijazah
    spec:
      containers:
      - name: e-ijazah
        image: your-registry/e-ijazah:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: e-ijazah-secrets
              key: jwt-secret
        - name: CORS_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: e-ijazah-config
              key: cors-origins
        livenessProbe:
          httpGet:
            path: /api/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 🔄 Post-Deployment

### 1. Health Checks

```bash
# Check health
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "OK",
  "uptime": 123.45,
  "version": "2.7.0",
  "checks": {
    "jwt": "configured",
    "cors": "configured",
    "database": "connected"
  }
}

# Check readiness
curl https://yourdomain.com/api/ready

# Check liveness
curl https://yourdomain.com/api/live
```

---

### 2. Monitoring Setup

**PM2 Monitoring** (VPS):
```bash
pm2 monit              # Real-time monitoring
pm2 logs e-ijazah      # View logs
pm2 status             # Check status
pm2 restart e-ijazah   # Restart app
```

**Docker Monitoring**:
```bash
docker stats e-ijazah  # Resource usage
docker logs -f e-ijazah # View logs
```

**Setup Log Rotation**:
```bash
# For PM2
pm2 install pm2-logrotate

# For Docker
# Add to docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

### 3. Backup Strategy

**Database Backup**:
```bash
# Manual backup
cp src/database/db.sqlite backups/db.sqlite.$(date +%Y%m%d)

# Automated backup (cron)
# Add to crontab: crontab -e
0 2 * * * cp /path/to/app/src/database/db.sqlite /path/to/backups/db.sqlite.$(date +\%Y\%m\%d)
```

**Full Backup**:
```bash
# Backup everything
tar -czf backup-$(date +%Y%m%d).tar.gz \
  src/database/ \
  .env \
  public/assets/
```

---

### 4. Monitoring & Alerts

**Setup Tools**:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Performance**: New Relic, DataDog
- **Logs**: Papertrail, Loggly

**Health Check URLs**:
- `/api/health` - General health
- `/api/ready` - Readiness probe
- `/api/live` - Liveness probe

---

## 🔧 Maintenance

### Regular Tasks

**Daily**:
- Check server logs
- Monitor disk space
- Check error rates

**Weekly**:
- Review health check status
- Check security alerts
- Backup database

**Monthly**:
- Update dependencies
- Review performance metrics
- Test backup restore
- Rotate JWT secret (optional)

---

## 🚨 Rollback Plan

**Quick Rollback**:

```bash
# PM2
pm2 stop e-ijazah
git checkout <previous-commit>
npm install
pm2 restart e-ijazah

# Docker
docker stop e-ijazah
docker run <previous-image>

# Database rollback
cp backups/db.sqlite.YYYYMMDD src/database/db.sqlite
```

---

## 📞 Troubleshooting

### App Won't Start

**Check 1**: JWT_SECRET configured?
```bash
grep JWT_SECRET .env
```

**Check 2**: Port available?
```bash
lsof -i :3000
```

**Check 3**: Database exists?
```bash
ls -la src/database/db.sqlite
```

### CORS Errors

**Check**: CORS_ORIGINS configured?
```bash
grep CORS_ORIGINS .env
```

**Fix**:
```bash
# Add your domain to .env
CORS_ORIGINS=https://yourdomain.com
```

### High Memory Usage

**Check**:
```bash
pm2 monit  # or docker stats
```

**Fix**:
- Restart application
- Check for memory leaks
- Increase server resources

---

## ✅ Final Checklist

Before going live:

- [ ] JWT_SECRET generated and configured
- [ ] CORS_ORIGINS set to production domain
- [ ] NODE_ENV=production
- [ ] Database migrated
- [ ] Tests passing
- [ ] SSL/HTTPS enabled
- [ ] Nginx configured (if applicable)
- [ ] PM2/Docker running
- [ ] Health checks responding
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Logs accessible
- [ ] Rollback plan documented
- [ ] Team notified

---

**Deployment Time**: 15-30 minutes
**Difficulty**: Medium
**Support**: See documentation in root directory

🚀 **Ready to deploy!**