# 📘 Panduan Lengkap: Sistem Sinkronisasi Multi-Sekolah

## 🎯 Overview Sistem

Sistem ini terdiri dari 2 komponen utama:

1. **Aplikasi Sekolah** (Desktop/Web) - Digunakan oleh 300+ sekolah
2. **Server Dinas Pusat** (Cloud) - Mengagregasi data dari semua sekolah

```
┌─────────────────────────┐
│   🏫 SEKOLAH (300+)      │
│   - Input nilai offline  │
│   - Sync 1x seminggu    │
└───────────┬─────────────┘
            │
            ▼ (Internet)
┌─────────────────────────┐
│   ☁️ SERVER DINAS        │
│   - Agregasi data       │
│   - Dashboard admin     │
└─────────────────────────┘
```

---

## ✅ Apa yang Sudah Diimplementasi?

### 1. Database Migration ✅
- Kolom tracking: `last_modified`, `synced_at`, `is_deleted`
- Tabel `sync_log` untuk riwayat sinkronisasi
- Triggers otomatis untuk update timestamp

**File:** `src/migrations/add-sync-tracking.js`

**Cara run:**
```bash
node src/migrations/add-sync-tracking.js
```

### 2. Backend Sync Service ✅
- Service untuk get unsynced data
- Service untuk mark as synced
- Logging sync activity

**File:** `backend/src/services/sync-service.js`

### 3. API Routes untuk Sync ✅
- `GET /api/sync/status` - Status sinkronisasi
- `GET /api/sync/unsynced` - Jumlah data belum tersinkron
- `POST /api/sync/upload` - Upload ke server pusat
- `GET /api/sync/history` - Riwayat sinkronisasi
- `POST /api/sync/test` - Test koneksi

**File:** `backend/src/routes/sync-routes.js`

### 4. Frontend Sync Module ✅
- UI panel sinkronisasi
- Auto-sync timer
- Online/offline detection
- Sync settings modal
- History viewer

**File:** `public/sync.js`

### 5. Server Dinas Pusat ✅
- Express server dengan PostgreSQL
- API untuk terima data dari sekolah
- API untuk admin dashboard
- Database schema lengkap

**File:** `server-dinas/server.js`

### 6. Admin Dashboard ✅
- Dashboard web untuk admin dinas
- Statistik real-time
- Filter data per sekolah/kecamatan
- Export data (placeholder)

**File:** `server-dinas/public/admin-dashboard.html`

---

## 🚀 Cara Menggunakan

### A. Setup Aplikasi Sekolah (Existing App)

#### 1. Run Migration

```bash
cd "C:\ProyekWeb\web 2\2"
node src/migrations/add-sync-tracking.js
```

Output yang diharapkan:
```
Adding sync tracking columns...
✅ Sync tracking columns added successfully
Migration completed
```

#### 2. Load Sync Module di HTML

Tambahkan di file HTML utama (E-ijazah.html atau index.html):

```html
<!-- Sebelum closing </body> -->
<script src="sync.js"></script>
```

#### 3. Tambahkan Sync Panel ke Dashboard

Di bagian dashboard sekolah, tambahkan:

```html
<div id="syncPanelContainer"></div>

<script>
    // Render sync panel
    document.getElementById('syncPanelContainer').innerHTML = renderSyncPanel();

    // Update UI
    updateSyncUI();
</script>
```

#### 4. Konfigurasi URL Server Dinas

Saat aplikasi pertama kali dijalankan:
1. Klik tombol "⚙️ Pengaturan" di panel sync
2. Masukkan URL server dinas (misal: `https://dinas-server.railway.app`)
3. Klik "🔌 Test Koneksi" untuk memastikan koneksi berhasil
4. Centang "Aktifkan sinkronisasi otomatis" jika ingin auto-sync
5. Klik "💾 Simpan"

---

### B. Setup Server Dinas Pusat

#### Option 1: Deploy ke Railway (Recommended)

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login**
```bash
railway login
```

3. **Deploy**
```bash
cd server-dinas
railway init
railway up
```

4. **Add PostgreSQL Database**
Di Railway dashboard:
- Klik "New" → "Database" → "PostgreSQL"
- Database akan otomatis terhubung

5. **Run Database Migration**
```bash
railway run psql $DATABASE_URL -f schema.sql
```

6. **Get Public URL**
```bash
railway domain
```

Salin URL ini untuk dikonfigurasi di aplikasi sekolah.

#### Option 2: Deploy ke VPS

Lihat detail lengkap di `server-dinas/README.md`

---

### C. Menggunakan Sistem

#### Untuk Admin Sekolah:

1. **Input Data Offline**
   - Gunakan aplikasi seperti biasa
   - Input data siswa dan nilai tanpa internet

2. **Sinkronisasi ke Dinas**
   - Pastikan ada koneksi internet
   - Klik tombol "🔄 Sinkronisasi Sekarang"
   - Tunggu sampai muncul notifikasi "✅ Berhasil!"

