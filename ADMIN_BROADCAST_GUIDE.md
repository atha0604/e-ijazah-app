# 📢 PANDUAN ADMIN - BROADCAST UPDATE

**Versi**: 2.7.0 (Tanpa Email)
**Metode**: In-App Notification Only

---

## 🎯 CARA BROADCAST UPDATE

### **Method 1: Automatic (Recommended)**

Setiap user yang login akan otomatis mendapat notifikasi update:

```
1. Admin update version history di updateRoutes.js
2. User login/buka aplikasi
3. Auto-check berjalan (setiap 30 menit)
4. Notification banner muncul otomatis
5. User klik "Lihat Detail"
6. User download/update
```

**✅ Tidak perlu action dari admin!**

---

### **Method 2: Manual Broadcast (API)**

Jika ingin trigger broadcast secara eksplisit:

#### **Step 1: Set Admin Key di .env**
```bash
ADMIN_BROADCAST_KEY=rahasia_super_aman_123
```

#### **Step 2: Call Broadcast API**
```bash
curl -X POST http://localhost:3000/api/updates/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "version": "2.7.0",
    "adminKey": "rahasia_super_aman_123"
  }'
```

#### **Step 3: Response**
```json
{
  "success": true,
  "message": "Update v2.7.0 is now available for all users",
  "broadcastType": "in-app",
  "timestamp": "2025-10-07T12:00:00Z",
  "notificationMethod": "Auto-check (30 min interval) + In-app banner",
  "whatsappMessageReady": true,
  "socialMediaPostReady": true
}
```

---

### **Method 3: Manual Broadcast (UI)**

File standalone tersedia di: `admin-broadcast.html`

#### **Cara Akses**:
```
http://localhost:3000/admin-broadcast.html
```

#### **Fitur UI**:
- ✅ Pilih versi untuk broadcast
- ✅ Preview pesan (WhatsApp, Social Media)
- ✅ Test broadcast
- ✅ Kirim broadcast
- ✅ Konfirmasi modal

---

## 📝 CARA TAMBAH VERSI BARU

Edit file: `src/routes/updateRoutes.js`

### **Tambah di Version History**:

```javascript
const versionHistory = [
    {
        version: '2.8.0',  // Versi baru
        releaseDate: '2025-11-01',
        type: 'minor',  // major | minor | patch | hotfix
        features: [
            'Fitur baru 1',
            'Fitur baru 2',
            'Fitur baru 3'
        ],
        bugfixes: [
            'Fix bug 1',
            'Fix bug 2'
        ],
        downloadUrl: 'https://github.com/atha0604/e-ijazah-app/releases/latest'
    },
    // Versi lama...
    {
        version: '2.7.0',
        ...
    }
];
```

### **Update package.json**:

```json
{
  "version": "2.8.0"
}
```

### **Selesai!**

User akan otomatis dapat notifikasi saat login/auto-check.

---

## 🔧 NOTIFICATION CHANNELS

### **1. In-App Notification** ✅ (PRIMARY)

**Status**: Active & Automated
**Reach**: All active users
**Method**: Auto-check setiap 30 menit

**Cara Kerja**:
- User buka aplikasi
- `UpdateChecker.init()` dipanggil
- Auto-check setiap 30 menit
- Banner notification muncul jika ada update

**Kelebihan**:
- ✅ Otomatis
- ✅ Tidak perlu setup
- ✅ Langsung muncul di app
- ✅ Modal detail tersedia

---

### **2. WhatsApp Broadcast** 📱 (MANUAL)

**Status**: Manual (Message generator ready)
**Reach**: School contacts dengan WhatsApp

**Cara Pakai**:

```bash
# 1. Get WhatsApp message
curl http://localhost:3000/api/updates/preview-message/2.7.0?format=text
```

**Output**:
```
🎉 *UPDATE APLIKASI E-IJAZAH v2.7.0*

📅 Tanggal Rilis: 3 Januari 2025
🆕 Tipe Update: Fitur Baru

✨ *FITUR BARU:*
• Sistem sinkronisasi data
• Auto-sync scheduler
• Dashboard monitoring

🔧 *PERBAIKAN:*
• Optimasi performa database
• Perbaikan UI responsif

🌐 *CARA MENGAKSES:*
• Web: https://nilai-e-ijazah.koyeb.app
• Desktop: Download di GitHub Releases

---
Tim Pengembang E-Ijazah
```

**Copy paste ke WhatsApp Business dan kirim manual.**

---

