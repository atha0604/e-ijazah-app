# File Split Analysis & Safe Refactoring Plan

## 📊 Current State

### File Sizes
| File | Lines | Size | Status |
|------|-------|------|--------|
| `public/script.js` | **10,896** | 428KB | ⚠️ CRITICAL |
| `src/controllers/dataController.js` | **1,881** | 75KB | ⚠️ HIGH |

**Target**: < 500 lines per file

---

## ⚠️ Why Direct Split is DANGEROUS

### 1. Global State Dependencies
```javascript
// Line 61-67: Shared by ALL functions
let database = {
    sekolah: [],
    siswa: [],
    nilai: {},
    settings: {},
    sklPhotos: {}
};

// Line 69-80: 10 tables with pagination state
let paginationState = { ... };

// Line 82-92: Performance cache
let tableDataCache = { ... };
```

**Problem**: If we split files, ALL modules need access to `database`, creating tight coupling.

### 2. Circular Function Dependencies

**Example from script.js:**
```
renderDashboardStats()
  → calls filterSiswaData()
    → calls updateDashboardComplete()
      → calls renderAdminTable()
        → calls applySort()
          → calls getFilteredAndSortedData()
```

**Problem**: If `renderDashboardStats()` is in `dashboard.js` and `filterSiswaData()` is in `siswa.js`, they need to import each other → circular dependency.

### 3. Global DOM References (44 elements)
```javascript
const loginPage = document.getElementById('loginPage');
const adminDashboard = document.getElementById('adminDashboard');
const sekolahDashboard = document.getElementById('sekolahDashboard');
// ... 41 more
```

**Problem**: DOM elements referenced globally, hard to split without breaking UI logic.

### 4. No Module System
- File currently loads in `<script>` tag (no imports/exports)
- All functions are in global scope
- No namespacing or encapsulation

---

## 🔍 File Structure Analysis

### public/script.js (10,896 lines)

#### Sections Identified:
| Section | Lines | Functions | Can Split? |
|---------|-------|-----------|------------|
| **Global State** | 1-100 | DOM refs, state | ❌ Core |
| **Utility Functions** | 100-600 | fetch, cache, sort | ⚠️ Maybe |
| **Login & Auth** | 500-800 | login, logout | ✅ Yes |
| **Dashboard** | 800-1500 | stats, counters | ⚠️ Depends |
| **Isi Nilai** | 1500-2500 | grade input | ✅ Yes |
| **Siswa CRUD** | 2200-2800 | add/edit/delete | ✅ Yes |
| **Admin Functions** | 2800-3200 | admin panel | ✅ Yes |
| **Rekap Nilai** | 3200-3600 | reports | ✅ Yes |
| **PDF Generation** | 3600-4500 | transkrip, SKL | ✅ Yes |
| **Settings** | 4000-4300 | settings page | ✅ Yes |
| **Import/Export** | 4300-5500 | Excel, data | ⚠️ Complex |
| **Ranking** | 5200-5400 | ranking calc | ✅ Yes |
| **Event Handlers** | 5400-10896 | click, input | ❌ Core |

**Total Functions**: ~200+

---

## 🚨 Risks of Immediate Split

### HIGH RISK ⚠️
1. **Breaking Changes** - App akan crash karena missing functions
2. **State Management** - `database` object tidak accessible
3. **Event Listeners** - Event handlers lose context
4. **Load Order** - Scripts must load in correct order
5. **Testing Complexity** - Need to test EVERY page/feature

### MEDIUM RISK ⚠️
1. **Performance** - Multiple file loads (can mitigate with bundler)
2. **Debugging** - Stack traces across files harder to read
3. **Maintenance** - More files to track

---

## ✅ SAFE Refactoring Strategy (Incremental)

### Phase 0: Preparation (DO THIS FIRST) ✅
1. ✅ **Backup files** - DONE (`backup/pre-split-20250105-critical/`)
2. ⏳ **Add module system** - Convert to ES6 modules
3. ⏳ **Create state manager** - Centralized state (Redux-like)
4. ⏳ **Map all dependencies** - Document function calls
5. ⏳ **Write integration tests** - Ensure nothing breaks

### Phase 1: Extract Pure Utilities (Low Risk)
Split functions with **NO dependencies on global state**:

