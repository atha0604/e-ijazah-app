# 🔄 WORKFLOW SYNC: WEB ↔ ELECTRON

## 📋 OVERVIEW

**Web Version**: `ai-e-ijazah.koyeb.app` - Auto-deploy dari GitHub
**Electron Version**: Local files - Manual update diperlukan
**NEW**: Hybrid Mode - Switch between local & web dalam 1 aplikasi

---

## 🎯 CURRENT UPDATE FLOW

### **Web Version (Auto)**
```
1. Code changes → Git push to main branch
2. Koyeb auto-detects changes
3. Auto-deploy dalam 2-5 menit
4. User langsung dapat update terbaru
```

### **Electron Version (Manual)**
```
1. Code changes → Git push to main branch
2. Manual build: npm run build-portable
3. Manual distribution: ZIP file upload
4. User download & extract manual
```

---

## 🚀 NEW: HYBRID MODE IMPLEMENTATION

### **File Modified**
- ✅ `electron-main-embedded.js` - Added web mode support
- ✅ `jalankan-web-mode.bat` - Launcher for web mode

### **New Features**
1. **Menu Toggle**: File → Switch ke Web Version
2. **Command Line**: `npx electron . --web`
3. **Environment**: `SET USE_WEB_VERSION=true`

### **Usage**
```bash
# Mode Lokal (Default)
npx electron .

# Mode Web (Always Updated)
npx electron . --web

# Atau gunakan launcher
jalankan-web-mode.bat
```

---

## 📝 SYNC WORKFLOW PROCESS

### **Phase 1: Development**
```bash
# 1. Buat perubahan di local
git add .
git commit -m "FEATURE: New functionality"
git push origin main

# 2. Web version auto-update (Koyeb)
# ✅ ai-e-ijazah.koyeb.app langsung terupdate

# 3. Test via hybrid mode
npx electron . --web  # Test web version in Electron
```

### **Phase 2: Electron Distribution**
```bash
# 1. Build portable version
node build-portable.js

# 2. Test local build
cd dist/portable-fixed
npx electron .

# 3. Package for distribution
# ZIP folder → Upload to GitHub Releases
```

### **Phase 3: User Update Options**

**Option A: Hybrid Mode (Instant Update)**
```
1. User buka Electron app
2. File → Switch ke Web Version
3. Langsung dapat update terbaru
4. No download required
```

**Option B: Manual Update (Traditional)**
```
1. Download ZIP terbaru dari GitHub
2. Extract & replace folder lama
3. Jalankan JALANKAN-APLIKASI.bat
```

---

## 🔧 DEVELOPER WORKFLOW

### **Daily Development**
```bash
# Local development
npm start          # Test web server
npm run electron   # Test Electron app

# Hybrid testing
npx electron . --web    # Test web version in Electron wrapper
npx electron . --dev    # Test local with dev tools
```

### **Release Process**
```bash
# 1. Feature complete
git add .
git commit -m "RELEASE: Version 2.7.0"
git push origin main

# 2. Wait for Koyeb deploy (5 menit)
# 3. Test web version: ai-e-ijazah.koyeb.app

# 4. Build Electron version
node build-portable.js

# 5. Test local build
cd dist/portable-fixed && npx electron .

# 6. Create GitHub Release
# Upload ZIP dengan changelog
```

---

## 📊 UPDATE COMPARISON

| Aspect | Web Version | Electron Local | Hybrid Mode |
|--------|-------------|----------------|-------------|
| **Update Speed** | ⚡ Instant | ❌ Manual | ⚡ Instant |
| **Internet Required** | ✅ Yes | ❌ No | ✅ Yes (for web mode) |
| **Database** | 🌐 Shared | 💾 Local | 🔄 Choice |
| **Offline Work** | ❌ No | ✅ Yes | ⚠️ Local mode only |
| **Performance** | 🌐 Network | ⚡ Native | 🔄 Depends on mode |

---

## 🎯 BEST PRACTICES

### **For Users**
1. **Daily Use**: Hybrid mode dengan web version (selalu update)
2. **Offline Work**: Switch ke local mode
3. **Critical Work**: Local mode (lebih stabil)

### **For Developers**
1. **Small Updates**: Push ke web, user use hybrid mode
2. **Major Updates**: Build new Electron version
3. **Emergency Fix**: Web version first, Electron later

### **Version Strategy**
```
Web Version: Continuous (main branch)
Electron Version: Tagged releases (v2.6.0, v2.7.0)
Hybrid Mode: Best of both worlds
```

---

## 🔄 MIGRATION PATH

### **Current Users (v2.6.0)**
```
1. Download update dengan hybrid mode support
2. Install seperti biasa
3. Mulai gunakan File → Switch ke Web Version
4. Enjoy instant updates!
```

### **Future Enhancements**
- [ ] Auto-update notification system
- [ ] Background sync for offline mode
- [ ] Settings persistence between modes
- [ ] Data sync between local & web database

---

## 💡 CONCLUSION

**Problem Solved**: ✅ Electron version sekarang bisa dapat update instant melalui hybrid mode
**User Benefit**: Pilihan antara stability (local) dan fresh updates (web)
**Developer Benefit**: Tidak perlu build Electron untuk setiap small update

**Bottom Line**: User tidak perlu menunggu download & install untuk mendapat fitur terbaru!