### **3. Social Media Post** 🌐 (MANUAL)

**Status**: Manual (Post generator ready)

**Cara Pakai**:

```bash
# Get social media post
curl http://localhost:3000/api/updates/preview-message/2.7.0
```

Look for `socialMedia` field in response.

**Output**:
```
🚀 Aplikasi E-Ijazah v2.7.0 telah dirilis!

✨ Highlights update ini:
• Sistem sinkronisasi data
• Auto-sync scheduler
• Dashboard monitoring

💡 Akses sekarang di: nilai-e-ijazah.koyeb.app

#EIjazah #SekolahDigital #SistemNilai #Update
```

**Copy paste ke Facebook/Instagram/Twitter.**

---

## 🔒 SECURITY

### **Admin Broadcast Key**

File `.env`:
```bash
ADMIN_BROADCAST_KEY=your_super_secret_key_here
```

**Important**:
- ✅ Gunakan key yang kuat (min 20 karakter)
- ✅ Jangan commit ke Git
- ✅ Simpan di .env (sudah di .gitignore)
- ❌ Jangan share ke publik

### **API Protection**

Broadcast endpoint dilindungi:
```javascript
if (adminKey !== process.env.ADMIN_BROADCAST_KEY) {
    return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid admin key'
    });
}
```

---

## 📊 MONITORING

### **Check Broadcast History**

Cek log server:
```bash
tail -f logs/application.log | grep "Broadcasting update"
```

### **Verify Version Available**

```bash
curl http://localhost:3000/api/updates/check
```

Response:
```json
{
  "currentVersion": "2.7.0",
  "latestVersion": "2.7.0",
  "updateAvailable": false
}
```

### **View All Versions**

```bash
curl http://localhost:3000/api/updates/changelog
```

---

## 🧪 TESTING

### **Test Auto-check**

1. Login sebagai sekolah
2. Buka menu "Cek Update"
3. Klik "Cek Update Sekarang"
4. Verifikasi response

### **Test Banner Notification**

1. Update version di `updateRoutes.js` (buat versi lebih tinggi)
2. Restart server
3. Login ke aplikasi
4. Banner harus muncul dalam 30 detik - 30 menit

### **Test Broadcast API**

```bash
# Test dengan invalid key (harus 403)
curl -X POST http://localhost:3000/api/updates/broadcast \
  -H "Content-Type: application/json" \
  -d '{"version":"2.7.0","adminKey":"wrong"}'

# Test dengan valid key (harus 200)
curl -X POST http://localhost:3000/api/updates/broadcast \
  -H "Content-Type: application/json" \
  -d '{"version":"2.7.0","adminKey":"rahasia_super_aman_123"}'
```

---

## ❓ FAQ

### **Q: Kenapa tidak pakai email?**
**A**: Simplified approach. In-app notification sudah cukup karena:
- Auto-check setiap 30 menit
- User pasti lihat saat login
- No setup/maintenance needed
- No privacy concerns

### **Q: Bagaimana cara sekolah tahu ada update?**
**A**:
1. **Otomatis**: Banner notification muncul saat login/auto-check
2. **Manual**: Klik menu "Cek Update"

### **Q: Apakah perlu broadcast manual?**
**A**: Tidak! Sistem sudah otomatis. Broadcast manual hanya jika ingin logging eksplisit.

### **Q: Bagaimana tracking siapa yang sudah update?**
**A**: Cek dari user login version atau analytics dashboard (jika ada).

### **Q: Bisa kirim notifikasi push mobile?**
**A**: Saat ini tidak. Fokus web-based with in-app notification.

---

## 🚀 QUICK REFERENCE

### **Admin Checklist - Rilis Update Baru**

```
☐ Update version di package.json
☐ Tambah entry di versionHistory (updateRoutes.js)
☐ Test locally (cek update API)
☐ Commit & push ke GitHub
☐ Create GitHub release (optional)
☐ Deploy ke production
☐ (Optional) Broadcast via API
☐ (Optional) Post ke WhatsApp/Social Media
☐ Monitor user adoption
```

### **Key Files**

| File | Purpose |
|------|---------|
| `src/routes/updateRoutes.js` | Version history & API |
| `src/utils/updateNotifier.js` | Broadcast logic |
| `public/update-checker.js` | Auto-check frontend |
| `public/update-section.js` | UI section |
| `admin-broadcast.html` | Admin UI (standalone) |

---

**Selesai!** Sistem update sudah 100% siap tanpa email. 🎉