```javascript
// public/js/utils/formatter.js
export function formatDate(date) { ... }
export function formatNumber(num) { ... }
export function normalizeKecamatan(str) { ... }

// public/js/utils/validator.js
export function validateNISN(nisn) { ... }
export function validateNilai(nilai) { ... }
```

**Files to create:**
- `public/js/utils/formatter.js` (~200 lines)
- `public/js/utils/validator.js` (~150 lines)
- `public/js/utils/calculator.js` (~300 lines)

**Risk**: ✅ LOW - Pure functions, no side effects

### Phase 2: Centralize State (Medium Risk)
Create single source of truth:

```javascript
// public/js/state/store.js
class AppStore {
    constructor() {
        this.database = { sekolah: [], siswa: [], nilai: {} };
        this.pagination = { ... };
        this.cache = { ... };
    }

    getSekolah() { return this.database.sekolah; }
    setSekolah(data) { this.database.sekolah = data; }
    // ... getters/setters
}

export const store = new AppStore();
```

**Files to create:**
- `public/js/state/store.js` (~500 lines)
- `public/js/state/actions.js` (~300 lines)

**Risk**: ⚠️ MEDIUM - Requires refactoring ALL state access

### Phase 3: Extract Feature Modules (Medium Risk)
Group related functions by feature:

```javascript
// public/js/modules/siswa.js
import { store } from '../state/store.js';

export function renderSiswaTable() { ... }
export function addSiswa(data) { ... }
export function editSiswa(id, data) { ... }
export function deleteSiswa(id) { ... }
```

**Files to create:**
- `public/js/modules/siswa.js` (~800 lines)
- `public/js/modules/nilai.js` (~900 lines)
- `public/js/modules/sekolah.js` (~600 lines)
- `public/js/modules/pdf.js` (~1000 lines)
- `public/js/modules/ranking.js` (~200 lines)
- `public/js/modules/settings.js` (~300 lines)

**Risk**: ⚠️ MEDIUM - Need proper import/export, test each module

### Phase 4: Update HTML (Low Risk)
Change from single script to modules:

```html
<!-- OLD (current) -->
<script src="script.js"></script>

<!-- NEW -->
<script type="module" src="js/main.js"></script>
```

**Risk**: ✅ LOW - Modern browsers support ES6 modules

### Phase 5: Bundle for Production (Optional)
Use webpack/vite to bundle modules:

```bash
npm install --save-dev vite
vite build
```

**Risk**: ✅ LOW - Build step, doesn't affect dev code

---

## 📋 Detailed Split Plan (When Ready)

### Target Structure:
```
public/
├── js/
│   ├── main.js              (Entry point, ~100 lines)
│   ├── config.js            (Constants, ~50 lines)
│   ├── state/
│   │   ├── store.js         (State management, ~500 lines)
│   │   └── actions.js       (State actions, ~300 lines)
│   ├── utils/
│   │   ├── formatter.js     (Format utils, ~200 lines)
│   │   ├── validator.js     (Validation, ~150 lines)
│   │   ├── calculator.js    (Calculations, ~300 lines)
│   │   └── api.js           (Fetch wrapper, ~200 lines)
│   ├── modules/
│   │   ├── auth.js          (Login/logout, ~300 lines)
│   │   ├── dashboard.js     (Dashboard, ~400 lines)
│   │   ├── siswa.js         (Siswa CRUD, ~800 lines)
│   │   ├── nilai.js         (Nilai management, ~900 lines)
│   │   ├── sekolah.js       (Sekolah management, ~600 lines)
│   │   ├── pdf.js           (PDF generation, ~1000 lines)
│   │   ├── ranking.js       (Ranking logic, ~200 lines)
│   │   ├── settings.js      (Settings page, ~300 lines)
│   │   └── import.js        (Import/Export, ~800 lines)
│   └── ui/
│       ├── modal.js         (Modal handlers, ~200 lines)
│       ├── table.js         (Table rendering, ~400 lines)
│       └── pagination.js    (Pagination, ~300 lines)
└── script.js (DEPRECATED - keep for rollback)
```

**Total**: ~7,500 lines organized (vs 10,896 monolithic)
**Max file size**: ~1,000 lines (vs 10,896)