3. **Auto-Sync (Optional)**
   - Jika diaktifkan, aplikasi akan otomatis sync sesuai interval
   - Default: setiap 1 jam

4. **Cek Riwayat**
   - Klik "📊 Riwayat" untuk melihat log sinkronisasi

#### Untuk Admin Dinas:

1. **Akses Dashboard**
   - Buka: `https://your-dinas-server.com/admin-dashboard.html`

2. **Monitoring Sekolah**
   - Tab "🏫 Status Sekolah" - Lihat sekolah mana yang sudah/belum sync

3. **Lihat Data Siswa**
   - Tab "👨‍🎓 Data Siswa"
   - Filter per sekolah/kecamatan

4. **Lihat Data Nilai**
   - Tab "📝 Data Nilai"
   - Filter per sekolah/kecamatan

5. **Export Data**
   - Klik "📥 Export Excel" (akan diimplementasi)

---

## 📊 Flow Sinkronisasi

```
1. Sekolah input data
   ↓
2. Data tersimpan di database lokal
   ↓
3. Kolom last_modified otomatis diupdate
   ↓
4. Admin sekolah klik "Sinkronisasi"
   ↓
5. Aplikasi ambil data yang belum sync
   (WHERE last_modified > synced_at OR synced_at IS NULL)
   ↓
6. Kirim ke server dinas via HTTP POST
   ↓
7. Server dinas terima & simpan di PostgreSQL
   ↓
8. Server kirim response sukses
   ↓
9. Aplikasi sekolah update kolom synced_at
   ↓
10. Log tersimpan di sync_log
```

---

## 🛠️ Troubleshooting

### Problem: Migration gagal - "Cannot add a column with non-constant default"

**Solusi:** Sudah diperbaiki. Gunakan file migration terbaru yang tidak menggunakan function default.

### Problem: "Cannot find module 'node-fetch'"

**Solusi:**
```bash
npm install node-fetch
```

### Problem: Server dinas tidak bisa diakses

**Solusi:**
1. Cek firewall/port
2. Pastikan DATABASE_URL sudah diset
3. Cek logs: `railway logs` atau `pm2 logs`

### Problem: Data tidak tersinkron

**Solusi:**
1. Cek koneksi internet
2. Test koneksi di Settings → "🔌 Test Koneksi"
3. Lihat error di riwayat sinkronisasi
4. Cek browser console untuk error

---

## 🔧 Maintenance & Updates

### Update Aplikasi Sekolah

Jika ada perbaikan bug atau fitur baru:

1. Push kode baru ke repository
2. Build installer baru
3. Upload installer ke server dinas folder `/updates/`
4. Sekolah akan otomatis mendapat notifikasi update

(Catatan: Fitur auto-update belum diimplementasi, ada di rencana berikutnya)

### Backup Database Dinas

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250101.sql
```

### Monitor Performa

```sql
-- Cek sekolah yang belum sync > 30 hari
SELECT npsn, nama_lengkap, last_sync
FROM sekolah_master
WHERE last_sync < NOW() - INTERVAL '30 days'
ORDER BY last_sync ASC;

-- Cek total data per sekolah
SELECT
    sm.npsn,
    sm.nama_lengkap,
    COUNT(DISTINCT sp.nisn) as siswa,
    COUNT(np.id) as nilai
FROM sekolah_master sm
LEFT JOIN siswa_pusat sp ON sm.npsn = sp.npsn
LEFT JOIN nilai_pusat np ON sp.nisn = np.nisn
GROUP BY sm.npsn, sm.nama_lengkap;
```

---

## 📝 TODO - Enhancement Berikutnya

- [ ] Auto-update installer mechanism
- [ ] Export to Excel (real implementation)
- [ ] Conflict resolution (jika ada perubahan di 2 tempat)
- [ ] Incremental sync (hanya kirim perubahan)
- [ ] Compression untuk data besar
- [ ] Authentication & authorization untuk admin dinas
- [ ] Email notification ke admin jika sekolah tidak sync > 30 hari
- [ ] Mobile app untuk admin dinas

---

## 💡 Tips Best Practices

1. **Sync Reguler**: Ingatkan sekolah untuk sync minimal 1x seminggu
2. **Monitor Status**: Admin dinas cek dashboard setiap hari
3. **Backup Reguler**: Backup database dinas setiap minggu
4. **Test Connection**: Sekolah test koneksi sebelum sync
5. **Bandwidth**: Sync saat jam tidak sibuk untuk performa lebih baik

---

## 📞 Support

Jika ada pertanyaan atau masalah:

1. Cek file log
2. Lihat dokumentasi API
3. Check server status di `/api/health`

---

**Status Implementasi:** ✅ SELESAI
**Tanggal:** 2025-01-02
**Versi:** 1.0.0
