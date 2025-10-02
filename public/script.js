// API configuration moved to js/config.js

// Mobile functionality moved to js/mobile.js

// Update top-right header name to current school name (if available)
function updateHeaderSchoolName() {
  try {
    if (!window.currentUser || !window.currentUser.schoolData) return;
    const schoolName = window.currentUser.schoolData[4] || window.currentUser.schoolData[5];
    if (!schoolName) return;

    // Update admin dashboard header
    const adminHeaderNameEl = document.querySelector('#adminDashboard .dashboard-header .user-profile .user-info h3');
    if (adminHeaderNameEl) {
      adminHeaderNameEl.textContent = schoolName;
      adminHeaderNameEl.title = schoolName;
    }

    // Update sekolah dashboard header
    const schoolHeaderNameEl = document.querySelector('#sekolahDashboard .dashboard-header .user-profile .user-info h3');
    if (schoolHeaderNameEl) {
      schoolHeaderNameEl.textContent = schoolName;
      schoolHeaderNameEl.title = schoolName;
    }
  } catch (e) {
    // silent fail to avoid breaking UI
  }
}


  // --- ELEMEN DOM ---
        const loginPage = document.getElementById('loginPage');
        const adminDashboard = document.getElementById('adminDashboard');
        const sekolahDashboard = document.getElementById('sekolahDashboard');
        const appCodeInput = document.getElementById('appCode');
        const editModal = document.getElementById('editModal');
        const transkripModal = document.getElementById('transkripModal');
        const sklModal = document.getElementById('sklModal');
        const skkbModal = document.getElementById('skkbModal');
        const editSiswaForm = document.getElementById('editSiswaForm');
        const loginInfoModal = document.getElementById('loginInfoModal');
        const versionInfoBadge = document.getElementById('version-info-badge');
        const loadingOverlay = document.getElementById('loadingOverlay');

        // Initialize all modals as hidden
        function initializeModals() {
            const modals = [editModal, transkripModal, sklModal, skkbModal, loginInfoModal];
            modals.forEach(modal => {
                if (modal) modal.style.display = 'none';
            });
        }

        // Call initialize function
        initializeModals();

        // Reset modal flag on page load
        window.loginInfoModalShown = false;


        // --- STATE MANAGEMENT ---
        let database = {
            sekolah: [],
            siswa: [],
            nilai: {},
            settings: {},
            sklPhotos: {}
        };

let paginationState = {
    sekolah: { currentPage: 1, rowsPerPage: 10 },
    siswa: { currentPage: 1, rowsPerPage: 10 },
    sekolahSiswa: { currentPage: 1, rowsPerPage: 10 },
    isiNilai: { currentPage: 1, rowsPerPage: 10, currentSemester: null, currentSemesterName: null },
    transkripNilai: { currentPage: 1, rowsPerPage: 10 },
    skl: { currentPage: 1, rowsPerPage: 10 },
    skkb: { currentPage: 1, rowsPerPage: 10 },
    cetakGabungan: { currentPage: 1, rowsPerPage: 10 },
    rekapNilai: { currentPage: 1, rowsPerPage: 10 },
    rekapNilaiAdmin: { currentPage: 1, rowsPerPage: 10 } 
};

// Performance optimization: Cache untuk data yang sudah difilter dan disort
let tableDataCache = {
    sekolah: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    siswa: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    sekolahSiswa: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    isiNilai: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    transkripNilai: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    cetakGabungan: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    rekapNilai: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 },
    rekapNilaiAdmin: { filteredData: null, lastSearchTerm: '', lastSortKey: '', lastSortDirection: 'asc', lastTimestamp: 0 }
};

// Performance optimization functions
function invalidateTableCache(tableId) {
    if (tableDataCache[tableId]) {
        tableDataCache[tableId].filteredData = null;
        tableDataCache[tableId].lastTimestamp = 0;
    }
}

function getFilteredAndSortedData(tableId, rawData, searchTerm, sortKey, sortDirection) {
    const cache = tableDataCache[tableId];
    if (!cache) return rawData;
    
    const currentTimestamp = Date.now();
    
    // Check if we can use cached data
    const canUseCache = cache.filteredData !== null &&
                       cache.lastSearchTerm === searchTerm &&
                       cache.lastSortKey === sortKey &&
                       cache.lastSortDirection === sortDirection &&
                       (currentTimestamp - cache.lastTimestamp) < 30000; // Cache valid for 30 seconds
    
    if (canUseCache) {
        return cache.filteredData;
    }
    
    // Process data
    let filteredData = rawData;
    
    // Apply search filter
    if (searchTerm && searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        filteredData = rawData.filter(row => {
            return row.some(cell => 
                String(cell || '').toLowerCase().includes(searchLower)
            );
        });
    }
    
    // Apply sorting
    if (sortKey && sortKey.trim() !== '') {
        filteredData = [...filteredData].sort((a, b) => {
            let aVal = a[sortKey] || '';
            let bVal = b[sortKey] || '';
            
            // Try to parse as numbers
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            } else {
                // String comparison
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            }
        });
    }
    
    // Update cache
    cache.filteredData = filteredData;
    cache.lastSearchTerm = searchTerm;
    cache.lastSortKey = sortKey;
    cache.lastSortDirection = sortDirection;
    cache.lastTimestamp = currentTimestamp;
    
    return filteredData;
}

function optimizedUpdatePaginationControls(tableId, totalRows) {
    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
        const controls = document.querySelector(`.pagination-controls[data-table-id="${tableId}"]`);
        if (!controls) return;

        const state = paginationState[tableId];
        if (!state) return;

        const rowsPerPage = state.rowsPerPage === 'all' ? totalRows : parseInt(state.rowsPerPage, 10);
        const totalPages = rowsPerPage > 0 ? Math.ceil(totalRows / rowsPerPage) : 1;
        const infoSpan = controls.querySelector('.pagination-info');
        const prevButton = controls.querySelector('.prev-page');
        const nextButton = controls.querySelector('.next-page');

        // Batch DOM updates to avoid reflow
        const startRow = ((state.currentPage - 1) * rowsPerPage) + 1;
        const endRow = Math.min(state.currentPage * rowsPerPage, totalRows);

        if (infoSpan) {
            infoSpan.textContent = totalRows > 0
                ? `${startRow}-${endRow} dari ${totalRows} item`
                : '0 item';
        }

        // Update rows per page dropdown to match current state
        const rowsPerPageSelect = controls.querySelector('.rows-per-page');
        if (rowsPerPageSelect && rowsPerPageSelect.value !== state.rowsPerPage) {
            rowsPerPageSelect.value = state.rowsPerPage;
        }

        if (prevButton) prevButton.disabled = state.currentPage <= 1;
        if (nextButton) nextButton.disabled = state.currentPage >= totalPages;
    });
}

// Debounced search untuk mengurangi pemrosesan berlebihan
let searchDebounceTimers = {};

function debouncedSearch(tableId, searchTerm, delay = 300) {
    // Clear existing timer
    if (searchDebounceTimers[tableId]) {
        clearTimeout(searchDebounceTimers[tableId]);
    }
    
    // Set new timer
    searchDebounceTimers[tableId] = setTimeout(() => {
        searchState[tableId] = searchTerm;
        paginationState[tableId].currentPage = 1;
        rerenderActiveTable(tableId);
    }, delay);
}

// Virtual scrolling untuk tabel besar (experimental)

// Optimized DOM manipulation for large tables


// Intersection Observer for lazy loading table rows

let searchState = {
    siswa: '',
    sekolahSiswa: '',
    isiNilai: '',
    transkripNilai: '',
    skl: '',
    skkb: '',
    cetakGabungan: '',
    rekapNilai: ''
};

        let sortState = {
            sekolah: { keyIndex: 8, direction: 'asc', type: 'string' },
            siswa: { keyIndex: 8, direction: 'asc', type: 'string' },
            sekolahSiswa: { keyIndex: 8, direction: 'asc', type: 'string' },
            isiNilai: { keyIndex: 8, direction: 'asc', type: 'string' },
            transkripNilai: { keyIndex: 8, direction: 'asc', type: 'string' },
            skl: { keyIndex: 8, direction: 'asc', type: 'string' },
            skkb: { keyIndex: 8, direction: 'asc', type: 'string' },
            cetakGabungan: { keyIndex: 8, direction: 'asc', type: 'string' },
            rekapNilai: { keyIndex: 8, direction: 'asc', keyType: 'string' }, // <-- TAMBAHKAN INI
            rekapNilaiAdmin: { keyIndex: 8, direction: 'asc', keyType: 'string' } // <-- TAMBAHKAN INI
        };

        // Make window.currentUser global for other modules to access
        window.currentUser = {
            isLoggedIn: false,
            role: null,
            schoolData: null,
            loginType: null,
            kurikulum: null
        };
        
        let autosaveTimer = null;

let charts = {
    completionChart: null,
    averageGradeChart: null // Tambahkan ini
};


const subjects = {
    K13: ["AGAMA", "PKN", "B.INDO", "MTK", "IPA", "IPS", "SBDP", "PJOK", "MULOK1", "MULOK2", "MULOK3"],
    Merdeka: ["AGAMA", "PKN", "B.INDO", "MTK", "IPAS", "B.ING", "SBDP", "PJOK", "MULOK1", "MULOK2", "MULOK3"]
};
        
        // --- PERUBAHAN: Daftar Mapel untuk Transkrip ---
        const transcriptSubjects = {
            K13: [
                { display: 'Pendidikan Agama dan Budi Pekerti', key: 'AGAMA' },
                { display: 'Pendidikan Pancasila dan Kewarganegaraan', key: 'PKN' },
                { display: 'Bahasa Indonesia', key: 'B.INDO' },
                { display: 'Matematika', key: 'MTK' },
                { display: 'Ilmu Pengetahuan Alam', key: 'IPA' },
                { display: 'Ilmu Pengetahuan Sosial', key: 'IPS' },
                { display: 'Seni Budaya dan Prakarya', key: 'SBDP' },
                { display: 'Pendidikan Jasmani, Olahraga dan Kesehatan', key: 'PJOK' },
            ],
            Merdeka: [
                { display: 'Pendidikan Agama dan Budi Pekerti', key: 'AGAMA' },
                { display: 'Pendidikan Pancasila', key: 'PKN' },
                { display: 'Bahasa Indonesia', key: 'B.INDO' },
                { display: 'Matematika', key: 'MTK' },
                { display: 'Ilmu Pengetahuan Alam dan Sosial', key: 'IPAS' },
                { display: 'Bahasa Inggris', key: 'B.ING' },
                { display: 'Seni Budaya dan Prakarya', key: 'SBDP' },
                { display: 'Pendidikan Jasmani, Olahraga dan Kesehatan', key: 'PJOK' },
            ]
        };
        
        const semesterMap = {
            "9": "KELAS 5 SEMESTER 1",
            "10": "KELAS 5 SEMESTER 2",
            "11": "KELAS 6 SEMESTER 1",
            "12": "KELAS 6 SEMESTER 2"
        };
        const semesterIds = Object.keys(semesterMap);


        // Fungsi showLoader yang lama telah dihapus untuk memperbaiki error redeklarasi.

        // Fungsi hideLoader yang lama telah dihapus untuk memperbaiki error redeklarasi.

        // Enhanced loading states for specific operations
        function showButtonLoading(buttonElement, originalText) {
            if (!buttonElement) return originalText;

            // Store original text in data attribute for safety
            const currentText = buttonElement.textContent;
            buttonElement.dataset.originalText = currentText;

            buttonElement.disabled = true;
            buttonElement.style.opacity = '0.7';
            buttonElement.textContent = 'Loading...';

            return currentText;
        }

        function hideButtonLoading(buttonElement, originalText) {
            if (!buttonElement) return;

            // Restore button state
            buttonElement.disabled = false;
            buttonElement.style.opacity = '1';

            // Use original text from parameter, fallback to data attribute, fallback to default
            const textToRestore = originalText || buttonElement.dataset.originalText || 'Masuk';
            buttonElement.textContent = textToRestore;

            // Clean up data attribute
            if (buttonElement.dataset.originalText) {
                delete buttonElement.dataset.originalText;
            }
        }

        // Smart loading for table operations
        function showTableLoading(tableContainer, message = 'Memuat data...') {
            if (!tableContainer) return;
            
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'table-loading-overlay';
            loadingDiv.innerHTML = `
                <div class="table-loading-content">
                    <div class="loading-message">${message}</div>
                </div>
            `;
            
            tableContainer.style.position = 'relative';
            tableContainer.appendChild(loadingDiv);
        }

        function hideTableLoading(tableContainer) {
            if (!tableContainer) return;
            
            const loadingOverlay = tableContainer.querySelector('.table-loading-overlay');
            if (loadingOverlay) loadingOverlay.remove();
        }

        // Enhanced error message handling
        function getErrorMessage(error, operation = 'operasi') {
            // Common error patterns and user-friendly messages
            const errorMessages = {
                'Network Error': 'Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.',
                'Failed to fetch': 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
                'ECONNRESET': 'Koneksi ke server terputus. Silakan coba lagi.',
                'timeout': 'Permintaan memakan waktu terlalu lama. Coba lagi dalam beberapa saat.',
                'ENOTFOUND': 'Server tidak dapat dijangkau. Periksa koneksi internet Anda.',
                'Unauthorized': 'Sesi Anda telah berakhir. Silakan login kembali.',
                '401': 'Sesi Anda telah berakhir. Silakan login kembali.',
                '403': 'Anda tidak memiliki izin untuk melakukan operasi ini.',
                '404': 'Data tidak ditemukan atau URL tidak valid.',
                '500': 'Terjadi kesalahan pada server. Silakan hubungi administrator.',
                '502': 'Server sedang bermasalah. Coba lagi dalam beberapa menit.',
                '503': 'Server sedang dalam pemeliharaan. Coba lagi nanti.',
                'SQLITE_CONSTRAINT': 'Data yang Anda masukkan melanggar aturan database.',
                'duplicate': 'Data sudah ada sebelumnya. Silakan gunakan data yang berbeda.',
                'invalid': 'Format data tidak valid. Periksa kembali input Anda.',
                'missing': 'Data yang diperlukan tidak lengkap. Pastikan semua field terisi.',
            };
            
            if (!error) return `Gagal melakukan ${operation}. Silakan coba lagi.`;
            
            const errorString = error.toString ? error.toString() : String(error);
            const message = error.message || errorString;
            
            // Check for known error patterns
            for (const [pattern, friendlyMessage] of Object.entries(errorMessages)) {
                if (message.toLowerCase().includes(pattern.toLowerCase())) {
                    return friendlyMessage;
                }
            }
            
            // If it's already a user-friendly message, return as is
            if (message.length < 100 && !message.includes('Error:') && !message.includes('at ')) {
                return message;
            }
            
            // Generic fallback with operation context
            return `Gagal melakukan ${operation}. ${message.split('.')[0]}. Silakan coba lagi.`;
        }

        // Enhanced notification with better error handling
        function showSmartNotification(messageOrError, type = 'success', operation = 'operasi') {
            let finalMessage;
            
            if (type === 'error') {
                finalMessage = getErrorMessage(messageOrError, operation);
            } else {
                finalMessage = messageOrError;
            }
            
            showNotification(finalMessage, type);
        }

        // Fungsi showNotification yang lama telah dihapus untuk memperbaiki error redeklarasi.


        function showAutosaveStatus(status) {
            const indicator = document.getElementById('autosaveIndicator');
            if (!indicator) return;

            if (status === 'saving') {
                indicator.textContent = 'Menyimpan...';
                indicator.className = 'autosave-indicator saving';
            } else if (status === 'saved') {
                indicator.textContent = '✔ Tersimpan';
                indicator.className = 'autosave-indicator saved';
                setTimeout(() => {
                    indicator.className = 'autosave-indicator';
                }, 2000);
            } else {
                indicator.className = 'autosave-indicator';
            }
        }

       
// REPLACE: fetchWithAuth
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('jwtToken');
  if (!token) { handleLogout?.(); throw new Error('Sesi tidak ditemukan. Silakan login kembali.'); }

  const fullUrl = /^https?:\/\//i.test(url) ? url : apiUrl(url);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  try {
    const resp = await fetch(fullUrl, { ...options, headers });
    if (resp.status === 401 || resp.status === 403) { handleLogout?.(); throw new Error('Sesi Anda telah berakhir. Silakan login kembali.'); }

    const data = await resp.json().catch(() => ({}));

    // Jika status bukan 2xx, throw error dengan message dari response
    if (!resp.ok) {
      throw new Error(data.message || `HTTP ${resp.status}: ${resp.statusText}`);
    }

    return data;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('fetchWithAuth error:', {
      url: fullUrl,
      method: options.method || 'GET',
      error: error.message,
      stack: error.stack
    });

    // Check if it's a network error
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Koneksi ke server terputus. Periksa koneksi internet Anda dan coba lagi.');
    }

    throw error;
  }
}




// Util: Migrasi flag PRO global -> per sekolah
function migrateLegacyProFlag(kodeBiasa, kodePro) {
  const legacyActivated = localStorage.getItem('kodeProActivated');
  const legacyValue = (localStorage.getItem('kodeProValue') || '').toString().trim().toUpperCase();
  const schoolKodePro = (kodePro || '').toString().trim().toUpperCase();
  // Hanya migrasi jika legacyValue cocok dengan kodePro sekolah ini
  if (legacyActivated === 'true' && legacyValue && schoolKodePro && legacyValue === schoolKodePro) {
    if (kodeBiasa) {
      localStorage.setItem(`kodeProActivated:${kodeBiasa}`, 'true');
      localStorage.setItem(`kodeProValue:${kodeBiasa}`, legacyValue);
    }
  }
  // Selalu bersihkan key legacy global agar tidak auto-aktif untuk sekolah lain
  localStorage.removeItem('kodeProActivated');
  localStorage.removeItem('kodeProValue');
}

// GANTI SELURUH FUNGSI handleLogin DENGAN VERSI FINAL INI
async function handleLogin(event) {
    event.preventDefault();
    const loginBtn = event.target.querySelector('button[type="submit"]');

    // Ensure we have the login button and store original text safely
    if (!loginBtn) {
        console.error('Login button not found');
        return;
    }

    const originalText = showButtonLoading(loginBtn);
    // Don't use showLoader on login page to avoid circular spinner

    const appCode = appCodeInput.value.trim();
    const kurikulum = document.querySelector('input[name="kurikulum"]:checked').value;

    if (!appCode) {
        showSmartNotification('Silakan masukkan Kode Aplikasi.', 'warning', 'login');
        hideButtonLoading(loginBtn, originalText);
        // hideLoader(); // Disabled for login page
        return;
    }

    try {
        const result = await fetch(apiUrl('/api/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appCode, kurikulum }),
        });

        const loginData = await result.json();

        if (loginData.success) {
            localStorage.setItem('jwtToken', loginData.token);

            // Migrasi flag PRO legacy (global) ke skop sekolah saat login (hanya jika cocok kodePro)
            migrateLegacyProFlag(loginData?.schoolData?.[0], loginData?.schoolData?.[1]);
            window.currentUser = {
                isLoggedIn: true,
                role: loginData.role,
                schoolData: loginData.schoolData,
                loginType: loginData.loginType,
                kurikulum: loginData.kurikulum,
                token: loginData.token
            };
            // ================================

            localStorage.setItem('currentUserSession', JSON.stringify(window.currentUser));

            await fetchDataFromServer();

            // Reset button sebelum pindah ke dashboard
            hideButtonLoading(loginBtn, originalText);

            showDashboard(window.currentUser.role);
            if (window.currentUser.role === 'sekolah') {
                showLoginInfoModal();
            }
        } else {
            throw new Error(loginData.message);
        }
    } catch (error) {
        // Only log to console for unexpected errors, not user input errors
        if (error.message !== 'Kode Aplikasi tidak ditemukan.') {
            console.error('Login error:', error);
        }
        showSmartNotification(error, 'error', 'login');
        // Ensure button is reset on error
        hideButtonLoading(loginBtn, originalText);
    } finally {
        // Final safety net - always restore button
        if (loginBtn && loginBtn.disabled) {
            hideButtonLoading(loginBtn, originalText);
        }
        // hideLoader(); // Disabled for login page
    }
}

// ==========================================================
// == TAMBAHKAN KEMBALI FUNGSI YANG HILANG INI ==
// ==========================================================
// === FINAL: Simpan HANYA SATU versi dari fungsi ini ===
async function fetchDataFromServer(silent = false) {
  try {
    if (typeof showLoader === 'function' && !silent) showLoader('Memuat data dari server...');

    const result = await fetchWithAuth(apiUrl('/api/data/all'));

    if (!result?.success) {
      throw new Error(result?.message || 'Gagal memuat data dari server.');
    }

    // Update state global
    database = result.data;

    // Update admin counters setelah data dimuat
    updateAdminCounters();

    // Update logo preview UI with loaded settings
    updateLogoPreviewUI();

    // PERFORMANCE: Invalidate all table caches when data changes from server
    Object.keys(tableDataCache).forEach(tableId => {
        invalidateTableCache(tableId);
    });
    
    // Debug logs removed for production

    // Re-render section aktif di Admin
    const activeAdminSection = document.querySelector('#adminDashboard .content-section.active');
    if (activeAdminSection && typeof renderAdminTable === 'function') {
      renderAdminTable(activeAdminSection.id);
    }

    // Re-render section aktif di Sekolah
    const activeSekolahSection = document.querySelector('#sekolahDashboard .content-section.active');
    if (activeSekolahSection) {
      const tableId = activeSekolahSection.dataset.tableId || activeSekolahSection.id;

      // Only rerender if it's a valid table ID, not dashboard sections
      const validTableIds = ['sekolahSiswa', 'sekolahNilai', 'sekolahTranskripNilai', 'sekolahSKL', 'sekolahSKKB', 'sekolahCetak'];

      if (validTableIds.includes(tableId)) {
        if (typeof rerenderActiveTable === 'function') {
          rerenderActiveTable(tableId);
        }
      } else if (typeof switchSekolahContent === 'function') {
        switchSekolahContent(activeSekolahSection.id);
      }
    }

    // Update ranking widget jika user sedang di dashboard
    if (window.currentUser && window.currentUser.role === 'sekolah' && 
        activeSekolahSection && activeSekolahSection.id === 'dashboardSection') {
      updateRankingWidget();
    }

    return true;
  } catch (error) {
    console.error('Fetch error:', error);
    if (typeof showNotification === 'function' && !silent) {
      showNotification(error.message || 'Gagal memuat data dari server.', 'error');
    }
    throw error; // Re-throw to be handled by caller
  } finally {
    if (typeof hideLoader === 'function' && !silent) hideLoader();
  }
}


// REPLACE: showDashboard
function showDashboard(role) {
  const loginPage = document.getElementById('loginPage');
  const adminDashboard = document.getElementById('adminDashboard');
  const sekolahDashboard = document.getElementById('sekolahDashboard');

  if (loginPage) loginPage.style.display = 'none';
  if (adminDashboard) adminDashboard.style.display = 'none';
  if (sekolahDashboard) sekolahDashboard.style.display = 'none';

  if (role === 'admin' && adminDashboard) {
    adminDashboard.style.display = 'flex';
    adminDashboard.classList.add('css-loaded'); // Prevent FOUC
    // Update counters saat dashboard admin dibuka
    updateAdminCounters();
    if (typeof switchContent === 'function') switchContent('dashboardContent');
  } else if (role === 'sekolah' && sekolahDashboard) {
    sekolahDashboard.style.display = 'flex';
    sekolahDashboard.classList.add('css-loaded'); // Prevent FOUC
    // Reflect school name on the top-right header (admin-style header reused in mockup)
    updateHeaderSchoolName();
    const defaultTarget = 'infoTerbaruSection';
    document.querySelectorAll('#sekolahDashboard .menu-item').forEach(m => m.classList.remove('active'));
    const defaultLink = document.querySelector(`.menu-item[data-target="${defaultTarget}"]`);
    if (defaultLink) defaultLink.classList.add('active');
    if (typeof switchSekolahContent === 'function') switchSekolahContent(defaultTarget);
    renderVersionBadge();
    
    // Check Pro activation menu state after login
    const kodeBiasa = window.currentUser?.schoolData?.[0];
    const isProForSchool = kodeBiasa ? localStorage.getItem(`kodeProActivated:${kodeBiasa}`) === 'true' : false;
    
    // LOGIKA MENU AKTIVASI:
    // 1. Jika login dengan kode PRO -> disable menu
    // 2. Jika login dengan kode biasa tapi sudah aktivasi PRO -> disable menu  
    // 3. Jika login dengan kode biasa dan belum aktivasi PRO -> enable menu (bisa diklik)
    if (window.currentUser?.loginType === 'pro' || isProForSchool) {
      disableAktivasiMenu();
    } else if (window.currentUser?.loginType === 'biasa' && !isProForSchool) {
      enableAktivasiMenu(); // Memastikan menu bisa diklik untuk kode biasa
    }
  }

  // Ensure logo preview is updated after dashboard is shown
  setTimeout(() => {
    updateLogoPreviewUI();
  }, 500); // Small delay to ensure DOM is ready
}

// REPLACE: renderVersionBadge
function renderVersionBadge() {
  const badge = document.getElementById('version-info-badge');
  if (!badge) return;
  if (window.currentUser?.role !== 'sekolah') {
    badge.innerHTML = '';
    return;
  }
  const loginType = window.currentUser.loginType;
  badge.innerHTML = (loginType === 'pro')
    ? `<span class="version-badge pro">VERSI PRO <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="gold" stroke="gold" stroke-width="1"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></span>`
    : `<span class="version-badge biasa">VERSI BIASA</span>`;
}

function switchSekolahContent(targetId) {

    // Remove active class from all sections
    document.querySelectorAll('#sekolahDashboard .content-section').forEach(s => {
        s.classList.remove('active');
    });

    // Add active class to target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');

        // FORCE DISPLAY untuk notificationCenterSection
        if (targetId === 'notificationCenterSection') {
            targetSection.style.display = 'flex';
            targetSection.style.flexDirection = 'column';
            targetSection.style.visibility = 'visible';
            targetSection.style.opacity = '1';
            targetSection.style.minHeight = '400px';
            // targetSection.style.border = '2px solid blue'; // Debug border removed for production
        }
    }

    // Keep header name consistent on every menu change
    updateHeaderSchoolName();
    
    document.querySelectorAll('#sekolahDashboard .sidebar-menu a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`#sekolahDashboard .sidebar-menu a[data-target="${targetId}"]`);
    if(activeLink && !activeLink.classList.contains('has-submenu')) {
         activeLink.classList.add('active');
    }

    if (targetId === 'dashboardSection') {
        renderDashboardStats();
    } else if (targetId === 'profilSiswaSection') {
        // FORCE reset pagination ke halaman 1 saat switch ke menu siswa
        paginationState.sekolahSiswa = { currentPage: 1, rowsPerPage: 10 };
        renderProfilSiswa();
    } else if (targetId === 'transkripNilaiSection') {
        renderTranskripSiswaTable();
    } else if (targetId === 'settingSection') {
        renderSettingsPage();
    } else if (targetId === 'sklSection') {
        renderSklSiswaTable();
    } else if (targetId === 'skkbSection') {
        renderSkkbSiswaTable();
    } else if (targetId === 'cetakGabunganSection') {
        renderCetakGabunganPage();
    } else if (targetId === 'rekapNilaiSection') { // Penambahan untuk menu baru
        renderRekapNilai();
    } else if (targetId === 'infoTerbaruSection') { // Penambahan untuk Info Terbaru
        if (typeof renderInfoTerbaru === 'function') {
            setTimeout(() => {
                renderInfoTerbaru();
            }, 100);
        }
    } else if (targetId === 'aktivasiKodeProSection') { // Penambahan untuk Aktivasi Kode Pro
        initAktivasiKodePro();
    } else if (targetId === 'notificationCenterSection') {
        // RENDER PENGUMUMAN FEED seperti contoh gambar

        const container = document.getElementById('sekolahNotificationCenterContent');
        if (container) {
            // Format seperti contoh di gambar 2 - feed pengumuman
            container.innerHTML = `
                <div style="padding: 0; margin: 0;">
                    <!-- Header dengan icon dan tombol refresh -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #374151;">
                                <path d="M8 2v4"></path>
                                <path d="M16 2v4"></path>
                                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                <path d="M3 10h18"></path>
                            </svg>
                            <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #374151;">Pengumuman</h2>
                        </div>
                        <button onclick="fetchNotifications()" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #0891b2; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                <path d="M21 3v5h-5"></path>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                                <path d="M3 21v-5h5"></path>
                            </svg>
                            Refresh
                        </button>
                    </div>

                    <!-- Content area untuk pengumuman -->
                    <div id="pengumumanFeedList" style="padding: 0;">
                        <!-- Loading state -->
                        <div style="padding: 40px; text-align: center; color: #6b7280;">
                            <div style="margin-bottom: 12px;">📄</div>
                            <p style="margin: 0;">Memuat pengumuman...</p>
                        </div>
                    </div>
                </div>
            `;

        }

        // Panggil fetchNotifications untuk update data asli
        fetchNotifications();
    }
}



function renderDashboardStats() {
    if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) return;

    const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
    const filteredSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);
    const totalSiswa = filteredSiswa.length;

    // --- MENGISI SEMUA INFORMASI BARU DI DASBOR ---
    // Update elements that exist
    const dashboardSchoolName = document.getElementById('dashboardSchoolName');
    if (dashboardSchoolName) {
        dashboardSchoolName.textContent = window.currentUser.schoolData[4] || 'Dasbor Statistik';
    }
    
    const statTotalSiswa = document.getElementById('statTotalSiswa');
    if (statTotalSiswa) {
        statTotalSiswa.textContent = `${totalSiswa} Siswa`;
    }
    
    const statKurikulum = document.getElementById('statKurikulum');
    if (statKurikulum) {
        statKurikulum.textContent = window.currentUser.kurikulum;
    }

    // Hitung data completion (siswa dengan NISN dan foto)
    const siswaDataLengkap = filteredSiswa.filter(siswa => {
        const hasNISN = siswa[6] && String(siswa[6]).trim() !== '';
        const hasPhoto = siswa[12] && String(siswa[12]).trim() !== '';
        return hasNISN && hasPhoto;
    }).length;
    
    const statDataCompletion = document.getElementById('statDataCompletion');
    if (statDataCompletion) {
        statDataCompletion.textContent = `${siswaDataLengkap}/${totalSiswa}`;
    }

    // Hitung nilai progress (siswa dengan nilai lengkap untuk semua semester)
    const siswaNilaiLengkap = filteredSiswa.filter(siswa => 
        checkNilaiLengkap(siswa[6], false)
    ).length;
    
    const statNilaiProgress = document.getElementById('statNilaiProgress');
    if (statNilaiProgress) {
        statNilaiProgress.textContent = `${siswaNilaiLengkap}/${totalSiswa}`;
    }

    // --- Chart creation with error handling ---
    try {
        if (charts.completionChart) {
            charts.completionChart.destroy();
            charts.completionChart = null;
        }
        if (charts.averageGradeChart) {
            charts.averageGradeChart.destroy();
            charts.averageGradeChart = null;
        }
    } catch (error) {

    }
    
    // --- Logika Grafik Kelengkapan Data (Donut) ---
    if (totalSiswa > 0) {
        const completionCtx = document.getElementById('completionChart');
        if (completionCtx) {
            try {
                let nilaiLengkapCount = 0, ijazahLengkapCount = 0;
                filteredSiswa.forEach(siswa => {
                    if (checkNilaiLengkap(siswa[6], false)) nilaiLengkapCount++;
                    if (siswa[12] && String(siswa[12]).trim() !== '') ijazahLengkapCount++;
                });
                charts.completionChart = new Chart(completionCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Nilai Lengkap', 'Nilai Belum Lengkap', 'No. Ijazah Terisi', 'No. Ijazah Kosong'],
                        datasets: [{
                            label: 'Kelengkapan Data',
                            data: [
                                nilaiLengkapCount, totalSiswa - nilaiLengkapCount,
                                ijazahLengkapCount, totalSiswa - ijazahLengkapCount
                            ],
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.7)', 'rgba(75, 192, 192, 0.2)',
                                'rgba(54, 162, 235, 0.7)', 'rgba(54, 162, 235, 0.2)'
                            ],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        aspectRatio: 1,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating completion chart:', error);
            }
        }
    }

    // --- Logika Grafik Rata-rata Nilai (Batang) ---
    const avgGradeCtx = document.getElementById('averageGradeChart');
    if (avgGradeCtx && totalSiswa > 0) {
        try {

            // Let CSS handle the sizing naturally
  const kurikulum = window.currentUser.kurikulum;
  const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
  const subjectVisibility = (database.settings?.[schoolKodeBiasa]?.subjectVisibility) || {};
  const mulokNames = database.nilai?._mulokNames?.[schoolKodeBiasa] || {};

  // Daftar mapel mengikuti kurikulum + setting visibility + nama MULOK dari setting
  // (struktur ini sama seperti yang sudah kita pakai di tabel rekap) :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}
  const subjectKeys = subjects[kurikulum].filter(key => {
    if (key.startsWith('MULOK')) {
      return mulokNames[key] && mulokNames[key].trim() !== '';
    }
    return subjectVisibility[key] !== false;
  });

  const labels = subjectKeys.map(key => key.startsWith('MULOK') ? (mulokNames[key] || key) : key);

  // Hitung rata-rata per mapel untuk semua siswa tersaring
  const data = subjectKeys.map(key => {
    let sum = 0, count = 0;
    filteredSiswa.forEach(s => {
      const nisn = s[7];
      const val = calculateAverageForSubject(nisn, key); // fungsi ini sudah dipakai di rekap nilai
      if (val !== null && !Number.isNaN(val)) { sum += val; count++; }
    });
    return count ? +(sum / count).toFixed(2) : 0;
  });

  // Render chart (Chart.js)
  charts.averageGradeChart = new Chart(avgGradeCtx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Rata-rata',
        data,
        backgroundColor: 'rgba(78, 115, 223, 0.75)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}` } }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { stepSize: 10 }
        }
      }
    }
  });
            
            // Ensure responsive sizing after creation
            setTimeout(() => {
                if (charts.averageGradeChart) {
                    charts.averageGradeChart.resize();
                }
            }, 100);
            
        } catch (error) {
            console.error('Error creating average grade chart:', error);
        }
    }

    renderQuickProgress(filteredSiswa);
    renderActionItems(filteredSiswa);
    
    // Update ranking widget dengan data terbaru
    updateRankingWidget();
}
        function renderQuickProgress(siswaList) {
            const container = document.getElementById('quickProgressContainer');
            container.innerHTML = '';
            const totalSiswa = siswaList.length;

            if (totalSiswa === 0) {
                container.innerHTML = '<p style="text-align: center; color: #777;">Tidak ada siswa untuk ditampilkan.</p>';
                return;
            }

            semesterIds.forEach(semId => {
                const semName = semesterMap[semId];
                let completedCount = 0;
                siswaList.forEach(siswa => {
                    const isComplete = checkNilaiLengkapForSemester(siswa[6], semId);
                    if (isComplete) {
                        completedCount++;
                    }
                });

                const percentage = totalSiswa > 0 ? (completedCount / totalSiswa) * 100 : 0;

                const progressItem = document.createElement('div');
                progressItem.className = 'progress-item';
                progressItem.innerHTML = `
                    <div class="progress-label">
                        <span>${semName}</span>
                        <strong>${Math.round(percentage)}%</strong>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%;"></div>
                    </div>
                    ${percentage < 100 ? `<button class="btn btn-action btn-login" onclick="navigateToIsiNilai('${semId}', '${semName}')">Lanjutkan</button>` : ''}
                `;
                container.appendChild(progressItem);
            });
        }
        
        function navigateToIsiNilai(semesterId, semesterName) {
            const menu = document.getElementById('isiNilaiMenu');
            const parentMenu = menu.previousElementSibling;
            if (!menu.classList.contains('open')) {
                menu.classList.add('open');
                parentMenu.classList.add('open');
            }
            renderIsiNilaiPage(semesterId, semesterName);
        }

        function renderActionItems(siswaList) {
            const container = document.getElementById('actionItemsContainer');
            container.innerHTML = '';
            let hasItems = false;

            const siswaTanpaNisn = siswaList.filter(s => !s[7] || String(s[7]).trim() === '');
            if (siswaTanpaNisn.length > 0) {
                hasItems = true;
                const item = document.createElement('li');
                item.className = 'action-item';
                item.innerHTML = `
                    <span class="icon">⚠️</span>
                    <span class="text">${siswaTanpaNisn.length} siswa belum memiliki NISN.</span>
                    <button class="btn btn-action btn-view" onclick="switchSekolahContent('profilSiswaSection')">Lihat Daftar</button>
                `;
                container.appendChild(item);
            }

            const siswaNilaiTidakLengkap = siswaList.filter(s => !checkNilaiLengkap(s[7], false));
             if (siswaNilaiTidakLengkap.length > 0) {
                hasItems = true;
                const item = document.createElement('li');
                item.className = 'action-item';
                item.innerHTML = `
                    <span class="icon">📝</span>
                    <span class="text">${siswaNilaiTidakLengkap.length} siswa nilainya belum lengkap untuk semua semester.</span>
                     <button class="btn btn-action btn-view" onclick="switchSekolahContent('profilSiswaSection')">Lihat Daftar</button>
                `;
                container.appendChild(item);
            }

            if (!hasItems) {
                container.innerHTML = '<p style="text-align: center; color: #777;">👍 Semua data penting sudah lengkap. Kerja bagus!</p>';
            }
        }

   
function filterSiswaData(allSiswa, searchTerm) {
    if (!searchTerm) {
        return allSiswa;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allSiswa.filter(siswa => {
        // PERBAIKAN: Mengubah data menjadi String() sebelum dijadikan huruf kecil
        const nama = String(siswa[7] || '').toLowerCase();
        const nis = String(siswa[5] || '').toLowerCase();
        const nisn = String(siswa[6] || '').toLowerCase();
        return nama.includes(lowerCaseSearchTerm) || nis.includes(lowerCaseSearchTerm) || nisn.includes(lowerCaseSearchTerm);
    });
}

// Update ranking widget when dashboard is rendered
function updateDashboardComplete() {
    // Update ranking widget untuk menampilkan data terbaru
    updateRankingWidget();
}
        
        function handleSort(tableId, keyIndex, keyType) {
            const currentSort = sortState[tableId];
            if (currentSort.keyIndex === keyIndex) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.keyIndex = keyIndex;
                currentSort.direction = 'asc';
                currentSort.type = keyType;
            }
            
            paginationState[tableId].currentPage = 1;
            
            rerenderActiveTable(tableId);
        }

        // REPLACE: applySort
function applySort(data, tableId) {
  if (!sortState[tableId]) {
    sortState[tableId] = { keyIndex: 0, direction: 'asc', type: 'string' };
  }
  const { keyIndex, direction, type } = sortState[tableId];

  const copy = Array.isArray(data) ? [...data] : [];
  const dir = direction === 'desc' ? -1 : 1;

  return copy.sort((a, b) => {
    // Untuk tabel sekolahSiswa dan kolom NO (index 4), gunakan nomor urut asli
    if (tableId === 'sekolahSiswa' && keyIndex === 4) {
      // Jika originalOrder sudah ada, gunakan itu
      if (a.originalOrder !== undefined && b.originalOrder !== undefined) {
        const va = a.originalOrder;
        const vb = b.originalOrder;
        return (va - vb) * dir;
      } else {
        // Jika originalOrder belum ada, buat mapping berdasarkan posisi di database.siswa
        const allStudents = database?.siswa || [];
        const indexOfA = allStudents.findIndex(student => student[6] === a[6]); // Cari berdasarkan NISN
        const indexOfB = allStudents.findIndex(student => student[6] === b[6]); // Cari berdasarkan NISN
        
        // Jika ditemukan di database, gunakan nomor urut aslinya, jika tidak gunakan indeks array
        const va = indexOfA !== -1 ? indexOfA : (a[4] || 0);
        const vb = indexOfB !== -1 ? indexOfB : (b[4] || 0);
        return (va - vb) * dir;
      }
    }
    
    let va = a?.[keyIndex], vb = b?.[keyIndex];

    if (type === 'number') {
      va = Number.parseFloat(va);
      vb = Number.parseFloat(vb);
      va = Number.isFinite(va) ? va : -Infinity;
      vb = Number.isFinite(vb) ? vb : -Infinity;
      return (va - vb) * dir;
    } else {
      va = String(va ?? '').toLowerCase();
      vb = String(vb ?? '').toLowerCase();
      return va.localeCompare(vb, 'id') * dir;
    }
  });
}


        function updateSortHeaders(tableId) {
            const { keyIndex, direction } = sortState[tableId];
            document.querySelectorAll(`th.sortable[data-table-id="${tableId}"]`).forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
                if (parseInt(th.dataset.keyIndex) === keyIndex) {
                    th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            });
        }

   function renderProfilSiswa() {
    if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) {
        return;
    }

    // Initialize pagination state if not exists, but preserve current page and rowsPerPage
    if (!paginationState.sekolahSiswa) {
        paginationState.sekolahSiswa = { currentPage: 1, rowsPerPage: 10 };
    }

    const schoolData = window.currentUser.schoolData;
    const schoolKodeBiasa = String(schoolData[0]);
    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);

    const searchTerm = searchState.sekolahSiswa;
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);

    // Simpan nomor urut asli sebelum sorting
    let originalIndexMap = new Map();
    allSiswa.forEach((siswa, index) => {
        originalIndexMap.set(siswa[6], index); // Gunakan NISN sebagai kunci
    });

    filteredSiswa = applySort(filteredSiswa, 'sekolahSiswa');

    // Re-assign nomor urut berdasarkan urutan setelah sort dan filter
    filteredSiswa = filteredSiswa.map((siswa, index) => {
        const newSiswa = [...siswa]; // Copy array
        newSiswa[4] = index + 1; // Set nomor urut berurutan dari 1
        // Simpan nomor urut asli di properti tambahan untuk keperluan sorting
        newSiswa.originalOrder = originalIndexMap.get(siswa[6]) !== undefined ? originalIndexMap.get(siswa[6]) : index;
        return newSiswa;
    });

    // document.getElementById('sekolahSidebarHeader').textContent = schoolData[5] || 'Dasbor Sekolah';
    
    
    const kecamatanEl = document.getElementById('sekolahInfoKecamatan');
    if (kecamatanEl) kecamatanEl.textContent = schoolData[2] || 'NANGA PINOH';
    
    const kodeBiasaEl = document.getElementById('sekolahInfoKodeBiasa');
    if (kodeBiasaEl) kodeBiasaEl.textContent = schoolData[0] || '-';
    
    // Update header title dengan nama sekolah
    const namaSekolahHeader = document.getElementById('namaSekolahHeader');
    if (namaSekolahHeader) {
        namaSekolahHeader.textContent = schoolData[4] || schoolData[5] || 'SEKOLAH DASAR';
    }
    // NPSN: tampilkan nilai, jika kosong tampilkan 'Belum diisi' dan tandai untuk styling
    const npsnEl = document.getElementById('sekolahInfoNpsn');
    if (npsnEl) {
        const npsnVal = (schoolData[3] ?? '').toString().trim();
        npsnEl.textContent = npsnVal !== '' ? npsnVal : 'Belum diisi';
        if (npsnEl.classList) npsnEl.classList.toggle('is-missing', npsnVal === '');
        // Fallback: jika kosong, coba ambil dari database.sekolah berdasarkan kode biasa
        if (!npsnVal && Array.isArray(database.sekolah)) {
            const matchSekolah = database.sekolah.find(row => String(row[0]) === schoolKodeBiasa);
            const fallbackNpsn = (matchSekolah?.[3] ?? '').toString().trim();
            if (fallbackNpsn) {
                npsnEl.textContent = fallbackNpsn;
                if (npsnEl.classList) npsnEl.classList.toggle('is-missing', false);
            }
        }
    }
    
    const namaEl = document.getElementById('sekolahInfoNama');
    if (namaEl) namaEl.textContent = schoolData[4] || schoolData[5] || '-';
    
    const totalSiswaEl = document.getElementById('sekolahInfoTotalSiswa');
    if (totalSiswaEl) totalSiswaEl.textContent = allSiswa.length;

    const tableBody = document.getElementById('sekolahSiswaTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const tableHead = document.querySelector('#profilSiswaSection thead tr');
    const tableEl = document.querySelector('#profilSiswaSection table');
    // Check if PRO: either direct PRO login or biasa code with PRO activation
    const isProForSchool = schoolKodeBiasa ? localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true' : false;
    const isPro = window.currentUser.loginType === 'pro' || isProForSchool;

    // Set CSS classes untuk membedakan PRO dan BIASA
    if (tableEl) {
        tableEl.classList.add('has-photo-col'); // Kolom FOTO selalu ada
        tableEl.classList.add('has-action-col'); // Kolom AKSI sekarang untuk semua pengguna
    }

    // Hanya update state pagination jika pencarian berubah
    if (searchTerm !== searchState.sekolahSiswa) {
        paginationState.sekolahSiswa.currentPage = 1;
    }

    // Tampilkan kolom sesuai permintaan: NO | NO INDUK | NISN | NAMA PESERTA | TEMPAT DAN TANGGAL LAHIR | NAMA ORANG TUA | NO IJAZAH
    if (isPro) {
        tableHead.innerHTML = `
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="4" data-key-type="number">NO</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="5" data-key-type="string">NO INDUK</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="6" data-key-type="string">NISN</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="7" data-key-type="string">NAMA PESERTA</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="8" data-key-type="string">TEMPAT DAN TANGGAL LAHIR</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="9" data-key-type="string">NAMA ORANG TUA</th>
            <th class="photo-column">FOTO</th>
            <th class="col-ijazah">NO IJAZAH</th>
            <th class="action-column col-aksi">AKSI</th>
        `;
    } else {
         tableHead.innerHTML = `
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="4" data-key-type="number">NO</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="5" data-key-type="string">NO INDUK</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="6" data-key-type="string">NISN</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="7" data-key-type="string">NAMA PESERTA</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="8" data-key-type="string">TEMPAT DAN TANGGAL LAHIR</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="9" data-key-type="string">NAMA ORANG TUA</th>
            <th class="photo-column">FOTO</th>
            <th class="col-ijazah">NO IJAZAH</th>
            <th class="action-column col-aksi">AKSI</th>
        `;
    }

    const state = paginationState.sekolahSiswa;
    const rowsPerPage = state.rowsPerPage === 'all' ? filteredSiswa.length : parseInt(state.rowsPerPage);
    const totalPages = rowsPerPage > 0 ? Math.ceil(filteredSiswa.length / rowsPerPage) : 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));
    
    const start = (state.currentPage - 1) * rowsPerPage;
    const end = state.rowsPerPage === 'all' ? filteredSiswa.length : start + rowsPerPage;
    const paginatedData = filteredSiswa.slice(start, end);

    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[6]; // NISN sekarang di index 6
        // Cari originalIndex berdasarkan NISN untuk menghindari masalah referensi objek
        const originalIndex = database.siswa.findIndex(s => s[6] === nisn);
        const row = tableBody.insertRow();


        let photoCellHtml = '';
        if (isPro) {
            const hasPhoto = database.sklPhotos && database.sklPhotos[nisn];
            photoCellHtml = hasPhoto
                ? `<div class="photo-thumbnail-container" onclick="openPhotoModal('${nisn}', '${siswa[7] || 'Tidak diketahui'}')">
                     <img src="${database.sklPhotos[nisn]}" class="photo-thumbnail" title="Klik untuk memperbesar foto">
                   </div>`
                : '<span class="no-photo-placeholder">❌</span>';
        }

        let actionCellHtml = '';
        if (isPro) {
             const hasPhoto = database.sklPhotos && database.sklPhotos[nisn];
             actionCellHtml = `
                <div class="action-dropdown">
                    <button class="btn btn-small action-dropdown-btn" onclick="toggleActionDropdown(event, '${nisn}')">
                        Aksi
                    </button>
                    <div class="action-dropdown-content" id="dropdown-${nisn}">
                        <a href="#" onclick="openEditModalByNisn('${nisn}'); closeAllDropdowns();">
                            <span class="dropdown-icon">✏️</span> Edit Data
                        </a>
                        <a href="#" onclick="document.getElementById('profil-photo-input-${nisn}').click(); closeAllDropdowns();">
                            <span class="dropdown-icon">${hasPhoto ? '🔄' : '📷'}</span> ${hasPhoto ? 'Ubah Foto' : 'Unggah Foto'}
                        </a>
                        ${hasPhoto ? `<a href="#" onclick="deleteSklPhoto('${nisn}'); closeAllDropdowns();"><span class="dropdown-icon">🗑️</span> Hapus Foto</a>` : ''}
                    </div>
                    <input type="file" id="profil-photo-input-${nisn}" class="file-input" accept="image/*" onchange="handleSklPhotoUpload(event, '${nisn}')">
                </div>
            `;
        } else {
             // Untuk akun biasa, tetap tampilkan tombol edit
             actionCellHtml = `
                <div class="action-dropdown">
                    <button class="btn btn-small action-dropdown-btn" onclick="toggleActionDropdown(event, '${nisn}')">
                        Aksi
                    </button>
                    <div class="action-dropdown-content" id="dropdown-${nisn}">
                        <a href="#" onclick="openEditModalByNisn('${nisn}'); closeAllDropdowns();">
                            <span class="dropdown-icon">✏️</span> Edit Data
                        </a>
                    </div>
                </div>
            `;
        }
        
        // Perbaikan: Atribut onchange selalu ada agar validasi tetap berjalan
        const ijazahInputHtml = `<input type="text" class="editable-ijazah" value="${siswa[10] || ''}" data-index="${originalIndex}" onchange="saveIjazahNumber(this)" oninput="validateIjazahInput(this)" onblur="validateIjazahOnBlur(this)" maxlength="15">`;

        // Tentukan apakah sedang sorting berdasarkan kolom NO
        const isSortingByNo = sortState.sekolahSiswa && sortState.sekolahSiswa.keyIndex === 4;
        
        // Untuk kolom NO, tampilkan nomor urut asli jika sedang sorting berdasarkan kolom NO
        const noDisplay = isSortingByNo && siswa.originalOrder !== undefined 
            ? siswa.originalOrder + 1  // Tambah 1 karena nomor urut asli dimulai dari 0
            : siswa[4] || (start + index + 1);

        // Format nama peserta menjadi huruf besar semua
        const namaPeserta = (siswa[7] || '[Nama Tidak Tersedia]').toUpperCase();
        
        // Format tanggal lahir menjadi proper case
        const ttl = formatToProperCase(siswa[8] || '');
        
        // Format nama orang tua menjadi proper case
        const namaOrtu = formatToProperCase(siswa[9] || '[Nama Orang Tua Tidak Tersedia]');

        if (isPro) {
            row.innerHTML = `
                <td>${noDisplay}</td>
                <td>${siswa[5] || ''}</td>
                <td>${siswa[6] || ''}</td>
                <td>${namaPeserta}</td>
                <td>${ttl}</td>
                <td>${namaOrtu}</td>
                <td class="photo-cell">${photoCellHtml}</td>
                <td class="col-ijazah">${ijazahInputHtml}</td>
                <td class="action-cell col-aksi">${actionCellHtml}</td>
            `;
        } else {
             row.innerHTML = `
                <td>${noDisplay}</td>
                <td>${siswa[5] || ''}</td>
                <td>${siswa[6] || ''}</td>
                <td>${namaPeserta}</td>
                <td>${ttl}</td>
                <td>${namaOrtu}</td>
                <td class="photo-cell">❌</td>
                <td class="col-ijazah">${ijazahInputHtml}</td>
                <td class="action-cell col-aksi">${actionCellHtml}</td>
            `;
        }
    });

    optimizedUpdatePaginationControls('sekolahSiswa', filteredSiswa.length);
    updateSortHeaders('sekolahSiswa');
}


function renderIsiNilaiPage(semesterId, semesterName) {

    switchSekolahContent('isiNilaiSection');
    document.getElementById('isiNilaiTitle').textContent = `Nilai - ${semesterName}`;
    paginationState.isiNilai.currentSemester = semesterId;
    paginationState.isiNilai.currentSemesterName = semesterName;
    document.getElementById('deleteAllGradesBtn').style.display = 'inline-flex';
    showAutosaveStatus('idle');

    const container = document.getElementById('isiNilaiTableContainer');
    container.innerHTML = '';

    const table = document.createElement('table');
    table.id = 'isiNilaiTable';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
    const mulokNames = database.nilai._mulokNames?.[schoolKodeBiasa] || {};
    
    // PERUBAHAN UTAMA: Header tabel tidak lagi menggunakan input untuk nama Mulok
    if (window.currentUser.kurikulum === 'K13') {
        const currentSubjects = subjects.K13.filter(s => !s.startsWith("MULOK"));
        const tr1 = document.createElement('tr');
        tr1.innerHTML = `<th rowspan="2">NO</th><th rowspan="2" class="sortable" data-table-id="isiNilai" data-key-index="7" data-key-type="string">NAMA</th>`;
        currentSubjects.forEach(sub => { tr1.innerHTML += `<th colspan="3">${sub}</th>`; });
        
        tr1.innerHTML += `<th colspan="3">${mulokNames['MULOK1'] || 'MULOK 1'}</th>`;
        tr1.innerHTML += `<th colspan="3">${mulokNames['MULOK2'] || 'MULOK 2'}</th>`;
        tr1.innerHTML += `<th colspan="3">${mulokNames['MULOK3'] || 'MULOK 3'}</th>`;
        
        const tr2 = document.createElement('tr');
        [...currentSubjects, "MULOK1", "MULOK2", "MULOK3"].forEach(() => { 
            tr2.innerHTML += `<th>KI.3</th><th>KI.4</th><th>RT</th>`; 
        });
        
        thead.appendChild(tr1);
        thead.appendChild(tr2);
    } else { // Kurikulum Merdeka
        const currentSubjects = subjects.Merdeka.filter(s => !s.startsWith("MULOK"));
        const tr = document.createElement('tr');
        tr.innerHTML = `<th>NO</th><th class="sortable" data-table-id="isiNilai" data-key-index="7" data-key-type="string">NAMA</th>`;
        currentSubjects.forEach(sub => { tr.innerHTML += `<th>${sub}</th>`; });
        
        tr.innerHTML += `<th>${mulokNames['MULOK1'] || 'MULOK 1'}</th>`;
        tr.innerHTML += `<th>${mulokNames['MULOK2'] || 'MULOK 2'}</th>`;
        tr.innerHTML += `<th>${mulokNames['MULOK3'] || 'MULOK 3'}</th>`;
        thead.appendChild(tr);
    }
    table.appendChild(thead);

    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);

    const searchTerm = searchState.isiNilai;
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);

    filteredSiswa = applySort(filteredSiswa, 'isiNilai');

    const state = paginationState.isiNilai;
    optimizedUpdatePaginationControls('isiNilai', filteredSiswa.length);

    const rowsPerPage = state.rowsPerPage === 'all' ? filteredSiswa.length : parseInt(state.rowsPerPage);
    const totalPages = rowsPerPage > 0 ? Math.ceil(filteredSiswa.length / rowsPerPage) : 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));

    const start = (state.currentPage - 1) * rowsPerPage;
    const end = state.rowsPerPage === 'all' ? filteredSiswa.length : start + rowsPerPage;
    const paginatedData = filteredSiswa.slice(start, end);

    optimizedUpdatePaginationControls('isiNilai', paginatedData.length);

    const settings = database.settings[schoolKodeBiasa] || {};
    const subjectVisibility = settings.subjectVisibility || {};

    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[6];
        const hasNisn = nisn && String(nisn).trim() !== '';

        const tr = document.createElement('tr');
        if (!hasNisn) {
            tr.classList.add('row-disabled');
            tr.title = 'Input dinonaktifkan karena NISN siswa kosong. Harap lengkapi di menu Profil Siswa.';
        }
        tr.innerHTML = `<td>${start + index + 1}</td><td>${siswa[7] || ''}</td>`;

        let rowHtml = '';
        const allSubjectsForKurikulum = subjects[window.currentUser.kurikulum];

        allSubjectsForKurikulum.forEach(sub => {
            const isVisible = subjectVisibility[sub] !== false;
            const disabledAttribute = (isVisible && hasNisn) ? '' : 'disabled';

            if (window.currentUser.kurikulum === 'K13') {
                const ki3 = hasNisn ? (database.nilai[nisn]?.[semesterId]?.[sub]?.KI3 || '') : '';
                const ki4 = hasNisn ? (database.nilai[nisn]?.[semesterId]?.[sub]?.KI4 || '') : '';
                let rt = (ki3 !== '' && ki4 !== '') ? Math.round((parseFloat(ki3) + parseFloat(ki4)) / 2) : '';

                rowHtml += `
                    <td><input type="number" min="0" max="100" value="${ki3}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="KI3" oninput="handleGradeInput(this); calculateRataRata(this);" ${disabledAttribute}></td>
                    <td><input type="number" min="0" max="100" value="${ki4}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="KI4" oninput="handleGradeInput(this); calculateRataRata(this);" ${disabledAttribute}></td>
                    <td><input type="number" value="${rt}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="RT" readonly ${disabledAttribute}></td>`;
            } else { // Kurikulum Merdeka
                const nilai = hasNisn ? (database.nilai[nisn]?.[semesterId]?.[sub]?.NILAI || '') : '';
                rowHtml += `<td><input type="number" min="0" max="100" value="${nilai}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="NILAI" oninput="handleGradeInput(this)" ${disabledAttribute}></td>`;
            }
        });

        tr.innerHTML += rowHtml;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    optimizedUpdatePaginationControls('isiNilai', filteredSiswa.length);
    updateSortHeaders('isiNilai');
}       
        function handleGradeInput(inputElement) {
            validateGrade(inputElement);
            saveGrade(inputElement);
        }

        function calculateRataRata(inputElement) {
            const { nisn, semester, subject, type } = inputElement.dataset;

            // Only calculate RT for KI3 or KI4 inputs in K13 curriculum
            if (window.currentUser.kurikulum !== 'K13' || (type !== 'KI3' && type !== 'KI4')) {
                return;
            }

            // Get the current row to find the related RT input
            const row = inputElement.closest('tr');
            if (!row) return;

            // Find KI3, KI4, and RT inputs in the same row for the same subject
            const ki3Input = row.querySelector(`input[data-nisn="${nisn}"][data-semester="${semester}"][data-subject="${subject}"][data-type="KI3"]`);
            const ki4Input = row.querySelector(`input[data-nisn="${nisn}"][data-semester="${semester}"][data-subject="${subject}"][data-type="KI4"]`);
            const rtInput = row.querySelector(`input[data-nisn="${nisn}"][data-semester="${semester}"][data-subject="${subject}"][data-type="RT"]`);

            if (!ki3Input || !ki4Input || !rtInput) return;

            const ki3Value = parseFloat(ki3Input.value);
            const ki4Value = parseFloat(ki4Input.value);

            // Calculate RT if both KI3 and KI4 have valid values
            if (!isNaN(ki3Value) && !isNaN(ki4Value)) {
                const rtValue = Math.round((ki3Value + ki4Value) / 2);
                rtInput.value = rtValue;

                // Update the database object
                if (!database.nilai[nisn]) database.nilai[nisn] = {};
                if (!database.nilai[nisn][semester]) database.nilai[nisn][semester] = {};
                if (!database.nilai[nisn][semester][subject]) database.nilai[nisn][semester][subject] = {};
                database.nilai[nisn][semester][subject]['RT'] = rtValue;

                // Save the RT value to the server
                saveGrade(rtInput);
            } else {
                // Clear RT if either KI3 or KI4 is empty
                rtInput.value = '';
                if (database.nilai[nisn]?.[semester]?.[subject]) {
                    database.nilai[nisn][semester][subject]['RT'] = '';
                }
            }
        }
        
        function validateGrade(input) {
            let value = parseInt(input.value, 10);
            if (isNaN(value)) {
                input.classList.remove('invalid-input');
                return;
            }
            
            if (value > 100) {
                input.value = 100;
                input.classList.add('invalid-input');
            } else if (value < 0) {
                input.value = 0;
                input.classList.add('invalid-input');
            } else {
                input.classList.remove('invalid-input');
            }
            
            setTimeout(() => {
                input.classList.remove('invalid-input');
            }, 1500);
        }
        
        // --- PERUBAHAN: Simpan Nama Mulok ---
        
        
        // Ganti seluruh fungsi saveGrade dengan versi ini
// Ganti seluruh fungsi saveGrade dengan versi ini
// GANTI SELURUH FUNGSI saveGrade DENGAN VERSI INI
function saveGrade(inputElement) {
    const { nisn, semester, subject, type } = inputElement.dataset;
    const value = inputElement.value;

    // 1. Update dulu data di variabel frontend (agar tampilan responsif)
    if (!database.nilai[nisn]) database.nilai[nisn] = {};
    if (!database.nilai[nisn][semester]) database.nilai[nisn][semester] = {};
    if (!database.nilai[nisn][semester][subject]) database.nilai[nisn][semester][subject] = {};
    database.nilai[nisn][semester][subject][type] = value;
    
    // 2. Kirim data ke server dengan debounce (jeda)
    clearTimeout(autosaveTimer);
    showAutosaveStatus('saving');
    autosaveTimer = setTimeout(() => {
        fetchWithAuth(apiUrl('/api/data/grade/save'), {
            method: 'POST',
            body: JSON.stringify({ nisn, semester, subject, type, value }),
        })
        // 'result' sekarang langsung berisi data JSON dari fetchWithAuth
        .then(result => {
            if (result.success) {
                showAutosaveStatus('saved');
                // Update ranking widget jika sedang di dashboard
                if (document.getElementById('rankingContainer')) {
                    updateRankingWidget();
                }
            } else {
                showNotification('Gagal menyimpan nilai ke server.', 'error');
                showAutosaveStatus('idle');
            }
        })
        .catch(err => {
            console.error('Error saving grade:', err);
            showNotification(err.message || 'Koneksi ke server gagal saat menyimpan nilai.', 'error');
            showAutosaveStatus('idle');
        });
    }, 1500); // Jeda 1.5 detik sebelum mengirim
}

        function parseDateToYMD(dateStr) {
            if (!dateStr || dateStr.trim() === '') return '';
            
            const trimmedDate = dateStr.trim();
            
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
                return trimmedDate;
            }

            const parts = trimmedDate.split(' ');
            if (parts.length !== 3) return ''; 

            const day = parseInt(parts[0], 10);
            const year = parseInt(parts[2], 10);
            const months = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
            const monthIndex = months.indexOf(parts[1].toLowerCase());

            if (isNaN(day) || isNaN(year) || monthIndex === -1) return '';

            const month = monthIndex + 1;
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }


        function openEditModal(siswaData) {
            // Periksa apakah siswaData valid
            if (!siswaData || !Array.isArray(siswaData) || siswaData.length <= 6) {
                console.error('Invalid student data provided to openEditModal', siswaData);
                showSmartNotification('Data siswa tidak valid.', 'error', 'edit siswa');
                return;
            }

            // Cari originalIndex berdasarkan NISN, bukan dengan referensi objek
            const nisnToFind = siswaData[6]; // NISN ada di index 6
            if (!nisnToFind) {
                console.error('NISN tidak ditemukan di data siswa', siswaData);
                showSmartNotification('NISN siswa tidak valid.', 'error', 'edit siswa');
                return;
            }
            
            // Pastikan database dan database.siswa tersedia
            if (!database || !database.siswa || !Array.isArray(database.siswa)) {
                console.error('Database siswa tidak tersedia');
                showSmartNotification('Database siswa tidak tersedia.', 'error', 'edit siswa');
                return;
            }
            
            const originalIndex = database.siswa.findIndex(s => s[6] === nisnToFind);
            
            if (originalIndex === -1) {
                console.error('Student not found in database.siswa', nisnToFind);
                showSmartNotification('Data siswa tidak ditemukan di database.', 'error', 'edit siswa');
                return;
            }

            // Set hidden index for form submission
            document.getElementById('editSiswaIndex').value = originalIndex;

            // Set all field values
            const fields = [
                {id: 'editNis', value: siswaData[5]},           // NIS (noInduk)
                {id: 'editNisn', value: siswaData[6]},          // NISN
                // editNoPeserta removed - not needed anymore
                {id: 'editNamaPeserta', value: siswaData[7]},   // Nama Peserta
                {id: 'editNamaOrtu', value: siswaData[9]}       // Nama Orang Tua
            ];

            fields.forEach(field => {
                const element = document.getElementById(field.id);

                if (element) {
                    element.value = field.value || '';

                    // Force visibility with JavaScript
                    element.style.display = 'block';
                    element.style.visibility = 'visible';
                    element.style.opacity = '1';
                    element.style.height = 'auto';
                    element.style.minHeight = '40px';
                    element.style.width = '100%';
                    element.style.position = 'static';
                    element.style.overflow = 'visible';
                    element.style.clip = 'auto';
                    element.style.transform = 'none';
                    element.style.zIndex = '999';

                } else {
                    console.error(`Element ${field.id} not found`);
                }
            });

            // Handle TTL (Tempat Tanggal Lahir) splitting
            const ttl = (siswaData[8] || ',').split(',');
            const tempatLahir = ttl[0] ? ttl[0].trim() : '';
            const tanggalLahirStr = ttl[1] ? ttl[1].trim() : '';

            const tempatLahirEl = document.getElementById('editTempatLahir');
            const tanggalLahirEl = document.getElementById('editTanggalLahir');

            if (tempatLahirEl) {
                tempatLahirEl.value = tempatLahir;
            }

            if (tanggalLahirEl) {
                tanggalLahirEl.value = parseDateToYMD(tanggalLahirStr);
            }

            // Load student photo if available
            loadFotoSiswa(siswaData[6]); // NISN sebagai identifier (index 6, bukan 7)

            // Show modal
            editModal.style.display = 'flex';
        }

        function closeEditModal() {
            editModal.style.display = 'none';
            // Reset foto preview
            resetFotoPreview();
        }
        
        // Fungsi baru untuk membuka modal edit berdasarkan NISN
        function openEditModalByNisn(nisn) {

            // Pastikan database.siswa tersedia
            if (!database || !database.siswa || !Array.isArray(database.siswa)) {
                console.error('Database siswa tidak tersedia');
                showSmartNotification('Database siswa tidak tersedia.', 'error', 'edit siswa');
                return;
            }
            
            // Cari data siswa berdasarkan NISN
            const siswaIndex = database.siswa.findIndex(s => s[6] === nisn);

            if (siswaIndex === -1) {
                console.error('Student not found in database.siswa with NISN:', nisn);
                showSmartNotification('Data siswa tidak ditemukan di database.', 'error', 'edit siswa');
                return;
            }
            
            const siswaData = database.siswa[siswaIndex];

            openEditModal(siswaData);
        }
        
        // === FUNGSI DOWNLOAD TEMPLATE ===
        async function downloadIsiNilaiTemplate() {
            if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) {
                showNotification('Hanya sekolah yang dapat mengunduh template.', 'warning');
                return;
            }

            // Get current semester from pagination state
            const { currentSemester, currentSemesterName } = paginationState.isiNilai || {};
            if (!currentSemester) {
                showNotification('Pilih semester terlebih dahulu untuk mengunduh template.', 'warning');
                return;
            }

            try {
                showNotification('Mengunduh template Excel...', 'info');

                // Check if token exists (use jwtToken like other functions)
                const token = localStorage.getItem('jwtToken');
                if (!token) {
                    showNotification('Token tidak ditemukan. Silakan login ulang.', 'error');
                    handleLogout?.();
                    return;
                }

                // Create download URL
                const downloadUrl = apiUrl(`/api/data/template/download?semester=${currentSemester}&kurikulum=${window.currentUser.kurikulum}&kodeSekolah=${window.currentUser.schoolData[0]}`);
                
                // Fetch with authorization header (similar to fetchWithAuth but for blob response)
                const response = await fetch(downloadUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        showNotification('Sesi telah berakhir. Silakan login ulang.', 'error');
                        handleLogout?.();
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Get the blob from response
                const blob = await response.blob();
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Template-Nilai-Sem${currentSemester}-${window.currentUser.kurikulum}.xlsx`;
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up object URL
                window.URL.revokeObjectURL(url);
                
                showNotification('Template Excel berhasil diunduh!', 'success');
                
            } catch (error) {
                console.error('Download template error:', error);
                showNotification('Gagal mengunduh template Excel. Silakan coba lagi.', 'error');
            }
        }
        
        // === FUNGSI FOTO SISWA ===
        function previewFotoSiswa(input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                
                // Validasi file
                if (!file.type.match('image.*')) {
                    showNotification('Hanya file gambar yang diizinkan!', 'error');
                    input.value = '';
                    return;
                }
                
                // Validasi ukuran file (maksimal 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    showNotification('Ukuran file terlalu besar! Maksimal 2MB.', 'error');
                    input.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('editFotoPreview');
                    preview.src = e.target.result;
                    preview.classList.add('uploaded');
                    
                    // Upload button removed - no action needed
                };
                reader.readAsDataURL(file);
            }
        }
        
        async function hapusFotoSiswa() {
            const preview = document.getElementById('editFotoPreview');
            const indexSiswa = document.getElementById('editSiswaIndex').value;
            
            if (indexSiswa !== '' && database.siswa[indexSiswa]) {
                try {
                    const siswaData = database.siswa[indexSiswa];
                    const nisn = siswaData[7];
                    
                    // Update ke server untuk hapus foto
                    const result = await fetchWithAuth(apiUrl('/api/data/siswa/update'), {
                        method: 'POST',
                        body: JSON.stringify({ 
                            nisn: nisn, 
                            updatedData: { foto: null } 
                        })
                    });
                    
                    if (result.success) {
                        // Update local data
                        await fetchDataFromServer();
                    }
                } catch (error) {
                    console.error('Error hapus foto:', error);
                }
            }
            
            // Reset preview ke placeholder
            preview.src = 'https://placehold.co/120x150/f0f0f0/999?text=Foto';
            preview.classList.remove('uploaded');
            
            // Input file removed from popup
            
            // Upload button removed - no action needed
            
            showNotification('Foto berhasil dihapus', 'info');
        }
        
        function resetFotoPreview() {
            const preview = document.getElementById('editFotoPreview');
            
            if (preview) {
                preview.src = 'https://placehold.co/120x150/f0f0f0/999?text=Foto';
                preview.classList.remove('uploaded');
            }
        }
        
        // Fungsi untuk mengkonversi foto ke base64 untuk disimpan
        function getFotoBase64() {
            // Input file removed from popup - photo upload only available in table
            return Promise.resolve(null);
        }
        
        // Fungsi untuk memuat foto siswa yang sudah tersimpan
        function loadFotoSiswa(nisn) {
            const preview = document.getElementById('editFotoPreview');
            
            if (!nisn || !preview) {
                return;
            }

            // Cek apakah ada foto tersimpan untuk siswa ini di database.sklPhotos
            if (database.sklPhotos && database.sklPhotos[nisn]) {
                preview.src = database.sklPhotos[nisn];
                preview.classList.add('uploaded');
            } else {
                // Reset ke placeholder jika tidak ada foto
                preview.src = 'https://placehold.co/120x150/f0f0f0/999?text=Foto';
                preview.classList.remove('uploaded');
            }
        }
        
        function closeTranskripModal() {
            transkripModal.style.display = 'none';
        }
        
        function closeSklModal() {
            sklModal.style.display = 'none';
        }
        
        function closeSkkbModal() {
            skkbModal.style.display = 'none';
        }

        function showLoginInfoModal() {
            if (!window.currentUser.schoolData) return;

            // Prevent showing modal if already shown in this session
            if (window.loginInfoModalShown) return;
            window.loginInfoModalShown = true;

            const schoolData = window.currentUser.schoolData;
            const schoolKodeBiasa = String(schoolData[0]);
            const totalSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa).length;

            document.getElementById('infoNamaSekolah').textContent = schoolData[4] || 'Nama Sekolah Tidak Ditemukan';
            document.getElementById('infoJumlahSiswa').textContent = `${totalSiswa} siswa`;
            document.getElementById('infoKurikulum').textContent = window.currentUser.kurikulum;

            // Update login type card
            const loginTypeBadge = document.getElementById('loginTypeBadge');
            const loginTypeText = document.getElementById('loginTypeText');
            const loginTypeDescription = document.getElementById('loginTypeDescription');
            const loginTypeCard = document.getElementById('loginTypeCard');

            if (loginTypeBadge && loginTypeText && loginTypeDescription) {
                const loginType = window.currentUser.loginType;

                // Reset classes
                loginTypeBadge.className = 'login-type-badge';

                if (loginType === 'pro') {
                    // Pro user styling
                    loginTypeBadge.classList.add('pro');
                    loginTypeText.textContent = 'KODE PRO';
                    loginTypeDescription.textContent = 'Akses premium dengan fitur lengkap, logo kustom, dan kontrol penuh';

                    // Update card border for pro
                    if (loginTypeCard) {
                        loginTypeCard.style.borderLeftColor = '#f57f17';
                        loginTypeCard.style.borderColor = '#ffe0b2';
                    }
                } else {
                    // Basic user styling
                    loginTypeBadge.classList.add('biasa');
                    loginTypeText.textContent = 'KODE BIASA';
                    loginTypeDescription.textContent = 'Akses standar dengan fitur dasar untuk pengelolaan nilai siswa';

                    // Reset card border for basic
                    if (loginTypeCard) {
                        loginTypeCard.style.borderLeftColor = '#2196f3';
                        loginTypeCard.style.borderColor = '#e3f2fd';
                    }
                }
            }

            // Close any other open modals first
            const allModals = document.querySelectorAll('.modal-overlay');
            allModals.forEach(modal => {
                if (modal.id !== 'loginInfoModal') {
                    modal.style.display = 'none';
                }
            });

            // Only show if not already visible and user just logged in
            if (loginInfoModal.style.display !== 'flex') {
                loginInfoModal.style.display = 'flex';

                // Auto-close modal after 10 seconds to avoid blocking user
                setTimeout(() => {
                    if (loginInfoModal.style.display === 'flex') {
                        closeLoginInfoModal();
                    }
                }, 10000);
            }
        }

        function closeLoginInfoModal() {
            loginInfoModal.style.display = 'none';
            // Reset flag so modal can be shown again if needed
            window.loginInfoModalShown = false;
        }

        // Ganti seluruh fungsi saveSiswaChanges dengan versi async ini
// GANTI SELURUH FUNGSI saveSiswaChanges DENGAN VERSI FINAL INI
// GANTI SELURUH FUNGSI INI
async function saveSiswaChanges(event) {
    event.preventDefault();
    const namaPeserta = document.getElementById('editNamaPeserta').value.trim();
    const nisnValue = document.getElementById('editNisn').value.trim();
    if (!namaPeserta || !nisnValue) {
        showNotification('Nama Peserta dan NISN wajib diisi.', 'warning');
        return;
    }

    const index = document.getElementById('editSiswaIndex').value;
    if (index === '' || !database.siswa[index]) return;

    try {
        showLoader();
        const tempatLahir = document.getElementById('editTempatLahir').value.trim();
        const tanggalLahirYMD = document.getElementById('editTanggalLahir').value;
        const tanggalLahirFormatted = formatDateToIndonesian(tanggalLahirYMD);
        

        // Foto tidak dapat diubah dari popup edit - hanya dari tabel
        const fotoBase64 = null;
        
        const updatedData = {
            nis: document.getElementById('editNis').value || '',
            nisn: nisnValue,
            noPeserta: '',
            namaPeserta: namaPeserta,
            ttl: `${tempatLahir}, ${tanggalLahirFormatted}`,
            namaOrtu: document.getElementById('editNamaOrtu').value || ''
            // Hapus foto dari update - tidak perlu dikirim jika null
        };

        // Hapus field yang null atau undefined dari updatedData
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === null || updatedData[key] === undefined) {
                delete updatedData[key];
            }
        });


        // Test koneksi ke server terlebih dahulu
        try {
            const testResponse = await fetch(apiUrl('/api/data/siswa'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (testError) {
            console.error('Server connection test failed:', testError);
            throw new Error('Tidak dapat terhubung ke server. Pastikan server sedang berjalan.');
        }

        // Langsung gunakan hasil dari fetchWithAuth
        const result = await fetchWithAuth(apiUrl('/api/data/siswa/update'), {
            method: 'POST',
            body: JSON.stringify({ nisn: nisnValue, updatedData: updatedData })
        });


        if (result.success) {
            await fetchDataFromServer(); // Sinkronkan data dengan server
            closeEditModal();
            renderProfilSiswa();
            showNotification('Data siswa berhasil diperbarui!', 'success');
        } else {
            console.error('Server returned error:', result);
            throw new Error(result.message || 'Server mengembalikan error tanpa pesan');
        }
    } catch (error) {
        console.error('Save siswa changes error:', error);
        console.error('Error stack:', error.stack);
        showNotification(`Error: ${error.message || 'Gagal memperbarui data siswa.'}`, 'error');
    } finally {
        hideLoader();
    }
}

        function handleLogout() {
            localStorage.removeItem('currentUserSession');
            adminDashboard.style.display = 'none';
            sekolahDashboard.style.display = 'none';
            loginPage.style.display = 'flex';
            appCodeInput.value = '';

            // Reset tombol login ke state normal
            const loginBtn = document.querySelector('#loginForm button[type="submit"]');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
                loginBtn.textContent = 'Masuk';
            }

            window.currentUser = { isLoggedIn: false, role: null, schoolData: null, loginType: null, kurikulum: null };
        }

        function switchContent(targetId) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .sidebar-menu .menu-item').forEach(item => item.classList.remove('active'));

    document.getElementById(targetId).classList.add('active');
    document.querySelector(`#adminDashboard .menu-item[data-target="${targetId}"]`).classList.add('active');
    
    // PERBAIKAN: Menggunakan if/else if yang benar
    if (targetId === 'dashboardContent') {
        populateDashboardStatistics();
    } else if (targetId === 'sekolah') {
        renderAdminTable('sekolah');
    } else if (targetId === 'siswa') {
        renderAdminTable('siswa');
        // Temporarily disable custom search initialization
        // initializeSiswaSearch();
    } else if (targetId === 'rekapNilaiAdmin') {
        renderRekapNilaiAdminPage();
    } else if (targetId === 'notificationCenterSection') {
        fetchNotifications();
    }
}

    // GANTI SELURUH FUNGSI handleFile DENGAN VERSI FINAL INI
// Fungsi handleFile yang lama telah dihapus untuk memperbaiki error redeklarasi.   
        
// Di dalam file E-ijazah.html, ganti seluruh fungsi ini

// Fungsi untuk update counter di panel admin
function updateAdminCounters() {
    const sekolahCountEl = document.getElementById('sekolahCount');
    const siswaCountEl = document.getElementById('siswaCount');


    if (sekolahCountEl) {
        const sekolahCount = database.sekolah ? database.sekolah.length : 0;
        sekolahCountEl.textContent = sekolahCount;
    } else {

    }

    if (siswaCountEl) {
        const siswaCount = database.siswa ? database.siswa.length : 0;
        siswaCountEl.textContent = siswaCount;
    } else {

    }
}

// Fungsi untuk mengolah data statistik wilayah
// Daftar kecamatan resmi di Kabupaten Melawi
const kecamatanMelawi = [
    'BELIMBING',
    'BELIMBING HULU',
    'ELLA HILIR',
    'MENUKUNG',
    'NANGA PINOH',
    'PINOH SELATAN',
    'PINOH UTARA',
    'SAYAN',
    'SOKAN',
    'TANAH PINOH',
    'TANAH PINOH BARAT'
];

// Fungsi untuk normalisasi nama kecamatan
function normalizeKecamatan(kecamatan) {
        if (!kecamatan) return 'LAINNYA';

        const kecamatanUpper = kecamatan.toUpperCase().trim();

        // Cek apakah kecamatan ada dalam daftar resmi
        const found = kecamatanMelawi.find(k => k === kecamatanUpper);
        if (found) return found;

        // Cek dengan pola yang lebih fleksibel
        const foundPartial = kecamatanMelawi.find(k =>
            kecamatanUpper.includes(k) || k.includes(kecamatanUpper)
        );
        if (foundPartial) return foundPartial;

        return 'LAINNYA';
    }


// Function to open the modal and fetch school data
async function openSekolahKecamatanModal(kecamatan) {
    // Create modern popup overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; border-radius: 12px; padding: 24px;
        max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        position: relative;
    `;

    // Show loading initially
    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 8px; font-size: 24px;">🏫 Sekolah di Kecamatan ${kecamatan}</h2>
            <p style="color: #666; font-size: 14px;">Mencari data sekolah...</p>
        </div>
        <div style="display: flex; justify-content: center; align-items: center; padding: 40px;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2563eb; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add CSS animation for spinner
    if (!document.getElementById('spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    try {
        const response = await fetch(`/api/data/sekolah-by-kecamatan/${kecamatan}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            const schoolTable = result.data.map((sekolah, i) =>
                `<tr style="border-bottom: 1px solid #eee; ${i % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                    <td style="padding: 12px 8px; text-align: center; font-weight: 600;">${i + 1}</td>
                    <td style="padding: 12px 8px;">
                        <div style="font-weight: 600; color: #1f2937;">${sekolah.namaSekolahLengkap}</div>
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${sekolah.npsn || 'N/A'}</span>
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${sekolah.kodeBiasa}</span>
                    </td>
                </tr>`
            ).join('');

            modalContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2 style="color: #2563eb; margin: 0; font-size: 24px;">🏫 Sekolah di Kecamatan ${kecamatan}</h2>
                        <p style="color: #666; margin: 4px 0 0 0; font-size: 14px;">Ditemukan ${result.data.length} sekolah</p>
                    </div>
                    <button onclick="this.closest('.modal-overlay').remove()" style="
                        background: #ef4444; color: white; border: none;
                        border-radius: 50%; width: 32px; height: 32px;
                        cursor: pointer; font-size: 18px; font-weight: bold;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">&times;</button>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #2563eb, #3b82f6); color: white;">
                                <th style="padding: 16px 8px; text-align: center; font-weight: 600;">NO</th>
                                <th style="padding: 16px 8px; text-align: left; font-weight: 600;">NAMA SEKOLAH</th>
                                <th style="padding: 16px 8px; text-align: center; font-weight: 600;">NPSN</th>
                                <th style="padding: 16px 8px; text-align: center; font-weight: 600;">KODE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schoolTable}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 16px; padding: 12px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
                    <p style="margin: 0; font-size: 14px; color: #1e40af;">
                        💡 <strong>Tips:</strong> Klik kolom untuk melihat detail lebih lanjut atau gunakan fitur pencarian untuk menemukan sekolah tertentu.
                    </p>
                </div>
            `;
        } else {
            modalContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="color: #f59e0b; font-size: 64px; margin-bottom: 16px;">🏫</div>
                    <h2 style="color: #1f2937; margin-bottom: 8px;">Tidak Ada Sekolah</h2>
                    <p style="color: #6b7280; margin-bottom: 20px;">Tidak ada sekolah ditemukan di kecamatan ${kecamatan}.</p>
                    <button onclick="this.closest('.modal-overlay').remove()" style="
                        background: #2563eb; color: white; border: none;
                        padding: 12px 24px; border-radius: 8px; cursor: pointer;
                        font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">Tutup</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching sekolah by kecamatan:', error);
        modalContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="color: #ef4444; font-size: 64px; margin-bottom: 16px;">❌</div>
                <h2 style="color: #ef4444; margin-bottom: 8px;">Gagal Memuat Data</h2>
                <p style="color: #6b7280; margin-bottom: 20px;">Terjadi kesalahan saat memuat data sekolah. Silakan coba lagi.</p>
                <button onclick="this.closest('.modal-overlay').remove()" style="
                    background: #ef4444; color: white; border: none;
                    padding: 12px 24px; border-radius: 8px; cursor: pointer;
                    font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">Tutup</button>
            </div>
        `;
    }

    // Close modal when clicking overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Legacy function - now handled by modern popup system
function closeSekolahKecamatanModal() {
    // Legacy function for backward compatibility
    const modal = document.getElementById('sekolahKecamatanModal');
    if (modal) modal.style.display = 'none';
}

// Add event listener to the kecamatanGrid
document.addEventListener('DOMContentLoaded', () => {
    const kecamatanGrid = document.getElementById('kecamatanGrid');
    if (kecamatanGrid) {
        kecamatanGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.kecamatan-card');
            if (card) {
                const kecamatan = card.dataset.kecamatan;
                if (kecamatan) {
                    openSekolahKecamatanModal(kecamatan);
                }
            }
        });
    }
});

// Function to generate statistics by kecamatan
function generateStatistikByKecamatan(sekolahData, siswaData) {
    // Grouping data berdasarkan kecamatan
    const kecamatanStats = {};

    // Inisialisasi semua kecamatan Melawi dengan data kosong
    kecamatanMelawi.forEach(kecamatan => {
        kecamatanStats[kecamatan] = {
            kecamatan: kecamatan,
            sekolahList: [],
            jumlahSekolah: 0,
            jumlahSiswa: 0
        };
    });

    // Tambahkan kategori LAINNYA untuk kecamatan yang tidak dikenali
    kecamatanStats['LAINNYA'] = {
        kecamatan: 'LAINNYA',
        sekolahList: [],
        jumlahSekolah: 0,
        jumlahSiswa: 0
    };

    // Process sekolah data - gunakan kolom kecamatan yang sudah ada di database
    sekolahData.forEach(sekolah => {
        // Struktur sekolah: [kodeBiasa, kodePro, kecamatan, npsn, namaSekolahLengkap, namaSekolahSingkat]
        const kodeSekolah = sekolah[0];
        const kecamatanRaw = sekolah[2];
        const kecamatan = normalizeKecamatan(kecamatanRaw);
        const namaSekolah = sekolah[4] || 'Unknown';

        kecamatanStats[kecamatan].sekolahList.push({
            kode: kodeSekolah,
            nama: namaSekolah,
            npsn: sekolah[3] || 'N/A',
            kecamatanAsli: kecamatanRaw // Simpan kecamatan asli untuk debugging
        });
        kecamatanStats[kecamatan].jumlahSekolah++;
    });

    // Process siswa data to count students per kecamatan
    siswaData.forEach(siswa => {
        const kodeSekolah = siswa[0];
        const sekolah = sekolahData.find(s => String(s[0]) === String(kodeSekolah));

        if (sekolah) {
            // Gunakan kolom kecamatan dari data sekolah dengan normalisasi
            const kecamatanRaw = sekolah[2];
            const kecamatan = normalizeKecamatan(kecamatanRaw);

            if (kecamatanStats[kecamatan]) {
                kecamatanStats[kecamatan].jumlahSiswa++;
            }
        }
    });

    // Convert to array and calculate averages, filter out empty kecamatan (except LAINNYA if it has data)
    const result = Object.values(kecamatanStats)
        .filter(stat => {
            // Tampilkan semua kecamatan yang memiliki sekolah atau siswa
            // Atau jika ini adalah LAINNYA dan memiliki data
            return stat.jumlahSekolah > 0 || stat.jumlahSiswa > 0 ||
                   (stat.kecamatan === 'LAINNYA' && (stat.jumlahSekolah > 0 || stat.jumlahSiswa > 0));
        })
        .map(stat => ({
            ...stat,
            rataRataSiswa: stat.jumlahSekolah > 0 ? (stat.jumlahSiswa / stat.jumlahSekolah).toFixed(1) : '0'
        }));

    // Sort dengan LAINNYA di bagian akhir
    return result.sort((a, b) => {
        if (a.kecamatan === 'LAINNYA') return 1;
        if (b.kecamatan === 'LAINNYA') return -1;
        return a.kecamatan.localeCompare(b.kecamatan);
    });
}

// Fungsi untuk render tabel Statistik Wilayah

function renderAdminTable(tableId) {
    // Map tableId to correct table body ID
    const tableBodyMap = {
        'siswa': 'adminSiswaTableBody',
        'sekolah': 'adminSekolahTableBody',
        'dashboardContent': null // Dashboard doesn't have table body
    };

    const tableBodyId = tableBodyMap[tableId];
    if (!tableBodyId) {

        return;
    }

    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {

        return;
    }

    // Show table loading state
    if (window.LoadingManager) {
        LoadingManager.showTableLoading(tableBodyId, 'Memuat data...');
    }

    let data;
    if (tableId === 'rekapNilaiAdmin') {
        data = getRekapNilaiLengkapData();
    } else {
        data = database[tableId] || [];
    }

    if (tableId === 'siswa' && data.length > 0) {

    }

    // Hide table loading state
    if (window.LoadingManager) {
        LoadingManager.hideTableLoading(tableBodyId);
    }

    // Update counter setelah data dimuat
    updateAdminCounters();

    // Use built-in search for all tables (temporarily disable custom siswa search)
    const searchInput = document.getElementById(`search${capitalize(tableId)}`);
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();


    const filteredData = searchTerm
        ? data.filter(item => {
            if (['rekapNilaiAdmin', 'sekolah'].includes(tableId)) {
                return Object.values(item).some(val =>
                    String(val).toLowerCase().includes(searchTerm)
                );
            }

            const match = item.some(cell => String(cell).toLowerCase().includes(searchTerm));
            return match;
        })
        : data;

    
    const sortedData = applySort(filteredData, tableId);
    
    optimizedUpdatePaginationControls(tableId, sortedData.length);
    const state = paginationState[tableId];
    const rowsPerPage = state.rowsPerPage === 'all' ? sortedData.length : parseInt(state.rowsPerPage);
    const start = (state.currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = sortedData.slice(start, end);

    tableBody.innerHTML = '';

    if (tableId === 'rekapNilaiAdmin') {
        // Logika untuk rekap nilai tidak berubah
    } else {
        paginatedData.forEach(rowData => {
            const row = tableBody.insertRow();

            if (tableId === 'siswa') {
                // DEBUG: Log first row data to console
                if (row.rowIndex === 0) {
                    rowData.forEach((cell, i) => {

                    });
                }

                // For siswa table, show all 11 columns in correct order as per HTML header
                // Data structure: [kodeBiasa, kodePro, namaSekolah, kecamatan, noUrut, noInduk, nisn, namaPeserta, ttl, namaOrtu, noIjazah]
                const columnsToShow = rowData.slice(0, 11); // Ensure we show exactly 11 columns

                columnsToShow.forEach(cellData => {
                    const cell = row.insertCell();
                    cell.textContent = cellData || '-';
                });
            } else {
                // For other tables, show all columns directly
                const columnsToShow = rowData;

                columnsToShow.forEach(cellData => {
                    const cell = row.insertCell();
                    cell.textContent = cellData || '-';
                });
            }

            // ==========================================================
            // == PERBAIKAN UTAMA ADA DI SINI ==
            // Pastikan class tombolnya spesifik: 'btn-edit-sekolah' dan 'btn-delete-sekolah'
            // ==========================================================
            if (tableId === 'sekolah') {
                const actionCell = row.insertCell();
                actionCell.classList.add('action-cell');
                const kodeBiasa = rowData[0];
                
                actionCell.innerHTML = `
    <button type="button" class="btn btn-edit btn-edit-sekolah" data-kode="${kodeBiasa}">Edit</button>
    <button type="button" class="btn btn-delete btn-delete-sekolah" data-kode="${kodeBiasa}">Hapus</button>
`;
            } else if (tableId === 'siswa') {
                const actionCell = row.insertCell();
                actionCell.classList.add('action-cell');
                const nisn = rowData[6]; // NISN ada di index ke-6
                const nama = rowData[7]; // Nama ada di index ke-7
                
                actionCell.innerHTML = `
    <button type="button" class="btn btn-edit btn-edit-admin btn-edit-siswa" data-nisn="${nisn}" data-nama="${nama}">Edit</button>
    <button type="button" class="btn btn-delete btn-delete-admin btn-delete-siswa" data-nisn="${nisn}" data-nama="${nama}">Hapus</button>
`;
            }
            // ==========================================================
        });
    }

    // Check and handle empty states
    if (window.EmptyStateManager) {
        const emptyStateId = `empty${capitalize(tableId)}State`;
        EmptyStateManager.checkTableData(tableBodyId, emptyStateId);
    }
}

// Wrapper function for student table rendering
function renderAdminSiswaTable() {
    renderAdminTable('siswa');
}

// ===== ADMIN DASHBOARD FUNCTIONS =====
function populateDashboardStatistics() {

    try {
        // Calculate total schools and students
        const totalSekolah = database.sekolah ? database.sekolah.length : 0;
        const totalSiswa = database.siswa ? database.siswa.length : 0;

        // Update stat cards
        updateStatCard('totalSekolahStat', totalSekolah, 'Total Sekolah');
        updateStatCard('totalSiswaStat', totalSiswa, 'Total Siswa');

        // Calculate and display kecamatan breakdown
        calculateKecamatanStatistics();

    } catch (error) {
        console.error('Error populating dashboard statistics:', error);
    }
}

function updateStatCard(cardId, value, description) {
    const valueElement = document.getElementById(cardId);
    if (valueElement) {
        // Animate the number
        animateNumber(valueElement, 0, value, 1000);
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easing function for smooth animation
        const easedProgress = easeOutQuart(progress);
        const currentValue = Math.floor(start + (difference * easedProgress));

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = end.toLocaleString();
        }
    }

    requestAnimationFrame(updateNumber);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function calculateKecamatanStatistics() {
    // List of kecamatan as requested
    const kecamatanList = [
        'BELIMBING',
        'BELIMBING HULU',
        'ELLA HILIR',
        'MENUKUNG',
        'NANGA PINOH',
        'PINOH SELATAN',
        'PINOH UTARA',
        'SAYAN',
        'SOKAN',
        'TANAH PINOH',
        'TANAH PINOH BARAT'
    ];

    // Count students per kecamatan
    const kecamatanStats = {};

    // Initialize counts
    kecamatanList.forEach(kecamatan => {
        kecamatanStats[kecamatan] = 0;
    });

    // Count students by matching school kecamatan
    if (database.siswa && database.sekolah) {
        database.siswa.forEach(siswa => {
            const kodeBiasa = siswa[0]; // School code is at index 0

            // Find the school data to get kecamatan
            const sekolahData = database.sekolah.find(sekolah => sekolah[0] === kodeBiasa);

            if (sekolahData) {
                const kecamatan = sekolahData[2]; // Kecamatan is at index 2 in school data

                // Match kecamatan (case insensitive)
                const matchedKecamatan = kecamatanList.find(k =>
                    k.toLowerCase() === kecamatan.toLowerCase()
                );

                if (matchedKecamatan) {
                    kecamatanStats[matchedKecamatan]++;
                }
            }
        });
    }

    // Update kecamatan cards
    updateKecamatanCards(kecamatanStats);
}

function updateKecamatanCards(stats) {
    Object.entries(stats).forEach(([kecamatan, count]) => {
        const cardElement = document.querySelector(`[data-kecamatan="${kecamatan}"]`);
        if (cardElement) {
            const countElement = cardElement.querySelector('.kecamatan-count');
            if (countElement) {
                // Animate the count
                animateNumber(countElement, 0, count, 800);
            }
        }
    });
}

// Initialize student search when admin section is shown
function initializeSiswaSearch() {
    if (window.siswaSearch) {
        window.siswaSearch.init();
    } else {
        // Retry after script loads
        setTimeout(() => {
            if (window.siswaSearch) {
                window.siswaSearch.init();
            }
        }, 500);
    }
}

// Refresh student search data when database is updated
function refreshSiswaSearchData() {
    if (window.siswaSearch) {
        window.siswaSearch.refreshData();
    }
}




        function updatePaginationControls(tableId, totalRows) {
    const controls = document.querySelector(`.pagination-controls[data-table-id="${tableId}"]`);
    if (!controls) return;

    const state = paginationState[tableId];
    if (!state) return;

    const rowsPerPage = parseInt(state.rowsPerPage, 10);
    const totalPages = rowsPerPage > 0 ? Math.ceil(totalRows / rowsPerPage) : 1;
    const infoSpan = controls.querySelector('.pagination-info');
    const rowsPerPageSelect = controls.querySelector('.rows-per-page');
    const prevButton = controls.querySelector('.prev-page');
    const nextButton = controls.querySelector('.next-page');

    if (infoSpan) {
        const start = totalRows > 0 ? (state.currentPage - 1) * rowsPerPage + 1 : 0;
        const end = Math.min(start + rowsPerPage - 1, totalRows);
        infoSpan.textContent = `Menampilkan ${start} - ${end} dari ${totalRows} siswa`;
    }
    if (rowsPerPageSelect) {
        rowsPerPageSelect.value = state.rowsPerPage;
    }
    if (prevButton) {
        prevButton.disabled = state.currentPage <= 1;
    }
    if (nextButton) {
        nextButton.disabled = state.currentPage >= totalPages;
    }
}
// === FINAL: REPLACE fungsi yang sudah ada, JANGAN bikin nama baru ===
// === FINAL (REPLACE): Hapus semua data pada panel admin sesuai tableId ===
// Pemakaian: deleteAllData('sekolah') atau deleteAllData('siswa')
// - 'sekolah'  => coba hapus semua baris SEKOLAH saja (tidak menyentuh siswa/nilai/foto).
//                 Jika masih ada siswa, server akan menolak (409) dan memberi pesan.
// - 'siswa'    => coba hapus semua baris SISWA saja (tidak menyentuh sekolah).
//                 Jika masih ada nilai/foto terkait siswa, server akan menolak (409) dan memberi pesan.
async function deleteAllData(tableId) {
  // VALIDASI KONFIRMASI DIHAPUS - Langsung hapus tanpa konfirmasi

  try {
    if (typeof showLoader === 'function') showLoader();

    // Panggil endpoint yang SUDAH ADA
    const resp = await fetchWithAuth(apiUrl('/api/data/delete-all'), {
      method: 'POST',
      body: JSON.stringify({ tableId })
    });

    // sukses
    if (!resp?.success) throw new Error(resp?.message || 'Gagal menghapus data.');

    // ambil ulang data dari server
    await fetchDataFromServer();

    // reset UI (search & pagination) hanya pada tabel yang relevan
    const idsToReset = [tableId];
    idsToReset.forEach((id) => {
      const searchEl =
        document.getElementById(`search${id.charAt(0).toUpperCase()}${id.slice(1)}`) ||
        document.querySelector(`.search-bar[data-table-id="${id}"]`);
      if (searchEl) searchEl.value = '';
      if (typeof searchState === 'object' && Object.prototype.hasOwnProperty.call(searchState, id)) {
        searchState[id] = '';
      }
      if (typeof paginationState === 'object') {
        if (!paginationState[id]) paginationState[id] = { currentPage: 1, rowsPerPage: 10 };
        paginationState[id].currentPage = 1;
        paginationState[id].rowsPerPage = 'all';
      }
    });

    // render ulang tabel yang terdampak
    if (typeof renderAdminTable === 'function') {
      idsToReset.forEach((id) => renderAdminTable(id));
    } else if (typeof rerenderActiveTable === 'function') {
      idsToReset.forEach((id) => rerenderActiveTable(id));
    }

    // Refresh student search data if siswa table was deleted
    if (tableId === 'siswa') {
      refreshSiswaSearchData();
    }

    if (typeof showNotification === 'function') {
      showNotification(resp.message || 'Data berhasil dihapus.', 'success');
    }
  } catch (err) {
    // fetchWithAuth melempar string JSON bila status != 2xx; coba rapikan pesan
    let msg = err?.message || String(err) || 'Terjadi kesalahan.';
    try {
      // jika server mengirim JSON, ambil field message
      const parsed = JSON.parse(msg);
      if (parsed && parsed.message) msg = parsed.message;
    } catch (_) {  }
    console.error('deleteAllData error:', err);
    if (typeof showNotification === 'function') showNotification(msg, 'error');
  } finally {
    if (typeof hideLoader === 'function') hideLoader();
  }
}




        
        function renderGenericSiswaTable(tableId, openModalFn, downloadPdfFn) {
    if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) return;

    const tableBodyId = (tableId === 'transkripNilai') ? 'transkripSiswaTableBody' : `${tableId}SiswaTableBody`;
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    // Show table loading state
    if (window.LoadingManager) {
        LoadingManager.showTableLoading(tableBodyId, 'Memuat data siswa...');
    }

    const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);

    const searchTerm = searchState[tableId];
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);

    filteredSiswa = applySort(filteredSiswa, tableId);

    // Hide table loading state
    if (window.LoadingManager) {
        LoadingManager.hideTableLoading(tableBodyId);
    }

    tableBody.innerHTML = '';

    const state = paginationState[tableId] || { currentPage: 1, rowsPerPage: 10 };

    // Ensure state exists in paginationState
    if (!paginationState[tableId]) {
        paginationState[tableId] = { currentPage: 1, rowsPerPage: 10 };
    }

    const rowsPerPage = state.rowsPerPage === 'all' ? filteredSiswa.length : parseInt(state.rowsPerPage);
    const totalPages = rowsPerPage > 0 ? Math.ceil(filteredSiswa.length / rowsPerPage) : 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));

    const start = (state.currentPage - 1) * rowsPerPage;
    const end = state.rowsPerPage === 'all' ? filteredSiswa.length : start + rowsPerPage;
    const paginatedData = filteredSiswa.slice(start, end);

    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[6] || `temp-${start + index}`;
        const row = tableBody.insertRow();
        
        // Cek kelengkapan nilai untuk dokumen yang relevan
        let statusHtml = '<span style="color: #6c757d;">-</span>'; // Default status
        if (tableId === 'skkb') {
            // SKKB tidak memerlukan nilai, jadi selalu dianggap "siap"
            statusHtml = '<span style="color: #1e8e3e; font-weight: bold;" title="Dokumen siap dicetak">✔</span>';
        } else if (checkNilaiLengkap(nisn, false)) {
            statusHtml = '<span style="color: #1e8e3e; font-weight: bold;" title="Nilai sudah lengkap, dokumen siap dicetak">✔</span>';
        } else {
            statusHtml = '<span style="color: #ff9800; font-weight: bold;" title="Nilai belum lengkap, tidak dapat dicetak">⚠️</span>';
        }
        
        let actionButtonsHTML = '';
        if (openModalFn) {
            actionButtonsHTML += `<button class="btn btn-small btn-view" onclick="${openModalFn}('${nisn}')">Lihat</button>`;
        }
        
        // Nonaktifkan tombol PDF jika nilai belum lengkap (kecuali untuk SKKB)
        const isReadyToPrint = (tableId === 'skkb') || checkNilaiLengkap(nisn, false);
        actionButtonsHTML += `<button class="btn btn-small btn-pdf" onclick="${isReadyToPrint ? `${downloadPdfFn}('${nisn}')` : `showNotification('Nilai belum lengkap.', 'warning')`}" ${isReadyToPrint ? '' : 'disabled'}>PDF</button>`;
        
        // Upload foto dan hapus foto dipindah ke menu profil siswa

        row.innerHTML = `
            <td>${start + index + 1}</td>
            <td>${siswa[7] || ''}</td>
            <td>${nisn}</td>
            <td style="text-align: center;">${statusHtml}</td>
            <td>${actionButtonsHTML}</td>`;
    });

    optimizedUpdatePaginationControls(tableId, filteredSiswa.length);
    updateSortHeaders(tableId);

    // Check and handle empty states
    if (window.EmptyStateManager) {
        const emptyStateId = `empty${capitalize(tableId)}State`;
        EmptyStateManager.checkTableData(tableBodyId, emptyStateId);
    }
}

        function renderTranskripSiswaTable() {
            renderGenericSiswaTable('transkripNilai', 'openTranskripModal', 'downloadTranskripPDF');
        }
        
        function renderSklSiswaTable() {
            renderGenericSiswaTable('skl', 'openSklModal', 'downloadSklPDF');
        }
        
        function renderSkkbSiswaTable() {
            renderGenericSiswaTable('skkb', 'openSkkbModal', 'downloadSkkbPDF');
        }


function renderRekapNilai() {
    const tableId = 'rekapNilai';
    if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) return;

    const thead = document.getElementById('rekapNilaiThead');
    const tbody = document.getElementById('rekapNilaiTbody');

    // Show table loading state
    if (window.LoadingManager && tbody) {
        LoadingManager.showTableLoading('rekapNilaiTbody', 'Memuat rekap nilai...');
    }

    const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);

    const searchTerm = searchState.rekapNilai;
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Hide table loading state
    if (window.LoadingManager && tbody) {
        LoadingManager.hideTableLoading('rekapNilaiTbody');
    }

    // --- PERBAIKAN UTAMA DI SINI ---
    // 1. Mengambil daftar mapel lengkap, termasuk Mulok
    const allSubjects = subjects[window.currentUser.kurikulum];
    const settings = database.settings[schoolKodeBiasa] || {};
    const subjectVisibility = settings.subjectVisibility || {};
    const mulokNames = database.nilai._mulokNames?.[schoolKodeBiasa] || {};

    // 2. Filter mapel yang akan ditampilkan berdasarkan Setting
    const visibleSubjects = allSubjects.filter(subjectKey => {
        // Untuk Mulok, tampilkan hanya jika namanya sudah diisi di Setting
        if (subjectKey.startsWith('MULOK')) {
            return mulokNames[subjectKey] && mulokNames[subjectKey].trim() !== '';
        }
        // Untuk mapel utama, periksa visibility dari setting
        return subjectVisibility[subjectKey] !== false;
    });

    // 3. Membuat Header Tabel dari daftar mapel yang sudah lengkap
    const headerRow = thead.insertRow();
    headerRow.innerHTML = '<th>NO</th><th>NISN</th><th>NAMA</th>';
    visibleSubjects.forEach(subjectKey => {
        // Gunakan nama custom untuk Mulok, atau key untuk mapel lain
        const headerName = mulokNames[subjectKey] || subjectKey;
        headerRow.innerHTML += `<th>${headerName}</th>`;
    });
    // Tambahkan kolom rata-rata di akhir
    headerRow.innerHTML += '<th>RATA-RATA</th>';
    // --- AKHIR PERBAIKAN ---

    // Mengisi Body Tabel
    const state = paginationState.rekapNilai;
    const rowsPerPage = state.rowsPerPage === 'all' ? filteredSiswa.length : parseInt(state.rowsPerPage);
    const totalPages = rowsPerPage > 0 ? Math.ceil(filteredSiswa.length / rowsPerPage) : 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));
    
    const start = (state.currentPage - 1) * rowsPerPage;
    const end = state.rowsPerPage === 'all' ? filteredSiswa.length : start + rowsPerPage;
    const paginatedData = filteredSiswa.slice(start, end);

    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[6] || `temp-${start + index}`;
        const row = tbody.insertRow();
        row.innerHTML = `<td>${start + index + 1}</td><td>${nisn}</td><td>${siswa[7] || ''}</td>`;
        
        let totalGrades = 0;
        let countValidGrades = 0;
        
        // Loop menggunakan daftar mapel yang sudah lengkap
        visibleSubjects.forEach(subjectKey => {
            const finalGrade = calculateAverageForSubject(nisn, subjectKey);
            const gradeDisplay = finalGrade !== null ? finalGrade.toFixed(2) : '-';
            row.innerHTML += `<td style="text-align: center;">${gradeDisplay}</td>`;
            
            // Hitung untuk rata-rata siswa
            if (finalGrade !== null && !isNaN(finalGrade)) {
                totalGrades += finalGrade;
                countValidGrades++;
            }
        });
        
        // Tambahkan kolom rata-rata siswa
        const studentAverage = countValidGrades > 0 ? totalGrades / countValidGrades : 0;
        const averageDisplay = countValidGrades > 0 ? studentAverage.toFixed(2) : '-';
        row.innerHTML += `<td style="text-align: center; font-weight: bold;">${averageDisplay}</td>`;
    });

    optimizedUpdatePaginationControls('rekapNilai', filteredSiswa.length);
    updateSortHeaders(tableId);
    
    // Setup PDF download button
    const downloadBtn = document.getElementById('downloadRekapNilaiSekolahPdfBtn');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            downloadRekapNilaiSekolahPDF(filteredSiswa, visibleSubjects, mulokNames);
        };
    }

    // Check and handle empty states
    if (window.EmptyStateManager) {
        const emptyStateId = 'emptyRekapNilaiState';
        EmptyStateManager.checkTableData('rekapNilaiTbody', emptyStateId);
    }
}

// Fungsi untuk mencetak rekap nilai sekolah ke PDF (untuk panel sekolah)
async function downloadRekapNilaiSekolahPDF(filteredSiswa, visibleSubjects, mulokNames) {
    if (!filteredSiswa || filteredSiswa.length === 0) {
        showNotification('Tidak ada data siswa untuk dicetak.', 'warning');
        return;
    }

    showLoader();
    const { jsPDF } = window.jspdf;
    
    try {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        
        const schoolName = (window.currentUser.schoolData[4] || 'SEKOLAH').toUpperCase();
        const kurikulum = window.currentUser.kurikulum || 'Merdeka';
        
        // Membangun data header dan body untuk autoTable
        const tableHeaders = [{
            "header": "NO", "dataKey": "no"
        }, {
            "header": "NAMA", "dataKey": "nama"
        }, {
            "header": "NISN", "dataKey": "nisn"
        }];
        
        visibleSubjects.forEach(subjectKey => {
            const headerName = mulokNames[subjectKey] || subjectKey;
            tableHeaders.push({ "header": headerName, "dataKey": subjectKey });
        });
        
        // Tambahkan kolom rata-rata
        tableHeaders.push({ "header": "RATA-RATA", "dataKey": "average" });

        const tableBody = filteredSiswa.map((siswa, index) => {
            const row = {
                "no": index + 1,
                "nama": siswa[7] || '',
                "nisn": siswa[6] || ''
            };
            
            let totalGrades = 0;
            let countValidGrades = 0;
            
            visibleSubjects.forEach(subjectKey => {
                const finalGrade = calculateAverageForSubject(siswa[6], subjectKey);
                row[subjectKey] = finalGrade > 0 ? finalGrade.toFixed(2) : '-';
                
                if (finalGrade > 0) {
                    totalGrades += finalGrade;
                    countValidGrades++;
                }
            });
            
            const averageGrade = countValidGrades > 0 ? (totalGrades / countValidGrades) : 0;
            row["average"] = averageGrade > 0 ? averageGrade.toFixed(2) : '-';
            
            return row;
        });

        // Fungsi untuk membuat kop/header di setiap halaman
        const addHeader = (pdf, pageNumber) => {
            // Judul tetap rata tengah
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text(`REKAP NILAI AKHIR SISWA`, 148, 20, { align: 'center' });
            pdf.text(`TAHUN PELAJARAN 2024/2025`, 148, 30, { align: 'center' });
            
            // Informasi sekolah rata kiri dengan format titik dua yang rapi
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            
            const labelWidth = 35; // Lebar tetap untuk label
            const colonX = 14 + labelWidth; // Posisi titik dua
            const valueX = colonX + 5; // Posisi nilai (setelah titik dua)
            
            // Label
            pdf.text('KECAMATAN', 14, 42);
            pdf.text('NAMA SEKOLAH', 14, 48);
            pdf.text('NPSN', 14, 54);
            pdf.text('KURIKULUM', 14, 60);
            pdf.text('JUMLAH SISWA', 14, 66);
            
            // Titik dua
            pdf.text(':', colonX, 42);
            pdf.text(':', colonX, 48);
            pdf.text(':', colonX, 54);
            pdf.text(':', colonX, 60);
            pdf.text(':', colonX, 66);
            
            // Nilai
            pdf.text(window.currentUser.schoolData[2] || '-', valueX, 42); // Kecamatan
            pdf.text(schoolName, valueX, 48); // Nama Sekolah
            pdf.text(window.currentUser.schoolData[3] || '-', valueX, 54); // NPSN
            pdf.text(kurikulum, valueX, 60); // Kurikulum
            pdf.text(`${filteredSiswa.length} orang`, valueX, 66); // Jumlah Siswa
        };

        // Tambahkan header di halaman pertama
        addHeader(pdf, 1);

        // Menggunakan autoTable untuk membuat tabel dengan header di setiap halaman
        pdf.autoTable({
            columns: tableHeaders,
            body: tableBody,
            startY: 75,
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 7,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 }, // NO - dikecilkan
                1: { halign: 'left', cellWidth: 45 },   // NAMA - diperbesar tanpa ellipsis
                2: { halign: 'center', cellWidth: 20 }, // NISN - dikecilkan sedikit
                // Kolom mata pelajaran akan auto-adjust
            },
            margin: { top: 75, right: 5, bottom: 20, left: 5 },
            tableWidth: 'auto',
            didDrawPage: (data) => {
                // Tambahkan header di setiap halaman baru (kecuali halaman pertama)
                if (data.pageNumber > 1) {
                    addHeader(pdf, data.pageNumber);
                }
            }
        });

        // Tambahkan tanda tangan kepala sekolah di akhir halaman
        const currentDate = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const finalY = pdf.autoTable.previous.finalY || 75;
        let signatureY = finalY + 20;

        // Pastikan ada ruang untuk tanda tangan, jika tidak buat halaman baru
        if (signatureY > 180) {
            pdf.addPage();
            addHeader(pdf, pdf.internal.getNumberOfPages());
            signatureY = 90;
        }

        // Tempat dan tanggal (kanan atas)
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        const kecamatan = window.currentUser.schoolData[2] || 'Nanga Pinoh';
        pdf.text(`${kecamatan}, ${currentDate}`, 200, signatureY, { align: 'left' });

        // Tanda tangan kepala sekolah (kanan bawah)
        signatureY += 10;
        pdf.text('Kepala Sekolah,', 200, signatureY, { align: 'left' });

        // Ruang untuk tanda tangan (3 baris kosong)
        signatureY += 30;

        // Nama kepala sekolah dengan garis bawah
        const principalName = database.settings[window.currentUser.schoolData[0]]?.principalName || 'PRASETYA LUKMANA, S.KOM';
        pdf.setFont(undefined, 'bold');
        pdf.text(principalName, 200, signatureY, { align: 'left' });

        // Garis bawah untuk nama kepala sekolah
        const textWidth = pdf.getStringUnitWidth(principalName) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        pdf.line(200, signatureY + 2, 200 + textWidth, signatureY + 2);

        // NIP kepala sekolah
        signatureY += 8;
        const principalNip = database.settings[window.currentUser.schoolData[0]]?.principalNip || '198840620252111031';
        pdf.setFont(undefined, 'normal');
        pdf.text(`NIP. ${principalNip}`, 200, signatureY, { align: 'left' });

        // Simpan PDF
        const fileName = `Rekap_Nilai_${schoolName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(fileName);
        
        showNotification("PDF rekap nilai berhasil dibuat!", 'success');
    } catch (error) {
        console.error('Error membuat PDF:', error);
        showNotification("Gagal membuat file PDF rekap nilai.", 'error');
    } finally {
        hideLoader();
    }
}

function checkNilaiLengkap(nisn, showNotif = true) {
  if (!nisn) return false;
  for (const semId of semesterIds) {
    if (!checkNilaiLengkapForSemester(nisn, semId)) {
      if (showNotif) {
        showNotification(`Data nilai belum lengkap. Periksa semua semester.`, 'warning');
      }
      return false;
    }
  }
  return true;
}

function checkNilaiLengkapForSemester(nisn, semesterId) {
  if (!nisn) return false;
  const requiredSubjects = subjects[window.currentUser.kurikulum];


  for (const subject of requiredSubjects) {
    const nilaiData = database.nilai[nisn]?.[semesterId]?.[subject];

    // ⛳ Khusus MULOK: jika belum diberi nama kustom, tidak dianggap wajib.
    if (subject.startsWith('MULOK')) {
      const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
      const mulokName = database.nilai._mulokNames?.[schoolKodeBiasa]?.[subject];
      if (!mulokName || mulokName.trim() === '') {
        continue; // lewati slot MULOK tanpa nama
      }
    }

    // jika mapel wajib tidak ada sama sekali
    if (!nilaiData) {
      return false;
    }

    if (window.currentUser.kurikulum === 'K13') {
      // K13 wajib terisi KI3 & KI4 (boleh hitung RT terpisah, tapi validasi tetap 2 komponen)
      if (!nilaiData.KI3 || String(nilaiData.KI3).trim() === '' ||
          !nilaiData.KI4 || String(nilaiData.KI4).trim() === '') {
        return false;
      }
    } else {
      // Merdeka: 1 komponen tunggal 'NILAI' wajib ada
      if (!nilaiData.NILAI || String(nilaiData.NILAI).trim() === '') {
        return false;
      }
    }
  }
  return true;
}


function calculateAverageForSubject(nisn, subjectKey) {
    let totalNilai = 0;
    let countNilai = 0;

    const semesterMap = {
        "1": "KELAS 1 SEMESTER 1",
        "2": "KELAS 1 SEMESTER 2",
        "3": "KELAS 2 SEMESTER 1",
        "4": "KELAS 2 SEMESTER 2",
        "5": "KELAS 3 SEMESTER 1",
        "6": "KELAS 3 SEMESTER 2",
        "7": "KELAS 4 SEMESTER 1",
        "8": "KELAS 4 SEMESTER 2",
        "9": "KELAS 5 SEMESTER 1",
        "10": "KELAS 5 SEMESTER 2",
        "11": "KELAS 6 SEMESTER 1",
        "12": "KELAS 6 SEMESTER 2"
    };
    const semesterIds = Object.keys(semesterMap);

    semesterIds.forEach(semId => {
        const nilaiData = database.nilai[nisn]?.[semId]?.[subjectKey];
        let nilai;
        if (window.currentUser.kurikulum === 'K13') {
            if (nilaiData && nilaiData.RT !== undefined && String(nilaiData.RT).trim() !== '') {
                nilai = nilaiData.RT;
            } else if (nilaiData && (String(nilaiData.KI3||'').trim() !== '' && String(nilaiData.KI4||'').trim() !== '')) {
                const k3 = parseFloat(nilaiData.KI3);
                const k4 = parseFloat(nilaiData.KI4);
                if (!isNaN(k3) && !isNaN(k4)) nilai = Math.round((k3 + k4) / 2);
            } else {
                nilai = '';
            }
        } else {
            nilai = nilaiData?.NILAI || '';
        }
        if (nilai !== '' && !isNaN(nilai)) {
            totalNilai += parseFloat(nilai);
            countNilai++;
        }
    });
    return countNilai > 0 ? (totalNilai / countNilai) : null;
}
        
        // Utility functions moved to js/utils.js


function createTranskripHTML(nisn) {
    const siswa = database.siswa.find(s => s[6] === nisn);
    const sekolah = window.currentUser.schoolData;
    if (!siswa || !sekolah) return '<p>Data tidak ditemukan.</p>';

    const schoolKodeBiasa = String(sekolah[0]);
    const settings = database.settings[schoolKodeBiasa] || {};

    const { tableRows } = createNilaiTableHTML(nisn, 'transkrip');
    const schoolName = (sekolah[4] || 'NAMA SEKOLAH').toUpperCase();
    const schoolNameHtml = schoolName.length > 40 ? `<p style="font-size: 1em;">${schoolName}</p>` : `<p>${schoolName}</p>`;
    const displayPrintDate = formatDateToIndonesian(settings.printDate) || new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const transcriptNumberDisplay = (settings.transcriptNumber || '431.211/07/').replace(/ /g, '&nbsp;');
    const documentNumber = transcriptNumberDisplay;

    // Check if user is PRO for logo selection
    const isProUser = window.currentUser?.loginType === 'pro' ||
                     (schoolKodeBiasa && localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true');

    const logoLeftPosTop = settings.logoLeftPosTop || 13;
    const logoLeftPosLeft = settings.logoLeftPosLeft || 15;
    const logoRightPosTop = settings.logoRightPosTop || 13;
    const logoRightPosRight = settings.logoRightPosRight || 15;

    return `
        <div class="transkrip-full-header">
            <img src="${(isProUser && settings.logoLeft) ? settings.logoLeft : './assets/kop-left-melawi.png'}" alt="Logo Kiri" class="transkrip-logo" style="position: absolute; top: ${logoLeftPosTop}mm; left: ${logoLeftPosLeft}mm; width: ${settings.logoLeftSize || 80}px; height: auto;" >
            <div class="transkrip-header-text" style="display: inline-block; vertical-align: middle; padding-top: 13mm;">
                <p><strong>PEMERINTAH KABUPATEN MELAWI</strong></p>
                ${schoolNameHtml}
                <p style="font-weight: normal; font-size: 0.9em;">${settings.schoolAddress || 'JL. PENDIDIKAN NANGA PINOH'}</p>
            </div>
            <img src="${(isProUser && settings.logoRight) ? settings.logoRight : './assets/kop-right-tutwuri.png'}" alt="Logo Kanan" class="transkrip-logo" style="position: absolute; top: ${logoRightPosTop}mm; right: ${logoRightPosRight}mm; width: ${settings.logoRightSize || 80}px; height: auto;" >
        </div>
        <hr class="transkrip-hr">
        <div style="text-align: center; margin: 20px 0;">
            <h2 style="font-size: 18px; font-weight: bold; margin: 10px 0;"><strong><u>TRANSKRIP NILAI</u></strong></h2>
            <p style="margin: 5px 0;">Nomor : ${documentNumber}</p>
        </div>
        <div class="transkrip-student-info-table">
            <table style="border: none; margin-bottom: 20px; font-size: 14px;">
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top; width: 200px;">Satuan Pendidikan</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top; width: 20px;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${toTitleCase(sekolah[4] || 'SEKOLAH DASAR SWASTA ISLAM TERPADU INSAN KAMIL')}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Pokok Sekolah Nasional</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${sekolah[3] || '69854814'}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nama Lengkap</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${toTitleCase(siswa[7] || 'ACHMAD FAHRY SETIAWAN')}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Tempat, Tanggal Lahir</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${formatBirthPlaceDate(siswa[8] || 'NANGA PINOH, 9 September 2012')}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Induk Siswa Nasional</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${siswa[6] || '0128593698'}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Ijazah</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${siswa[11] || ''}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Tanggal Kelulusan</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">2 Juni 2025</td>
                </tr>
            </table>
        </div>
        <table id="transkripNilaiTable" style="border-collapse: collapse; width: 100%; margin-bottom: 30px;">
            <thead>
                <tr style="border: 1px solid black;">
                    <th style="border: 1px solid black; padding: 8px; text-align: center; width: 50px;">No</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: center;">Mata Pelajaran</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: center; width: 80px;">Nilai</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
        <div class="transkrip-signature" style="text-align: right; margin-top: 40px;">
            <div class="transkrip-signature-block" style="display: inline-block; text-align: left;">
                <p>Kabupaten Melawi, ${displayPrintDate}</p>
                <p>Kepala,</p><br><br><br>
                <p class="principal-name" style="text-decoration: underline;"><strong>${settings.principalName || 'Prasetya Lukmana, S.Kom'}</strong></p>
                <p>${settings.principalNip ? 'NIP. ' + settings.principalNip : 'NIP. 198840620252111031'}</p>
            </div>
        </div>`;
}
        
function createSklHTML(nisn) {
    const siswa = database.siswa.find(s => s[6] === nisn);
    const sekolah = window.currentUser.schoolData;
    if (!siswa || !sekolah) return '<p>Data tidak ditemukan.</p>';

    const schoolKodeBiasa = String(sekolah[0]);
    const settings = database.settings[schoolKodeBiasa] || {};

    const { tableRows } = createNilaiTableHTML(nisn, 'skl');
    const schoolName = (sekolah[4] || 'NAMA SEKOLAH').toUpperCase();
    const schoolNameHtml = schoolName.length > 40 ? `<p style="font-size: 1em;">${schoolName}</p>` : `<p>${schoolName}</p>`;

    const sklPhoto = database.sklPhotos?.[nisn];
    let photoBoxContent;
    let photoBoxClass = 'skl-pasfoto no-photo';
    if (sklPhoto) {
        photoBoxContent = `<img src="${sklPhoto}" alt="Pasfoto">`;
        photoBoxClass = 'skl-pasfoto has-photo';
    } else {
        photoBoxContent = `
            <p style="margin: 0;">Pasfoto 3 cm x 4 cm</p>
            <p style="margin: 0;">hitam putih atau</p>
            <p style="margin: 0;">berwarna</p>
        `;
    }

    const displayPrintDate = formatDateToIndonesian(settings.printDate) || new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const transcriptNumberDisplay = (settings.transcriptNumber || '400.3/').replace(/ /g, '&nbsp;');
    const documentNumber = transcriptNumberDisplay;

    // Check if user is PRO for logo selection
    const isProUser = window.currentUser?.loginType === 'pro' ||
                     (schoolKodeBiasa && localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true');

    const logoLeftPosTop = settings.logoLeftPosTop || 13;
    const logoLeftPosLeft = settings.logoLeftPosLeft || 15;
    const logoRightPosTop = settings.logoRightPosTop || 13;
    const logoRightPosRight = settings.logoRightPosRight || 15;
    const sklPhotoLayout = settings.sklPhotoLayout || 5;

    return `
        <div class="transkrip-full-header">
            <img src="${(isProUser && settings.logoLeft) ? settings.logoLeft : './assets/kop-left-melawi.png'}" alt="Logo Kiri" class="transkrip-logo" style="position: absolute; top: ${logoLeftPosTop}mm; left: ${logoLeftPosLeft}mm; width: ${settings.logoLeftSize || 80}px; height: auto;" >
            <div class="transkrip-header-text" style="display: inline-block; vertical-align: middle; padding-top: 13mm;">
                <p><strong>PEMERINTAH KABUPATEN MELAWI</strong></p>
                ${schoolNameHtml}
                <p style="font-weight: normal; font-size: 0.9em;">${settings.schoolAddress || 'JL. PENDIDIKAN KECAMATAN NANGA PINOH KABUPATEN MELAWI'}</p>
            </div>
            <img src="${(isProUser && settings.logoRight) ? settings.logoRight : './assets/kop-right-tutwuri.png'}" alt="Logo Kanan" class="transkrip-logo" style="position: absolute; top: ${logoRightPosTop}mm; right: ${logoRightPosRight}mm; width: ${settings.logoRightSize || 80}px; height: auto;" >
        </div>
        <hr class="transkrip-hr">
        <p class="transkrip-title"><strong><u>SURAT KETERANGAN LULUS</u></strong></p>
        <p class="transkrip-nomor" style="text-align: center;"><strong>TAHUN PELAJARAN 2025/2026</strong></p>
        <p class="transkrip-nomor" style="text-align: center;">Nomor: ${documentNumber}</p>
        <p class="skl-body-text">Yang bertanda tangan dibawah ini, Kepala ${toTitleCase(sekolah[4] || 'SEKOLAH DASAR SWASTA ISLAM TERPADU INSAN KAMIL')} NPSN: ${sekolah[3] || '69854814'} Kecamatan ${toTitleCase(sekolah[2] || 'NANGA PINOH')} Kabupaten Melawi Provinsi Kalimantan Barat menerangkan :</p>
        <div class="skl-student-info-table">
            <table style="border: none; margin-left: 4cm; margin-bottom: 20px;">
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top; width: 200px;">Nama</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top; width: 20px;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${toTitleCase(siswa[7] || 'ACHMAD FAHRY SETIAWAN')}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Tempat Dan Tanggal Lahir</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${formatBirthPlaceDate(siswa[8] || 'NANGA PINOH, 08 SEPTEMBER 2012')}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nama Orang Tua/Wali</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${toTitleCase(siswa[10] || 'TATO')}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Induk Siswa</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${siswa[5] || '0134'}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Induk Siswa Nasional</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${siswa[6] || '0128593698'}</td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Ijazah</td>
                    <td style="border: none; padding: 3px 5px; vertical-align: top;">:</td>
                    <td style="border: none; padding: 3px 0; vertical-align: top;">${siswa[11] || ''}</td>
                </tr>
            </table>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <h2 style="font-size: 24px; font-weight: bold; margin: 0;"><strong>LULUS</strong></h2>
        </div>
        <table id="sklNilaiTable" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <thead>
                <tr style="border: 1px solid black;">
                    <th style="border: 1px solid black; padding: 8px; text-align: center; width: 50px;">No</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: center;">Mata Pelajaran</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: center; width: 80px;">Nilai</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
        <p class="skl-body-text" style="margin-top: 15px;">Surat Keterangan Kelulusan ini bersifat sementara sampai dikeluarkannya Ijazah.</p>
        <div class="skl-footer" style="position: relative; margin-top: 30px; height: 4cm; width: 100%;">
            <div class="${photoBoxClass}" style="position: absolute; left: ${sklPhotoLayout}%; top: 0; width: 3cm; height: 4cm; border: 1px solid black; display: flex; align-items: center; justify-content: center; flex-direction: column; font-size: 12px; text-align: center;">${photoBoxContent}</div>
            <div class="transkrip-signature-block" style="position: absolute; right: 0; top: 0; text-align: left; width: 280px;">
                <p>Kabupaten Melawi, ${displayPrintDate}</p>
                <p>Kepala Sekolah,</p><br><br><br>
                <p class="principal-name" style="text-decoration: underline;"><strong>${settings.principalName || 'PRASETYA LUKMANA, S.KOM'}</strong></p>
                <p>${settings.principalNip ? 'NIP. ' + settings.principalNip : 'NIP. 198840620252111031'}</p>
            </div>
        </div>`;
}

function createSkkbHTML(nisn) {
    const siswa = database.siswa.find(s => s[6] === nisn);
    const sekolah = window.currentUser.schoolData;
    if (!siswa || !sekolah) return '<p>Data tidak ditemukan.</p>';

    const schoolKodeBiasa = String(sekolah[0]);
    const settings = database.settings[schoolKodeBiasa] || {};

    const schoolName = (sekolah[4] || 'NAMA SEKOLAH').toUpperCase();
    const schoolNameHtml = schoolName.length > 40 ? `<p style="font-size: 1em;">${schoolName}</p>` : `<p>${schoolName}</p>`;
    const displayPrintDate = formatDateToIndonesian(settings.printDate) || '.........................';
    const skkbNumberDisplay = (settings.skkbNumber || '').replace(/ /g, '&nbsp;');

    // Check if user is PRO for logo selection
    const isProUser = window.currentUser?.loginType === 'pro' ||
                     (schoolKodeBiasa && localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true');

    const logoLeftPosTop = settings.logoLeftPosTop || 13;
    const logoLeftPosLeft = settings.logoLeftPosLeft || 15;
    const logoRightPosTop = settings.logoRightPosTop || 13;
    const logoRightPosRight = settings.logoRightPosRight || 15;

    return `
        <div class="transkrip-full-header">
            <img src="${(isProUser && settings.logoLeft) ? settings.logoLeft : './assets/kop-left-melawi.png'}" alt="Logo Kiri" class="transkrip-logo" style="position: absolute; top: ${logoLeftPosTop}mm; left: ${logoLeftPosLeft}mm; width: ${settings.logoLeftSize || 80}px; height: auto;" >
            <div class="transkrip-header-text" style="display: inline-block; vertical-align: middle; padding-top: 13mm;">
                <p><strong>PEMERINTAH KABUPATEN MELAWI</strong></p>
                ${schoolNameHtml}
                <p style="font-weight: normal; font-size: 0.9em;">${settings.schoolAddress || ''}</p>
            </div>
            <img src="${(isProUser && settings.logoRight) ? settings.logoRight : './assets/kop-right-tutwuri.png'}" alt="Logo Kanan" class="transkrip-logo" style="position: absolute; top: ${logoRightPosTop}mm; right: ${logoRightPosRight}mm; width: ${settings.logoRightSize || 80}px; height: auto;" >
        </div>
        <hr class="transkrip-hr">

        <div style="text-align: center; margin: 30px 0;">
            <p class="transkrip-title" style="margin: 20px 0;"><strong><u>SURAT KETERANGAN BERKELAKUAN BAIK</u></strong></p>
            <p class="transkrip-nomor" style="margin: 10px 0;">Nomor:&nbsp;${skkbNumberDisplay}</p>
        </div>

        <div style="margin: 30px 0; text-align: justify; line-height: 1.8;">
            <p class="skl-body-text" style="margin-bottom: 20px;">Yang bertanda tangan dibawah ini, Kepala ${toTitleCase(sekolah[4])} NPSN: ${sekolah[3]} Kecamatan ${toTitleCase(sekolah[2])} Kabupaten Melawi Provinsi Kalimantan Barat menerangkan dengan sesungguhnya bahwa :</p>

            <div class="skl-student-info-table" style="text-align: center; margin: 40px 0; margin-left: 3.5cm;">
                <table style="margin: 0 auto; border-spacing: 0; line-height: 2.0; text-align: left;">
                    <tr>
                        <td style="border: none; padding: 3px 0; vertical-align: top; width: 200px;">Nama</td>
                        <td style="border: none; padding: 3px 5px; vertical-align: top; width: 20px;">:</td>
                        <td style="border: none; padding: 3px 0; vertical-align: top;">${toTitleCase(siswa[7] || '')}</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 3px 0; vertical-align: top;">Tempat Dan Tanggal Lahir</td>
                        <td style="border: none; padding: 3px 5px; vertical-align: top; width: 20px;">:</td>
                        <td style="border: none; padding: 3px 0; vertical-align: top;">${formatBirthPlaceDate(siswa[8] || '')}</td>
                    </tr>
                    <tr>
                        <td style="border: none; padding: 3px 0; vertical-align: top;">Nomor Induk Siswa Nasional</td>
                        <td style="border: none; padding: 3px 5px; vertical-align: top; width: 20px;">:</td>
                        <td style="border: none; padding: 3px 0; vertical-align: top;">${siswa[6] || ''}</td>
                    </tr>
                </table>
            </div>

            <p class="skl-body-text" style="margin-top: 30px; margin-bottom: 15px;">Adalah benar-benar siswa kami dan selama menjadi siswa di sekolah ini yang bersangkutan berkelakuan baik.</p>
            <p class="skl-body-text" style="margin-bottom: 40px;">Demikian surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
        </div>

        <div style="margin-top: 50px; text-align: right;">
            <div style="display: inline-block; text-align: left; width: 280px;">
                <p>Kabupaten Melawi, ${displayPrintDate.replace(/,/g, '')}</p>
                <p>Kepala Sekolah,</p>
                <br><br><br>
                <p style="text-decoration: underline; font-weight: bold;">${settings.principalName || ''}</p>
            </div>
        </div>`;
}

// GANTI SELURUH FUNGSI createNilaiTableHTML DENGAN VERSI FINAL INI
function createNilaiTableHTML(nisn, docType, semesterId = null) {
    let tableRows = '';
    let totalRataRata = 0;
    let countRataRata = 0;
    const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
    const settings = database.settings[schoolKodeBiasa] || {};
    const subjectVisibility = settings.subjectVisibility || {};
    const nilaiData = database.nilai[nisn] || {};

    // 1. Filter HANYA mata pelajaran utama yang dicentang (visible)
    const visibleSubjects = transcriptSubjects[window.currentUser.kurikulum].filter(subject => {
        return subjectVisibility[subject.key] !== false;
    });

    // Membuat baris untuk setiap mapel utama yang visible
    visibleSubjects.forEach((subject, i) => {
        let gradeDisplay;
        if (semesterId) {
            const nilaiSemester = nilaiData[semesterId]?.[subject.key];
            gradeDisplay = (window.currentUser.kurikulum === 'K13' ? nilaiSemester?.RT : nilaiSemester?.NILAI) || '';
        } else {
            const finalGrade = calculateAverageForSubject(nisn, subject.key);
            gradeDisplay = finalGrade !== null ? finalGrade.toFixed(2) : '';
            if (finalGrade !== null) {
                totalRataRata += finalGrade;
                countRataRata++;
            }
        }
        if (docType === 'skl' || docType === 'transkrip') {
            tableRows += `<tr style="border: 1px solid black;"><td style="border: 1px solid black; padding: 8px; text-align: center;">${i + 1}</td><td style="border: 1px solid black; padding: 8px;">${subject.display}</td><td style="border: 1px solid black; padding: 8px; text-align: center;">${gradeDisplay}</td></tr>`;
        } else {
            tableRows += `<tr><td style="text-align: center;">${i + 1}</td><td>${subject.display}</td><td style="text-align: center;">${gradeDisplay}</td></tr>`;
        }
    });

    // 2. Selalu tampilkan baris header untuk "Muatan Lokal"
    const mulokHeaderIndex = visibleSubjects.length + 1;
    if (docType === 'skl' || docType === 'transkrip') {
        tableRows += `<tr style="border: 1px solid black;"><td style="border: 1px solid black; padding: 8px; text-align: center;">${mulokHeaderIndex}</td><td style="border: 1px solid black; padding: 8px;">Muatan Lokal</td><td style="border: 1px solid black; padding: 8px;"></td></tr>`;
    } else {
        tableRows += `<tr><td style="text-align: center;">${mulokHeaderIndex}</td><td>Muatan Lokal</td><td></td></tr>`;
    }

    const mulokKeys = ['MULOK1', 'MULOK2', 'MULOK3'];
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const mulokNames = database.nilai?._mulokNames?.[schoolKodeBiasa] || {};

    // 3. Selalu loop sebanyak 3 kali untuk semua slot Mulok
    mulokKeys.forEach((key, index) => {
        const hasCustomName = mulokNames[key] && mulokNames[key].trim() !== '';
        // Jika nama tidak ada, tampilkan '-', persis seperti permintaan Anda
        const displayName = hasCustomName ? mulokNames[key] : '-';
        
        let gradeDisplay = '';
        
        // Hanya hitung nilai jika Mulok tersebut punya nama custom
        if (hasCustomName) {
            if (semesterId) {
                const nilaiSemester = nilaiData[semesterId]?.[key];
                gradeDisplay = (window.currentUser.kurikulum === 'K13' ? nilaiSemester?.RT : nilaiSemester?.NILAI) || '';
            } else {
                const finalGrade = calculateAverageForSubject(nisn, key);
                gradeDisplay = finalGrade !== null ? finalGrade.toFixed(2) : '';
                if (finalGrade !== null) {
                    totalRataRata += finalGrade;
                    countRataRata++;
                }
            }
        }
        
        // Buat baris tabel untuk Mulok.
        if (docType === 'skl' || docType === 'transkrip') {
            tableRows += `
                <tr style="border: 1px solid black;">
                    <td style="border: 1px solid black; padding: 8px;"></td>
                    <td style="border: 1px solid black; padding: 8px;"> &nbsp; &nbsp; ${alphabet[index]}. ${displayName}</td>
                    <td style="border: 1px solid black; padding: 8px; text-align: center;">${gradeDisplay}</td>
                </tr>
            `;
        } else {
            tableRows += `
                <tr>
                    <td></td>
                    <td> &nbsp; &nbsp; ${alphabet[index]}. ${displayName}</td>
                    <td style="text-align: center;">${gradeDisplay}</td>
                </tr>
            `;
        }
    });

    // Menghitung dan menambahkan baris Rata-rata (hanya jika dokumennya adalah SKL)
    if (docType === 'skl' && !semesterId) {
        const finalAverage = countRataRata > 0 ? (totalRataRata / countRataRata).toFixed(2) : '-';
        tableRows += `
            <tr style="border: 1px solid black;">
                <td colspan="2" style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">Rata - Rata</td>
                <td style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">${finalAverage}</td>
            </tr>
        `;
    }

    return { tableRows };
}


function openTranskripModal(nisn) {
  if (!checkNilaiLengkap(nisn)) return;
  const content = createTranskripHTML(nisn);
  document.getElementById('transkripContent').innerHTML = content;
  updateLogoPreviewUI(); // <-- tambahkan baris ini
  transkripModal.style.display = 'flex';
}
        
function openSklModal(nisn) {
  if (!checkNilaiLengkap(nisn)) return;
  const content = createSklHTML(nisn);
  document.getElementById('sklContent').innerHTML = content;
  setTimeout(() => updateLogoPreviewUI(), 100); // Small delay for DOM update
  sklModal.style.display = 'flex';
}
        
function openSkkbModal(nisn) {
  const content = createSkkbHTML(nisn);
  document.getElementById('skkbContent').innerHTML = content;
  setTimeout(() => updateLogoPreviewUI(), 100); // Small delay for DOM update
  skkbModal.style.display = 'flex';
}

        async function downloadTranskripPDF(nisn) {
            if (!checkNilaiLengkap(nisn, false)) {
                showNotification('Data nilai belum lengkap. PDF akan di-generate dengan data yang tersedia.', 'warning');
            }
            const content = createTranskripHTML(nisn);
            await downloadAsPDF(content, nisn, 'Transkrip');
        }
        
        async function downloadSklPDF(nisn) {
            if (!checkNilaiLengkap(nisn, false)) {
                showNotification('Data nilai belum lengkap. PDF akan di-generate dengan data yang tersedia.', 'warning');
            }
            const content = createSklHTML(nisn);
            await downloadAsPDF(content, nisn, 'SKL');
        }
        
        async function downloadSkkbPDF(nisn) {
            const content = createSkkbHTML(nisn);
            await downloadAsPDF(content, nisn, 'SKKB');
        }
        
async function downloadAsPDF(content, nisn, docType) {
  const { jsPDF } = window.jspdf;
  const pdfContainer = document.getElementById('pdf-content');
  const siswa = database.siswa.find(s => s[6] === nisn);
  const sekolah = window.currentUser.schoolData;

  if (!siswa || !sekolah) {
    showNotification('Data siswa atau sekolah tidak ditemukan.', 'error');
    return;
  }

  // Render ke #pdf-content dengan page box yang ukurannya SAMA seperti preview
  pdfContainer.innerHTML = content;

  // Update logo preview after content is rendered
  setTimeout(() => updateLogoPreviewUI(), 100);

  showLoader();
  showNotification(`Membuat PDF ${docType}.`, 'success');

  try {
    // Pastikan semua gambar (logo/pasfoto) selesai dimuat
    await waitForImages(pdfContainer);

    // Render ke canvas (resolusi cukup tinggi)
    const canvas = await html2canvas(pdfContainer, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      imageTimeout: 15000
    });
    const imgData = canvas.toDataURL('image/png');

    // Buat PDF dengan ukuran fisik yang sama dengan CSS
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 330] });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const namaSekolah = (sekolah[5] || 'sekolah').replace(/ /g, '_');
    const namaSiswa = (siswa[8] || 'siswa').replace(/ /g, '_');
    const fileName = `${docType}_${namaSekolah}_${namaSiswa}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error creating PDF:", error);
    showNotification("Gagal membuat file PDF.", 'error');
  } finally {
    pdfContainer.innerHTML = '';
    hideLoader();
  }
}




// ===== REPLACE: renderSettingsPage (lengkap & idempotent) =====
function renderSettingsPage() {
  if (!window.currentUser?.schoolData) return;

  const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
  const settings = database?.settings?.[schoolKodeBiasa] || {};
  const mulokNames = database?.nilai?._mulokNames?.[schoolKodeBiasa] || {};

  // Helper kecil
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
  const setRange = (inputId, labelId, v) => {
    const inEl = document.getElementById(inputId);
    const lab  = document.getElementById(labelId);
    if (inEl) inEl.value = (v ?? inEl.value ?? '');
    if (lab)  lab.textContent = String(inEl ? inEl.value : (v ?? ''));
  };

  // ---- Prefill: Informasi Dokumen
  setVal('settingPrincipalName',   settings.principalName);
  setVal('settingPrincipalNip',    settings.principalNip);
  setVal('settingSchoolAddress',   settings.schoolAddress);
  setVal('settingPrintDate',       settings.printDate);
  setVal('settingTranscriptNumber',settings.transcriptNumber);
  setVal('settingSkkbNumber',      settings.skkbNumber);

  // ---- Prefill: Nama MULOK (tetap ada walau refresh)
  setVal('settingMulok1Name', mulokNames.MULOK1);
  setVal('settingMulok2Name', mulokNames.MULOK2);
  setVal('settingMulok3Name', mulokNames.MULOK3);

  // ---- Prefill: Logo preview (kiri & kanan)
  const leftPrev  = document.getElementById('logoLeftPreview');   // ada di E-ijazah.html
  const rightPrev = document.getElementById('logoRightPreview');  // ada di E-ijazah.html
  if (leftPrev && settings.logoLeft)   leftPrev.src  = settings.logoLeft;   // simpanan base64
  if (rightPrev && settings.logoRight) rightPrev.src = settings.logoRight;  // simpanan base64
  // Catatan: jika belum ada logo tersimpan, biarkan src placeholder default dari HTML.

  // ---- Prefill: Ukuran & Posisi logo + layout pas foto SKL (dengan default 80px)
  setRange('settingLogoLeftSize',   'logoLeftSizeLabel',   settings.logoLeftSize || 80);
  setRange('settingLogoRightSize',  'logoRightSizeLabel',  settings.logoRightSize || 80);

  // Auto-save default values if not set yet (ukuran dan posisi)
  const needsDefaultSave = !settings.logoLeftSize || !settings.logoRightSize ||
                           !settings.logoLeftPosTop || !settings.logoLeftPosLeft ||
                           !settings.logoRightPosTop || !settings.logoRightPosRight;

  if (needsDefaultSave) {
    setTimeout(() => {
      const form = document.getElementById('settingsForm');
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 100);
  }
  setRange('settingSklPhotoLayout', 'sklPhotoLayoutLabel', settings.sklPhotoLayout);

  setRange('settingLogoLeftPosTop',  'logoLeftPosTopLabel',   settings.logoLeftPosTop || 13);
  setRange('settingLogoLeftPosLeft', 'logoLeftPosLeftLabel',  settings.logoLeftPosLeft || 15);
  setRange('settingLogoRightPosTop', 'logoRightPosTopLabel',  settings.logoRightPosTop || 13);
  setRange('settingLogoRightPosRight','logoRightPosRightLabel',settings.logoRightPosRight || 15);

  // ---- Prefill: Manajemen Mapel (centang sesuai visibility)
  const subjectContainer = document.getElementById('subjectSelectionContainer');
  if (subjectContainer) {
    subjectContainer.innerHTML = '';
    const kur = window.currentUser.kurikulum || 'Merdeka';
    const list = (transcriptSubjects?.[kur]) || [];
    const vis = settings.subjectVisibility || {};
    
    
    list.forEach(s => {
      const checked = Object.prototype.hasOwnProperty.call(vis, s.key) ? !!vis[s.key] : true; // default tampil
      subjectContainer.insertAdjacentHTML('beforeend', `
        <div class="subject-checkbox">
          <input type="checkbox" id="check-${s.key}" data-subject-key="${s.key}" ${checked ? 'checked' : ''}>
          <label for="check-${s.key}">${s.display}</label>
        </div>
      `);
    });
    
  } else {
    console.error('subjectSelectionContainer not found!');
  }

  // Optional: init tab sekali saja
  const tabNav = document.querySelector('.tab-nav');
  if (tabNav && !tabNav.dataset.inited) {
    if (typeof setupSettingTabs === 'function') setupSettingTabs(); // fungsi sudah ada
    tabNav.dataset.inited = '1';
  }

  // --- sinkron label nilai awal (panggil di akhir renderSettingsPage) ---
const mapRangeToLabel = [
  ['settingLogoLeftSize',      'logoLeftSizeLabel'],
  ['settingLogoRightSize',     'logoRightSizeLabel'],
  ['settingSklPhotoLayout',    'sklPhotoLayoutLabel'],
  ['settingLogoLeftPosTop',    'logoLeftPosTopLabel'],
  ['settingLogoLeftPosLeft',   'logoLeftPosLeftLabel'],
  ['settingLogoRightPosTop',   'logoRightPosTopLabel'],
  ['settingLogoRightPosRight', 'logoRightPosRightLabel'],
];

mapRangeToLabel.forEach(([rangeId, labelId]) => {
  const r = document.getElementById(rangeId);
  const l = document.getElementById(labelId);
  if (r && l) l.textContent = r.value;
});

  // --- Bind live logo preview setelah semua element di-render ---
  bindLiveLogoOnce();
  
  // --- Update live preview untuk menampilkan logo yang sudah tersimpan ---
  updateLogoPreviewUI();

  // --- Update live preview dengan default values ---
  if (typeof updateLivePreviewLogo === 'function') {
    updateLivePreviewLogo();
  }

}


async function saveSettings(event) {
    try {
        if (!window.currentUser.schoolData) return;
        const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
        showLoader();

        // 1. Kumpulkan semua data dari form
        const settingsData = {
            principalName: document.getElementById('settingPrincipalName').value,
            principalNip: document.getElementById('settingPrincipalNip').value,
            schoolAddress: document.getElementById('settingSchoolAddress').value,
            printDate: document.getElementById('settingPrintDate').value,
            transcriptNumber: document.getElementById('settingTranscriptNumber').value,
            skkbNumber: document.getElementById('settingSkkbNumber').value,
            logoLeftSize: document.getElementById('settingLogoLeftSize').value,
            logoRightSize: document.getElementById('settingLogoRightSize').value,
            sklPhotoLayout: document.getElementById('settingSklPhotoLayout').value,
            logoLeftPosTop: document.getElementById('settingLogoLeftPosTop').value,
            logoLeftPosLeft: document.getElementById('settingLogoLeftPosLeft').value,
            logoRightPosTop: document.getElementById('settingLogoRightPosTop').value,
            logoRightPosRight: document.getElementById('settingLogoRightPosRight').value,
            subjectVisibility: {}
        };
        document.querySelectorAll('#subjectSelectionContainer input[type="checkbox"]').forEach(checkbox => {
            settingsData.subjectVisibility[checkbox.dataset.subjectKey] = checkbox.checked;
        });

        const mulokNamesData = {
            MULOK1: document.getElementById('settingMulok1Name').value,
            MULOK2: document.getElementById('settingMulok2Name').value,
            MULOK3: document.getElementById('settingMulok3Name').value
        };

        // 2. Kirim data ke server menggunakan fetchWithAuth
        const result = await fetchWithAuth(apiUrl('/api/data/settings/save'), {
            method: 'POST',
            body: JSON.stringify({
                schoolCode: schoolKodeBiasa,
                settingsData: settingsData,
                mulokNamesData: mulokNamesData
            })
        });

        if (result.success) {
            // 3. Update data lokal di browser setelah berhasil disimpan di server
            database.settings[schoolKodeBiasa] = { ...database.settings[schoolKodeBiasa], ...settingsData };
            if (!database.nilai._mulokNames) database.nilai._mulokNames = {};
            database.nilai._mulokNames[schoolKodeBiasa] = mulokNamesData;

            // Update logo preview UI with new settings
            updateLogoPreviewUI();

            showNotification(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification(error.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
        hideLoader();
    }
}


async function handleSklPhotoUpload(event, nisn) {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Hanya file gambar yang diizinkan! (JPG, PNG, GIF)', 'error');
        event.target.value = ''; // Reset input
        return;
    }

    // Validasi file size (maksimal 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
        showNotification(`Ukuran file terlalu besar! Maksimal 2MB. (File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB)`, 'error');
        event.target.value = ''; // Reset input
        return;
    }

    // Show upload start notification
    showNotification(`Mengunggah foto untuk siswa NISN: ${nisn}...`, 'info', 2000);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const photoData = e.target.result;
        try {
            showLoader();
            const result = await fetchWithAuth(apiUrl('/api/data/skl-photo/save'), {
                method: 'POST',
                body: JSON.stringify({ nisn: nisn, photoData: photoData })
            });

            if (result.success) {
                if (!database.sklPhotos) database.sklPhotos = {};
                database.sklPhotos[nisn] = photoData; // Update data lokal
                showNotification(`✅ Foto berhasil diunggah untuk siswa NISN: ${nisn}`, 'success');
                // === PERBAIKAN UTAMA DI SINI ===
                rerenderActiveTable('sekolahSiswa'); // Render ulang tabel profil siswa
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showNotification(`❌ Gagal mengunggah foto: ${error.message || 'Terjadi kesalahan server'}`, 'error');
        } finally {
            hideLoader();
            event.target.value = ''; // Reset input untuk upload berikutnya
        }
    };

    reader.onerror = () => {
        showNotification('❌ Gagal membaca file gambar', 'error');
        event.target.value = '';
    };

    reader.readAsDataURL(file);
}

// GANTI SELURUH FUNGSI INI JUGA
async function deleteSklPhoto(nisn) {
    // VALIDASI KONFIRMASI DIHAPUS - Langsung hapus tanpa konfirmasi
    try {
        showLoader();
        const result = await fetchWithAuth(apiUrl('/api/data/skl-photo/delete'), {
            method: 'POST',
            body: JSON.stringify({ nisn: nisn })
        });

            if (result.success) {
                if (database.sklPhotos?.[nisn]) delete database.sklPhotos[nisn]; // Update data lokal
                showNotification('Foto berhasil dihapus.', 'success');
                // === PERBAIKAN UTAMA DI SINI ===
                rerenderActiveTable('sekolahSiswa'); // Render ulang tabel profil siswa
            } else {
                throw new Error(result.message);
            }
    } catch (error) {
        showNotification(error.message || 'Gagal menghapus foto dari server.', 'error');
    } finally {
        hideLoader();
    }
}
        

// GANTI SELURUH FUNGSI INI
async function handleLogoUpload(event, logoKey, previewId) {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.currentUser?.schoolData) {
        showNotification('❌ Anda harus login sebagai sekolah untuk mengunggah logo', 'error');
        event.target.value = '';
        return;
    }

    // Check if user is PRO
    const schoolKodeBiasa = window.currentUser.schoolData[0];
    const isProUser = window.currentUser.loginType === 'pro' ||
                     (schoolKodeBiasa && localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true');

    if (!isProUser) {
        showNotification('⚡ Fitur kustomisasi logo hanya tersedia untuk user PRO. Silakan upgrade ke PRO terlebih dahulu.', 'warning');
        event.target.value = '';
        return;
    }

    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('❌ Hanya file gambar yang diizinkan! (JPG, PNG, GIF)', 'error');
        event.target.value = '';
        return;
    }

    // Validasi file size (maksimal 1MB untuk logo)
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    if (file.size > maxSize) {
        showNotification(`❌ Ukuran file terlalu besar! Maksimal 1MB untuk logo. (File Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB)`, 'error');
        event.target.value = '';
        return;
    }

    // Show upload start notification
    const logoName = logoKey === 'logoLeft' ? 'Logo Kiri (Kabupaten)' : 'Logo Kanan (Tut Wuri)';
    showNotification(`📤 Mengunggah ${logoName}...`, 'info', 2000);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            showLoader();
            const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
            const logoData = e.target.result;

            // Update preview immediately for better UX
            document.getElementById(previewId).src = logoData;

            const partialSettingsData = {};
            partialSettingsData[logoKey] = logoData;

            const result = await fetchWithAuth(apiUrl('/api/data/settings/save'), {
                method: 'POST',
                body: JSON.stringify({
                    schoolCode: schoolKodeBiasa,
                    settingsData: partialSettingsData
                })
            });

            if (result.success) {
                if (!database.settings[schoolKodeBiasa]) database.settings[schoolKodeBiasa] = {};
                database.settings[schoolKodeBiasa][logoKey] = logoData;

                // Update live preview setelah upload logo
                updateLogoPreviewUI();

                showNotification(`✅ ${logoName} berhasil diunggah dan disimpan!`, 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showNotification(`❌ Gagal mengunggah ${logoName}: ${error.message || 'Terjadi kesalahan server'}`, 'error');
            // Restore old logo on error
            const oldLogo = (database.settings[window.currentUser.schoolData[0]] && database.settings[window.currentUser.schoolData[0]][logoKey]);
            document.getElementById(previewId).src = oldLogo || 'https://placehold.co/80x80/f0f0f0/ccc?text=Logo';
        } finally {
            hideLoader();
            event.target.value = ''; // Reset input untuk upload berikutnya
        }
    };

    reader.onerror = () => {
        showNotification(`❌ Gagal membaca file ${logoName}`, 'error');
        event.target.value = '';
    };

    reader.readAsDataURL(file);
}


async function deleteAllGradesForSemester() {
    const { currentSemester, currentSemesterName } = paginationState.isiNilai;
    if (!currentSemester) {
        showNotification("Pilih semester terlebih dahulu.", 'warning');
        return;
    }

    // VALIDASI KONFIRMASI DIHAPUS - Langsung hapus tanpa konfirmasi
    try {
        showLoader();
        const schoolCode = String(window.currentUser.schoolData[0]);

        // Langsung gunakan hasil dari fetchWithAuth sebagai 'result'
        const result = await fetchWithAuth(apiUrl('/api/data/grades/delete-by-semester'), {
            method: 'POST',
            body: JSON.stringify({ schoolCode: schoolCode, semesterId: currentSemester })
        });

        if (result.success) {
            // Panggil nama fungsi yang benar
            await fetchDataFromServer();

            // Render ulang halaman "Isi Nilai"
            renderIsiNilaiPage(currentSemester, currentSemesterName);
            showNotification(result.message, 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification(error.message || 'Gagal menghapus data nilai.', 'error');
    } finally {
        hideLoader();
    }
}
        
        function renderCetakGabunganPage() {
            const proMessage = document.getElementById('cetakGabunganProMessage');
            const tableContainer = document.getElementById('cetakGabunganTableContainer');
            const paginationControls = document.querySelector('.pagination-controls[data-table-id="cetakGabungan"]');
            const searchBar = document.getElementById('searchCetakGabungan');

            if (window.currentUser.loginType !== 'pro') {
                proMessage.style.display = 'block';
                tableContainer.style.display = 'none';
                paginationControls.style.display = 'none';
                searchBar.style.display = 'none';
                return;
            }
            
            proMessage.style.display = 'none';
            tableContainer.style.display = 'block';
            paginationControls.style.display = 'flex';
            searchBar.style.display = 'block';
            
            renderGenericSiswaTable('cetakGabungan', '', 'downloadGabunganPDF');
        }
        
// === REPLACE SELURUH downloadGabunganPDF ===
async function downloadGabunganPDF(nisn) {
  if (!checkNilaiLengkap(nisn)) return;
  const { jsPDF } = window.jspdf;
  const pdfContainer = document.getElementById('pdf-content');
  const siswa = database.siswa.find(s => s[6] === nisn);
  const sekolah = window.currentUser.schoolData;

  if (!siswa || !sekolah) {
    showNotification('Data siswa atau sekolah tidak ditemukan.', 'error');
    return;
  }

  showLoader();
  showNotification('Membuat PDF Gabungan.', 'success');

  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 330] });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const documents = [
      { type: 'Transkrip', html: createTranskripHTML(nisn) },
      { type: 'SKL',       html: createSklHTML(nisn)       },
      { type: 'SKKB',      html: createSkkbHTML(nisn)      }
    ];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      pdfContainer.innerHTML = doc.html;

      // Update logo preview after content is rendered
      setTimeout(() => updateLogoPreviewUI(), 100);

      // Pastikan semua gambar siap
      await waitForImages(pdfContainer);

      const canvas = await html2canvas(pdfContainer, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        imageTimeout: 15000
      });
      const imgData = canvas.toDataURL('image/png');

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    const namaSekolah = (sekolah[5] || 'sekolah').replace(/ /g, '_');
    const namaSiswa = (siswa[7] || 'siswa').replace(/ /g, '_');
    const fileName = `Laporan_Gabungan_${namaSekolah}_${namaSiswa}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error creating combined PDF:", error);
    showNotification("Gagal membuat file PDF gabungan.", 'error');
  } finally {
    pdfContainer.innerHTML = '';
    hideLoader();
  }
}



async function handleBackup() {
    if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) return;

    // Show progress modal
    showBackupProgress();
    
    try {
        updateBackupProgress(10, 'Mempersiapkan data...');
        
        const schoolCode = String(window.currentUser.schoolData[0]);
        const schoolName = (window.currentUser.schoolData[5] || 'sekolah').replace(/ /g, '_');

        updateBackupProgress(20, 'Mengumpulkan data sekolah...');

        // Kita gunakan data `database` yang ada di frontend karena sudah paling update
        const backupData = {
            appVersion: '2.6-server',
            backupDate: new Date().toISOString(),
            schoolCode: schoolCode,
            schoolName: window.currentUser.schoolData[4],
            siswa: database.siswa.filter(s => String(s[0]) === schoolCode),
            nilai: {},
            settings: database.settings[schoolCode] || {},
            sklPhotos: {},
            mulokNames: database.nilai._mulokNames ? (database.nilai._mulokNames[schoolCode] || {}) : {}
        };

        updateBackupProgress(40, 'Mengumpulkan data siswa...');

        const schoolNisns = new Set(backupData.siswa.map(s => s[7]));
        let processedCount = 0;
        const totalStudents = schoolNisns.size;

        updateBackupProgress(50, 'Mengumpulkan data nilai dan foto...');

        // Process data with async progress updates
        for (const nisn of schoolNisns) {
            if (database.nilai[nisn]) backupData.nilai[nisn] = database.nilai[nisn];
            if (database.sklPhotos[nisn]) backupData.sklPhotos[nisn] = database.sklPhotos[nisn];
            
            processedCount++;
            if (processedCount % 50 === 0 || processedCount === totalStudents) {
                const progress = 50 + Math.floor((processedCount / totalStudents) * 30);
                updateBackupProgress(progress, `Memproses data siswa ${processedCount}/${totalStudents}...`);
                // Allow UI to update
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }

        updateBackupProgress(85, 'Membuat file backup...');

        // Validasi data sebelum export
        if (backupData.siswa.length === 0) {
            throw new Error('Tidak ada data siswa untuk di-backup.');
        }

        // Add some delay for progress visibility
        await new Promise(resolve => setTimeout(resolve, 100));


        let jsonString;
        try {
            jsonString = JSON.stringify(backupData, null, 2);
        } catch (stringifyError) {
            console.error('JSON stringify error:', stringifyError);
            throw new Error('Gagal mengkonversi data ke JSON. Data mungkin terlalu besar atau memiliki referensi circular.');
        }

        let blob;
        try {
            blob = new Blob([jsonString], { type: 'application/json' });
        } catch (blobError) {
            console.error('Blob creation error:', blobError);
            throw new Error('Gagal membuat file backup. Ukuran data mungkin terlalu besar.');
        }
        
        updateBackupProgress(95, 'Menyiapkan unduhan...');
        
        const date = new Date().toISOString().slice(0, 10);
        const time = new Date().toTimeString().slice(0, 5).replace(':', '-');
        const filename = `backup_${schoolName}_${date}_${time}.json`;
        
        try {
            
            // Modern browser support check
            if (window.URL && window.URL.createObjectURL) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Fallback for older browsers
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    // IE/Edge support
                    window.navigator.msSaveOrOpenBlob(blob, filename);
                } else {
                    // Last resort - open data URL (might not work for large files)
                    const reader = new FileReader();
                    reader.onload = function() {
                        const a = document.createElement('a');
                        a.href = reader.result;
                        a.download = filename;
                        a.click();
                    };
                    reader.readAsDataURL(blob);
                }
            }
        } catch (downloadError) {
            console.error('Download error:', downloadError);
            throw new Error('Gagal mengunduh file backup. Browser Anda mungkin tidak mendukung download otomatis.');
        }

        updateBackupProgress(100, 'Backup selesai!');

        setTimeout(() => {
            hideBackupProgress();
            showNotification(`Backup berhasil! File: backup_${schoolName}_${date}_${time}.json`, 'success');
        }, 1000);
        
    } catch (error) {
        console.error("Backup failed:", error);
        hideBackupProgress();
        showNotification(error.message || 'Terjadi kesalahan saat membuat backup.', 'error');
    }
}

// Progress Modal Functions
function showBackupProgress() {
    const modal = document.createElement('div');
    modal.id = 'backupProgressModal';
    modal.className = 'progress-modal';
    modal.innerHTML = `
        <div class="progress-modal-content">
            <h3>Membuat Backup Data</h3>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="backupProgressFill"></div>
                </div>
                <div class="progress-text" id="backupProgressText">0%</div>
            </div>
            <div class="progress-status" id="backupProgressStatus">Memulai backup...</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateBackupProgress(percentage, status) {
    const fill = document.getElementById('backupProgressFill');
    const text = document.getElementById('backupProgressText');
    const statusEl = document.getElementById('backupProgressStatus');
    
    if (fill) fill.style.width = percentage + '%';
    if (text) text.textContent = percentage + '%';
    if (statusEl) statusEl.textContent = status;
}


function showRestoreProgress() {
    const modal = document.createElement('div');
    modal.id = 'restoreProgressModal';
    modal.className = 'progress-modal';
    modal.innerHTML = `
        <div class="progress-modal-content">
            <h3>Memulihkan Data Backup</h3>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="restoreProgressFill"></div>
                </div>
                <div class="progress-text" id="restoreProgressText">0%</div>
            </div>
            <div class="progress-status" id="restoreProgressStatus">Memulai restore...</div>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateRestoreProgress(percentage, status) {
    const fill = document.getElementById('restoreProgressFill');
    const text = document.getElementById('restoreProgressText');
    const statusEl = document.getElementById('restoreProgressStatus');
    
    if (fill) fill.style.width = percentage + '%';
    if (text) text.textContent = percentage + '%';
    if (statusEl) statusEl.textContent = status;
}


// Enhanced Restore Function
async function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Prevent multiple simultaneous restore operations
    if (document.getElementById('restoreProgressModal')) {
        return;
    }

    // Show progress modal
    showRestoreProgress();

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            updateRestoreProgress(10, 'Membaca file backup...');

            const backupData = JSON.parse(e.target.result);

            updateRestoreProgress(20, 'Memvalidasi file backup...');

            // Enhanced validation
            const validationResult = validateBackupData(backupData);
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            updateRestoreProgress(30, 'File backup valid, mengirim ke server...');

            // Show backup info before restore
            const confirmMessage = `
File Backup Info:
- Sekolah: ${backupData.schoolName || 'Tidak diketahui'}
- Tanggal: ${new Date(backupData.backupDate).toLocaleDateString('id-ID')}
- Jumlah Siswa: ${backupData.siswa?.length || 0}
- App Version: ${backupData.appVersion || 'Tidak diketahui'}

Apakah Anda yakin ingin melakukan restore? Data saat ini akan diganti!
            `;

            updateRestoreProgress(40, 'Menunggu konfirmasi...');

            if (!confirm(confirmMessage.trim())) {
                hideRestoreProgress();
                event.target.value = '';
                return;
            }

            updateRestoreProgress(50, 'Mengirim data ke server...');

            // Check server connection first
            let result;
            try {
                result = await fetchWithAuth('/api/data/restore', {
                    method: 'POST',
                    body: JSON.stringify(backupData)
                });
            } catch (fetchError) {
                console.error('Network error:', fetchError);
                
                // Try fallback URL or provide better error message
                if (fetchError.message.includes('Failed to fetch')) {
                    throw new Error('Tidak dapat terhubung ke server. Pastikan server sedang berjalan dan Anda terhubung ke internet.');
                } else {
                    throw new Error(`Gagal mengirim data ke server: ${fetchError.message}`);
                }
            }

            updateRestoreProgress(80, 'Memproses di server...');

            if (result && result.success) {
                updateRestoreProgress(100, 'Restore berhasil!');
                
                // Wait for database to finish committing, then reload data
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                updateRestoreProgress(100, 'Memuat ulang data...');
                
                // Try to reload data with retry mechanism
                let dataLoaded = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    await fetchDataFromServer();
                    
                    const nilaiCount = Object.keys(database.nilai || {}).filter(k => k !== '_mulokNames').length;
                    
                    if (nilaiCount > 0) {
                        dataLoaded = true;
                        break;
                    }
                    
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                    }
                }
                
                setTimeout(() => {
                    hideRestoreProgress();
                    if (dataLoaded) {
                        showNotification('Data berhasil direstore! Halaman akan dimuat ulang untuk menerapkan perubahan.', 'success');
                    } else {
                        showNotification('Data berhasil direstore, namun mungkin perlu refresh manual untuk menampilkan semua data.', 'warning');
                    }
                    
                    // Muat ulang halaman setelah 2 detik
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }, 500);
            } else {
                throw new Error(result?.message || 'Server mengembalikan response yang tidak valid');
            }
        } catch (err) {
            console.error("Restore failed:", err);
            hideRestoreProgress();
            showNotification(err.message || 'Gagal memproses file backup!', 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Backup Data Validation Function
function validateBackupData(backupData) {
    if (!backupData) {
        return { isValid: false, message: 'File backup kosong atau tidak valid.' };
    }

    if (!backupData.schoolCode) {
        return { isValid: false, message: 'File backup tidak berisi kode sekolah.' };
    }

    if (!backupData.appVersion) {
        return { isValid: false, message: 'File backup tidak memiliki informasi versi aplikasi.' };
    }

    if (!backupData.backupDate) {
        return { isValid: false, message: 'File backup tidak memiliki tanggal backup.' };
    }

    // Validate required fields
    const requiredFields = ['siswa', 'nilai', 'settings'];
    for (const field of requiredFields) {
        if (backupData[field] === undefined) {
            return { isValid: false, message: `Field '${field}' tidak ditemukan dalam backup.` };
        }
    }

    // Validate data types
    if (!Array.isArray(backupData.siswa)) {
        return { isValid: false, message: 'Data siswa harus berupa array.' };
    }

    if (typeof backupData.nilai !== 'object') {
        return { isValid: false, message: 'Data nilai harus berupa object.' };
    }

    if (typeof backupData.settings !== 'object') {
        return { isValid: false, message: 'Data settings harus berupa object.' };
    }

    // Check if backup is too old
    const backupDate = new Date(backupData.backupDate);
    const now = new Date();
    const daysDiff = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 365) {
        return { 
            isValid: false, 
            message: `Backup terlalu lama (${daysDiff} hari). Gunakan backup yang lebih baru.` 
        };
    }

    return { isValid: true, message: 'File backup valid.' };
}



document.addEventListener('DOMContentLoaded', () => {
    const savedSession = localStorage.getItem('currentUserSession');
    if (savedSession) {
        window.currentUser = JSON.parse(savedSession);

        // Restore token dari localStorage jika tidak ada dalam session
        if (!window.currentUser.token) {
            window.currentUser.token = localStorage.getItem('jwtToken');
        }
        // Update session with restored token
        if (window.currentUser.token) {
            localStorage.setItem('currentUserSession', JSON.stringify(window.currentUser));
        }

        // Migrasi flag PRO legacy bila masih ada (tanpa mengubah loginType)
        if (window.currentUser?.schoolData?.[0]) {
            migrateLegacyProFlag(window.currentUser.schoolData[0], window.currentUser.schoolData?.[1]);
        } else {
            migrateLegacyProFlag(null, null);
        }
        // Jika sekolah ini sudah diaktivasi PRO dan kode cocok, terapkan PRO pada sesi (UI)
        if (window.currentUser?.role === 'sekolah') {
          const kb = window.currentUser.schoolData?.[0];
          const kp = window.currentUser.schoolData?.[1];
          const act = kb && kp && localStorage.getItem(`kodeProActivated:${kb}`) === 'true';
          const stored = kb && localStorage.getItem(`kodeProValue:${kb}`);
          const eq = (val1, val2) => (val1||'').toString().trim().toUpperCase() === (val2||'').toString().trim().toUpperCase();
          if (act && stored && eq(stored, kp)) {
            window.currentUser.loginType = 'pro';
            localStorage.setItem('currentUserSession', JSON.stringify(window.currentUser));
          }
        }
        if (window.currentUser.isLoggedIn && window.currentUser.token) {
            fetchDataFromServer(true).then(() => {
                showDashboard(window.currentUser.role);
            }).catch((error) => {

                // Clear invalid session
                localStorage.removeItem('currentUserSession');
                localStorage.removeItem('jwtToken');
                window.currentUser = null;
                // Stay on login page
            });
        }
    }


        // Mengaktifkan sistem tab di menu Setting
    setupSettingTabs();

    // Sanitasi glyph/ikon korup agar tampilan bersih tanpa ubah struktur
    try {
      const brandLogo = document.querySelector('.brand-logo');
      if (brandLogo) brandLogo.textContent = 'EI';

      document.querySelectorAll('.brand-points li').forEach(li => {
        li.textContent = (li.textContent || '').replace(/^[^A-Za-z0-9]+\s*/, '');
      });

      const inputIcon = document.querySelector('.input-icon');
      if (inputIcon) inputIcon.textContent = '🔑';

      const tsIcon = document.querySelector('.stat-card-small.total-siswa .icon');
      if (tsIcon) tsIcon.textContent = '👥';
      const kkIcon = document.querySelector('.stat-card-small.kurikulum-info .icon');
      if (kkIcon) kkIcon.textContent = '📘';

      const successIcon = document.querySelector('#aktivasiSuccess .success-icon');
      if (successIcon) successIcon.textContent = '✓';

      const kodeProInput = document.getElementById('kodeProInput');
      if (kodeProInput) kodeProInput.placeholder = 'Masukkan Kode Pro (8 digit)';
    } catch (_) {}


const btnTambah = document.getElementById('btnTambahSekolah');
    if (btnTambah) {
        btnTambah.addEventListener('click', () => {
            // Memanggil fungsi untuk membuka modal dengan mode 'add'
            openSekolahModal('add');
        });
    }

    // Menggunakan Event Delegation untuk tombol Edit dan Hapus yang dinamis
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard) {
        adminDashboard.addEventListener('click', (event) => {
            // Cek apakah yang diklik adalah tombol Edit Sekolah
            if (event.target.matches('.btn-edit-sekolah')) {
                const kodeBiasa = event.target.dataset.kode;
                const rowData = database.sekolah.find(s => s[0] === kodeBiasa);
                if (rowData) {
                    openSekolahModal('edit', rowData);
                }
            }

            // Cek apakah yang diklik adalah tombol Hapus Sekolah
            if (event.target.matches('.btn-delete-sekolah')) {
                const kodeBiasa = event.target.dataset.kode;
                handleDeleteSekolah(kodeBiasa);
            }

            // Cek apakah yang diklik adalah tombol Edit Siswa
            if (event.target.matches('.btn-edit-siswa')) {
                const nisn = event.target.dataset.nisn;
                const rowData = database.siswa.find(s => s[6] === nisn);
                if (rowData) {
                    openSiswaAdminModal('edit', rowData);
                }
            }

            // Cek apakah yang diklik adalah tombol Hapus Siswa
            if (event.target.matches('.btn-delete-siswa')) {
                const nisn = event.target.dataset.nisn;
                const nama = event.target.dataset.nama;
                handleDeleteSiswa(nisn, nama);
            }
        });
    }

    // Menghubungkan event 'submit' pada form di dalam modal
    const sekolahForm = document.getElementById('sekolahForm');
    if (sekolahForm) {
        sekolahForm.addEventListener('submit', (event) => {
            handleSekolahFormSubmit(event);
        });
    }

    // Menghubungkan tombol 'X' di modal agar bisa menutup pop-up
    const closeBtn = document.getElementById('closeSekolahModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeSekolahModal();
        });
    }

    // Tambahan: Menutup modal saat mengklik area luar (overlay)
    const sekolahModal = document.getElementById('sekolahModal');
    if (sekolahModal) {
        sekolahModal.addEventListener('click', (event) => {
            // Cek jika yang diklik adalah area overlay itu sendiri, bukan konten di dalamnya
            if (event.target === sekolahModal) {
                closeSekolahModal();
            }
        });
    }
    // --- Dari sini ke bawah adalah semua event listener yang benar ---
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('cancelBtn').addEventListener('click', () => { appCodeInput.value = ''; });

    // Note: Logout buttons removed - now handled by user profile dropdown

    document.querySelectorAll('#adminDashboard .sidebar-menu .menu-item').forEach(item => {
        item.addEventListener('click', (event) => {
            // Check if this is an external link (has href but no data-target)
            if (item.getAttribute('href') && item.getAttribute('href') !== '#' && !item.dataset.target) {
                // Allow default behavior for external links
                return;
            }

            event.preventDefault();

            // Only call switchContent for items with data-target
            if (item.dataset.target) {
                switchContent(item.dataset.target);
            }
        });
    });

    document.querySelectorAll('#sekolahDashboard .sidebar-menu .menu-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            if (item.classList.contains('has-submenu')) {
                item.classList.toggle('open');
                const submenu = document.getElementById(item.dataset.target);
                if (submenu) submenu.classList.toggle('open');
            } else {
                switchSekolahContent(item.dataset.target);
            }
        });
    });
    
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();

            // Remove active class from all menu items and submenu items
            document.querySelectorAll('.menu-item, .submenu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });

            // Add active class to clicked submenu item
            item.classList.add('active');

            // Keep parent menu open and active
            const parentLi = item.closest('ul.submenu').closest('li');
            const parentMenu = parentLi?.querySelector('.has-submenu');
            if (parentMenu) {
                parentMenu.classList.add('open');
                const submenu = document.getElementById(parentMenu.dataset.target);
                if (submenu) submenu.classList.add('open');
            }

            paginationState.isiNilai.currentPage = 1;
            renderIsiNilaiPage(item.dataset.semester, item.dataset.semesterName);
        });
    });
    
    document.querySelectorAll('.btn-import[data-target-input]').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById(button.dataset.targetInput).click();
        });
    });
    
    document.getElementById('importSekolahInput').addEventListener('change', (e) => handleFile(e, 'sekolah'));
    document.getElementById('importSiswaInput').addEventListener('change', (e) => handleFile(e, 'siswa'));
    
    document.querySelectorAll('.btn-delete[data-table-id]').forEach(button => {
        button.addEventListener('click', () => {
            deleteAllData(button.dataset.tableId);
        });
    });

    // Old pagination controls removed - now handled by event delegation in setupPaginationControls()

    document.querySelectorAll('.search-bar').forEach(searchBar => {
        searchBar.addEventListener('input', (e) => {
            const tableId = e.target.dataset.tableId;
            if (Object.prototype.hasOwnProperty.call(searchState, tableId) && Object.prototype.hasOwnProperty.call(paginationState, tableId)) {
                // PERFORMANCE: Use debounced search to reduce excessive processing
                debouncedSearch(tableId, e.target.value, 300);
            }
        });
    });

    

// ==== Delegasi Event Toolbar \"Isi Nilai\" ====
// Berfungsi walau DOM tombol dibuat/dihapus berkali-kali.
document.addEventListener('click', (e) => {
  // Download Template
  const dlBtn = e.target.closest('#btnDownloadTemplate');
  if (dlBtn) {
    e.preventDefault();
    try {
      downloadIsiNilaiTemplate();
    } catch (err) {
      console.error('Download template error:', err);
      showNotification('Error saat download template.', 'error');
    }
    return;
  }

  // Upload Nilai -> trigger input file hidden
  const upBtn = e.target.closest('#btnUploadNilai');
  if (upBtn) {
    e.preventDefault();
    const fileInput = document.getElementById('uploadExcelInput');
    if (fileInput) fileInput.click();
    return;
  }
});

// Change handler untuk input file (hidden)
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'uploadExcelInput') {
    handleUploadExcelChange(e);
  }
});

   
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    // Update label posisi logo secara live
document.getElementById('settingLogoLeftPosTop').addEventListener('input', (e) => { document.getElementById('logoLeftPosTopLabel').textContent = e.target.value; });
document.getElementById('settingLogoLeftPosLeft').addEventListener('input', (e) => { document.getElementById('logoLeftPosLeftLabel').textContent = e.target.value; });
document.getElementById('settingLogoRightPosTop').addEventListener('input', (e) => { document.getElementById('logoRightPosTopLabel').textContent = e.target.value; });
document.getElementById('settingLogoRightPosRight').addEventListener('input', (e) => { document.getElementById('logoRightPosRightLabel').textContent = e.target.value; });

    document.getElementById('settingSklPhotoLayout').addEventListener('input', (e) => { document.getElementById('sklPhotoLayoutLabel').textContent = e.target.value; });
    document.getElementById('deleteAllGradesBtn').addEventListener('click', deleteAllGradesForSemester);
    document.getElementById('backupBtn').addEventListener('click', handleBackup);
    document.getElementById('restoreBtn').addEventListener('click', () => document.getElementById('restoreInput').click());
    document.getElementById('restoreInput').addEventListener('change', handleRestore);
    // ==========================================================
});

// Temporary stub functions to prevent undefined errors
window.editSekolah = function(kodeBiasa) {

    // Find the proper button and trigger its event handler
    const button = document.querySelector(`.btn-edit-sekolah[data-kode="${kodeBiasa}"]`);
    if (button) {
        button.click();
    } else {
        const rowData = database.sekolah.find(s => s[0] === kodeBiasa);
        if (rowData) {
            openSekolahModal('edit', rowData);
        }
    }
};

window.deleteSekolah = function(kodeBiasa) {

    // Find the proper button and trigger its event handler
    const button = document.querySelector(`.btn-delete-sekolah[data-kode="${kodeBiasa}"]`);
    if (button) {
        button.click();
    } else {
        handleDeleteSekolah(kodeBiasa);
    }
};

    editSiswaForm.addEventListener('submit', saveSiswaChanges);
    window.addEventListener('click', (event) => {
        if (event.target == editModal) closeEditModal();
        if (event.target == transkripModal) closeTranskripModal();
        if (event.target == sklModal) closeSklModal();
        if (event.target == skkbModal) closeSkkbModal();
        if (event.target == loginInfoModal) closeLoginInfoModal();
    });


    
    

     populateKecamatanFilter();

    
/* ==== Excel Template & Upload Nilai (Isi Nilai) ==== */
// ===================== RANKING FUNCTIONS =====================
function calculateStudentRanking() {
    
    if (!window.currentUser || !database.siswa) {
        return [];
    }

    if (!database.nilai) {
        return [];
    }
    
    const schoolCode = window.currentUser.schoolData[0];
    const schoolStudents = database.siswa.filter(siswa => siswa[0] === schoolCode);
    
    if (schoolStudents.length === 0) {
        return [];
    }
    
    // Get subject keys based on kurikulum
    const kurikulum = window.currentUser.kurikulum;
    
    const transcriptSubjects = {
        'K13': [
            { key: 'AGAMA', display: 'Pendidikan Agama dan Budi Pekerti' },
            { key: 'PKN', display: 'Pendidikan Pancasila dan Kewarganegaraan' },
            { key: 'B.INDO', display: 'Bahasa Indonesia' },
            { key: 'MTK', display: 'Matematika' },
            { key: 'IPA', display: 'Ilmu Pengetahuan Alam' },
            { key: 'IPS', display: 'Ilmu Pengetahuan Sosial' },
            { key: 'B.ING', display: 'Bahasa Inggris' },
            { key: 'SBDP', display: 'Seni Budaya dan Prakarya' },
            { key: 'PJOK', display: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' }
        ],
        'MERDEKA': [
            { key: 'AGAMA', display: 'Pendidikan Agama dan Budi Pekerti' },
            { key: 'PKN', display: 'Pendidikan Pancasila' },
            { key: 'B.INDO', display: 'Bahasa Indonesia' },
            { key: 'MTK', display: 'Matematika' },
            { key: 'IPAS', display: 'Ilmu Pengetahuan Alam dan Sosial' },
            { key: 'B.ING', display: 'Bahasa Inggris' },
            { key: 'SBDP', display: 'Seni Budaya dan Prakarya' },
            { key: 'PJOK', display: 'Pendidikan Jasmani, Olahraga, dan Kesehatan' }
        ]
    };
    
    const subjects = transcriptSubjects[kurikulum] || transcriptSubjects['MERDEKA'];
    
    // Calculate average for each student
    const studentsWithAverage = schoolStudents.map(siswa => {
        const nisn = siswa[6]; // NISN index
        const nama = siswa[8]; // Nama index
        
        let totalNilai = 0;
        let countValidGrades = 0;
        
        // Calculate average across all main subjects (exclude MULOK for ranking)
        subjects.forEach(subject => {
            const avg = calculateAverageForSubject(nisn, subject.key);
            if (avg !== null && !isNaN(avg) && avg >= 0) { // Changed > 0 to >= 0
                totalNilai += avg;
                countValidGrades++;
            }
        });
        
        const average = countValidGrades > 0 ? (totalNilai / countValidGrades) : 0;
        
        return {
            nisn: nisn,
            nama: nama,
            noUrut: siswa[4], // No urut
            average: average
        };
    });
    
    
    // Filter and sort - show students even with 0 average for debugging
    const result = studentsWithAverage
        .filter(student => student.nama && student.nama.trim() !== '') // Only filter by name existence
        .sort((a, b) => b.average - a.average)
        .slice(0, 10); // Top 10 only
        
    return result;
}

function updateRankingWidget() {
    const rankingContainer = document.getElementById('rankingContainer');
    if (!rankingContainer) {
        return;
    }
    
    const rankings = calculateStudentRanking();

    if (rankings.length === 0) {
        rankingContainer.innerHTML = '<div class="ranking-empty">Belum ada data nilai untuk menampilkan ranking</div>';
        return;
    }
    
    let html = '';
    rankings.forEach((student, index) => {
        const rank = index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
        const itemClass = rank <= 3 ? `top-3 ${rankClass}` : '';
        
        html += `
            <div class="ranking-item ${itemClass}">
                <div class="ranking-number ${rankClass}">${rank}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${student.nama}</div>
                    <div class="ranking-average">${student.average.toFixed(2)}</div>
                </div>
            </div>
        `;
    });
    
    rankingContainer.innerHTML = html;
}

// ===================== HELPER (PASTIKAN HANYA ADA SATU) =====================
function _getCurrentSchoolKode() {
  return String((window.currentUser && window.currentUser.schoolData && window.currentUser.schoolData[0]) || '');
}
function _getMulokNamesForSchool() {
  const kode = _getCurrentSchoolKode();
  const names = (database.nilai && database.nilai._mulokNames && database.nilai._mulokNames[kode]) || {};
  return names; // mis: { MULOK1: "BTQ", MULOK2: "Bahasa Daerah", MULOK3: "" }
}
function _normalizeHeader(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[().]/g, '') // "KI.3" -> "ki3"
    .trim();
}
function _subjectDisplayForTemplate(code) {
  // Dipakai saat membuat template; untuk MULOK pakai nama kustom jika ada
  const mn = _getMulokNamesForSchool();
  if (code.startsWith('MULOK')) {
    return mn[code] && mn[code].trim() ? mn[code] : code;
  }
  return code;
}

// ===================== MAPPER HEADER → KOLOM NILAI (PASTIKAN HANYA ADA SATU) =====================
function _mapHeadersToKeys(headers, kur) {
  const norm = headers.map(_normalizeHeader);
  const idxNISN = norm.findIndex(h => h === 'nisn');
  const idxNama = norm.findIndex(h => h === 'nama' || h === 'nama peserta' || h === 'nama siswa');

  const headerToIndex = new Map(norm.map((h, i) => [h, i]));
  const map = {}; // colIndex -> { subject: 'AGAMA'|'PKN'|...|'MULOK1', type: 'KI3'|'KI4'|'NILAI' }

  const addIf = (key, subject, type) => {
    const idx = headerToIndex.get(key);
    if (idx !== undefined && idx >= 0) map[idx] = { subject, type };
  };

  // alias umum untuk Merdeka (1 kolom nilai) dan K13 (KI3/KI4)
  const aliasBase = {
    'agama': 'AGAMA', 'pai': 'AGAMA', 'pabp': 'AGAMA',
    'ppkn': 'PKN', 'pkn': 'PKN',
    'bahasa indonesia': 'B.INDO', 'bindo': 'B.INDO', 'b indo': 'B.INDO',
    'matematika': 'MTK', 'mtk': 'MTK', 'mat': 'MTK',
    'ipas': 'IPAS', 'ipa': 'IPAS', 'ips': 'IPAS',
    'bahasa inggris': 'B.ING', 'bing': 'B.ING', 'b inggris': 'B.ING',
    'sbdp': 'SBDP', 'sbkp': 'SBDP', 'sbk': 'SBDP',
    'pjok': 'PJOK', 'penjas': 'PJOK', 'penjaskes': 'PJOK',
  };

  // nama MULOK kustom (jika di-setting)
  const mn = _getMulokNamesForSchool(); // { MULOK1: 'BTQ', ... }
  const mulokKeys = ['MULOK1', 'MULOK2', 'MULOK3'];
  const mulokVariants = mulokKeys.map(k => {
    const custom = _normalizeHeader(mn[k] || '');  // 'btq'
    const variants = [custom, _normalizeHeader(k), _normalizeHeader(k.replace('MULOK', 'Muatan Lokal '))].filter(Boolean);
    return Array.from(new Set(variants)); // buang duplikat
  });

  if (kur === 'K13') {
    // 1) map kolom KI.3 & KI.4 untuk mapel standar
    (subjects && subjects.K13 ? subjects.K13 : []).forEach(code => {
      const disp = _normalizeHeader(_subjectDisplayForTemplate(code)); // nama display
      const codeNorm = _normalizeHeader(code); // kode baku
      const bases = Array.from(new Set([disp, codeNorm, ...Object.keys(aliasBase).filter(a => aliasBase[a] === code)]));
      bases.forEach(base => {
        addIf(`${base} ki3`, code, 'KI3');
        addIf(`${base} ki4`, code, 'KI4');
      });
    });

    // 2) fallback khusus MULOK K13 (kalau header pakai nama kustom): cari "<namaMulok> ki3/ki4"
    mulokVariants.forEach((variants, i) => {
      variants.forEach(v => {
        addIf(`${v} ki3`, `MULOK${i + 1}`, 'KI3');
        addIf(`${v} ki4`, `MULOK${i + 1}`, 'KI4');
      });
    });

  } else {
    // Merdeka: 1 kolom per mapel
    (subjects && subjects.Merdeka ? subjects.Merdeka : []).forEach(code => {
      const disp = _normalizeHeader(_subjectDisplayForTemplate(code));
      const codeNorm = _normalizeHeader(code);
      const bases = Array.from(new Set([disp, codeNorm, ...Object.keys(aliasBase).filter(a => aliasBase[a] === code)]));
      bases.forEach(base => addIf(base, code, 'NILAI'));
    });

    // Fallback MULOK Merdeka: jika header memakai nama kustom saja
    mulokVariants.forEach((variants, i) => {
      variants.forEach(v => addIf(v, `MULOK${i + 1}`, 'NILAI'));
    });

    // Kalau masih ada header tak dikenal, alokasikan ke MULOK yang kosong (urutan MULOK1..3)
    const already = new Set(Object.keys(map).map(k => parseInt(k, 10)));
    const freeMulok = mulokKeys.filter(k => !Object.values(map).some(v => v.subject === k));
    if (freeMulok.length) {
      for (let col = 0; col < norm.length; col++) {
        if (col === idxNISN || col === idxNama || already.has(col)) continue;
        const h = norm[col];
        if (!h || h === '-' || h === 'nil') continue;
        const target = freeMulok.shift();
        if (!target) break;
        map[col] = { subject: target, type: 'NILAI' };
      }
    }
  }

  return { map, idxNISN, idxNama };
}


async function handleUploadExcelChange(evt) {
  const file = evt.target.files?.[0];
  if (!file) return;

  showLoader();
  try {
    // Pastikan nama MULOK sudah ada agar mapping di upload pertama langsung benar
    const kode = _getCurrentSchoolKode();
    if (!database.nilai || !database.nilai._mulokNames || !database.nilai._mulokNames[kode]) {
      await fetchDataFromServer();
    }

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

    if (aoa.length < 2) throw new Error('Sheet kosong atau hanya header.');
    const headers = aoa[0];
    const rows = aoa.slice(1);

    const kur = window.currentUser?.kurikulum || 'Merdeka';
    const { map, idxNISN } = _mapHeadersToKeys(headers, kur);
    if (idxNISN < 0) throw new Error('Kolom NISN tidak ditemukan di header.');

    const semester = paginationState?.isiNilai?.currentSemester;

    const gradesToSave = [];
    for (const r of rows) {
      const nisn = String(r[idxNISN] ?? '').trim();
      if (!nisn) continue;

      for (const colIdxStr of Object.keys(map)) {
        const colIdx = +colIdxStr;
        const { subject, type } = map[colIdx];

        let raw = r[colIdx];
        if (raw === undefined || raw === null || String(raw).trim() === '') continue;

        let value = String(raw).replace(',', '.').trim();
        const num = Number(value);
        value = Number.isFinite(num) ? num : value;

        gradesToSave.push({ nisn, semester, subject, type, value });
      }
    }

    if (!gradesToSave.length) throw new Error('Tidak ada nilai yang terbaca dari file.');

    // ⛳ PENTING: fetchWithAuth mengembalikan JSON, jadi cek .success (bukan resp.ok / resp.text)
    // Add retry mechanism for better reliability
    let result;
    const maxRetries = 2;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        ...`);
        result = await fetchWithAuth(apiUrl('/api/data/grades/save-bulk'), {
          method: 'POST',
          body: JSON.stringify(gradesToSave)
        });
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!result && lastError) {
      throw new Error(`Gagal menyimpan nilai setelah ${maxRetries} percobaan: ${lastError.message}`);
    }

    if (!result || result.success === false) {
      throw new Error(result?.message || 'Gagal menyimpan nilai (server).');
    }

 
    await fetchDataFromServer();                  // tarik data terbaru dari server
    
    
    await refreshIsiNilaiViewAfterSave();         // ➜ paksa render ulang & reset pagination
    showNotification(result.message || 'Berhasil menyimpan nilai.', 'success');


  } catch (err) {
    console.error('Error processing Excel for grades:', err);
    showNotification(err.message || 'Gagal memproses file Excel.', 'error');
  } finally {
    hideLoader();
    evt.target.value = '';
  }
}




async function saveIjazahNumber(inputElement) {
  const originalIndex = parseInt(inputElement.dataset.index);
  const newValue = inputElement.value.trim();
  const siswaData = database.siswa[originalIndex];
  if (!siswaData) return;

  const nisn = String(siswaData[6]); // NISN ada di index 6, bukan 7
  inputElement.classList.remove('invalid-input');

  // Validasi: boleh kosong, atau 15 digit
  if (newValue !== '' && !/^\d{15}$/.test(newValue)) {
    const msg = 'Nomor Ijazah harus tepat 15 digit dan hanya berisi angka.';
    showSmartNotification(msg, 'error', 'validasi no ijazah');
    inputElement.classList.add('invalid-input');
    inputElement.value = siswaData[10] || ''; // noIjazah ada di index 10, bukan 11
    setTimeout(() => inputElement.classList.remove('invalid-input'), 2500);
    return;
  }
  
  // Cek duplikat No Ijazah
  if (newValue !== '' && checkDuplicateIjazah(newValue, originalIndex)) {
    const msg = 'Nomor Ijazah sudah digunakan oleh siswa lain. Harap masukkan nomor yang unik.';
    showSmartNotification(msg, 'error', 'validasi no ijazah');
    inputElement.classList.add('invalid-input');
    inputElement.value = siswaData[10] || ''; // kembalikan ke nilai sebelumnya
    setTimeout(() => inputElement.classList.remove('invalid-input'), 2500);
    return;
  }

  // Optimistic update (kembalikan jika gagal)
  const prev = siswaData[10]; // noIjazah ada di index 10, bukan 11
  siswaData[10] = newValue;

  try {
    const result = await fetchWithAuth(apiUrl('/api/data/siswa/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nisn, updatedData: { noIjazah: newValue } })
    });
    if (!result.success) throw new Error(result.message);
    showSmartNotification('Nomor Ijazah berhasil disimpan!', 'success', 'simpan no ijazah');
  } catch (err) {
    siswaData[10] = prev; // noIjazah ada di index 10, bukan 11
    showSmartNotification(err.message || 'Gagal menyimpan No. Ijazah ke server.', 'error', 'simpan no ijazah');
  }
}


let rekapNilaiAdminState = {
    filteredSiswa: [],
    selectedSchool: null,
    selectedKurikulum: null
};


function renderRekapNilaiAdminPage() {
    const tableHead = document.querySelector("#rekapNilaiAdmin table thead tr");
    if (!tableHead) return;

    const tableBody = document.getElementById('rekapNilaiTableBody');
    if (tableBody) tableBody.innerHTML = '';

    const kurikulum = document.getElementById('filterKurikulum')?.value || 'Merdeka';
    const subjectsForKurikulum = transcriptSubjects[kurikulum] || [];
    const mapelHeader = subjectsForKurikulum.map(s => `<th>${s.display}</th>`).join('');
    tableHead.innerHTML = `
        <th>No</th>
        <th>NISN</th>
        <th>Nama Siswa</th>
        <th>Asal Sekolah</th>
        ${mapelHeader}
        <th>Rata-rata</th>
    `;

    initRekapFilters();

    const tableId = 'rekapNilaiAdmin';
    const controls = document.querySelector(`.pagination-controls[data-table-id="${tableId}"]`);
    if (controls && !controls.dataset.listenerAttached) {
        const prevButton = controls.querySelector('.prev-page');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (paginationState[tableId] && paginationState[tableId].currentPage > 1) {
                    paginationState[tableId].currentPage--;
                    renderAdminRekapTable();
                }
            });
        }
        const nextButton = controls.querySelector('.next-page');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const state = paginationState[tableId];
                if (!state) return;
                const data = rekapNilaiAdminState.filteredSiswa;
                if (!data) return;
                const rowsPerPage = state.rowsPerPage === 'all' ? data.length : parseInt(state.rowsPerPage);
                const totalPages = rowsPerPage > 0 ? Math.ceil(data.length / rowsPerPage) : 1;
                if (state.currentPage < totalPages) {
                    state.currentPage++;
                    renderAdminRekapTable();
                }
            });
        }
        const rowsPerPageSelect = controls.querySelector('.rows-per-page');
        if (rowsPerPageSelect) {
            rowsPerPageSelect.addEventListener('change', (e) => {
                if (paginationState[tableId]) {
                    paginationState[tableId].rowsPerPage = e.target.value;
                    paginationState[tableId].currentPage = 1;
                    renderAdminRekapTable();
                }
            });
        }
        controls.dataset.listenerAttached = 'true';
    }
}

// Mengisi dropdown filter
function populateRekapNilaiFilters() {
    const kecamatanFilter = document.getElementById('filterKecamatan');
    kecamatanFilter.innerHTML = '<option value="">Semua Kecamatan</option>';
    const sekolahFilter = document.getElementById('filterSekolah');
    sekolahFilter.innerHTML = '<option value="">Semua Sekolah</option>';

    const allKecamatan = [...new Set(database.sekolah.map(s => s[2]))];
    allKecamatan.forEach(kecamatan => {
        kecamatanFilter.innerHTML += `<option value="${kecamatan}">${kecamatan}</option>`;
    });

    const selectedKecamatan = kecamatanFilter.value;
    if (selectedKecamatan) populateSekolahFilter();
}

// [PERBAIKAN #2]
// [GANTI FUNGSI INI SECARA KESELURUHAN]
// Fungsi populateSekolahFilter yang lama telah dihapus untuk memperbaiki error redeklarasi.

// GANTI FUNGSI LAMA DENGAN VERSI BARU INI
// [GANTI FUNGSI INI SECARA KESELURUHAN]
function filterAndRenderRekapNilaiAdminTable() {
    const kurikulumFilter = document.getElementById('filterKurikulum').value;
    const kecamatanFilter = document.getElementById('adminFilterKecamatan').value;
    const sekolahFilter = document.getElementById('filterSekolah').value;

    const downloadBtn = document.getElementById('downloadRekapPdfBtn');


    // Filter data siswa berdasarkan pilihan
    let filteredSiswa = database.siswa;
    
    if (kecamatanFilter) {
        // Filter berdasarkan kecamatan (s[3] adalah kolom kecamatan di data siswa)
        filteredSiswa = filteredSiswa.filter(s => s[3] === kecamatanFilter);
    }
    
    if (sekolahFilter) {
        // [PERBAIKAN DI SINI]
        // Menggunakan s[0] (kode sekolah siswa) untuk dicocokkan dengan nilai filter (kode sekolah).
        // Sebelumnya: s[2] (nama sekolah siswa), ini yang salah.
        filteredSiswa = filteredSiswa.filter(s => {
            const match = s[0] === sekolahFilter;
            return match;
        });
    }
    
    if (kurikulumFilter) {
        // PERBAIKAN: Data siswa tidak memiliki kolom kurikulum
        // Filter kurikulum harus berdasarkan data sekolah atau user login
        // Untuk sementara, skip filter kurikulum karena tidak ada di data siswa
    }


    // Simpan data yang sudah difilter untuk digunakan nanti
    rekapNilaiAdminState.filteredSiswa = filteredSiswa;
    
    // Simpan data sekolah yang dipilih untuk PDF
    if (sekolahFilter) {
        rekapNilaiAdminState.selectedSchool = database.sekolah.find(s => s[0] === sekolahFilter);
    } else {
        rekapNilaiAdminState.selectedSchool = null;
    }

    // Menonaktifkan tombol download jika tidak ada data
    downloadBtn.disabled = filteredSiswa.length === 0;

    // Panggil fungsi untuk merender tabel dan paginasi
    renderAdminRekapTable(); 
}

// GANTI FUNGSI LAMA DENGAN VERSI BARU INI
// GANTI SELURUH FUNGSI LAMA DENGAN VERSI BARU DAN LENGKAP INI
function renderAdminRekapTable() {
    const thead = document.querySelector("#rekapNilaiAdmin table thead tr");
    const tbody = document.getElementById('rekapNilaiTableBody');
    const kurikulumFilter = document.getElementById('filterKurikulum').value;
    const siswaData = rekapNilaiAdminState.filteredSiswa;

    // --- Logika Paginasi ---
    const pageState = paginationState.rekapNilaiAdmin;
    const rowsPerPage = pageState.rowsPerPage === 'all' ? siswaData.length : parseInt(pageState.rowsPerPage);
    const totalPages = Math.ceil(siswaData.length / rowsPerPage) || 1;
    pageState.currentPage = Math.min(pageState.currentPage, totalPages);
    const start = (pageState.currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = siswaData.slice(start, end);

    // Kosongkan tabel
    if (thead) thead.innerHTML = '';
    tbody.innerHTML = '';

    // Tampilkan pesan jika tidak ada data
    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="20" style="text-align: center; padding: 20px;">Tidak ada data yang cocok dengan filter Anda.</td></tr>`;
        updatePaginationControls('rekapNilaiAdmin', 0);
        return;
    }

    // --- Membuat Header Tabel Dinamis ---
    // Gunakan filter kurikulum yang dipilih, jika tidak ada default ke Merdeka
    const kurikulum = kurikulumFilter || 'Merdeka';
    const subjectsForKurikulum = subjects[kurikulum];
    const schoolKodeBiasaSiswaPertama = String(paginatedData[0][0]);
    const mulokNames = database.nilai._mulokNames?.[schoolKodeBiasaSiswaPertama] || {};

    let headerHTML = '<th>NO</th><th>NAMA SEKOLAH</th><th>NAMA SISWA</th><th>NISN</th>';
    subjectsForKurikulum.forEach(subjectKey => {
        const headerName = (subjectKey.startsWith('MULOK') && mulokNames[subjectKey]) ? mulokNames[subjectKey] : subjectKey;
        headerHTML += `<th>${headerName}</th>`;
    });
    // Tambahkan kolom rata-rata di akhir
    headerHTML += '<th>RATA-RATA</th>';
    if (thead) thead.innerHTML = headerHTML;
    
    // --- Mengisi Baris Data dengan Nilai ---
    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[6] || '';
        const row = tbody.insertRow();
        let rowHTML = `
            <td>${start + index + 1}</td>
            <td>${siswa[2] || '-'}</td>
            <td>${siswa[7] || '-'}</td>
            <td>${nisn}</td>
        `;
        
        let totalGrades = 0;
        let countValidGrades = 0;
        
        // Loop untuk setiap mata pelajaran, hitung rata-ratanya
        subjectsForKurikulum.forEach(subjectKey => {
            const finalGrade = calculateAverageForSubject(nisn, subjectKey);
            const gradeDisplay = finalGrade !== null ? finalGrade.toFixed(2) : '-';
            rowHTML += `<td style="text-align: center;">${gradeDisplay}</td>`;
            
            // Hitung untuk rata-rata siswa
            if (finalGrade !== null && !isNaN(finalGrade)) {
                totalGrades += finalGrade;
                countValidGrades++;
            }
        });
        
        // Tambahkan kolom rata-rata siswa
        const studentAverage = countValidGrades > 0 ? totalGrades / countValidGrades : 0;
        const averageDisplay = countValidGrades > 0 ? studentAverage.toFixed(2) : '-';
        rowHTML += `<td style="text-align: center; font-weight: bold;">${averageDisplay}</td>`;
        
        row.innerHTML = rowHTML;
    });

    // Update kontrol paginasi
    updatePaginationControls('rekapNilaiAdmin', siswaData.length);
}

// Fungsi untuk mencetak rekap nilai per sekolah ke PDF
async function downloadRekapNilaiAdminPDF() {
    const school = rekapNilaiAdminState.selectedSchool;
    if (!school) {
        showNotification('Pilih sekolah terlebih dahulu.', 'warning');
        return;
    }

    showLoader();
    const { jsPDF } = window.jspdf;
    const filteredSiswa = rekapNilaiAdminState.filteredSiswa;
    
    try {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        
        const schoolName = (school[4] || 'SEKOLAH').toUpperCase();
        const kurikulum = filteredSiswa[0]?.kurikulum || 'Merdeka';
        const allSubjects = subjects[kurikulum] || [];
        const mulokNames = database.nilai._mulokNames?.[school[0]] || {};
        
        // Membangun data header dan body untuk autoTable
        const tableHeaders = [{
            "header": "NO", "dataKey": "no"
        }, {
            "header": "NAMA", "dataKey": "nama"
        }, {
            "header": "NISN", "dataKey": "nisn"
        }];
        
        allSubjects.forEach(subjectKey => {
            const headerName = (mulokNames && mulokNames[subjectKey]) || subjectKey;
            tableHeaders.push({ "header": headerName, "dataKey": subjectKey });
        });
        
        // Tambahkan kolom rata-rata
        tableHeaders.push({ "header": "RATA-RATA", "dataKey": "average" });

        const tableBody = filteredSiswa.map((siswa, index) => {
            const row = {
                "no": index + 1,
                "nama": siswa[7] || '',
                "nisn": siswa[6] || ''
            };
            
            let totalGrades = 0;
            let countValidGrades = 0;
            
            allSubjects.forEach(subjectKey => {
                const finalGrade = calculateAverageForSubject(siswa[6], subjectKey);
                row[subjectKey] = finalGrade !== null ? finalGrade.toFixed(2) : '-';
                
                // Hitung untuk rata-rata siswa
                if (finalGrade !== null && !isNaN(finalGrade)) {
                    totalGrades += finalGrade;
                    countValidGrades++;
                }
            });
            
            // Tambahkan kolom rata-rata siswa
            const studentAverage = countValidGrades > 0 ? totalGrades / countValidGrades : 0;
            row.average = countValidGrades > 0 ? studentAverage.toFixed(2) : '-';
            
            return row;
        });

        // Fungsi untuk membuat header di setiap halaman (versi admin)
        const addHeaderAdmin = (pdf, pageNumber) => {
            // Header kop rata kiri sesuai permintaan
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text("REKAP NILAI AKHIR SISWA", 14, 20);
            
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text("TAHUN PELAJARAN 2024/2025", 14, 30);
            
            // Informasi sekolah rata kiri dengan format titik dua yang rapi
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'normal');
            
            const labelWidth = 35; // Lebar tetap untuk label
            const colonX = 14 + labelWidth; // Posisi titik dua
            const valueX = colonX + 5; // Posisi nilai (setelah titik dua)
            
            // Label
            pdf.text('Kecamatan', 14, 42);
            pdf.text('NPSN', 14, 48);
            pdf.text('Nama Sekolah', 14, 54);
            pdf.text('Jumlah Siswa', 14, 60);
            pdf.text('Kurikulum', 14, 66);
            
            // Titik dua
            pdf.text(':', colonX, 42);
            pdf.text(':', colonX, 48);
            pdf.text(':', colonX, 54);
            pdf.text(':', colonX, 60);
            pdf.text(':', colonX, 66);
            
            // Nilai
            pdf.text(school[2] || '-', valueX, 42);
            pdf.text(school[3] || '-', valueX, 48);
            pdf.text(schoolName, valueX, 54);
            pdf.text(`${filteredSiswa.length} orang`, valueX, 60);
            pdf.text(kurikulum, valueX, 66);
        };

        // Tambahkan header di halaman pertama
        addHeaderAdmin(pdf, 1);
        
        // Menggambar tabel dengan autoTable
        pdf.autoTable({
            startY: 75,
            head: [tableHeaders.map(h => h.header)],
            body: tableBody.map(row => tableHeaders.map(h => row[h.dataKey])),
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            didDrawPage: (data) => {
                // Tambahkan header di setiap halaman baru (kecuali halaman pertama)
                if (data.pageNumber > 1) {
                    addHeaderAdmin(pdf, data.pageNumber);
                    // Set margin atas yang lebih besar untuk halaman berikutnya
                    data.cursor.y = Math.max(data.cursor.y, 75);
                }
            },
            margin: { top: 75 },
            columnStyles: {
                0: { cellWidth: 10 }, // NO
                1: { cellWidth: 50 }, // NAMA
                2: { cellWidth: 30 }, // NISN
                // Kolom rata-rata (indeks terakhir)
                [tableHeaders.length - 1]: { 
                    cellWidth: 20, 
                    halign: 'center', 
                    fontStyle: 'bold' 
                }
            }
        });

        const fileName = `RekapNilai_${schoolName.replace(/ /g, '_')}.pdf`;
        pdf.save(fileName);
        
        showNotification(`Rekap nilai berhasil diunduh: ${fileName}`, 'success');

    } catch (error) {
        console.error("Error creating Rekap Nilai PDF:", error);
        showNotification("Gagal membuat file PDF rekap nilai.", 'error');
    } finally {
        hideLoader();
    }
}

// Fungsi untuk membuat HTML khusus Rekap Nilai
function createRekapNilaiHTML(school, siswaList) {
    const schoolName = (school[4] || 'NAMA SEKOLAH').toUpperCase();
    const kurikulum = siswaList[0]?.kurikulum || 'Merdeka';
    const allSubjects = subjects[kurikulum];
    const mulokNames = database.nilai._mulokNames?.[school[0]] || {};

    let tableHeaders = '<th>NO</th><th>NAMA</th><th>NISN</th>';
    allSubjects.forEach(subjectKey => {
        const headerName = (mulokNames && mulokNames[subjectKey]) || subjectKey;
        tableHeaders += `<th>${headerName}</th>`;
    });

    let tableRows = '';
    siswaList.forEach((siswa, index) => {
        const nisn = siswa[7] || '';
        let rowData = `<td>${index + 1}</td><td>${siswa[8] || ''}</td><td>${nisn}</td>`;
        allSubjects.forEach(subjectKey => {
            const finalGrade = calculateAverageForSubject(nisn, subjectKey);
            const gradeDisplay = finalGrade !== null ? finalGrade.toFixed(2) : '-';
            rowData += `<td>${gradeDisplay}</td>`;
        });
        tableRows += `<tr>${rowData}</tr>`;
    });
    
    return `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 10pt;">
            <h1 style="text-align: center; margin-bottom: 5px;">Rekap Nilai Akhir Siswa</h1>
            <h2 style="text-align: center; margin-top: 0;">${schoolName}</h2>
            <p style="margin-top: 20px;"><strong>Kecamatan:</strong> ${school[2]}</p>
            <p><strong>NPSN:</strong> ${school[3]}</p>
            <p><strong>Kurikulum:</strong> ${kurikulum}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead><tr>${tableHeaders}</tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;
}

// TAMBAHKAN FUNGSI BARU INI
// GANTI SELURUH FUNGSI getRekapNilaiData DENGAN INI
// GANTI SELURUH FUNGSI getRekapNilaiData DENGAN INI
function getRekapNilaiData() {
    const filterKecamatan = document.getElementById('filterKecamatan').value;
    const filterSekolah = document.getElementById('filterSekolah').value;

    let filteredSiswa = database.siswa;

    // 1. Filter berdasarkan Kecamatan (jika dipilih)
    if (filterKecamatan !== 'Semua Kecamatan') {
        const schoolCodesInKecamatan = new Set(database.sekolah.filter(s => s[2] === filterKecamatan).map(s => s[0]));
        filteredSiswa = filteredSiswa.filter(siswa => schoolCodesInKecamatan.has(siswa[0]));
    }
    
    // 2. Filter berdasarkan Sekolah (jika dipilih)
    if (filterSekolah !== 'Semua Sekolah') {
        filteredSiswa = filteredSiswa.filter(siswa => siswa[0] === filterSekolah);
    }
    
    // Sisa logika untuk menghitung rata-rata tetap sama
    const rekapData = filteredSiswa.map(siswa => {
        const nisn = siswa[6];
        const namaSiswa = siswa[8];
        const namaSekolah = (database.sekolah.find(s => s[0] === siswa[0]) || [])[4] || 'N/A';
        let totalNilai = 0;
        let jumlahMapel = 0;
        const subjectsToCalculate = transcriptSubjects[window.currentUser.kurikulum || 'Merdeka'];
        subjectsToCalculate.forEach(subject => {
            const avg = calculateAverageForSubject(nisn, subject.key);
            if (avg !== null) {
                totalNilai += avg;
                jumlahMapel++;
            }
        });
        const rataRataAkhir = jumlahMapel > 0 ? (totalNilai / jumlahMapel).toFixed(2) : 'N/A';
        return [nisn, namaSiswa, namaSekolah, rataRataAkhir];
    });
    return rekapData;
}

function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// TAMBAHKAN FUNGSI BARU INI
// GANTI SELURUH FUNGSI populateKecamatanFilter DENGAN INI
function populateKecamatanFilter() {
    const filterKecamatan = document.getElementById('filterKecamatan');
    if (!filterKecamatan) return;

    const kecamatanSet = new Set(database.sekolah.map(s => s[2]));
    const kecamatanList = ['Semua Kecamatan', ...kecamatanSet];

    filterKecamatan.innerHTML = '';
    kecamatanList.forEach(kecamatan => {
        const option = document.createElement('option');
        option.value = kecamatan;
        option.textContent = kecamatan;
        filterKecamatan.appendChild(option);
    });
    
    // Panggil fungsi filter sekolah setelah kecamatan diisi
    populateSekolahFilter();
}


// TAMBAHKAN FUNGSI BARU INI
function populateSekolahFilter() {
    const filterKecamatan = document.getElementById('filterKecamatan').value;
    const filterSekolah = document.getElementById('filterSekolah');
    if (!filterSekolah) return;

    filterSekolah.innerHTML = ''; // Kosongkan pilihan lama

    // Tambahkan opsi default
    const defaultOption = document.createElement('option');
    defaultOption.value = 'Semua Sekolah';
    defaultOption.textContent = 'Semua Sekolah';
    filterSekolah.appendChild(defaultOption);

    if (filterKecamatan !== 'Semua Kecamatan') {
        const sekolahDiKecamatan = database.sekolah.filter(s => s[2] === filterKecamatan);
        sekolahDiKecamatan.forEach(sekolah => {
            const option = document.createElement('option');
            option.value = sekolah[0]; // Gunakan Kode Sekolah (NPSN/Kode Biasa) sebagai value
            option.textContent = sekolah[4]; // Tampilkan Nama Sekolah
            filterSekolah.appendChild(option);
        });
    }
}

function getRekapNilaiLengkapData() {
    const filterKecamatan = document.getElementById('adminFilterKecamatan').value;
    const filterSekolah = document.getElementById('filterSekolah').value;


    let filteredSiswa = database.siswa;

    if (filterKecamatan !== 'Semua Kecamatan' && filterKecamatan !== '') {
        const schoolCodesInKecamatan = new Set(database.sekolah.filter(s => s[2] === filterKecamatan).map(s => s[0]));
        filteredSiswa = filteredSiswa.filter(siswa => schoolCodesInKecamatan.has(siswa[0]));
    }

    if (filterSekolah !== 'Semua Sekolah' && filterSekolah !== '') {
        filteredSiswa = filteredSiswa.filter(siswa => siswa[0] === filterSekolah);
    }

    const rekapData = filteredSiswa.map(siswa => {
        const nisn = siswa[6];
        const namaSiswa = siswa[8];
        const namaSekolah = (database.sekolah.find(s => s[0] === siswa[0]) || [])[4] || 'N/A';
        
        let nilaiMapel = {};
        let totalNilai = 0;
        let jumlahMapel = 0;
        
        const subjectsToCalculate = transcriptSubjects[window.currentUser.kurikulum || 'Merdeka'];
        subjectsToCalculate.forEach(subject => {
            const avg = calculateAverageForSubject(nisn, subject.key);
            nilaiMapel[subject.key] = avg !== null ? avg.toFixed(2) : '-';
            if (avg !== null) {
                totalNilai += avg;
                jumlahMapel++;
            }
        });

        const rataRataAkhir = jumlahMapel > 0 ? (totalNilai / jumlahMapel).toFixed(2) : '0';
        
        return {
            no: 0, // Placeholder untuk nomor urut
            nisn: nisn,
            namaSiswa: namaSiswa,
            namaSekolah: namaSekolah,
            nilaiMapel: nilaiMapel,
            rataRata: parseFloat(rataRataAkhir)
        };
    });


    return rekapData;
}


// TAMBAHKAN FUNGSI BARU INI
function setupSettingTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Hapus kelas 'active' dari semua tombol dan panel
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Tambahkan kelas 'active' ke tombol yang diklik dan panel targetnya
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.target);
            targetTab.classList.add('active');
            
            // Render ulang subject checkboxes jika tab mapel dibuka
            if (button.dataset.target === 'tab-mapel') {
                renderSubjectCheckboxes();
            }
        });
    });
}

// Fungsi untuk render checkbox mata pelajaran
function renderSubjectCheckboxes() {
    const subjectContainer = document.getElementById('subjectSelectionContainer');
    if (!subjectContainer) {
        console.error('subjectSelectionContainer not found!');
        return;
    }
    
    if (!window.currentUser || !window.currentUser.schoolData) {
        console.error('window.currentUser or schoolData not found!');
        return;
    }
    
    const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
    const settings = database?.settings?.[schoolKodeBiasa] || {};
    
    subjectContainer.innerHTML = '';
    const kur = window.currentUser.kurikulum || 'Merdeka';
    const list = (transcriptSubjects?.[kur]) || [];
    const vis = settings.subjectVisibility || {};
    
    
    list.forEach(s => {
        const checked = Object.prototype.hasOwnProperty.call(vis, s.key) ? !!vis[s.key] : true; // default tampil
        subjectContainer.insertAdjacentHTML('beforeend', `
            <div class="subject-checkbox">
                <input type="checkbox" id="check-${s.key}" data-subject-key="${s.key}" ${checked ? 'checked' : ''}>
                <label for="check-${s.key}">${s.display}</label>
            </div>
        `);
    });
    
}

// Tambahkan dua fungsi baru ini
function openSekolahModal(mode, data = null) {
    const modal = document.getElementById('sekolahModal');
    const form = document.getElementById('sekolahForm');
    form.reset(); // Bersihkan form setiap kali dibuka

    document.getElementById('sekolahModalMode').value = mode;

    if (mode === 'edit') {
        document.getElementById('sekolahModalTitle').textContent = 'Edit Data Sekolah';
        document.getElementById('originalKodeBiasa').value = data[0];
        document.getElementById('kodeBiasa').value = data[0];
        document.getElementById('kodePro').value = data[1];
        document.getElementById('kecamatan').value = data[2];
        document.getElementById('npsn').value = data[3];
        document.getElementById('namaSekolah').value = data[4];
        document.getElementById('namaSekolahSingkat').value = data[5];
    } else { // mode 'add'
        document.getElementById('sekolahModalTitle').textContent = 'Tambah Sekolah Baru';
    }

    modal.style.display = 'block';
}

function closeSekolahModal() {
    const modal = document.getElementById('sekolahModal');
    modal.style.display = 'none';
}


// GANTI FUNGSI LAMA DENGAN VERSI BARU INI
async function handleSekolahFormSubmit(event) {
    event.preventDefault();
    showLoader();

    try {
        const mode = document.getElementById('sekolahModalMode').value;
        const originalKodeBiasa = document.getElementById('originalKodeBiasa').value;

        // Kumpulkan data dalam bentuk array, sesuai yang diharapkan backend
        const sekolahData = [
            document.getElementById('kodeBiasa').value,
            document.getElementById('kodePro').value,
            document.getElementById('kecamatan').value,
            document.getElementById('npsn').value,
            document.getElementById('namaSekolah').value,
            document.getElementById('namaSekolahSingkat').value,
        ];

        // Body request yang akan dikirim
        const requestBody = {
            mode: mode,
            sekolahData: sekolahData,
            originalKodeBiasa: originalKodeBiasa
        };

        // Kirim ke satu endpoint yang benar: /sekolah/save
        const result = await fetchWithAuth(apiUrl('/api/data/sekolah/save'), {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        if (!result.success) throw new Error(result.message);

        closeSekolahModal();
        showNotification(result.message, 'success');
        await fetchDataFromServer(); // Ambil data terbaru dari server

    } catch (error) {
        showNotification(error.message || 'Gagal menyimpan data.', 'error');
    } finally {
        hideLoader();
    }
}



async function handleDeleteSekolah(kodeBiasa) {
    // VALIDASI KONFIRMASI DIHAPUS - Langsung hapus tanpa konfirmasi
    showLoader();
    try {
        // Pastikan memanggil fetchWithAuth, bukan fetch biasa
        const result = await fetchWithAuth(apiUrl('/api/data/sekolah/delete'), {
            method: 'POST',
            body: JSON.stringify({ kodeBiasa })
        });

        if (!result.success) throw new Error(result.message);

        showNotification(result.message, 'success');
        await fetchDataFromServer(); // Ambil data terbaru

    } catch (error) {
        showNotification(error.message || 'Gagal menghapus data.', 'error');
    } finally {
        hideLoader();
    }
}

// === TEMPLATE EXCEL PINTAR DENGAN VALIDASI OTOMATIS ===
// Generate smart Excel template with validation
function generateSmartExcelTemplate(type) {
    const wb = XLSX.utils.book_new();

    if (type === 'sekolah') {
        // Template untuk data sekolah
        const sekolahData = [
            ['KODE_BIASA', 'KODE_REGISTRASI', 'NSS', 'NPSN', 'NAMA_SEKOLAH', 'STATUS', 'BENTUK_PENDIDIKAN', 'KEPALA_SEKOLAH', 'OPERATOR'],
            ['CONTOH: 12345', 'CONTOH: REG001', 'CONTOH: 101230001001', 'CONTOH: 10123456', 'CONTOH: SDN 1 Jakarta', 'CONTOH: Negeri/Swasta', 'CONTOH: SD', 'CONTOH: Pak Budi', 'CONTOH: Bu Sari'],
            ['', '', '', '', '', '', '', '', ''],
        ];

        // Validation rules sheet
        const validationRules = [
            ['KOLOM', 'ATURAN VALIDASI', 'KETERANGAN'],
            ['KODE_BIASA', 'Wajib diisi, angka 5 digit', 'Kode unik sekolah'],
            ['KODE_REGISTRASI', 'Opsional, alfanumerik', 'Kode registrasi sekolah'],
            ['NSS', 'Wajib diisi, angka 12 digit', 'Nomor Statistik Sekolah'],
            ['NPSN', 'Wajib diisi, angka 8 digit', 'Nomor Pokok Sekolah Nasional'],
            ['NAMA_SEKOLAH', 'Wajib diisi, maksimal 100 karakter', 'Nama lengkap sekolah'],
            ['STATUS', 'Pilihan: Negeri/Swasta', 'Status sekolah'],
            ['BENTUK_PENDIDIKAN', 'Pilihan: SD/MI/SDS', 'Bentuk pendidikan'],
            ['KEPALA_SEKOLAH', 'Wajib diisi, maksimal 50 karakter', 'Nama kepala sekolah'],
            ['OPERATOR', 'Opsional, maksimal 50 karakter', 'Nama operator sekolah']
        ];

        const ws1 = XLSX.utils.aoa_to_sheet(sekolahData);
        const ws2 = XLSX.utils.aoa_to_sheet(validationRules);

        XLSX.utils.book_append_sheet(wb, ws1, 'Data Sekolah');
        XLSX.utils.book_append_sheet(wb, ws2, 'Aturan Validasi');

    } else if (type === 'siswa') {
        // Template untuk data siswa
        const siswaData = [
            ['KODE_SEKOLAH', 'KODE_KELAS', 'KODE_ROMBEL', 'KODE_BIASA', 'NIS', 'NO_PESERTA', 'NISN', 'NAMA_SISWA', 'TEMPAT_TANGGAL_LAHIR', 'NAMA_ORANG_TUA', 'NO_IJAZAH'],
            ['CONTOH: 12345', 'CONTOH: 6A', 'CONTOH: R001', 'CONTOH: 001', 'CONTOH: 12345', 'CONTOH: P001', 'CONTOH: 1234567890', 'CONTOH: Ahmad Budi', 'CONTOH: Jakarta, 01 Januari 2010', 'CONTOH: Pak Rahman', ''],
            ['', '', '', '', '', '', '', '', '', '', ''],
        ];

        // Validation rules sheet
        const validationRules = [
            ['KOLOM', 'ATURAN VALIDASI', 'KETERANGAN'],
            ['KODE_SEKOLAH', 'Wajib diisi, angka 5 digit', 'Harus sesuai dengan kode sekolah yang sudah ada'],
            ['KODE_KELAS', 'Wajib diisi, format: angka+huruf', 'Contoh: 5A, 6B'],
            ['KODE_ROMBEL', 'Opsional, alfanumerik', 'Kode rombongan belajar'],
            ['KODE_BIASA', 'Wajib diisi, angka 3 digit', 'Nomor urut siswa di sekolah'],
            ['NIS', 'Wajib diisi, maksimal 20 karakter', 'Nomor Induk Siswa'],
            ['NO_PESERTA', 'Opsional, alfanumerik', 'Nomor peserta ujian'],
            ['NISN', 'Wajib diisi, angka 10 digit', 'Nomor Induk Siswa Nasional'],
            ['NAMA_SISWA', 'Wajib diisi, maksimal 50 karakter', 'Nama lengkap siswa'],
            ['TEMPAT_TANGGAL_LAHIR', 'Wajib diisi, format: Tempat, DD MM YYYY', 'Contoh: Jakarta, 01 Januari 2010'],
            ['NAMA_ORANG_TUA', 'Wajib diisi, maksimal 50 karakter', 'Nama orang tua/wali'],
            ['NO_IJAZAH', 'Opsional, akan diisi kemudian', 'Nomor ijazah siswa']
        ];

        const ws1 = XLSX.utils.aoa_to_sheet(siswaData);
        const ws2 = XLSX.utils.aoa_to_sheet(validationRules);

        XLSX.utils.book_append_sheet(wb, ws1, 'Data Siswa');
        XLSX.utils.book_append_sheet(wb, ws2, 'Aturan Validasi');
    }

    // Download template
    const fileName = `Template_${type.charAt(0).toUpperCase() + type.slice(1)}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showNotification(`Template Excel ${type} berhasil didownload: ${fileName}`, 'success');
}

// Enhanced validation function
function validateExcelData(data, type) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(data) || data.length === 0) {
        errors.push('Data kosong atau format tidak valid');
        return { isValid: false, errors, warnings };
    }

    data.forEach((row, index) => {
        const rowNum = index + 1;

        if (type === 'sekolah') {
            // Validasi data sekolah
            if (!row[0] || String(row[0]).trim() === '') {
                errors.push(`Baris ${rowNum}: KODE_BIASA wajib diisi`);
            } else if (!/^\d{5}$/.test(String(row[0]).trim())) {
                errors.push(`Baris ${rowNum}: KODE_BIASA harus berupa 5 digit angka`);
            }

            if (!row[2] || String(row[2]).trim() === '') {
                errors.push(`Baris ${rowNum}: NSS wajib diisi`);
            } else if (!/^\d{12}$/.test(String(row[2]).trim())) {
                errors.push(`Baris ${rowNum}: NSS harus berupa 12 digit angka`);
            }

            if (!row[3] || String(row[3]).trim() === '') {
                errors.push(`Baris ${rowNum}: NPSN wajib diisi`);
            } else if (!/^\d{8}$/.test(String(row[3]).trim())) {
                errors.push(`Baris ${rowNum}: NPSN harus berupa 8 digit angka`);
            }

            if (!row[4] || String(row[4]).trim() === '') {
                errors.push(`Baris ${rowNum}: NAMA_SEKOLAH wajib diisi`);
            } else if (String(row[4]).length > 100) {
                warnings.push(`Baris ${rowNum}: NAMA_SEKOLAH terlalu panjang (maksimal 100 karakter)`);
            }

            if (row[5] && !['Negeri', 'Swasta'].includes(String(row[5]).trim())) {
                warnings.push(`Baris ${rowNum}: STATUS sebaiknya 'Negeri' atau 'Swasta'`);
            }

            if (row[6] && !['SD', 'MI', 'SDS'].includes(String(row[6]).trim())) {
                warnings.push(`Baris ${rowNum}: BENTUK_PENDIDIKAN sebaiknya 'SD', 'MI', atau 'SDS'`);
            }

        } else if (type === 'siswa') {
            // Validasi data siswa
            if (!row[0] || String(row[0]).trim() === '') {
                errors.push(`Baris ${rowNum}: KODE_SEKOLAH wajib diisi`);
            } else if (!/^\d{5}$/.test(String(row[0]).trim())) {
                errors.push(`Baris ${rowNum}: KODE_SEKOLAH harus berupa 5 digit angka`);
            }

            if (!row[4] || String(row[4]).trim() === '') {
                errors.push(`Baris ${rowNum}: NIS wajib diisi`);
            }

            if (!row[6] || String(row[6]).trim() === '') {
                errors.push(`Baris ${rowNum}: NISN wajib diisi`);
            } else if (!/^\d{10}$/.test(String(row[6]).trim())) {
                errors.push(`Baris ${rowNum}: NISN harus berupa 10 digit angka`);
            }

            if (!row[7] || String(row[7]).trim() === '') {
                errors.push(`Baris ${rowNum}: NAMA_SISWA wajib diisi`);
            } else if (String(row[7]).length > 50) {
                warnings.push(`Baris ${rowNum}: NAMA_SISWA terlalu panjang (maksimal 50 karakter)`);
            }

            if (!row[8] || String(row[8]).trim() === '') {
                errors.push(`Baris ${rowNum}: TEMPAT_TANGGAL_LAHIR wajib diisi`);
            } else {
                // Validasi format tempat, tanggal lahir
                const ttlPattern = /^.+,\s*\d{1,2}\s+\w+\s+\d{4}$/;
                if (!ttlPattern.test(String(row[8]).trim())) {
                    warnings.push(`Baris ${rowNum}: Format TEMPAT_TANGGAL_LAHIR sebaiknya 'Tempat, DD Bulan YYYY'`);
                }
            }

            if (!row[9] || String(row[9]).trim() === '') {
                errors.push(`Baris ${rowNum}: NAMA_ORANG_TUA wajib diisi`);
            } else if (String(row[9]).length > 50) {
                warnings.push(`Baris ${rowNum}: NAMA_ORANG_TUA terlalu panjang (maksimal 50 karakter)`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        totalRows: data.length
    };
}

// Modal untuk menampilkan error validasi
function showValidationErrorModal(validationResult) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; border-radius: 12px; padding: 24px;
        max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    const errorList = validationResult.errors.map(err => `<li style="margin-bottom: 8px; color: #dc3545;">${err}</li>`).join('');

    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="color: #dc3545; font-size: 48px; margin-bottom: 12px;">⚠️</div>
            <h2 style="color: #dc3545; margin-bottom: 8px;">Validasi Gagal</h2>
            <p style="color: #666;">Data Excel mengandung error yang harus diperbaiki:</p>
        </div>

        <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #dc3545; margin-bottom: 12px;">Error yang ditemukan (${validationResult.errors.length}):</h4>
            <ul style="margin: 0; padding-left: 20px;">${errorList}</ul>
        </div>

        <div style="text-align: center;">
            <button id="closeValidationError" style="
                background: #dc3545; color: white; border: none; padding: 12px 24px;
                border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;
            ">Tutup dan Perbaiki Data</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('closeValidationError').onclick = () => {
        modal.remove();
    };

    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Modal untuk menampilkan warning validasi
function showValidationWarningModal(validationResult) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white; border-radius: 12px; padding: 24px;
            max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        const warningList = validationResult.warnings.map(warn => `<li style="margin-bottom: 8px; color: #f56500;">${warn}</li>`).join('');

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="color: #f56500; font-size: 48px; margin-bottom: 12px;">⚠️</div>
                <h2 style="color: #f56500; margin-bottom: 8px;">Peringatan Validasi</h2>
                <p style="color: #666;">Data Excel mengandung warning yang sebaiknya diperbaiki:</p>
            </div>

            <div style="background: #fffbf0; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h4 style="color: #f56500; margin-bottom: 12px;">Warning ditemukan (${validationResult.warnings.length}):</h4>
                <ul style="margin: 0; padding-left: 20px;">${warningList}</ul>
            </div>

            <div style="text-align: center; display: flex; gap: 12px; justify-content: center;">
                <button id="cancelWarning" style="
                    background: #6b7280; color: white; border: none; padding: 12px 24px;
                    border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;
                ">Batal dan Perbaiki</button>
                <button id="proceedWarning" style="
                    background: #f56500; color: white; border: none; padding: 12px 24px;
                    border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;
                ">Lanjutkan Import</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        document.getElementById('cancelWarning').onclick = () => {
            modal.remove();
            resolve(false);
        };

        document.getElementById('proceedWarning').onclick = () => {
            modal.remove();
            resolve(true);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

// Modal untuk preview data sebelum import
function showImportPreviewModal(data, type, validationResult) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white; border-radius: 12px; padding: 24px;
            max-width: 90%; width: 1000px; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        // Create preview table
        const previewRows = data.slice(0, 5); // Show first 5 rows
        const headers = type === 'sekolah'
            ? ['KODE_BIASA', 'KODE_REGISTRASI', 'NSS', 'NPSN', 'NAMA_SEKOLAH', 'STATUS', 'BENTUK_PENDIDIKAN', 'KEPALA_SEKOLAH', 'OPERATOR']
            : ['KODE_SEKOLAH', 'KODE_KELAS', 'KODE_ROMBEL', 'KODE_BIASA', 'NIS', 'NO_PESERTA', 'NISN', 'NAMA_SISWA', 'TEMPAT_TANGGAL_LAHIR', 'NAMA_ORANG_TUA', 'NO_IJAZAH'];

        const tableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        ${headers.map(h => `<th style="border: 1px solid #dee2e6; padding: 8px; font-size: 12px;">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${previewRows.map(row => `
                        <tr>
                            ${headers.map((_, i) => `<td style="border: 1px solid #dee2e6; padding: 8px; font-size: 12px;">${row[i] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="color: #28a745; font-size: 48px; margin-bottom: 12px;">📊</div>
                <h2 style="color: #28a745; margin-bottom: 8px;">Preview Import Data</h2>
                <p style="color: #666;">Konfirmasi data yang akan diimport:</p>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div><strong>Total Rows:</strong> ${validationResult.totalRows}</div>
                    <div><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div><strong>Errors:</strong> <span style="color: ${validationResult.errors.length > 0 ? '#dc3545' : '#28a745'}">${validationResult.errors.length}</span></div>
                    <div><strong>Warnings:</strong> <span style="color: ${validationResult.warnings.length > 0 ? '#f56500' : '#28a745'}">${validationResult.warnings.length}</span></div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px;">Preview Data (5 baris pertama):</h4>
                <div style="overflow-x: auto; border: 1px solid #dee2e6; border-radius: 8px;">
                    ${tableHTML}
                </div>
                ${data.length > 5 ? `<p style="text-align: center; color: #666; margin-top: 8px; font-size: 14px;">... dan ${data.length - 5} baris lainnya</p>` : ''}
            </div>

            <div style="text-align: center; display: flex; gap: 12px; justify-content: center;">
                <button id="cancelImport" style="
                    background: #6b7280; color: white; border: none; padding: 12px 24px;
                    border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;
                ">Batal</button>
                <button id="confirmImport" style="
                    background: #28a745; color: white; border: none; padding: 12px 24px;
                    border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;
                ">Import Data (${validationResult.totalRows} rows)</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        document.getElementById('cancelImport').onclick = () => {
            modal.remove();
            resolve(false);
        };

        document.getElementById('confirmImport').onclick = () => {
            modal.remove();
            resolve(true);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

// Enhanced handleFile with smart validation
async function handleFile(event, tableId) {
  const uploadBtn = event.target.closest('.btn, button');
  let originalText = '';
  
  try {
    if (uploadBtn) originalText = showButtonLoading(uploadBtn);
    if (typeof showLoader === 'function') showLoader('Memproses file Excel...');

    const file = event.target?.files?.[0];
    if (!file) {
      if (typeof showSmartNotification === 'function') showSmartNotification('Tidak ada file yang dipilih.', 'warning', 'upload file');
      return;
    }

    // Baca SEMUA sheet lalu gabungkan barisnya
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const allRows = [];
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      let rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }) || [];
      if (!rows.length) continue;
      rows.shift(); // buang header
      rows = rows.filter(r => Array.isArray(r) && r.some(c => String(c ?? '').trim() !== ''));
      if (rows.length) allRows.push(...rows);
    }

    if (!allRows.length) {
      if (typeof showNotification === 'function') showNotification('Tidak ada baris data valid pada file.', 'warning');
      return;
    }

    // VALIDASI DIHAPUS - Langsung import tanpa validasi

    // Kirim ke backend
    const result = await fetchWithAuth(apiUrl(`/api/data/import/${tableId}`), {
      method: 'POST',
      body: JSON.stringify(allRows)
    });
    if (!result?.success) throw new Error(result?.message || 'Import gagal pada server.');

    // --- PERTAHANKAN pilihan rows-per-page yang sedang aktif (default 10) ---
    let preservedRowsPerPage = 10;
    // coba ambil dari UI select yang sekarang
    const rowsSelect =
      document.querySelector(`.pagination-controls[data-table-id="${tableId}"] .rows-per-page`) ||
      document.querySelector(`#${tableId} .pagination-controls .rows-per-page`);
    if (rowsSelect && rowsSelect.value) {
      preservedRowsPerPage = rowsSelect.value; // "10" | "30" | "50" | "all"
    } else if (typeof paginationState === 'object' && paginationState?.[tableId]?.rowsPerPage) {
      // fallback ke state lama jika select belum ada/baru
      preservedRowsPerPage = paginationState[tableId].rowsPerPage;
    }

    // Ambil ulang data dari server agar state FE sinkron
    const ok = await fetchDataFromServer();
    if (!ok) throw new Error('Gagal memuat ulang data dari server setelah import.');

    // Reset search hanya untuk tabel terkait (biar hasil import terlihat)
    const searchEl =
      document.getElementById(`search${tableId.charAt(0).toUpperCase()}${tableId.slice(1)}`) ||
      document.querySelector(`.search-bar[data-table-id="${tableId}"]`);
    if (searchEl) searchEl.value = '';
    if (typeof searchState === 'object' && Object.prototype.hasOwnProperty.call(searchState, tableId)) {
      searchState[tableId] = '';
    }

    // Terapkan kembali pagination yang dipertahankan (TIDAK lagi dipaksa 'all')
    if (typeof paginationState === 'object') {
      if (!paginationState[tableId]) paginationState[tableId] = { currentPage: 1, rowsPerPage: 10 };
      paginationState[tableId].currentPage = 1;
      paginationState[tableId].rowsPerPage = preservedRowsPerPage;
    }

    // Render ulang tabel yang relevan
    if (typeof renderAdminTable === 'function') {
      renderAdminTable(tableId); // 'sekolah' | 'siswa'
    } else if (typeof rerenderActiveTable === 'function') {
      rerenderActiveTable(tableId);
    }

    // Refresh student search data if siswa table was updated
    if (tableId === 'siswa') {
      refreshSiswaSearchData();
    }

    if (typeof showNotification === 'function') {
      const info = result?.message || `${allRows.length} baris diimpor.`;
      showNotification(`Import ${tableId} berhasil: ${info}`, 'success');
    }

    // Reset input file agar bisa pilih file sama lagi
    event.target.value = '';
  } catch (err) {
    console.error('Import error:', err);
    if (typeof showSmartNotification === 'function') {
      showSmartNotification(err, 'error', 'import file Excel');
    }
  } finally {
    if (uploadBtn) hideButtonLoading(uploadBtn, originalText);
    if (typeof hideLoader === 'function') hideLoader();
  }
}




async function handleDeleteAllDataClick(event) {
  const getTableId = () => {
    // Ambil tableId dari tombol (data-table-id="sekolah" | "siswa")
    const src = event?.currentTarget || event?.target;
    return src?.dataset?.tableId || 'sekolah';
  };

  const tableId = getTableId();

  // Pesan peringatan sesuai konteks
  const warningMessage =
    tableId === 'sekolah'
      ? [
          'Anda akan MENGHAPUS SEMUA DATA SEKOLAH.',
          'Karena relasi database (FOREIGN KEY + CASCADE), SEMUA SISWA, NILAI, dan FOTO TERKAIT juga akan ikut terhapus.',
          '',
          'Tindakan ini tidak dapat dibatalkan.',
          'Ketik HAPUS untuk konfirmasi kemudian tekan OK.'
        ].join('\n')
      : [
          'Perhatian:',
          'Saat ini penghapusan massal berjalan di level basis data.',
          'Menjalankan "hapus semua" akan mengosongkan tabel-tabel terkait (termasuk siswa & nilai).',
          '',
          'Tindakan ini tidak dapat dibatalkan.',
          'Ketik HAPUS untuk konfirmasi kemudian tekan OK.'
        ].join('\n');

  const confirmText = prompt(warningMessage, '');
  if (confirmText !== 'HAPUS') {
    if (typeof showNotification === 'function') showNotification('Dibatalkan.', 'warning');
    return;
  }

  try {
    if (typeof showLoader === 'function') showLoader();

    // Panggil endpoint global wipe (hapus semua tabel terkait)
    const result = await fetchWithAuth(apiUrl('/api/data/delete-all'), {
      method: 'POST'
    });

    if (!result?.success) {
      throw new Error(result?.message || 'Gagal menghapus data.');
    }

    // Muat ulang database dari server agar state FE fresh
    const ok = await fetchDataFromServer();
    if (!ok) throw new Error('Gagal memuat ulang data setelah penghapusan.');

    // === RESET UI untuk kedua tabel admin (sekolah & siswa) ===
    const idsToReset = ['sekolah', 'siswa'];

    idsToReset.forEach((id) => {
      // Bersihkan search bar jika ada
      const searchEl =
        document.getElementById(`search${id.charAt(0).toUpperCase()}${id.slice(1)}`) ||
        document.querySelector(`.search-bar[data-table-id="${id}"]`);
      if (searchEl) searchEl.value = '';

      // Reset state pencarian
      if (typeof searchState === 'object' && Object.prototype.hasOwnProperty.call(searchState, id)) {
        searchState[id] = '';
      }

      // Reset pagination (ke halaman 1, dan tampilkan 'all' agar terlihat kosong jelas)
      if (typeof paginationState === 'object') {
        if (!paginationState[id]) paginationState[id] = { currentPage: 1, rowsPerPage: 10 };
        paginationState[id].currentPage = 1;
        paginationState[id].rowsPerPage = 'all';
      }
    });

    // Render ulang tabel admin jika fungsinya tersedia
    if (typeof renderAdminTable === 'function') {
      idsToReset.forEach((id) => renderAdminTable(id));
    } else if (typeof rerenderActiveTable === 'function') {
      idsToReset.forEach((id) => rerenderActiveTable(id));
    }

    if (typeof showNotification === 'function') {
      showNotification('Seluruh data berhasil dihapus.', 'success');
    }
  } catch (err) {
    console.error('Delete-all error:', err);
    if (typeof showNotification === 'function') {
      showNotification(err.message || 'Terjadi kesalahan saat menghapus data.', 'error');
    }
  } finally {
    if (typeof hideLoader === 'function') hideLoader();
    // (opsional) blur tombol agar efek fokus hilang
    try { (event?.currentTarget || event?.target)?.blur?.(); } catch (e) {  }
  }
}
// === FINAL: Pasang event handler tombol hapus (Admin) ===
function bindAdminDeleteAllButtons() {
  // Tombol "Hapus Semua Data" di section Database Sekolah
  const btnDelSekolah = document.querySelector('#sekolah .btn.btn-delete[data-table-id="sekolah"]');
  if (btnDelSekolah) {
    btnDelSekolah.removeEventListener('click', handleDeleteAllSekolahClick);
    btnDelSekolah.addEventListener('click', handleDeleteAllSekolahClick);
  }

  // Tombol "Hapus Semua Data" di section Database Siswa
  const btnDelSiswa = document.querySelector('#siswa .btn.btn-delete[data-table-id="siswa"]');
  if (btnDelSiswa) {
    btnDelSiswa.removeEventListener('click', handleDeleteAllSiswaClick);
    btnDelSiswa.addEventListener('click', handleDeleteAllSiswaClick);
  }
}

// panggil setelah DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindAdminDeleteAllButtons);
} else {
  bindAdminDeleteAllButtons();
}
// === FINAL: Hapus semua SEKOLAH (FE) ===
async function handleDeleteAllSekolahClick(event) {
  const confirmed = confirm(
    'Anda akan MENGHAPUS SEMUA DATA SEKOLAH.\n' +
    'Tindakan ini hanya menyasar tabel SEKOLAH.\n' +
    'Jika masih ada SISWA terkait, penghapusan akan DITOLAK.\n\n' +
    'Apakah Anda yakin?'
  );
  if (!confirmed) {
    if (typeof showNotification === 'function') showNotification('Dibatalkan.', 'warning');
    return;
  }

  try {
    if (typeof showLoader === 'function') showLoader();

    // Gunakan endpoint yang sama dengan deleteAllData untuk konsistensi
    const result = await fetchWithAuth(apiUrl('/api/data/delete-all'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'sekolah' })
    });

    if (!result?.success) throw new Error(result?.message || 'Gagal menghapus data sekolah.');

    // Sinkronisasi ulang state FE dengan DB
    const ok = await fetchDataFromServer();
    if (!ok) throw new Error('Gagal memuat ulang data setelah penghapusan.');

    // Reset UI untuk tabel sekolah & siswa (keduanya jadi kosong)
    ['sekolah', 'siswa'].forEach((id) => {
      const searchEl =
        document.getElementById(`search${id.charAt(0).toUpperCase()}${id.slice(1)}`) ||
        document.querySelector(`.search-bar[data-table-id="${id}"]`);
      if (searchEl) searchEl.value = '';
      if (typeof searchState === 'object' && Object.prototype.hasOwnProperty.call(searchState, id)) {
        searchState[id] = '';
      }
      if (typeof paginationState === 'object') {
        if (!paginationState[id]) paginationState[id] = { currentPage: 1, rowsPerPage: 10 };
        paginationState[id].currentPage = 1;
        paginationState[id].rowsPerPage = 'all';
      }
    });

    // Render ulang tabel admin
    if (typeof renderAdminTable === 'function') {
      renderAdminTable('sekolah');
      renderAdminTable('siswa');
    } else if (typeof rerenderActiveTable === 'function') {
      rerenderActiveTable('sekolah');
      rerenderActiveTable('siswa');
    }

    if (typeof showNotification === 'function') showNotification('Semua data sekolah (beserta siswa & nilai) berhasil dihapus.', 'success');
  } catch (err) {
    console.error('Delete-all sekolah error:', err);
    if (typeof showNotification === 'function') showNotification(err.message || 'Terjadi kesalahan saat menghapus sekolah.', 'error');
  } finally {
    if (typeof hideLoader === 'function') hideLoader();
    try { (event?.currentTarget || event?.target)?.blur?.(); } catch (e) {  }
  }
}
// === FINAL: Hapus semua SISWA (FE) ===
async function handleDeleteAllSiswaClick(event) {
  const confirmed = confirm(
    'Anda akan MENGHAPUS SEMUA DATA SISWA.\n' +
    'Tindakan ini hanya menyasar tabel SISWA.\n' +
    'Jika masih ada NILAI/FOTO terkait, penghapusan akan DITOLAK.\n' +
    'DATA SEKOLAH TETAP ADA.\n\n' +
    'Apakah Anda yakin?'
  );
  if (!confirmed) {
    if (typeof showNotification === 'function') showNotification('Dibatalkan.', 'warning');
    return;
  }

  try {
    if (typeof showLoader === 'function') showLoader();

    // Gunakan endpoint yang sama dengan deleteAllData untuk konsistensi
    const result = await fetchWithAuth(apiUrl('/api/data/delete-all'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: 'siswa' })
    });

    if (!result?.success) throw new Error(result?.message || 'Gagal menghapus data siswa.');

    // Sinkronisasi ulang state FE dengan DB
    const ok = await fetchDataFromServer();
    if (!ok) throw new Error('Gagal memuat ulang data setelah penghapusan.');

    // Reset UI untuk tabel siswa (sekolah dibiarkan)
    const id = 'siswa';
    const searchEl =
      document.getElementById(`search${id.charAt(0).toUpperCase()}${id.slice(1)}`) ||
      document.querySelector(`.search-bar[data-table-id="${id}"]`);
    if (searchEl) searchEl.value = '';
    if (typeof searchState === 'object' && Object.prototype.hasOwnProperty.call(searchState, id)) {
      searchState[id] = '';
    }
    if (typeof paginationState === 'object') {
      if (!paginationState[id]) paginationState[id] = { currentPage: 1, rowsPerPage: 10 };
      paginationState[id].currentPage = 1;
      paginationState[id].rowsPerPage = 'all';
    }

    // Render ulang tabel siswa (dan sekolah untuk kepastian state)
    if (typeof renderAdminTable === 'function') {
      renderAdminTable('siswa');
      renderAdminTable('sekolah');
    } else if (typeof rerenderActiveTable === 'function') {
      rerenderActiveTable('siswa');
      rerenderActiveTable('sekolah');
    }

    if (typeof showNotification === 'function') showNotification('Semua data siswa (beserta nilai & foto) berhasil dihapus. Data sekolah tetap ada.', 'success');
  } catch (err) {
    console.error('Delete-all siswa error:', err);
    if (typeof showNotification === 'function') showNotification(err.message || 'Terjadi kesalahan saat menghapus siswa.', 'error');
  } finally {
    if (typeof hideLoader === 'function') hideLoader();
    try { (event?.currentTarget || event?.target)?.blur?.(); } catch (e) {  }
  }
}
// ====== INIT LOGIN UI (ringan, tidak mengubah handleLogin) ======
(function initLoginUI() {
  // autofocus ke appCode
  const code = document.getElementById('appCode');
  if (code) code.focus();

  // Reset tombol login ke state normal saat halaman dimuat
  const loginBtn = document.querySelector('#loginForm button[type="submit"]');
  if (loginBtn) {
    loginBtn.disabled = false;
    loginBtn.style.opacity = '1';
    loginBtn.textContent = 'Masuk';
  }

  // tombol "Tempel" ambil dari clipboard

  // tombol Batal: bersihkan input & reset radio
  const cancel = document.getElementById('cancelBtn');
  if (cancel) {
    cancel.addEventListener('click', () => {
      const form = document.getElementById('loginForm');
      if (form) form.reset();
      if (code) { code.value = ''; code.focus(); }
      // defaultkan ke Merdeka
      const r1 = document.getElementById('kurikulumMerdeka');
      if (r1) r1.checked = true;


      // Reset tombol login ke state normal
      const loginBtn = document.querySelector('#loginForm button[type="submit"]');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
        loginBtn.textContent = 'Masuk';
      }
    });
  }

  // enter tekan di input => submit form (fallback)
  if (code) {
    code.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const form = document.getElementById('loginForm');
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
      }
    });
  }
})();

// Paksa re-render halaman "Isi Nilai" setelah simpan bulk
async function refreshIsiNilaiViewAfterSave() {

  // ambil state semester aktif dari pagination state
  const sem = paginationState?.isiNilai?.currentSemester;
  const semName = paginationState?.isiNilai?.currentSemesterName || '';


  // AGGRESSIVE RESET: reset semua state pagination & search
  if (paginationState?.isiNilai) {
    paginationState.isiNilai.currentPage = 1;
    paginationState.isiNilai.rowsPerPage = 10; // force ke default
  }

  // Clear search state jika ada
  if (searchState) {
    searchState.isiNilai = '';
  }

  // Clear search input di UI
  const searchInput = document.getElementById('searchIsiNilai');
  if (searchInput) {
    searchInput.value = '';
  }

  // FORCE DELAY: tunggu sebentar untuk memastikan data sudah ter-update di memori
  await new Promise(resolve => setTimeout(resolve, 100));

  // kalau ada fungsi render halaman, panggil itu
  if (typeof window.renderIsiNilaiPage === 'function') {
    window.renderIsiNilaiPage(sem, semName);
  }
  // Redundant else-if block removed to fix no-dupe-else-if error.
  // fallback ekstra: kalau app pakai router internal per menu
  else if (typeof window.switchSekolahContent === 'function') {
    try { window.switchSekolahContent('isiNilai'); } catch (e) {  }
  }

  // FORCE UPDATE pagination controls setelah render
  setTimeout(() => {
    if (typeof window.updatePaginationControls === 'function') {
      try { window.updatePaginationControls('isiNilai'); } catch (e) {  }
    }
    // Update pagination info yang spesifik untuk isiNilai
    if (typeof window.optimizedUpdatePaginationControls === 'function') {
      const allSiswa = database.siswa?.filter(siswa => String(siswa[0]) === String(window.currentUser.schoolData[0])) || [];
      try { window.optimizedUpdatePaginationControls('isiNilai', allSiswa.length); } catch (e) {  }
    }
  }, 200);
}

// Tunggu semua <img> di dalam root selesai load agar html2canvas akurat
async function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'))
    .filter(img => !img.complete || img.naturalWidth === 0);
  if (imgs.length === 0) return;
  await Promise.all(imgs.map(img => new Promise(resolve => {
    // pastikan CORS aman untuk logo dari blob/url eksternal
    if (!img.crossOrigin) img.crossOrigin = 'anonymous';
    const done = () => resolve();
    img.onload = done; img.onerror = done;
  })));
}
// === ADD: konstanta DPI dan helper konversi ===
const PX_PER_MM = 96 / 25.4; // 3.77952755906
function mmToPx(mm) { return mm * PX_PER_MM; }


// === ADD: Live preview posisi & ukuran logo pada dokumen yang sedang tampil ===
// === Fungsi untuk update label slider ===
function updateSliderLabel(sliderId) {
  const labelMap = {
    'settingLogoLeftSize': 'logoLeftSizeLabel',
    'settingLogoRightSize': 'logoRightSizeLabel',
    'settingLogoLeftPosTop': 'logoLeftPosTopLabel',
    'settingLogoLeftPosLeft': 'logoLeftPosLeftLabel',
    'settingLogoRightPosTop': 'logoRightPosTopLabel',
    'settingLogoRightPosRight': 'logoRightPosRightLabel'
  };
  
  const labelId = labelMap[sliderId];
  if (labelId) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (slider && label) {
      label.textContent = slider.value;
    }
  }
}

function updateLogoPreviewUI() {
  // Check if user is PRO
  const schoolKodeBiasa = window.currentUser?.schoolData?.[0];
  const isProUser = window.currentUser?.loginType === 'pro' ||
                   (schoolKodeBiasa && localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true');

  // Load logo data from settings into preview elements first
  if (window.currentUser?.schoolData) {
    const settings = database?.settings?.[schoolKodeBiasa] || {};

    // Update main logo preview elements with settings data or defaults
    const leftPrev = document.getElementById('logoLeftPreview');
    const rightPrev = document.getElementById('logoRightPreview');

    // Set logo source: custom if PRO and exists, otherwise default
    if (leftPrev) {
      leftPrev.src = (isProUser && settings.logoLeft) ? settings.logoLeft : './assets/kop-left-melawi.png';
    }
    if (rightPrev) {
      rightPrev.src = (isProUser && settings.logoRight) ? settings.logoRight : './assets/kop-right-tutwuri.png';
    }

    // Show/hide upload controls and warnings based on user type
    const leftUploadBtn = document.getElementById('logoLeftUploadBtn');
    const rightUploadBtn = document.getElementById('logoRightUploadBtn');
    const leftWarning = document.getElementById('logoLeftProWarning');
    const rightWarning = document.getElementById('logoRightProWarning');
    const leftInput = document.getElementById('settingLogoLeftInput');
    const rightInput = document.getElementById('settingLogoRightInput');

    if (!isProUser) {
      // User biasa: disable upload, show warning
      if (leftUploadBtn) leftUploadBtn.style.display = 'none';
      if (rightUploadBtn) rightUploadBtn.style.display = 'none';
      if (leftWarning) leftWarning.style.display = 'block';
      if (rightWarning) rightWarning.style.display = 'block';
      if (leftInput) leftInput.disabled = true;
      if (rightInput) rightInput.disabled = true;
    } else {
      // User PRO: enable upload, hide warning
      if (leftUploadBtn) leftUploadBtn.style.display = 'inline-block';
      if (rightUploadBtn) rightUploadBtn.style.display = 'inline-block';
      if (leftWarning) leftWarning.style.display = 'none';
      if (rightWarning) rightWarning.style.display = 'none';
      if (leftInput) leftInput.disabled = false;
      if (rightInput) rightInput.disabled = false;
    }
  }

  // Ambil nilai saat ini dari slider Setting (jika ada di DOM)
  const getNum = (id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : null;
  };

  const leftTop   = getNum('settingLogoLeftPosTop');
  const leftLeft  = getNum('settingLogoLeftPosLeft');
  const rightTop  = getNum('settingLogoRightPosTop');
  const rightRight= getNum('settingLogoRightPosRight');
  const leftSize  = getNum('settingLogoLeftSize');
  const rightSize = getNum('settingLogoRightSize');

  // Update live preview di tab Pengaturan Logo
  const livePreviewLeft = document.getElementById('livePreviewLeftLogo');
  const livePreviewRight = document.getElementById('livePreviewRightLogo');
  const livePreviewPlaceholder = document.getElementById('livePreviewPlaceholder');
  
  if (livePreviewLeft || livePreviewRight) {
    
    // Update data sekolah dari window.currentUser dan settings
    if (window.currentUser?.schoolData) {
      const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
      const settings = database?.settings?.[schoolKodeBiasa] || {};
      
      // Update nama sekolah dan alamat
      const schoolNameEl = document.getElementById('livePreviewSchoolName');
      const schoolAddressEl = document.getElementById('livePreviewSchoolAddress');
      
      if (schoolNameEl) {
        const schoolName = (window.currentUser.schoolData[4] || 'NAMA SEKOLAH').toUpperCase();
        schoolNameEl.textContent = schoolName;
      }
      
      if (schoolAddressEl) {
        schoolAddressEl.textContent = settings.schoolAddress || 'Alamat Sekolah Belum Diatur';
      }
    }
    
    let hasLogo = false;
    
    if (livePreviewLeft) {
      // Gunakan nilai dari slider atau default yang sama dengan template dokumen
      const finalLeftTop = leftTop !== null ? leftTop : 13;  // default sama dengan template
      const finalLeftLeft = leftLeft !== null ? leftLeft : 15; // default sama dengan template  
      const finalLeftSize = leftSize !== null ? leftSize : 80; // default sama dengan template
      
      // Posisi logo identik dengan popup modal (posisi absolut dari container berpadding)
      livePreviewLeft.style.top = `${finalLeftTop}mm`;
      livePreviewLeft.style.left = `${finalLeftLeft}mm`;
      livePreviewLeft.style.width = `${finalLeftSize}px`;
      
      
      // Show logo (always visible with default or custom)
      const logoLeftPreview = document.getElementById('logoLeftPreview');
      if (logoLeftPreview && logoLeftPreview.src) {
        livePreviewLeft.src = logoLeftPreview.src;
        livePreviewLeft.style.display = 'block';
        hasLogo = true;
      } else {
        // Fallback to default
        livePreviewLeft.src = './assets/kop-left-melawi.png';
        livePreviewLeft.style.display = 'block';
        hasLogo = true;
      }
    }
    
    if (livePreviewRight) {
      // Gunakan nilai dari slider atau default yang sama dengan template dokumen
      const finalRightTop = rightTop !== null ? rightTop : 13;   // default sama dengan template
      const finalRightRight = rightRight !== null ? rightRight : 15; // default sama dengan template
      const finalRightSize = rightSize !== null ? rightSize : 80;  // default sama dengan template
      
      // Posisi logo identik dengan popup modal (posisi absolut dari container berpadding)
      livePreviewRight.style.top = `${finalRightTop}mm`;
      livePreviewRight.style.right = `${finalRightRight}mm`;
      livePreviewRight.style.width = `${finalRightSize}px`;
      
      
      // Show logo (always visible with default or custom)
      const logoRightPreview = document.getElementById('logoRightPreview');
      if (logoRightPreview && logoRightPreview.src) {
        livePreviewRight.src = logoRightPreview.src;
        livePreviewRight.style.display = 'block';
        hasLogo = true;
      } else {
        // Fallback to default
        livePreviewRight.src = './assets/kop-right-tutwuri.png';
        livePreviewRight.style.display = 'block';
        hasLogo = true;
      }
    }
    
    // Hide/show placeholder based on whether logos are present
    if (livePreviewPlaceholder) {
      livePreviewPlaceholder.style.display = hasLogo ? 'none' : 'block';
    }
  }

  // Akar preview yang mungkin aktif: modal Transkrip/SKL/SKKB + kanvas PDF
  const roots = ['transkripContent', 'sklContent', 'skkbContent', 'pdf-content']
    .map(id => document.getElementById(id))
    .filter(Boolean);


  // Terapkan ke setiap dokumen yang sedang ada di DOM
  roots.forEach(root => {
    // di template, logo pakai alt "Logo Kiri" & "Logo Kanan"
    const leftImg  = root.querySelector('img[alt="Logo Kiri"]');
    const rightImg = root.querySelector('img[alt="Logo Kanan"]');


    if (leftImg) {
      if (leftTop   != null) leftImg.style.top   = `${leftTop}mm`;
      if (leftLeft  != null) leftImg.style.left  = `${leftLeft}mm`;
      if (leftSize  != null) leftImg.style.width = `${leftSize}px`;
    }
    if (rightImg) {
      if (rightTop   != null) rightImg.style.top   = `${rightTop}mm`;
      if (rightRight != null) rightImg.style.right = `${rightRight}mm`;
      if (rightSize  != null) rightImg.style.width = `${rightSize}px`;
    }
  });
}

// === Fungsi untuk bind live logo preview ===
function bindLiveLogoOnce() {
  const form = document.getElementById('settingsForm');
  if (!form || form.dataset.liveLogoBound) return;

  const ids = [
    'settingLogoLeftPosTop',
    'settingLogoLeftPosLeft',
    'settingLogoRightPosTop',
    'settingLogoRightPosRight',
    'settingLogoLeftSize',
    'settingLogoRightSize'
  ];
  
  
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        // Update label
        updateSliderLabel(id);
        // Update live preview
        updateLogoPreviewUI();
      });
    } else {

    }
  });

  form.dataset.liveLogoBound = '1';
}

// ===== AKTIVASI KODE PRO FUNCTIONALITY =====
function initAktivasiKodePro() {
  const kodeProInput = document.getElementById('kodeProInput');
  const aktivasiButton = document.getElementById('aktivasiButton');
  const menuAktivasiKodePro = document.getElementById('menuAktivasiKodePro');
  
  
  // Check if already activated (scoped per sekolah) — hanya untuk UI, tidak mengubah loginType
  const schoolKodeBiasa = window.currentUser?.schoolData?.[0];
  const schoolKodePro = window.currentUser?.schoolData?.[1]; // kodePro dari database
  const isProForSchool = schoolKodeBiasa ? localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true' : false;
  
  // Menu aktivasi hanya disabled jika:
  // 1. User login dengan kode PRO, atau
  // 2. User login dengan kode biasa tapi sudah pernah aktivasi PRO (tersimpan di localStorage)
  if (window.currentUser?.loginType === 'pro' || (window.currentUser?.loginType === 'biasa' && isProForSchool)) {
    disableAktivasiMenu();
    showSuccessStatus();
    return;
  }
  
  // Bind input listeners sekali saja
  if (kodeProInput && kodeProInput.dataset.bound !== '1') {
    // Auto uppercase and limit to 8 characters
    const onInput = function() {
      let value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (value.length > 8) value = value.substring(0, 8);
      this.value = value;
      if (aktivasiButton) aktivasiButton.disabled = value.length !== 8;
    };
    const onPaste = function(e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      const cleanPaste = paste.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
      this.value = cleanPaste;
      if (aktivasiButton) aktivasiButton.disabled = cleanPaste.length !== 8;
    };
    kodeProInput.addEventListener('input', onInput);
    kodeProInput.addEventListener('paste', onPaste);
    kodeProInput.dataset.bound = '1';
  }
  
  // Bind click listener sekali saja
  if (aktivasiButton && aktivasiButton.dataset.bound !== '1') {
    aktivasiButton.addEventListener('click', async function() {
      const kodePro = kodeProInput.value.trim();
      
      if (kodePro.length !== 8) {
        showNotification('Kode Pro harus 8 karakter!', 'error');
        return;
      }
      
      try {
        showLoader();
        
        // Here you would normally validate the code with your server
        // For now, we'll simulate a successful activation
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        // Validasi kode pro yang dimasukkan user
        const inputPro = kodePro.toString().trim().toUpperCase();
        const expectedPro = (window.currentUser?.schoolData?.[1] || '').toString().trim().toUpperCase();
        
        // Debug logging (sensitive data removed for security)
        
        // Jika sekolah sudah punya kode PRO di database, validasi harus match
        // Jika belum ada, terima kode PRO apapun yang valid (8 karakter alphanumeric)
        if (expectedPro && inputPro !== expectedPro) {
          hideLoader();
          showNotification('Kode Pro tidak sesuai', 'error');
          return;
        }
        
        // Jika tidak ada kode PRO di database, validasi format saja
        if (!expectedPro && !/^[A-Z0-9]{8}$/.test(inputPro)) {
          hideLoader();
          showNotification('Kode Pro harus 8 karakter huruf/angka!', 'error');
          return;
        }

        // Mark as activated (per sekolah)
        if (schoolKodeBiasa) {
          localStorage.setItem(`kodeProActivated:${schoolKodeBiasa}`, 'true');
          localStorage.setItem(`kodeProValue:${schoolKodeBiasa}`, kodePro);
        }
        
        // Aktifkan fitur PRO pada sesi saat ini (setelah validasi berhasil)
        if (window.currentUser && window.currentUser.isLoggedIn && window.currentUser.role === 'sekolah') {
          window.currentUser.loginType = 'pro';
          const sessionData = JSON.parse(localStorage.getItem('currentUserSession') || '{}');
          if (sessionData) {
            sessionData.loginType = 'pro';
            localStorage.setItem('currentUserSession', JSON.stringify(sessionData));
          }
        }
        
        // Show success status
        showSuccessStatus();
        
        // Disable the menu
        disableAktivasiMenu();
        
        // Update UI & reload agar fitur PRO aktif menyeluruh
        if (typeof renderVersionBadge === 'function') renderVersionBadge();
        // Render ulang profil siswa jika sedang dibuka
        try { if (typeof renderProfilSiswa === 'function') renderProfilSiswa(); } catch (e) {}
        // Reload ringan agar seluruh fitur mengambil loginType terbaru
        setTimeout(() => { try { window.location.reload(); } catch(e) {} }, 600);
        
        // Show popup notification
        showAktivasiSuccessPopup(kodePro);
        
        hideLoader();
        
      } catch (error) {
        hideLoader();
        showNotification('Gagal mengaktivasi kode pro. Silakan coba lagi.', 'error');
      }
    });
    aktivasiButton.dataset.bound = '1';
  }
}

function showSuccessStatus() {
  const successDiv = document.getElementById('aktivasiSuccess');
  const formContainer = document.querySelector('.aktivasi-form-container');
  
  if (successDiv && formContainer) {
    successDiv.classList.add('show');
    formContainer.style.display = 'none';
    
    const kodeBiasa = window.currentUser?.schoolData?.[0];
    const kodePro = (kodeBiasa && localStorage.getItem(`kodeProValue:${kodeBiasa}`)) || '********';
    const codeDisplay = successDiv.querySelector('.kode-pro-display');
    if (codeDisplay) {
      codeDisplay.textContent = kodePro;
    }
  }
}

function disableAktivasiMenu() {
  const menuItem = document.getElementById('menuAktivasiKodePro');
  if (menuItem) {
    menuItem.classList.add('disabled');
    // Tambahkan event listener untuk mencegah klik
    menuItem.addEventListener('click', preventDisabledClick);
  }
}

function enableAktivasiMenu() {
  const menuItem = document.getElementById('menuAktivasiKodePro');
  if (menuItem) {
    menuItem.classList.remove('disabled');
    // Hapus event listener untuk memungkinkan klik
    menuItem.removeEventListener('click', preventDisabledClick);
  }
}

// Function untuk mencegah klik pada menu disabled
function preventDisabledClick(event) {
  const menuItem = event.target.closest('#menuAktivasiKodePro');
  if (menuItem && menuItem.classList.contains('disabled')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}

function showAktivasiSuccessPopup(kodePro) {
  const popup = document.createElement('div');
  popup.className = 'success-popup-overlay';
  popup.innerHTML = `
    <div class="success-popup-content">
      <div class="success-popup-icon">✅</div>
      <h2>Berhasil Aktivasi!</h2>
      <p>Kode Pro <strong>${kodePro}</strong> berhasil diaktivasi.</p>
      <p>Sekarang Anda memiliki akses penuh ke semua fitur aplikasi.</p>
      <button class="popup-close-btn" onclick="closeSuccessPopup()">Tutup</button>
    </div>
  `;
  
  // Add popup styles
  const style = document.createElement('style');
  style.textContent = `
    .success-popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }
    
    .success-popup-content {
      background: white;
      padding: 40px 30px;
      border-radius: 15px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .success-popup-icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    
    .success-popup-content h2 {
      color: var(--success-green);
      margin-bottom: 15px;
      font-size: 24px;
    }
    
    .success-popup-content p {
      color: #666;
      margin-bottom: 15px;
      line-height: 1.5;
    }
    
    .popup-close-btn {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
      transition: background 0.3s ease;
    }
    
    .popup-close-btn:hover {
      background: #3a7bc8;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(popup);
}

function closeSuccessPopup() {
  const popup = document.querySelector('.success-popup-overlay');
  if (popup) {
    popup.remove();
  }
}

// Initialize when switching to aktivasi page
function switchToAktivasiKodePro() {
  if (document.getElementById('aktivasiKodeProSection')) {
    initAktivasiKodePro();
  }
}

// Initialize on page load for sekolah dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Inisialisasi UI Aktivasi Kode Pro dengan logika yang konsisten
  if (document.getElementById('sekolahDashboard') && window.currentUser) {
    const kodeBiasa = window.currentUser?.schoolData?.[0];
    const isProForSchool = kodeBiasa ? localStorage.getItem(`kodeProActivated:${kodeBiasa}`) === 'true' : false;
    
    // LOGIKA MENU AKTIVASI (konsisten dengan showSekolahDashboard):
    // 1. Jika login dengan kode PRO -> disable menu
    // 2. Jika login dengan kode biasa tapi sudah aktivasi PRO -> disable menu
    // 3. Jika login dengan kode biasa dan belum aktivasi PRO -> enable menu (bisa diklik)
    if (window.currentUser?.loginType === 'pro' || isProForSchool) {
      disableAktivasiMenu();
    } else if (window.currentUser?.loginType === 'biasa' && !isProForSchool) {
      enableAktivasiMenu(); // Memastikan menu bisa diklik untuk kode biasa
    }
  }
});

// --- REKAP NILAI ADMIN FILTER LOGIC ---
function initRekapFilters() {
    const kurikulumSelect = document.getElementById('filterKurikulum');
    const kecamatanSelect = document.getElementById('adminFilterKecamatan');
    const sekolahSelect = document.getElementById('filterSekolah');
    const searchBtn = document.getElementById('searchRekapBtn');
    const rekapTableBody = document.getElementById('rekapNilaiTableBody');

    // 1. Initial state setup - Load kecamatan data immediately
    sekolahSelect.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
    sekolahSelect.disabled = true;
    searchBtn.disabled = true;
    if(rekapTableBody) rekapTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 20px;">Silakan lengkapi semua filter di atas untuk menampilkan data.</td></tr>';

    // Load kecamatan data on initial load
    (async function loadInitialKecamatan() {
        kecamatanSelect.innerHTML = '<option value="">Memuat...</option>';
        kecamatanSelect.disabled = true;
        try {
            const result = await fetchWithAuth('/api/data/rekap/kecamatan');
            if (result.success) {
                kecamatanSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
                result.data.forEach(kec => {
                    const option = new Option(kec, kec);
                    kecamatanSelect.add(option);
                });
                kecamatanSelect.disabled = false;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showNotification(error.message || 'Gagal memuat data kecamatan.', 'error');
            kecamatanSelect.innerHTML = '<option value="">-- Gagal Memuat --</option>';
        }
    })();


    // 2. Event listener for Kurikulum change
    kurikulumSelect.onchange = async () => {
        const selectedKurikulum = kurikulumSelect.value;
        
        // Reset subsequent filters
        sekolahSelect.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        sekolahSelect.disabled = true;
        searchBtn.disabled = true;
        if(rekapTableBody) rekapTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 20px;">Silakan lengkapi semua filter di atas untuk menampilkan data.</td></tr>';

        // Always load kecamatan data regardless of curriculum selection
        kecamatanSelect.innerHTML = '<option value="">Memuat...</option>';
        kecamatanSelect.disabled = true;
        showLoader();
        try {
            const result = await fetchWithAuth('/api/data/rekap/kecamatan');
            if (result.success) {
                kecamatanSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
                result.data.forEach(kec => {
                    const option = new Option(kec, kec);
                    kecamatanSelect.add(option);
                });
                kecamatanSelect.disabled = false;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showNotification(error.message || 'Gagal memuat data kecamatan.', 'error');
            kecamatanSelect.innerHTML = '<option value="">-- Gagal Memuat --</option>';
        } finally {
            hideLoader();
        }
    };

    // 3. Event listener for Kecamatan change
    kecamatanSelect.onchange = async () => {
        const selectedKecamatan = kecamatanSelect.value;

        // Reset subsequent filters
        searchBtn.disabled = true;
        if(rekapTableBody) rekapTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 20px;">Silakan lengkapi semua filter di atas untuk menampilkan data.</td></tr>';

        if (selectedKecamatan) {
            sekolahSelect.innerHTML = '<option value="">Memuat...</option>';
            sekolahSelect.disabled = true;
            showLoader();
            try {
                const result = await fetchWithAuth(`/api/data/rekap/sekolah/${selectedKecamatan}`);
                if (result.success) {
                    sekolahSelect.innerHTML = '<option value="">Pilih Sekolah</option>';
                    result.data.forEach(sekolah => {
                        const option = new Option(sekolah.namaSekolahLengkap, sekolah.kodeBiasa);
                        sekolahSelect.add(option);
                    });
                    sekolahSelect.disabled = false;
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                showNotification(error.message || 'Gagal memuat data sekolah.', 'error');
                sekolahSelect.innerHTML = '<option value="">-- Gagal Memuat --</option>';
            } finally {
                hideLoader();
            }
        } else {
            sekolahSelect.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
            sekolahSelect.disabled = true;
        }
    };

    // 4. Event listener for Sekolah change
    sekolahSelect.onchange = () => {
        if(rekapTableBody) rekapTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 20px;">Silakan lengkapi semua filter di atas untuk menampilkan data.</td></tr>';
        searchBtn.disabled = !sekolahSelect.value;
    };

    // 5. Event listener for Search Button
    searchBtn.onclick = () => {
        const filters = {
            kurikulum: kurikulumSelect.value,
            kecamatan: kecamatanSelect.value,
            sekolah: sekolahSelect.value
        };

        // Validasi hanya kecamatan dan sekolah yang wajib, kurikulum boleh kosong (semua kurikulum)
        if (!filters.kecamatan || !filters.sekolah) {
            showNotification('Harap pilih kecamatan dan sekolah sebelum mencari.', 'warning');
            return;
        }

        showNotification(`Mencari data untuk sekolah dengan kode: ${filters.sekolah}`, 'info');
        
        // Panggil fungsi yang sudah ada untuk filter dan render tabel
        filterAndRenderRekapNilaiAdminTable();
    };
    
    // 6. Event listener for Download PDF Button
    const downloadBtn = document.getElementById('downloadRekapPdfBtn');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            downloadRekapNilaiAdminPDF();
        };
    }
}

// ===== MOBILE MENU FUNCTIONALITY ===== 
function initMobileMenu() {
    const adminMobileToggle = document.getElementById('adminMobileMenuToggle');
    const sekolahMobileToggle = document.getElementById('sekolahMobileMenuToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const sekolahSidebar = document.getElementById('sekolahSidebar');
    
    // Admin Mobile Menu Toggle
    if (adminMobileToggle && adminSidebar) {
        adminMobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            adminSidebar.classList.toggle('mobile-open');
            
            // Close sekolah sidebar if open
            if (sekolahSidebar) {
                sekolahSidebar.classList.remove('mobile-open');
            }
        });
    }
    
    // Sekolah Mobile Menu Toggle
    if (sekolahMobileToggle && sekolahSidebar) {
        sekolahMobileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sekolahSidebar.classList.toggle('mobile-open');
            
            // Close admin sidebar if open
            if (adminSidebar) {
                adminSidebar.classList.remove('mobile-open');
            }
        });
    }
    
    // Close sidebar when clicking outside or on main content
    document.addEventListener('click', (e) => {
        // Don't close if clicking on toggle buttons
        if (e.target.closest('.mobile-menu-toggle')) {
            return;
        }
        
        // Don't close if clicking inside sidebar
        if (e.target.closest('.sidebar')) {
            return;
        }
        
        // Close all mobile sidebars
        if (adminSidebar) {
            adminSidebar.classList.remove('mobile-open');
        }
        if (sekolahSidebar) {
            sekolahSidebar.classList.remove('mobile-open');
        }
    });
    
    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (adminSidebar) {
                adminSidebar.classList.remove('mobile-open');
            }
            if (sekolahSidebar) {
                sekolahSidebar.classList.remove('mobile-open');
            }
        }
    });
    
    // Auto-close sidebar when menu item is clicked on mobile
    const menuItems = document.querySelectorAll('.menu-item, .submenu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 480) {
                setTimeout(() => {
                    if (adminSidebar) {
                        adminSidebar.classList.remove('mobile-open');
                    }
                    if (sekolahSidebar) {
                        sekolahSidebar.classList.remove('mobile-open');
                    }
                }, 100);
            }
        });
    });
}

// Initialize mobile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
});

// ===== SKELETON LOADING FUNCTIONALITY =====
const SkeletonLoader = {
    // Generate skeleton for table rows
    createTableSkeleton: (rowCount = 5, columnCount = 6) => {
        let skeletonHTML = '';
        for (let i = 0; i < rowCount; i++) {
            skeletonHTML += '<tr class="skeleton-row">';
            for (let j = 0; j < columnCount; j++) {
                const widthClass = j === 0 ? 'narrow' : (j === columnCount - 1 ? 'narrow' : '');
                skeletonHTML += `<td><div class="skeleton skeleton-text table-skeleton-cell ${widthClass}"></div></td>`;
            }
            skeletonHTML += '</tr>';
        }
        return skeletonHTML;
    },

    // Generate skeleton for dashboard stats
    createDashboardSkeleton: () => {
        return `
            <div class="skeleton-dashboard">
                <div class="dashboard-left">
                    <div class="skeleton-stats-grid">
                        <div class="skeleton-stat-card">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-text short"></div>
                        </div>
                        <div class="skeleton-stat-card">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-text short"></div>
                        </div>
                    </div>
                    <div class="skeleton-chart">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-header" style="height: 120px; margin-top: 20px;"></div>
                    </div>
                    <div class="skeleton-chart">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-header" style="height: 100px; margin-top: 20px;"></div>
                    </div>
                </div>
                <div class="dashboard-right">
                    <div class="skeleton-ranking">
                        <div class="skeleton skeleton-title"></div>
                        ${this.createRankingSkeleton(8)}
                    </div>
                </div>
            </div>
        `;
    },

    // Generate skeleton for ranking list
    createRankingSkeleton: (itemCount = 10) => {
        let skeletonHTML = '';
        for (let i = 0; i < itemCount; i++) {
            skeletonHTML += `
                <div class="skeleton-ranking-item">
                    <div class="skeleton skeleton-ranking-number"></div>
                    <div class="skeleton-ranking-info">
                        <div class="skeleton skeleton-text medium"></div>
                        <div class="skeleton skeleton-text short"></div>
                    </div>
                </div>
            `;
        }
        return skeletonHTML;
    },

    // Generate skeleton for form
    createFormSkeleton: (fieldCount = 6) => {
        let skeletonHTML = '<div class="form-skeleton">';
        for (let i = 0; i < fieldCount; i++) {
            skeletonHTML += `
                <div class="form-skeleton-group">
                    <div class="skeleton skeleton-form-label"></div>
                    <div class="skeleton skeleton-form-input"></div>
                </div>
            `;
        }
        skeletonHTML += '</div>';
        return skeletonHTML;
    },

    // Generate skeleton for cards
    createCardSkeleton: (cardCount = 3) => {
        let skeletonHTML = '';
        for (let i = 0; i < cardCount; i++) {
            skeletonHTML += `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text long"></div>
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            `;
        }
        return skeletonHTML;
    },

    // Show skeleton in specific container
    show: (containerId, type = 'table', options = {}) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletonHTML = '';
        switch (type) {
            case 'table':
                if (container.tagName.toLowerCase() === 'tbody') {
                    skeletonHTML = this.createTableSkeleton(options.rows || 5, options.columns || 6);
                } else {
                    skeletonHTML = `<div class="table-skeleton">${this.createTableSkeleton(options.rows || 5, options.columns || 6)}</div>`;
                }
                break;
            case 'dashboard':
                skeletonHTML = this.createDashboardSkeleton();
                break;
            case 'ranking':
                skeletonHTML = this.createRankingSkeleton(options.items || 10);
                break;
            case 'form':
                skeletonHTML = this.createFormSkeleton(options.fields || 6);
                break;
            case 'cards':
                skeletonHTML = this.createCardSkeleton(options.count || 3);
                break;
            default:
                skeletonHTML = '<div class="skeleton skeleton-text"></div>';
        }

        container.innerHTML = skeletonHTML;
        container.classList.add('skeleton-loading');
    },

    // Hide skeleton and restore content
    hide: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.classList.remove('skeleton-loading');
        // Note: Original content should be restored by the calling function
    }
};

// Enhanced loading functions with skeleton support
function showLoader(message = 'Memuat data...', showSkeleton = false, skeletonTarget = null, skeletonType = 'table', skeletonOptions = {}) {
    // Disabled completely to prevent circular spinner overlay on login page
    // Show skeleton if requested (non-circular loading alternative)
    if (showSkeleton && skeletonTarget) {
        SkeletonLoader.show(skeletonTarget, skeletonType, skeletonOptions);
    }
}

function hideLoader(skeletonTarget = null) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        // Remove loading text
        const loadingText = loadingOverlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.remove();
        }
    }

    // Hide skeleton if specified
    if (skeletonTarget) {
        SkeletonLoader.hide(skeletonTarget);
    }
}

// Enhanced table rendering with skeleton support
function renderTableWithSkeleton(tableBodyId, data, renderFunction, showSkeletonFirst = true) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    if (showSkeletonFirst && data.length > 0) {
        // Show skeleton first
        SkeletonLoader.show(tableBodyId, 'table', { 
            rows: Math.min(data.length, 10), 
            columns: tableBody.parentElement.querySelectorAll('th').length 
        });

        // Simulate loading delay for better UX
        setTimeout(() => {
            renderFunction(data);
            SkeletonLoader.hide(tableBodyId);
        }, 500);
    } else {
        renderFunction(data);
    }
}

// Enhanced notification system with visual toast messages
function showNotification(message, type = 'info', duration = 4000, showLoading = false) {
    // Log to console for debugging, but skip common user input errors
    const skipConsoleLog = type === 'error' && (
        message.includes('Kode Aplikasi tidak ditemukan') ||
        message.includes('tidak ditemukan')
    );

    if (!skipConsoleLog) {
        console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`);
    }

    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create notification element
    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    toast.className = `toast toast-${type}`;

    // Get icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    // Get colors based on type
    const colors = {
        success: { bg: '#28a745', border: '#1e7e34' },
        error: { bg: '#dc3545', border: '#c82333' },
        warning: { bg: '#ffc107', border: '#e0a800', text: '#212529' },
        info: { bg: '#17a2b8', border: '#117a8b' }
    };

    const color = colors[type] || colors.info;

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 16px;">${icons[type] || icons.info}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="document.getElementById('${toastId}').remove()" style="
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        </div>
    `;

    toast.style.cssText = `
        background: ${color.bg};
        color: ${color.text || '#ffffff'};
        border: 2px solid ${color.border};
        border-radius: 6px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 300px;
        max-width: 400px;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        pointer-events: auto;
        word-wrap: break-word;
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // Auto hide after duration
    setTimeout(() => {
        if (document.getElementById(toastId)) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// Skeleton integration with existing functions
const originalRenderSekolahTable = window.renderSekolahTable;
if (originalRenderSekolahTable) {
    window.renderSekolahTable = function(data = null) {
        const tableBody = document.getElementById('sekolahTableBody');
        if (tableBody && data && data.length > 0) {
            SkeletonLoader.show('sekolahTableBody', 'table', { rows: Math.min(data.length, 10), columns: 7 });
            setTimeout(() => {
                originalRenderSekolahTable(data);
                SkeletonLoader.hide('sekolahTableBody');
            }, 300);
        } else {
            originalRenderSekolahTable(data);
        }
    };
}

// Dashboard skeleton integration
function showDashboardSkeleton() {
    const dashboardContainer = document.querySelector('#dashboardSection .dashboard-grid');
    if (dashboardContainer) {
        SkeletonLoader.show(dashboardContainer.id || 'dashboardContent', 'dashboard');
    }
}

function hideDashboardSkeleton() {
    const dashboardContainer = document.querySelector('#dashboardSection .dashboard-grid');
    if (dashboardContainer) {
        SkeletonLoader.hide(dashboardContainer.id || 'dashboardContent');
    }
}

// ===== ENHANCED ERROR HANDLING =====
const ErrorHandler = {
    // Error types with user-friendly messages
    errorMessages: {
        'network': {
            title: 'Koneksi Bermasalah',
            message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
            icon: '🌐',
            retry: true
        },
        'timeout': {
            title: 'Waktu Habis',
            message: 'Server membutuhkan waktu terlalu lama untuk merespons.',
            icon: '⏱️',
            retry: true
        },
        'server': {
            title: 'Kesalahan Server',
            message: 'Terjadi kesalahan di server. Tim teknis kami akan segera memperbaikinya.',
            icon: '🔧',
            retry: false
        },
        'notfound': {
            title: 'Data Tidak Ditemukan',
            message: 'Data yang Anda cari tidak ditemukan atau telah dihapus.',
            icon: '🔍',
            retry: false
        },
        'validation': {
            title: 'Data Tidak Valid',
            message: 'Mohon periksa kembali data yang Anda masukkan.',
            icon: '⚠️',
            retry: false
        },
        'permission': {
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
            icon: '🔒',
            retry: false
        },
        'duplicate': {
            title: 'Data Sudah Ada',
            message: 'Data yang sama sudah ada dalam sistem.',
            icon: '📋',
            retry: false
        }
    },

    // Show user-friendly error message
    showError: (errorType, customMessage = null, containerId = null, retryFunction = null) => {
        const errorInfo = ErrorHandler.errorMessages[errorType] || ErrorHandler.errorMessages['server'];
        const message = customMessage || errorInfo.message;
        
        if (containerId) {
            ErrorHandler.showErrorInContainer(containerId, errorInfo.title, message, errorInfo.icon, retryFunction, errorInfo.retry);
        } else {
            showNotification(`${errorInfo.icon} ${errorInfo.title}: ${message}`, 'error', 5000);
        }
    },

    // Show error state in specific container
    showErrorInContainer: (containerId, title, message, icon, retryFunction = null, canRetry = false) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const retryButton = canRetry && retryFunction ? 
            `<button class="retry-btn" onclick="(${retryFunction.toString()})()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Coba Lagi
            </button>` : '';

        container.innerHTML = `
            <div class="error-state">
                <div class="error-state-icon">${icon}</div>
                <div class="error-state-title">${title}</div>
                <div class="error-state-message">${message}</div>
                <div class="error-state-actions">
                    ${retryButton}
                </div>
            </div>
        `;
    },

    // Show connection error
    showConnectionError: (containerId, retryFunction = null) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const retryButton = retryFunction ? 
            `<button class="retry-btn" onclick="(${retryFunction.toString()})()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Coba Lagi
            </button>` : '';

        container.innerHTML = `
            <div class="connection-error">
                <div class="connection-error-icon">📡</div>
                <div class="connection-error-title">Tidak Ada Koneksi</div>
                <div class="connection-error-message">
                    Periksa koneksi internet Anda dan coba lagi.
                </div>
                <div class="connection-error-actions">
                    ${retryButton}
                </div>
            </div>
        `;
    },

    // Show empty state
    showEmptyState: (containerId, title, message, actionText = null, actionFunction = null) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const actionButton = actionText && actionFunction ? 
            `<button class="btn btn-primary" onclick="(${actionFunction.toString()})()">
                ${actionText}
            </button>` : '';

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-message">${message}</div>
                <div class="empty-state-actions">
                    ${actionButton}
                </div>
            </div>
        `;
    },

    // Handle API errors
    handleApiError: (error, context = '', retryFunction = null, containerId = null) => {
        console.error(`API Error in ${context}:`, error);
        
        let errorType = 'server';
        let customMessage = null;

        // Analyze error to provide specific message
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorType = 'network';
        } else if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
            errorType = 'timeout';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
            errorType = 'notfound';
        } else if (error.message.includes('400') || error.message.includes('validation')) {
            errorType = 'validation';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            errorType = 'permission';
        } else if (error.message.includes('409') || error.message.includes('duplicate')) {
            errorType = 'duplicate';
        } else if (error.message.includes('500')) {
            errorType = 'server';
            customMessage = 'Server sedang mengalami gangguan. Tim teknis telah diberitahu.';
        }

        ErrorHandler.showError(errorType, customMessage, containerId, retryFunction);
    },

    // Validate form fields
    validateField: (fieldId, rules = {}) => {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        const value = field.value.trim();
        const errors = [];

        // Remove previous error state
        field.classList.remove('input-error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Required validation
        if (rules.required && !value) {
            errors.push('Field ini wajib diisi.');
        }

        // Minimum length validation
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Minimal ${rules.minLength} karakter.`);
        }

        // Email validation
        if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push('Format email tidak valid.');
        }

        // Number validation
        if (rules.numeric && value && !/^\d+$/.test(value)) {
            errors.push('Hanya boleh angka.');
        }

        // NISN validation (10 digits)
        if (rules.nisn && value && !/^\d{10}$/.test(value)) {
            errors.push('NISN harus 10 digit angka.');
        }

        // Show errors if any
        if (errors.length > 0) {
            field.classList.add('input-error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.innerHTML = `<span>⚠️</span> ${errors.join(' ')}`;
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
            return false;
        }

        return true;
    },

    // Clear form errors
    clearFormErrors: (formId) => {
        const form = document.getElementById(formId);
        if (!form) return;

        // Remove error classes
        form.querySelectorAll('.input-error').forEach(field => {
            field.classList.remove('input-error');
        });

        // Remove error messages
        form.querySelectorAll('.field-error').forEach(error => {
            error.remove();
        });

        // Remove form-level errors
        form.querySelectorAll('.form-error').forEach(error => {
            error.remove();
        });
    },

    // Show form error
    showFormError: (formId, message) => {
        const form = document.getElementById(formId);
        if (!form) return;

        // Remove existing form errors
        form.querySelectorAll('.form-error').forEach(error => error.remove());

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.innerHTML = `
            <span class="form-error-icon">⚠️</span>
            ${message}
        `;

        form.insertBefore(errorDiv, form.firstChild);
    }
};


// Enhanced fetch with error handling
async function fetchWithErrorHandling(url, options = {}, context = '') {
    try {
        // Add timeout to fetch
        const timeoutId = setTimeout(() => {
            throw new Error('Request timeout');
        }, options.timeout || 15000);

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request was cancelled');
        }
        throw error;
    }
}

// Initialize error handling
document.addEventListener('DOMContentLoaded', () => {

    // Handle global errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        ErrorHandler.handleApiError(event.error, 'Global Error Handler');
    });

    // Handle promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        ErrorHandler.handleApiError(event.reason, 'Promise Rejection');
    });

    // Setup table navigation after tables are rendered
    setTimeout(() => {
        // Table navigation removed
    }, 1000);

    // Setup Siswa Admin Modal Event Handlers
    setupSiswaAdminModal();
});

// Fungsi untuk setup modal siswa admin
function setupSiswaAdminModal() {
    const btnTambahSiswa = document.getElementById('btnTambahSiswa');
    const closeSiswaAdminModalBtn = document.getElementById('closeSiswaAdminModalBtn');
    const siswaAdminForm = document.getElementById('siswaAdminForm');

    // Event handler untuk tombol tambah siswa
    if (btnTambahSiswa) {
        btnTambahSiswa.addEventListener('click', () => {
            openEditModal(null);
        });
    }

    // Event handler untuk tutup modal
    if (closeSiswaAdminModalBtn) {
        closeSiswaAdminModalBtn.addEventListener('click', closeSiswaAdminModal);
    }

    // Event handler untuk submit form
    if (siswaAdminForm) {
        siswaAdminForm.addEventListener('submit', handleSiswaAdminSubmit);
    }

    // Tutup modal jika klik di luar modal
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('siswaAdminModal');
        if (event.target === modal) {
            closeSiswaAdminModal();
        }
    });
}

// Fungsi untuk membuka modal siswa admin



// Fungsi untuk mengisi form dengan data siswa
function fillSiswaForm(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data passed to fillSiswaForm:', data);
        return;
    }

    // Mapping berdasarkan struktur array siswa yang benar (tanpa noPeserta): [kodeBiasa, kodePro, namaSekolah, kecamatan, noUrut, noInduk, nisn, namaPeserta, ttl, namaOrtu, noIjazah]
    const fields = [
        {id: 'editKodeBiasa', value: data[0], label: 'Kode Biasa'},
        {id: 'editKodePro', value: data[1], label: 'Kode Pro'},
        {id: 'editNamaSekolah', value: data[2], label: 'Nama Sekolah'},
        {id: 'editKecamatanSiswa', value: data[3], label: 'Kecamatan'},
        {id: 'editNoUrut', value: data[4], label: 'No Urut'},
        {id: 'editNoInduk', value: data[5], label: 'No Induk'},
        // editNoPeserta removed - field no longer exists
        {id: 'editNisn', value: data[6], label: 'NISN'},
        {id: 'editNamaPeserta', value: data[7], label: 'Nama Peserta'},
        {id: 'editTtl', value: data[8], label: 'TTL'},
        {id: 'editNamaOrtu', value: data[9], label: 'Nama Orang Tua'},
        {id: 'editNoIjazah', value: data[10], label: 'No Ijazah'}
    ];

    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value || '';
        } else {
            console.error(`Element ${field.id} not found for ${field.label}`);
        }
    });

    // Simpan NISN asli untuk update nanti
    document.getElementById('originalNisn').value = data[7]; // Menggunakan NISN sebagai identifier
}

// Fungsi untuk menangani submit form siswa admin
function handleSiswaAdminSubmit(event) {
    event.preventDefault();
    
    const mode = document.getElementById('siswaAdminModalMode').value;
    
    const formData = collectSiswaFormData();
    
    if (!validateSiswaData(formData)) {
        return;
    }

    if (mode === 'add') {
        addNewSiswa(formData);
    } else if (mode === 'edit') {
        updateSiswa(formData);
    }
}

// Fungsi untuk mengumpulkan data dari form
function collectSiswaFormData() {
    return {
        kodeBiasa: document.getElementById('siswaKodeBiasa').value.trim(),
        kodePro: document.getElementById('siswaKodePro').value.trim(),
        namaSekolah: document.getElementById('siswaNamaSekolah').value.trim(),
        kecamatan: document.getElementById('siswaKecamatan').value.trim(),
        noUrut: document.getElementById('siswaNoUrut').value.trim(),
        noInduk: document.getElementById('siswaNoInduk').value.trim(),
        nisn: document.getElementById('siswaNisn').value.trim(),
        namaPeserta: document.getElementById('siswaNamaPeserta').value.trim(),
        tempatTglLahir: document.getElementById('siswaTempatTglLahir').value.trim(),
        namaOrtu: document.getElementById('siswaNamaOrtu').value.trim(),
        noIjazah: document.getElementById('siswaNoIjazah').value.trim()
    };
}

// Fungsi untuk validasi data siswa
function validateSiswaData(data) {
    if (!data.kodeBiasa || !data.noInduk || !data.nisn || !data.namaPeserta) {
        showNotification('Mohon lengkapi data yang wajib diisi', 'error');
        return false;
    }
    return true;
}

// Fungsi untuk menambah siswa baru
async function addNewSiswa(data) {
    try {
        // Convert ke format array sesuai struktur database
        const siswaArray = [
            data.kodeBiasa,
            data.kodePro,
            data.namaSekolah,
            data.kecamatan,
            parseInt(data.noUrut) || (database.siswa ? database.siswa.length + 1 : 1),
            data.noInduk,
            data.nisn,
            data.namaPeserta,
            data.tempatTglLahir,
            data.namaOrtu,
            data.noIjazah
        ];

        // Kirim data ke server
        const result = await fetchWithAuth(apiUrl('/api/data/siswa/save'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: 'add',
                siswaData: siswaArray
            })
        });
        
        if (result.success) {
            // Tambah ke database lokal juga untuk sinkronisasi
            if (database && database.siswa) {
                database.siswa.push(siswaArray);
            }

            // Update counters setelah data berubah
            updateAdminCounters();

            // Refresh tabel
            if (typeof renderAdminSiswaTable === 'function') {
                renderAdminSiswaTable();
            }

            // Refresh student search data
            refreshSiswaSearchData();

            // Tutup modal dan show notifikasi
            closeSiswaAdminModal();
            showNotification('Data siswa berhasil ditambahkan', 'success');
        } else {
            throw new Error(result.message || 'Gagal menyimpan data siswa');
        }
        
    } catch (error) {
        console.error('Error adding student:', error);
        showNotification('Gagal menambahkan data siswa: ' + error.message, 'error');
    }
}

// Fungsi untuk update siswa
async function updateSiswa(data) {
    try {
        // Get original NISN for identification
        const originalNisn = document.getElementById('originalSiswaIndex').value;
        
        // Convert ke format array sesuai struktur database
        const siswaArray = [
            data.kodeBiasa,
            data.kodePro,
            data.namaSekolah,
            data.kecamatan,
            parseInt(data.noUrut) || 1,
            data.noInduk,
            data.nisn,
            data.namaPeserta,
            data.tempatTglLahir,
            data.namaOrtu,
            data.noIjazah
        ];

        // Kirim data ke server
        const result = await fetchWithAuth(apiUrl('/api/data/siswa/save'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: 'edit',
                siswaData: siswaArray,
                originalNisn: originalNisn
            })
        });
        
        if (result.success) {
            // Update database lokal juga untuk sinkronisasi
            if (database && database.siswa) {
                const siswaIndex = database.siswa.findIndex(s => s[6] === originalNisn);
                if (siswaIndex !== -1) {
                    database.siswa[siswaIndex] = siswaArray;
                }
            }
            
            // Refresh tabel
            if (typeof renderAdminTable === 'function') {
                renderAdminTable('siswa');
            }
            
            // Tutup modal dan show notifikasi
            closeSiswaAdminModal();
            showNotification('Data siswa berhasil diperbarui', 'success');
        } else {
            throw new Error(result.message || 'Gagal memperbarui data siswa');
        }
        
    } catch (error) {
        console.error('Error updating student:', error);
        showNotification('Gagal memperbarui data siswa: ' + error.message, 'error');
    }
}

// Fungsi untuk menangani hapus siswa
async function handleDeleteSiswa(nisn, nama) {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus siswa "${nama}" (NISN: ${nisn})?\n\nData siswa dan semua nilai terkait akan dihapus secara permanen.`);
    
    if (!confirmDelete) return;

    try {
        const result = await fetchWithAuth(apiUrl('/api/data/siswa/delete'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nisn: nisn
            })
        });
        
        if (result.success) {
            // Hapus dari database lokal juga
            if (database && database.siswa) {
                database.siswa = database.siswa.filter(s => s[7] !== nisn);
            }

            // Update counters setelah data berubah
            updateAdminCounters();

            // Refresh tabel
            if (typeof renderAdminTable === 'function') {
                renderAdminTable('siswa');
            }

            showNotification(`Siswa "${nama}" berhasil dihapus`, 'success');
        } else {
            throw new Error(result.message || 'Gagal menghapus siswa');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showNotification('Gagal menghapus siswa: ' + error.message, 'error');
    }
}

// ===== SETUP TABLE SORTING FUNCTIONALITY =====
function setupTableSorting() {
    // Add event listener for sortable table headers using event delegation
    document.addEventListener('click', (event) => {
        const sortableHeader = event.target.closest('th.sortable');
        if (sortableHeader) {
            event.preventDefault();

            const tableId = sortableHeader.getAttribute('data-table-id');
            const keyIndex = parseInt(sortableHeader.getAttribute('data-key-index'));
            const keyType = sortableHeader.getAttribute('data-key-type');

            if (tableId && keyIndex !== null && keyType) {
                handleSort(tableId, keyIndex, keyType);
                updateSortHeaders(tableId);

                // Re-render the appropriate table
                rerenderActiveTable(tableId);
            }
        }
    });

}

// Re-render table based on tableId
function rerenderActiveTable(tableId) {

    switch(tableId) {
        case 'sekolah':
            if (typeof renderAdminTable === 'function') {
                renderAdminTable('sekolah');
            }
            break;
        case 'siswa':
            if (typeof renderAdminTable === 'function') {
                renderAdminTable('siswa');
            }
            break;
        case 'rekapNilai':
            if (typeof renderRekapNilai === 'function') {
                renderRekapNilai();
            }
            break;
        case 'isiNilai':
            // Re-render current isi nilai page with current semester
            const currentSemester = paginationState.isiNilai?.currentSemester;
            const currentSemesterName = paginationState.isiNilai?.currentSemesterName;
            if (currentSemester && currentSemesterName && typeof renderIsiNilaiPage === 'function') {
                renderIsiNilaiPage(currentSemester, currentSemesterName);
            }
            break;
        case 'sekolahSiswa':
            if (typeof renderProfilSiswa === 'function') {
                renderProfilSiswa();
            }
            break;
        case 'transkripNilai':
            if (typeof renderTranskripSiswaTable === 'function') {
                renderTranskripSiswaTable();
            }
            break;
        case 'skl':
            if (typeof renderSklSiswaTable === 'function') {
                renderSklSiswaTable();
            }
            break;
        case 'skkb':
            if (typeof renderSkkbSiswaTable === 'function') {
                renderSkkbSiswaTable();
            }
            break;
        case 'cetakGabungan':
            if (typeof renderCetakGabunganPage === 'function') {
                renderCetakGabunganPage();
            }
            break;
        default:
            // Skip warning for dashboard sections that don't need table rerendering
            if (!tableId.includes('dashboard') && !tableId.includes('Section')) {

            }
    }
}

// ===== SETUP PAGINATION FUNCTIONALITY =====
function setupPaginationControls() {
    // Add event listeners for all pagination controls using event delegation
    document.addEventListener('change', (event) => {
        // Handle rows-per-page dropdown changes
        if (event.target.classList.contains('rows-per-page')) {
            const paginationControl = event.target.closest('.pagination-controls');
            if (paginationControl) {
                const tableId = paginationControl.getAttribute('data-table-id');
                if (tableId && paginationState[tableId]) {
                    paginationState[tableId].rowsPerPage = event.target.value;
                    paginationState[tableId].currentPage = 1; // Reset to first page
                    rerenderActiveTable(tableId);
                }
            }
        }
    });

    // Add event listeners for pagination buttons using event delegation
    document.addEventListener('click', (event) => {
        // Handle previous page buttons
        if (event.target.classList.contains('prev-page')) {
            const paginationControl = event.target.closest('.pagination-controls');
            if (paginationControl) {
                const tableId = paginationControl.getAttribute('data-table-id');
                if (tableId && paginationState[tableId] && paginationState[tableId].currentPage > 1) {
                    paginationState[tableId].currentPage--;
                    rerenderActiveTable(tableId);
                }
            }
        }

        // Handle next page buttons
        if (event.target.classList.contains('next-page')) {
            const paginationControl = event.target.closest('.pagination-controls');
            if (paginationControl) {
                const tableId = paginationControl.getAttribute('data-table-id');
                if (tableId && paginationState[tableId]) {
                    const state = paginationState[tableId];
                    // Calculate max page based on current data
                    const currentTable = getCurrentTableData(tableId);
                    if (currentTable) {
                        const totalRows = currentTable.length;
                        const rowsPerPage = state.rowsPerPage === 'all' ? totalRows : parseInt(state.rowsPerPage);
                        const totalPages = rowsPerPage > 0 ? Math.ceil(totalRows / rowsPerPage) : 1;

                        if (state.currentPage < totalPages) {
                            state.currentPage++;
                            rerenderActiveTable(tableId);
                        }
                    }
                }
            }
        }
    });

}

// Fungsi untuk mengubah teks menjadi proper case (huruf pertama kapital, sisanya kecil)
function formatToProperCase(str) {
  if (!str || typeof str !== 'string') return str || '';
  
  return str.toLowerCase().split(' ').map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Fungsi validasi real-time untuk input No Ijazah
function validateIjazahInput(inputElement) {
  const currentValue = inputElement.value;
  // Hanya izinkan angka dan maksimal 15 digit
  const numericValue = currentValue.replace(/\D/g, '').substring(0, 15);
  
  if (currentValue !== numericValue) {
    // Tampilkan notifikasi bahwa karakter non-angka dihapus
    showSmartNotification('Hanya angka yang diperbolehkan untuk Nomor Ijazah.', 'warning', 'validasi no ijazah');
    inputElement.value = numericValue;
  }
  
  // Update styling berdasarkan validitas - hanya valid jika kosong atau 15 digit angka
  if (currentValue !== '' && !/^\d{15}$/.test(inputElement.value)) {
    inputElement.classList.add('invalid-input');
  } else {
    inputElement.classList.remove('invalid-input');
  }
}

// Fungsi untuk memeriksa duplikat No Ijazah
function checkDuplicateIjazah(newValue, originalIndex) {
  if (newValue === '') return false; // Boleh kosong
  
  for (let i = 0; i < database.siswa.length; i++) {
    if (i !== originalIndex && database.siswa[i][10] === newValue) {
      return true; // Ditemukan duplikat
    }
  }
  return false;
}

// Fungsi validasi saat input kehilangan fokus
function validateIjazahOnBlur(inputElement) {
  const currentValue = inputElement.value;
  
  // Jika nilai tidak kosong dan bukan 15 digit, beri peringatan
  if (currentValue !== '' && !/^\d{15}$/.test(currentValue)) {
    showSmartNotification('Nomor Ijazah harus berupa 15 digit angka. Harap perbaiki sebelum menyimpan.', 'warning', 'validasi no ijazah');
  }
}

// Helper function to get current table data
function getCurrentTableData(tableId) {
    switch(tableId) {
        case 'sekolah':
            return database?.sekolah || [];
        case 'siswa':
            return database?.siswa || [];
        case 'rekapNilai':
        case 'isiNilai':
        case 'sekolahSiswa':
        case 'transkripNilai':
        case 'skl':
        case 'skkb':
        case 'cetakGabungan':
            if (window.currentUser?.schoolData) {
                const schoolKodeBiasa = String(window.currentUser.schoolData[0]);
                return database?.siswa?.filter(siswa => String(siswa[0]) === schoolKodeBiasa) || [];
            }
            return [];
        default:
            return [];
    }
}

// Initialize sorting and pagination when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup table sorting functionality
    setupTableSorting();

    // Setup pagination controls
    setupPaginationControls();

});

// Also initialize if DOM already loaded
if (document.readyState !== 'loading') {
    setupTableSorting();
    setupPaginationControls();
}

// ===== ENHANCED BACKUP & RESTORE FUNCTIONALITY =====

// Modern backup status updates
function updateBackupStatus(indicator, text) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    if (statusIndicator) statusIndicator.textContent = indicator;
    if (statusText) statusText.textContent = text;
}

// Modern backup progress display
function showModernBackupProgress() {
    const progressElement = document.getElementById('backupProgress');
    const statsElement = document.getElementById('backupStats');

    if (progressElement) {
        progressElement.style.display = 'block';
        progressElement.classList.add('show');
    }

    if (statsElement) {
        statsElement.style.display = 'block';
        updateBackupStats();
    }
}

// Hide backup progress
function hideBackupProgress() {
    const progressElement = document.getElementById('backupProgress');
    if (progressElement) {
        progressElement.classList.remove('show');
        setTimeout(() => {
            progressElement.style.display = 'none';
        }, 300);
    }
}

// Show backup success state
function showBackupSuccess() {
    const backupBtn = document.getElementById('backupBtn');
    const backupBtnText = document.getElementById('backupBtnText');

    if (backupBtn && backupBtnText) {
        backupBtn.classList.remove('loading');
        backupBtn.classList.add('success');
        backupBtnText.textContent = '✓ Backup Berhasil';

        updateBackupStatus('🟢', 'Backup berhasil dibuat');

        setTimeout(() => {
            backupBtn.classList.remove('success');
            backupBtn.disabled = false;
            backupBtnText.textContent = 'Download Backup';
        }, 3000);
    }
}

// Show backup error state
function showBackupError(message) {
    const backupBtn = document.getElementById('backupBtn');
    const backupBtnText = document.getElementById('backupBtnText');

    if (backupBtn && backupBtnText) {
        backupBtn.classList.remove('loading');
        backupBtn.classList.add('error');
        backupBtnText.textContent = '✗ Backup Gagal';

        updateBackupStatus('🔴', 'Backup gagal: ' + message);

        setTimeout(() => {
            backupBtn.classList.remove('error');
            backupBtn.disabled = false;
            backupBtnText.textContent = 'Download Backup';
        }, 5000);
    }

    hideBackupProgress();
}

// Update backup statistics
function updateBackupStats() {
    if (!database || !window.currentUser?.schoolData) return;

    const schoolCode = String(window.currentUser.schoolData[0]);
    const siswaCount = database.siswa ? database.siswa.filter(s => String(s[0]) === schoolCode).length : 0;
    const nilaiCount = database.nilai ? Object.keys(database.nilai).length : 0;
    const semesterCount = database.semester ? database.semester.length : 0;

    const totalSekolahEl = document.getElementById('totalSekolah');
    const totalSiswaEl = document.getElementById('totalSiswa');
    const totalNilaiEl = document.getElementById('totalNilai');
    const totalSemesterEl = document.getElementById('totalSemester');

    if (totalSekolahEl) totalSekolahEl.textContent = '1';
    if (totalSiswaEl) totalSiswaEl.textContent = siswaCount;
    if (totalNilaiEl) totalNilaiEl.textContent = nilaiCount;
    if (totalSemesterEl) totalSemesterEl.textContent = semesterCount;
}

// Modern restore progress display
function showModernRestoreProgress() {
    const progressElement = document.getElementById('restoreProgress');
    if (progressElement) {
        progressElement.style.display = 'block';
        progressElement.classList.add('show');
    }
}

// Hide restore progress
function hideRestoreProgress() {
    const progressElement = document.getElementById('restoreProgress');
    if (progressElement) {
        progressElement.classList.remove('show');
        setTimeout(() => {
            progressElement.style.display = 'none';
        }, 300);
    }
}

// Show restore success state
function showRestoreSuccess() {
    const restoreBtn = document.getElementById('restoreBtn');
    const restoreBtnText = document.getElementById('restoreBtnText');

    if (restoreBtn && restoreBtnText) {
        restoreBtn.classList.remove('loading');
        restoreBtn.classList.add('success');
        restoreBtnText.textContent = '✓ Restore Berhasil';

        setTimeout(() => {
            restoreBtn.classList.remove('success');
            restoreBtn.disabled = false;
            restoreBtnText.textContent = 'Pilih File Untuk Restore';
        }, 3000);
    }
}

// Show restore error state
function showRestoreError(message) {
    const restoreBtn = document.getElementById('restoreBtn');
    const restoreBtnText = document.getElementById('restoreBtnText');

    if (restoreBtn && restoreBtnText) {
        restoreBtn.classList.remove('loading');
        restoreBtn.classList.add('error');
        restoreBtnText.textContent = '✗ Restore Gagal';

        setTimeout(() => {
            restoreBtn.classList.remove('error');
            restoreBtn.disabled = false;
            restoreBtnText.textContent = 'Pilih File Untuk Restore';
        }, 5000);
    }

    hideRestoreProgress();
}

// Enhanced backup function with modern UI
async function handleModernBackup() {
    if (window.currentUser.role !== 'sekolah' || !window.currentUser.schoolData) {
        showNotification('Akses ditolak: Hanya sekolah yang dapat membuat backup', 'error');
        return;
    }

    const backupBtn = document.getElementById('backupBtn');
    const backupBtnText = document.getElementById('backupBtnText');

    backupBtn.classList.add('loading');
    backupBtn.disabled = true;
    backupBtnText.textContent = 'Memproses...';

    showModernBackupProgress();
    updateBackupStatus('🟡', 'Sedang memproses backup...');

    try {
        updateBackupProgress(10, 'Mempersiapkan data backup...');

        const schoolCode = String(window.currentUser.schoolData[0]);
        const schoolName = (window.currentUser.schoolData[5] || 'sekolah').replace(/ /g, '_');

        updateBackupProgress(25, 'Mengumpulkan data sekolah...');

        const backupData = {
            appVersion: '2.6-server',
            backupDate: new Date().toISOString(),
            schoolCode: schoolCode,
            schoolName: window.currentUser.schoolData[4],
            siswa: database.siswa.filter(s => String(s[0]) === schoolCode),
            nilai: {},
            settings: database.settings ? database.settings[schoolCode] || {} : {},
            sklPhotos: {},
            mulokNames: database.nilai && database.nilai._mulokNames ? (database.nilai._mulokNames[schoolCode] || {}) : {}
        };

        updateBackupProgress(40, 'Mengumpulkan data siswa...');

        const schoolNisns = new Set(backupData.siswa.map(s => s[7]));
        let processedCount = 0;
        const totalStudents = schoolNisns.size;

        updateBackupProgress(50, 'Mengumpulkan data nilai dan foto...');

        for (const nisn of schoolNisns) {
            if (database.nilai && database.nilai[nisn]) backupData.nilai[nisn] = database.nilai[nisn];
            if (database.sklPhotos && database.sklPhotos[nisn]) backupData.sklPhotos[nisn] = database.sklPhotos[nisn];

            processedCount++;
            if (processedCount % 50 === 0 || processedCount === totalStudents) {
                const progress = 50 + Math.floor((processedCount / totalStudents) * 30);
                updateBackupProgress(progress, `Memproses data siswa ${processedCount}/${totalStudents}...`);
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }

        updateBackupProgress(85, 'Membuat file backup...');

        if (backupData.siswa.length === 0) {
            throw new Error('Tidak ada data siswa untuk di-backup.');
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        updateBackupProgress(95, 'Menyiapkan unduhan...');

        const date = new Date().toISOString().slice(0, 10);
        const time = new Date().toTimeString().slice(0, 5).replace(':', '-');
        const filename = `backup_${schoolName}_${date}_${time}.json`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        updateBackupProgress(100, 'Backup selesai!');
        showNotification('Backup berhasil diunduh!', 'success');

        setTimeout(() => {
            hideBackupProgress();
            showBackupSuccess();
        }, 500);

        if (window.auditManager) {
            window.auditManager.log('backup_success', 'backup', {
                fileName: filename,
                siswaCount: backupData.siswa.length,
                nilaiCount: Object.keys(backupData.nilai).length
            });
        }

    } catch (error) {
        console.error('Backup failed:', error);
        showBackupError(error.message);
        showNotification('Backup gagal: ' + error.message, 'error');

        if (window.auditManager) {
            window.auditManager.log('backup_failed', 'backup', { error: error.message });
        }
    }
}

// Enhanced restore function with modern UI
async function handleModernRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (document.getElementById('restoreProgress')?.classList.contains('show')) {
        return;
    }

    const restoreBtn = document.getElementById('restoreBtn');
    const restoreBtnText = document.getElementById('restoreBtnText');

    restoreBtn.classList.add('loading');
    restoreBtn.disabled = true;
    restoreBtnText.textContent = 'Memproses...';

    showModernRestoreProgress();

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            updateRestoreProgress(10, 'Membaca file backup...');

            const backupData = JSON.parse(e.target.result);

            updateRestoreProgress(25, 'Memvalidasi file backup...');

            if (!backupData.schoolCode || !backupData.siswa) {
                throw new Error('Format file backup tidak valid');
            }

            if (!Array.isArray(backupData.siswa) || backupData.siswa.length === 0) {
                throw new Error('File backup tidak mengandung data siswa');
            }

            updateRestoreProgress(40, 'Memverifikasi kompatibilitas...');

            const confirmMessage = `Restore backup dari ${new Date(backupData.backupDate).toLocaleString()}?\n\n` +
                                  `Data yang akan di-restore:\n` +
                                  `- ${backupData.siswa.length} siswa\n` +
                                  `- ${Object.keys(backupData.nilai || {}).length} nilai\n` +
                                  `- ${Object.keys(backupData.sklPhotos || {}).length} foto\n\n` +
                                  `⚠️ PERINGATAN: Semua data saat ini akan diganti!`;

            if (!confirm(confirmMessage)) {
                hideRestoreProgress();
                restoreBtn.classList.remove('loading');
                restoreBtn.disabled = false;
                restoreBtnText.textContent = 'Pilih File Untuk Restore';
                return;
            }

            updateRestoreProgress(60, 'Membackup data saat ini...');

            if (window.BackupManager) {
                await window.BackupManager.createBackup('pre_restore');
            }

            updateRestoreProgress(75, 'Mengembalikan data...');

            const schoolCode = String(window.currentUser.schoolData[0]);

            if (backupData.siswa) {
                database.siswa = database.siswa.filter(s => String(s[0]) !== schoolCode);
                database.siswa.push(...backupData.siswa);
                // Refresh student search data after restore
                refreshSiswaSearchData();
            }

            if (backupData.nilai) {
                Object.assign(database.nilai, backupData.nilai);
            }

            if (backupData.sklPhotos) {
                Object.assign(database.sklPhotos, backupData.sklPhotos);
            }

            if (backupData.settings) {
                if (!database.settings) database.settings = {};
                database.settings[schoolCode] = backupData.settings;
            }

            if (backupData.mulokNames) {
                if (!database.nilai._mulokNames) database.nilai._mulokNames = {};
                database.nilai._mulokNames[schoolCode] = backupData.mulokNames;
            }

            updateRestoreProgress(90, 'Menyinkronkan interface...');

            try {
                localStorage.setItem('database', JSON.stringify(database));
            } catch (error) {

            }

            if (typeof renderProfilSiswa === 'function') renderProfilSiswa();
            if (typeof renderAdminTable === 'function') renderAdminTable('siswa');

            updateRestoreProgress(100, 'Restore selesai!');

            event.target.value = '';

            setTimeout(() => {
                hideRestoreProgress();
                showRestoreSuccess();
            }, 500);

            showNotification('Data berhasil direstore!', 'success');

            if (window.auditManager) {
                window.auditManager.log('restore_success', 'backup', {
                    backupDate: backupData.backupDate,
                    siswaCount: backupData.siswa.length,
                    nilaiCount: Object.keys(backupData.nilai || {}).length
                });
            }

        } catch (error) {
            console.error('Restore failed:', error);
            showRestoreError(error.message);
            showNotification('Restore gagal: ' + error.message, 'error');

            if (window.auditManager) {
                window.auditManager.log('restore_failed', 'backup', {
                    error: error.message,
                    fileName: file.name
                });
            }
        }
    };

    reader.onerror = () => {
        showRestoreError('Gagal membaca file backup');
        showNotification('Gagal membaca file backup', 'error');
    };

    reader.readAsText(file);
}

// Initialize enhanced backup/restore functionality
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('backupBtn')) {
        setTimeout(updateBackupStats, 1000);

        const backupBtn = document.getElementById('backupBtn');
        const restoreInput = document.getElementById('restoreInput');

        if (backupBtn) {
            backupBtn.removeEventListener('click', handleBackup);
            backupBtn.addEventListener('click', handleModernBackup);
        }

        if (restoreInput) {
            restoreInput.removeEventListener('change', handleRestore);
            restoreInput.addEventListener('change', handleModernRestore);
        }

    }

    // Pastikan menu Aktivasi Kode Pro disabled
    const aktivasiMenu = document.querySelector('.menu-item[onclick*="showSection(\'aktivasiKodePro\')"]');
    if (aktivasiMenu) {
        aktivasiMenu.classList.add('disabled');
        aktivasiMenu.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        aktivasiMenu.style.opacity = '0.5';
        aktivasiMenu.style.pointerEvents = 'none';
        aktivasiMenu.style.cursor = 'not-allowed';
        aktivasiMenu.style.backgroundColor = '#f0f0f0';
    }

    // ===== SCHOOL NAME TOP ROW FUNCTIONALITY =====
    function createSchoolNameTopRow() {
        // Pastikan user sudah login dan ada data sekolah
        if (!window.currentUser || !window.currentUser.schoolData || !window.currentUser.schoolData[4]) {
            return;
        }

        const schoolName = window.currentUser.schoolData[4];

        // Hapus top row yang sudah ada
        document.querySelectorAll('.school-name-top-row').forEach(row => row.remove());

        // Tambahkan top row ke semua content section
        const contentSections = document.querySelectorAll('.content-section');
        contentSections.forEach(section => {
            // Skip jika sudah ada top row
            if (section.querySelector('.school-name-top-row')) return;

            // Buat top row
            const topRow = document.createElement('div');
            topRow.className = 'school-name-top-row';

            // Buat badge
            const badge = document.createElement('div');
            badge.className = 'e-ijazah-logo-container';
            badge.innerHTML = `
                <div class="logo-wrapper">
                    <img src="/assets/logo-e-ijazah.svg" alt="E-Ijazah Logo" class="e-ijazah-logo">
                    <div class="logo-text">
                        <h1>APLIKASI NILAI E-IJAZAH</h1>
                        <p>Platform Pendidikan Digital Indonesia</p>
                    </div>
                </div>
            `;
            badge.title = schoolName; // Tooltip untuk nama lengkap

            // Tambahkan badge ke top row
            topRow.appendChild(badge);

            // Cari dan pindahkan version badge jika ada
            const versionBadge = section.querySelector('#version-info-badge');
            if (versionBadge) {
                versionBadge.remove();
                topRow.appendChild(versionBadge);
            }

            // Insert top row sebagai elemen pertama di section
            section.insertBefore(topRow, section.firstChild);

            // Hapus h2 duplikat jika ada
            const duplicateH2 = section.querySelector('#dashboardSchoolName');
            if (duplicateH2) {
                duplicateH2.remove();
            }
        });

    }

    // Fungsi untuk update top row saat ganti section
    function updateSchoolNameTopRows() {
        // Update top row pada section yang sedang aktif
        const activeSections = document.querySelectorAll('.content-section.active');
        activeSections.forEach(section => {
            if (!section.querySelector('.school-name-top-row')) {
                createSchoolNameTopRowForElement(section);
            }
        });
    }

    // Helper function untuk membuat top row pada elemen tertentu
    function createSchoolNameTopRowForElement(sectionElement) {
        if (!window.currentUser || !window.currentUser.schoolData || !window.currentUser.schoolData[4]) {
            return;
        }

        // Skip jika sudah ada top row
        if (sectionElement.querySelector('.school-name-top-row')) return;

        const schoolName = window.currentUser.schoolData[4];

        // Buat top row
        const topRow = document.createElement('div');
        topRow.className = 'school-name-top-row';

        // Buat badge
        const badge = document.createElement('div');
        badge.className = 'e-ijazah-logo-container';
        badge.innerHTML = `
                <div class="logo-wrapper">
                    <img src="/assets/logo-e-ijazah.svg" alt="E-Ijazah Logo" class="e-ijazah-logo">
                    <div class="logo-text">
                        <h1>APLIKASI NILAI E-IJAZAH</h1>
                        <p>Platform Pendidikan Digital Indonesia</p>
                    </div>
                </div>
            `;
        badge.title = schoolName;

        // Tambahkan badge ke top row
        topRow.appendChild(badge);

        // Cari dan pindahkan version badge jika ada
        const versionBadge = sectionElement.querySelector('#version-info-badge');
        if (versionBadge) {
            versionBadge.remove();
            topRow.appendChild(versionBadge);
        }

        // Insert top row sebagai elemen pertama di section
        sectionElement.insertBefore(topRow, sectionElement.firstChild);

        // Hapus h2 duplikat jika ada
        const duplicateH2 = sectionElement.querySelector('#dashboardSchoolName');
        if (duplicateH2) {
            duplicateH2.remove();
        }
    }

    // Observer untuk mendeteksi perubahan section aktif
    function observeActiveSection() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('content-section') && target.classList.contains('active')) {
                        // Section baru aktif, tambahkan top row jika belum ada
                        setTimeout(() => createSchoolNameTopRowForElement(target), 100);
                    }
                }
            });
        });

        // Observe semua section
        document.querySelectorAll('.content-section').forEach(section => {
            observer.observe(section, {
                attributes: true,
                attributeFilter: ['class']
            });
        });
    }

    // Inisialisasi school name top row
    if (window.currentUser && window.currentUser.schoolData) {
        createSchoolNameTopRow();
        observeActiveSection();

        // Update top row setiap kali ada perubahan user data
        window.addEventListener('userDataUpdated', createSchoolNameTopRow);
    }
});

// ===== FUNGSI-FUNGSI UNTUK MODAL ADMIN SISWA =====

// Fungsi untuk membuka modal admin siswa
function openSiswaAdminModal(mode, siswaData = null) {
    const modal = document.getElementById('siswaAdminModal');
    const modalTitle = document.getElementById('siswaAdminModalTitle');
    const modeInput = document.getElementById('siswaAdminModalMode');

    if (!modal || !modalTitle || !modeInput) return;

    // Set mode
    modeInput.value = mode;

    if (mode === 'edit' && siswaData) {
        modalTitle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Edit Data Siswa
        `;

        // Isi form dengan data siswa
        document.getElementById('editKodeBiasa').value = siswaData[0] || '';
        document.getElementById('editKodePro').value = siswaData[1] || '';
        document.getElementById('editNamaSekolah').value = siswaData[2] || '';
        document.getElementById('editKecamatanSiswa').value = siswaData[3] || '';
        document.getElementById('editNoUrut').value = siswaData[4] || '';
        document.getElementById('editNoInduk').value = siswaData[5] || '';
        document.getElementById('adminEditNoPeserta').value = '';
        document.getElementById('adminEditNisn').value = siswaData[7] || '';
        document.getElementById('adminEditNamaPeserta').value = siswaData[8] || '';
        document.getElementById('editTtl').value = siswaData[9] || '';
        document.getElementById('adminEditNamaOrtu').value = siswaData[10] || '';
        document.getElementById('editNoIjazah').value = siswaData[11] || '';

        // Simpan NISN original untuk update
        document.getElementById('originalNisn').value = siswaData[7] || '';
    }

    modal.style.display = 'flex';
}

// Fungsi untuk menutup modal admin siswa
function closeSiswaAdminModal() {
    const modal = document.getElementById('siswaAdminModal');
    const form = document.getElementById('siswaAdminForm');

    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

// Fungsi untuk menangani submit form admin siswa
async function handleSiswaAdminSubmit(event) {
    event.preventDefault();

    const mode = document.getElementById('siswaAdminModalMode').value;
    const originalNisn = document.getElementById('originalNisn').value;

    // Debug: pastikan originalNisn ada untuk mode edit
    if (mode === 'edit' && !originalNisn) {
        showNotification('Error: NISN original tidak ditemukan. Silakan tutup modal dan coba lagi.', 'error');
        return;
    }

    // Ambil data dari form
    const formData = {
        kodeBiasa: document.getElementById('editKodeBiasa').value.trim(),
        kodePro: document.getElementById('editKodePro').value.trim(),
        namaSekolah: document.getElementById('editNamaSekolah').value.trim(),
        kecamatan: document.getElementById('editKecamatanSiswa').value.trim(),
        noUrut: document.getElementById('editNoUrut').value.trim(),
        noInduk: document.getElementById('editNoInduk').value.trim(),
        noPeserta: '',
        nisn: document.getElementById('adminEditNisn').value.trim(),
        namaPeserta: document.getElementById('adminEditNamaPeserta').value.trim(),
        ttl: document.getElementById('editTtl').value.trim(),
        namaOrtu: document.getElementById('adminEditNamaOrtu').value.trim(),
        noIjazah: document.getElementById('editNoIjazah').value.trim() || '' // Allow empty for No Ijazah
    };

    // Validasi field wajib (semua kecuali noIjazah)
    const requiredFields = [
        { key: 'kodeBiasa', label: 'Kode Biasa' },
        { key: 'kodePro', label: 'Kode PRO' },
        { key: 'namaSekolah', label: 'Nama Sekolah' },
        { key: 'kecamatan', label: 'Kecamatan' },
        { key: 'noUrut', label: 'No Urut' },
        { key: 'noInduk', label: 'No Induk' },
        { key: 'nisn', label: 'NISN' },
        { key: 'namaPeserta', label: 'Nama Peserta' },
        { key: 'ttl', label: 'Tempat & Tanggal Lahir' },
        { key: 'namaOrtu', label: 'Nama Orang Tua' }
    ];

    // Cek field yang masih kosong
    const emptyFields = requiredFields.filter(field => !formData[field.key]);
    if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(field => field.label).join(', ');
        showNotification(`Field berikut wajib diisi: ${fieldNames}`, 'warning');
        return;
    }

    try {
        showLoader();

        // Debug: log data yang akan dikirim

        let result;
        if (mode === 'edit') {
            const updateData = {
                originalNisn: originalNisn,
                ...formData
            };


            // Update siswa menggunakan endpoint admin
            result = await fetchWithAuth(apiUrl('/api/data/siswa/update-admin'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
        } else {
            // Tambah siswa baru
            result = await fetchWithAuth(apiUrl('/api/data/siswa/add'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }

        if (result.success) {
            // Update database lokal
            if (mode === 'edit') {
                // Update data siswa di database lokal
                const siswaIndex = database.siswa.findIndex(s => s[6] === originalNisn);
                if (siswaIndex !== -1) {
                    database.siswa[siswaIndex] = [
                        formData.kodeBiasa,
                        formData.kodePro,
                        formData.namaSekolah,
                        formData.kecamatan,
                        formData.noUrut,
                        formData.noInduk,
                        formData.nisn,
                        formData.namaPeserta,
                        formData.ttl,
                        formData.namaOrtu,
                        formData.noIjazah,
                        database.siswa[siswaIndex][11] // Pertahankan foto jika ada
                    ];
                }
            } else {
                // Tambah siswa baru ke database lokal
                database.siswa.push([
                    formData.kodeBiasa,
                    formData.kodePro,
                    formData.namaSekolah,
                    formData.kecamatan,
                    formData.noUrut,
                    formData.noInduk,
                    formData.nisn,
                    formData.namaPeserta,
                    formData.ttl,
                    formData.namaOrtu,
                    formData.noIjazah,
                    null // Foto kosong untuk siswa baru
                ]);
            }

            // Refresh tabel
            if (typeof renderAdminTable === 'function') {
                renderAdminTable('siswa');
            }

            // Refresh student search data
            refreshSiswaSearchData();

            // Tutup modal dan show notifikasi
            closeSiswaAdminModal();
            showNotification('Data siswa berhasil diperbarui', 'success');
        } else {
            throw new Error(result.message || 'Gagal memperbarui data siswa');
        }

    } catch (error) {
        console.error('Error updating student:', error);
        showNotification('Gagal memperbarui data siswa: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

// Event listeners untuk modal admin siswa
document.addEventListener('DOMContentLoaded', function() {
    const closeSiswaAdminModalBtn = document.getElementById('closeSiswaAdminModalBtn');
    const cancelSiswaAdminBtn = document.getElementById('cancelSiswaAdminBtn');
    const siswaAdminForm = document.getElementById('siswaAdminForm');

    // Event handler untuk tutup modal
    if (closeSiswaAdminModalBtn) {
        closeSiswaAdminModalBtn.addEventListener('click', closeSiswaAdminModal);
    }

    if (cancelSiswaAdminBtn) {
        cancelSiswaAdminBtn.addEventListener('click', closeSiswaAdminModal);
    }

    // Event handler untuk submit form
    if (siswaAdminForm) {
        siswaAdminForm.addEventListener('submit', handleSiswaAdminSubmit);
    }

    // Tutup modal jika klik di luar modal
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('siswaAdminModal');
        if (event.target === modal) {
            closeSiswaAdminModal();
        }
    });
});


// ===== PHOTO MODAL FUNCTIONS =====
function openPhotoModal(nisn, namaLengkap) {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('photoModalImage');
    const modalNama = document.getElementById('photoModalNama');
    const modalNisn = document.getElementById('photoModalNisn');

    if (!modal || !modalImage || !modalNama || !modalNisn) return;

    // Set foto dan info siswa
    const photoData = database.sklPhotos && database.sklPhotos[nisn];
    if (photoData) {
        modalImage.src = photoData;
        modalNama.textContent = namaLengkap || 'Tidak diketahui';
        modalNisn.textContent = nisn || 'Tidak diketahui';

        // Tampilkan modal dengan animasi
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    } else {
        showNotification('Foto tidak ditemukan', 'warning');
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Event listener untuk menutup modal foto saat klik di luar
document.addEventListener('click', (event) => {
    const photoModal = document.getElementById('photoModal');
    if (event.target === photoModal) {
        closePhotoModal();
    }
});

// Event listener untuk menutup modal foto dengan tombol ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const photoModal = document.getElementById('photoModal');
        if (photoModal && photoModal.style.display === 'flex') {
            closePhotoModal();
        }
    }
});

// Fungsi untuk Info Terbaru
function renderInfoTerbaru() {

    const infoList = document.getElementById('infoTerbaruList');
    if (!infoList) {
        console.error('Info list container not found');
        return;
    }

    // Show loading
    infoList.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;"><div style="margin-bottom: 12px;">⏳</div><p style="margin: 0;">Memuat pengumuman...</p></div>';

    // Ambil data dari API notifications dengan sederhana
    fetchInfoTerbaruData();
}

async function fetchInfoTerbaruData() {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            showFallbackMessage();
            return;
        }

        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch');
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            renderInfoFeed(result.data);
        } else {
            showFallbackMessage();
        }
    } catch (error) {
        console.error('Error fetching info:', error);
        showErrorMessage();
    }
}

function renderInfoFeed(notifications) {
    const infoList = document.getElementById('infoTerbaruList');
    if (!infoList) return;

    const feedItems = notifications.map((notif, index) => {
        const createdDate = new Date(notif.created_at);
        const isLatest = index === 0;

        return `
            <div style="padding: 20px; border-bottom: 1px solid #f3f4f6; ${isLatest ? 'background: #fefefe;' : ''}">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="flex-shrink: 0; width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6" stroke="white" stroke-width="2" fill="none"></polyline>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
                            <span style="font-size: 14px; color: #3b82f6; font-weight: 500;">Admin</span>
                            <span style="font-size: 13px; color: #6b7280;">
                                ${createdDate.toLocaleDateString('id-ID', {timeZone: 'Asia/Jakarta'})} ${createdDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'})} WIB
                            </span>
                            ${isLatest ? '<span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px;">Terbaru</span>' : ''}
                        </div>
                        <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                            ${notif.message}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    infoList.innerHTML = feedItems;
}

function showFallbackMessage() {
    const infoList = document.getElementById('infoTerbaruList');
    if (infoList) {
        infoList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <div style="margin-bottom: 12px;">📄</div>
                <p style="margin: 0;">Belum ada pengumuman terbaru dari admin.</p>
            </div>
        `;
    }
}

function showErrorMessage() {
    const infoList = document.getElementById('infoTerbaruList');
    if (infoList) {
        infoList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <div style="margin-bottom: 12px;">⚠️</div>
                <p style="margin: 0;">Gagal memuat pengumuman. Silakan refresh halaman.</p>
            </div>
        `;
    }
}

// Event listener untuk menu Info Terbaru
document.addEventListener('DOMContentLoaded', () => {
    // Cari menu Info Terbaru dan tambahkan event listener
    const infoTerbaruMenu = document.querySelector('[data-target="infoTerbaruSection"]');
    if (infoTerbaruMenu) {
        infoTerbaruMenu.addEventListener('click', (e) => {
            e.preventDefault();

            // Aktifkan section Info Terbaru
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.remove('active'));

            const infoSection = document.getElementById('infoTerbaruSection');
            if (infoSection) {
                infoSection.classList.add('active');

                // Load data pengumuman
                setTimeout(() => {
                    renderInfoTerbaru();
                }, 100);
            }
        });
    }
});


// ===== PENGATURAN AKUN FUNCTIONS =====

// Toggle password visibility
document.addEventListener("DOMContentLoaded", function() {
    // Handle password toggle buttons
    document.querySelectorAll(".password-toggle").forEach(button => {
        button.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const targetInput = document.getElementById(targetId);
            const eyeIcon = this.querySelector(".eye-icon");
            
            if (targetInput.type === "password") {
                targetInput.type = "text";
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                targetInput.type = "password";
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });


    // Handle change admin code form
    const changeAdminCodeForm = document.getElementById("changeAdminCodeForm");
    if (changeAdminCodeForm) {
        changeAdminCodeForm.addEventListener("submit", handleChangeAdminCode);
    }
});


// Handle change admin code form submission
async function handleChangeAdminCode(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newLoginCode = formData.get("newLoginCode");

    // Validation
    if (!newLoginCode || newLoginCode.trim().length < 3) {
        showNotification("Kode login baru minimal 3 karakter", "error");
        return;
    }

    // Show loading state
    const submitButton = event.target.querySelector("button[type=\"submit\"]");
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Mengubah Kode...
    `;

    try {
        const token = localStorage.getItem("jwtToken");

        if (!token) {
            showNotification("Anda belum login. Silakan login terlebih dahulu.", "error");
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
            return;
        }

        const response = await fetch("/api/data/account/change-admin-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                newLoginCode: newLoginCode.trim()
            })
        });

        if (response.status === 401 || response.status === 403) {
            showNotification("Session telah berakhir. Silakan login ulang.", "error");
            localStorage.removeItem("jwtToken");
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
            return;
        }

        if (response.status === 400) {
            const errorResult = await response.json();
            showNotification(errorResult.message || "Gagal mengubah kode login", "error");
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            showNotification(`Server error (${response.status}): ${errorText}`, "error");
            return;
        }

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, "success");

            // Add to activity log
            addToActivityLog(`Admin berhasil mengubah kode login menjadi "${result.newLoginCode}".`);

            // Reset form
            event.target.reset();
        } else {
            showNotification(result.message || "Gagal mengubah kode login", "error");
        }

    } catch (error) {
        console.error("Change admin code error:", error);
        showNotification("Terjadi kesalahan saat mengubah kode login", "error");
    } finally {
        // Restore button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Reset change admin code form
function resetChangeAdminCodeForm() {
    const form = document.getElementById("changeAdminCodeForm");
    if (form) {
        form.reset();
    }
}

// Add entry to activity log
function addToActivityLog(message) {
    const activityLog = document.querySelector('.activity-log');
    if (!activityLog) return;

    // Create new log item
    const logItem = document.createElement('div');
    logItem.className = 'log-item';

    const now = new Date();
    const timeString = `Hari ini, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    logItem.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-action">${message}</div>
    `;

    // Add to the top of the activity log
    activityLog.insertBefore(logItem, activityLog.firstChild);

    // Keep only the latest 5 entries
    const logItems = activityLog.querySelectorAll('.log-item');
    if (logItems.length > 5) {
        for (let i = 5; i < logItems.length; i++) {
            logItems[i].remove();
        }
    }
}

// Load account info when pengaturanAkun section is activated
function loadAccountInfo() {
    const userToken = localStorage.getItem("jwtToken");
    if (userToken) {
        try {
            // Decode token untuk mendapatkan info user
            const tokenPayload = JSON.parse(atob(userToken.split(".")[1]));
            
            // Update current username
            const usernameElement = document.getElementById("currentUsername");
            if (usernameElement) {
                usernameElement.textContent = tokenPayload.userIdentifier || "PRASETYA LUKMANA";
            }
            
            // Update current role
            const roleElement = document.getElementById("currentRole");
            if (roleElement) {
                roleElement.textContent = tokenPayload.role || "Dinas Kab/Kota";
            }
            
            // Update last login time
            const lastLoginElement = document.getElementById("lastLoginTime");
            if (lastLoginElement && tokenPayload.iat) {
                const loginDate = new Date(tokenPayload.iat * 1000);
                lastLoginElement.textContent = loginDate.toLocaleString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            }
            
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    }
}


// Handle menu navigation - tambahkan event listener untuk pengaturan akun
document.addEventListener("DOMContentLoaded", function() {
    // Tambahkan event listener untuk semua menu item
    document.querySelectorAll(".menu-item").forEach(menuItem => {
        menuItem.addEventListener("click", function(e) {
            const targetId = this.getAttribute("data-target");

            // Jika menu pengaturan akun diklik, load account info
            if (targetId === "pengaturanAkun") {
                // Tunggu section muncul, kemudian load account info
                setTimeout(() => {
                    loadAccountInfo();
                }, 100);
            }
        });
    });
});

// ===== UPDATE CHECKER FUNCTIONS =====
// Fungsi untuk manual check update dari menu sidebar
async function checkForUpdatesManual() {
    try {
        if (window.updateChecker) {
            const result = await window.updateChecker.manualCheck();
            if (result && !result.updateAvailable) {
                showSmartNotification('Aplikasi sudah menggunakan versi terbaru!', 'success', 'update');
            }
        } else {
            showSmartNotification('Update checker belum siap, coba lagi sebentar...', 'warning', 'update');
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
        showSmartNotification('Gagal memeriksa update. Periksa koneksi internet Anda.', 'error', 'update');
    }
}

// Fungsi untuk menampilkan versi aplikasi saat ini
function showAppVersion() {
    const version = '2.6.0'; // Dari package.json
    showSmartNotification(`Aplikasi E-Ijazah v${version}`, 'info', 'version');
}

// Fungsi untuk membuka changelog
async function showChangelog() {
    try {
        const response = await fetch('/api/updates/changelog');
        const data = await response.json();

        if (data.success && window.updateChecker) {
            // Bisa menampilkan modal changelog atau redirect ke halaman changelog

            showSmartNotification('Changelog dimuat. Lihat console untuk detail.', 'info', 'changelog');
        }
    } catch (error) {
        console.error('Error fetching changelog:', error);
        showSmartNotification('Gagal memuat changelog', 'error', 'changelog');
    }
}

// ==========================================================
// USER PROFILE DROPDOWN FUNCTIONS
// ==========================================================

// Toggle user dropdown
function toggleUserDropdown(userType) {
    const dropdownId = userType === 'admin' ? 'adminUserProfile' : 'sekolahUserProfile';
    const dropdown = document.getElementById(dropdownId);

    if (!dropdown) return;

    // Close other dropdowns first
    document.querySelectorAll('.user-profile-dropdown').forEach(item => {
        if (item.id !== dropdownId) {
            item.classList.remove('active');
        }
    });

    // Toggle current dropdown
    dropdown.classList.toggle('active');

    // Update user info when opening
    if (dropdown.classList.contains('active')) {
        updateUserProfileInfo(userType);
    }
}

// Update user profile info
function updateUserProfileInfo(userType) {
    if (userType === 'admin') {
        const userName = document.getElementById('adminUserName');
        if (userName) {
            userName.textContent = 'Administrator';
        }
    } else if (userType === 'sekolah') {
        const userName = document.getElementById('sekolahUserName');
        const userRole = document.getElementById('sekolahUserRole');

        if (userName && window.currentUser) {
            userName.textContent = window.currentUser.namaSekolah || 'Sekolah';
        }

        if (userRole && window.currentUser) {
            const loginType = window.currentUser.loginType;
            userRole.textContent = loginType === 'pro' ? 'Kode Pro' : 'Kode Biasa';
        }
    }
}

// Show user profile modal
function showUserProfile(userType) {
    // Close dropdown
    toggleUserDropdown(userType);

    if (userType === 'admin') {
        // Show admin profile info
        showNotification('Fitur profil admin akan segera tersedia', 'info');
    } else if (userType === 'sekolah') {
        // Show existing login info modal (manually allow it)
        window.loginInfoModalShown = false; // Allow modal to show again
        showLoginInfoModal();
    }
}

// Show login info for sekolah
function showLoginInfo(userType) {
    // Close dropdown
    toggleUserDropdown(userType);

    // Show existing login info modal (manually allow it)
    window.loginInfoModalShown = false; // Allow modal to show again
    showLoginInfoModal();
}

// Show account settings
function showAccountSettings(userType) {
    // Close dropdown
    toggleUserDropdown(userType);

    if (userType === 'admin') {
        // Navigate to admin settings
        switchContent('pengaturanAkun');
    } else if (userType === 'sekolah') {
        // Navigate to school settings
        switchContentSekolah('settingSection');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdowns = document.querySelectorAll('.user-profile-dropdown');

    dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });
});

// Close dropdown on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.user-profile-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Initialize user profile dropdowns after login
function initializeUserProfile() {
    // Update user info for both panels if they exist
    updateUserProfileInfo('admin');
    updateUserProfileInfo('sekolah');
}

// Add this to existing login success handlers
window.addEventListener('userLoggedIn', () => {
    setTimeout(() => {
        initializeUserProfile();
    }, 100);
});

// ==========================================================
// HEADER USER PROFILE DROPDOWN FUNCTIONS
// ==========================================================

// Toggle header dropdown
function toggleHeaderDropdown() {
    const dropdown = document.getElementById('headerUserProfile');
    if (!dropdown) return;

    // Close other dropdowns first
    document.querySelectorAll('.user-profile-dropdown').forEach(item => {
        if (item.id !== 'headerUserProfile') {
            item.classList.remove('active');
        }
    });

    // Toggle current dropdown
    dropdown.classList.toggle('active');

    // Debug log
    );
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const headerDropdown = document.getElementById('headerUserProfile');
    if (!headerDropdown) return;

    // Check if click is outside the dropdown
    if (!headerDropdown.contains(event.target)) {
        headerDropdown.classList.remove('active');
    }
});

// ==========================================================
// == UTILITY: Force Cache Clear & Data Reload ==
// ==========================================================
window.forceClearCacheAndReload = async function() {

    try {
        // Clear all cache
        Object.keys(tableDataCache).forEach(tableId => {
            invalidateTableCache(tableId);
        });

        // Clear localStorage data cache if any
        const keysToRemove = Object.keys(localStorage).filter(key =>
            key.includes('database') || key.includes('cache') || key.includes('data')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Force refresh from server
        await fetchDataFromServer();

        showNotification('Data berhasil dimuat ulang dari server', 'success');

        return true;
    } catch (error) {
        console.error('Failed to force reload data:', error);
        showNotification('Gagal memuat ulang data: ' + error.message, 'error');
        return false;
    }
};

// Fungsi untuk toggle dropdown di kolom AKSI
function toggleActionDropdown(event, nisn) {

    event.stopPropagation(); // Mencegah event bubbling

    const dropdown = document.getElementById(`dropdown-${nisn}`);
    if (!dropdown) {
        console.error('Dropdown not found for nisn:', nisn);
        return;
    }

    // Cek apakah dropdown ini sudah terbuka
    const isCurrentlyOpen = dropdown.classList.contains('show');

    // Tutup semua dropdown terlebih dahulu
    closeAllDropdowns();

    // Jika dropdown ini belum terbuka, buka sekarang (toggle behavior)
    if (!isCurrentlyOpen) {
        dropdown.classList.add('show');

    } else {

    }
}

// Fungsi untuk menutup semua dropdown
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.action-dropdown-content');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Tutup dropdown ketika klik di luar area dropdown
document.addEventListener('click', function(event) {
    if (!event.target.matches('.action-dropdown-btn')) {
        closeAllDropdowns();
    }
});