---

## 🧪 Testing Strategy

### Before Split:
- [ ] Document all user flows (login, add siswa, input nilai, etc.)
- [ ] Create manual test checklist
- [ ] Take screenshots of working features
- [ ] Test on different browsers (Chrome, Firefox, Edge)

### During Split (Per Phase):
- [ ] Test feature in isolation
- [ ] Verify state updates work
- [ ] Check console for errors
- [ ] Test on localhost before deploy

### After Split:
- [ ] Full regression test (all features)
- [ ] Performance comparison (load time)
- [ ] Monitor for 1 week before considering stable

---

## 🔄 Rollback Plan

### If Split Breaks App:

**Quick Rollback (< 5 min):**
```bash
# Restore from backup
cp backup/pre-split-20250105-critical/script.js.backup public/script.js
cp backup/pre-split-20250105-critical/dataController.js.backup src/controllers/dataController.js

# Refresh browser
# DONE
```

**Files Backed Up:**
- ✅ `public/script.js` → `backup/pre-split-20250105-critical/script.js.backup`
- ✅ `src/controllers/dataController.js` → `backup/pre-split-20250105-critical/dataController.js.backup`

---

## 📊 Complexity Analysis

### dataController.js (1,881 lines)

**Structure:**
```javascript
// Line 1-50: Imports & setup
const db = require('../database/db');

// Line 50-500: Sekolah endpoints
router.post('/sekolah/import', ...);
router.get('/sekolah', ...);

// Line 500-1000: Siswa endpoints
router.post('/siswa/import', ...);
router.get('/siswa', ...);

// Line 1000-1500: Nilai endpoints
router.post('/nilai/import', ...);
router.get('/nilai/:nisn', ...);

// Line 1500-1881: Settings, mulok, cleanup
router.post('/settings', ...);
router.delete('/cleanup/:tableId', ...);
```

**Split Plan for dataController.js:**
```
src/controllers/
├── sekolahController.js     (~400 lines)
├── siswaController.js       (~500 lines)
├── nilaiController.js       (~500 lines)
├── settingsController.js    (~200 lines)
└── adminController.js       (~300 lines)

src/routes/
├── sekolahRoutes.js
├── siswaRoutes.js
├── nilaiRoutes.js
└── settingsRoutes.js
```

**Risk**: ⚠️ MEDIUM - Backend split easier than frontend, but test all endpoints

---

## 🎯 Recommendation

### DO NOT split immediately. Instead:

**Week 1: Preparation**
1. ✅ Backup files (DONE)
2. Add comprehensive comments to map dependencies
3. Create function dependency graph
4. Write integration tests

**Week 2: Foundation**
1. Implement ES6 module system
2. Create centralized state manager
3. Extract pure utility functions

**Week 3: Gradual Migration**
1. Split one feature module (start with "Settings" - least dependencies)
2. Test thoroughly
3. If successful, continue with next module

**Week 4: Backend Split**
1. Split dataController.js into separate route files
2. Test all API endpoints
3. Monitor for errors

**Estimated Total Time**: 1 month (safe, incremental)
**Alternative (Risky)**: 1 week (high chance of breaking everything)

---

## ⚠️ CRITICAL WARNING

**DO NOT proceed with direct split unless:**
- [ ] User explicitly approves the risk
- [ ] Full backup verified
- [ ] Test plan documented
- [ ] Rollback procedure tested
- [ ] Dedicated testing time allocated (2-3 days)

**Current Status**: ❌ **NOT READY FOR SPLIT**

**Backup Status**: ✅ **Files backed up successfully**

**Next Action Required**:
1. Get user approval for incremental approach, OR
2. Get user acknowledgment of risks for immediate split

---

## 📝 Notes

- File was originally well-structured with section comments
- Many "REPLACE" and "FINAL" comments suggest previous refactoring attempts
- Presence of cache optimization shows performance was already considered
- Global state pattern suggests this app grew organically over time

**Conclusion**: This is a **high-value, high-risk** refactoring. Rushing will break the app. Incremental approach is strongly recommended.

---

**Created**: 2025-01-05
**Backup Location**: `backup/pre-split-20250105-critical/`
**Status**: Analysis Complete, Awaiting User Decision
