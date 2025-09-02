const API_BASE = window.location.origin; // contoh: https://domainmu.com
const apiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;  




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
                       (currentTimestamp - cache.lastTimestamp) < 5000; // Cache valid for 5 seconds
    
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

        const rowsPerPage = parseInt(state.rowsPerPage, 10);
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
function createVirtualScrollTable(container, data, itemHeight = 50, visibleCount = 10) {
    const totalHeight = data.length * itemHeight;
    const viewportHeight = visibleCount * itemHeight;
    
    container.style.height = `${viewportHeight}px`;
    container.style.overflow = 'auto';
    container.style.position = 'relative';
    
    const scrollContent = document.createElement('div');
    scrollContent.style.height = `${totalHeight}px`;
    scrollContent.style.position = 'relative';
    
    const visibleItems = document.createElement('div');
    visibleItems.style.position = 'absolute';
    visibleItems.style.top = '0';
    visibleItems.style.width = '100%';
    
    let startIndex = 0;
    
    function updateVisibleItems() {
        const scrollTop = container.scrollTop;
        startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + 1, data.length);
        
        visibleItems.style.transform = `translateY(${startIndex * itemHeight}px)`;
        visibleItems.innerHTML = '';
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = document.createElement('div');
            item.style.height = `${itemHeight}px`;
            item.innerHTML = renderTableRow(data[i], i); // Custom row renderer
            visibleItems.appendChild(item);
        }
    }
    
    container.addEventListener('scroll', () => {
        requestAnimationFrame(updateVisibleItems);
    });
    
    scrollContent.appendChild(visibleItems);
    container.appendChild(scrollContent);
    updateVisibleItems();
}

// Optimized DOM manipulation for large tables
function batchDOMUpdates(callback) {
    // Use documentFragment for better performance when creating multiple elements
    return requestAnimationFrame(() => {
        const fragment = document.createDocumentFragment();
        const result = callback(fragment);
        return result;
    });
}

function createTableRowBatch(rows, createRowFunction) {
    const fragment = document.createDocumentFragment();
    
    // Process in smaller chunks to avoid blocking the UI
    const chunkSize = 50;
    let index = 0;
    
    function processChunk() {
        const endIndex = Math.min(index + chunkSize, rows.length);
        
        for (let i = index; i < endIndex; i++) {
            const row = createRowFunction(rows[i], i);
            if (row instanceof HTMLElement) {
                fragment.appendChild(row);
            } else if (typeof row === 'string') {
                const tr = document.createElement('tr');
                tr.innerHTML = row;
                fragment.appendChild(tr);
            }
        }
        
        index = endIndex;
        
        if (index < rows.length) {
            // Process next chunk
            requestAnimationFrame(processChunk);
        }
    }
    
    processChunk();
    return fragment;
}

// Intersection Observer for lazy loading table rows
function setupLazyTableLoading(tableContainer, loadMoreCallback) {
    if (!('IntersectionObserver' in window)) {
        return; // Fallback for older browsers
    }
    
    const loadMoreTrigger = document.createElement('div');
    loadMoreTrigger.style.height = '20px';
    loadMoreTrigger.style.margin = '10px 0';
    loadMoreTrigger.textContent = 'Loading more...';
    
    tableContainer.appendChild(loadMoreTrigger);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadMoreCallback();
            }
        });
    }, { 
        root: tableContainer,
        rootMargin: '100px' 
    });
    
    observer.observe(loadMoreTrigger);
    
    return observer;
}

let searchState = {
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

        let currentUser = {
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


        function showLoader(message = 'Memproses...') {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
                const loadingText = loadingOverlay.querySelector('.loading-text') || 
                                   loadingOverlay.querySelector('.spinner');
                if (loadingText && loadingText.nextSibling) {
                    loadingText.nextSibling.textContent = message;
                } else if (loadingText) {
                    // Create loading text if it doesn't exist
                    const textElement = document.createElement('div');
                    textElement.className = 'loading-text';
                    textElement.textContent = message;
                    textElement.style.marginTop = '15px';
                    textElement.style.color = '#666';
                    textElement.style.fontSize = '14px';
                    loadingText.parentNode.appendChild(textElement);
                }
            }
        }

        function hideLoader() {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }

        // Enhanced loading states for specific operations
        function showButtonLoading(buttonElement, originalText) {
            if (!buttonElement) return originalText;
            
            const spinner = document.createElement('span');
            spinner.innerHTML = '⟳';
            spinner.style.display = 'inline-block';
            spinner.style.animation = 'spin 1s linear infinite';
            spinner.style.marginRight = '5px';
            spinner.className = 'btn-spinner';
            
            const currentText = buttonElement.textContent;
            buttonElement.disabled = true;
            buttonElement.prepend(spinner);
            buttonElement.style.opacity = '0.7';
            
            return currentText;
        }

        function hideButtonLoading(buttonElement, originalText) {
            if (!buttonElement) return;
            
            const spinner = buttonElement.querySelector('.btn-spinner');
            if (spinner) spinner.remove();
            
            buttonElement.disabled = false;
            buttonElement.style.opacity = '1';
            if (originalText) buttonElement.textContent = originalText;
        }

        // Smart loading for table operations
        function showTableLoading(tableContainer, message = 'Memuat data...') {
            if (!tableContainer) return;
            
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'table-loading-overlay';
            loadingDiv.innerHTML = `
                <div class="table-loading-content">
                    <div class="loading-spinner"></div>
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

        // REPLACE: showNotification
function showNotification(message, type = 'success') {
  const el = document.getElementById('notification');
  if (!el) { 
    console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`); 
    return; 
  }
  
  // Pastikan tipe notifikasi valid
  const validTypes = ['success', 'warning', 'error', 'info'];
  if (!validTypes.includes(type)) {
    type = 'info';
  }
  
  // Clear existing classes dan tambahkan yang baru
  el.className = '';
  el.textContent = message;
  el.className = `show ${type}`;
  
  // Auto hide setelah 4 detik (lebih lama untuk info)
  const timeout = type === 'info' ? 4000 : 3000;
  setTimeout(() => { 
    el.className = el.className.replace('show', ''); 
  }, timeout);
}


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

  const resp = await fetch(fullUrl, { ...options, headers });
  if (resp.status === 401 || resp.status === 403) { handleLogout?.(); throw new Error('Sesi Anda telah berakhir. Silakan login kembali.'); }
  
  const data = await resp.json().catch(() => ({}));
  
  // Jika status bukan 2xx, throw error dengan message dari response
  if (!resp.ok) {
    throw new Error(data.message || `HTTP ${resp.status}: ${resp.statusText}`);
  }
  
  return data;
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
    const originalText = showButtonLoading(loginBtn);
    showLoader('Memverifikasi kode aplikasi...');

    const appCode = appCodeInput.value.trim();
    const kurikulum = document.querySelector('input[name="kurikulum"]:checked').value;

    if (!appCode) {
        showSmartNotification('Silakan masukkan Kode Aplikasi.', 'warning', 'login');
        hideButtonLoading(loginBtn, originalText);
        hideLoader();
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
            currentUser = {
                isLoggedIn: true,
                role: loginData.role,
                schoolData: loginData.schoolData,
                loginType: loginData.loginType,
                kurikulum: loginData.kurikulum
            };
            // ================================
            
            localStorage.setItem('currentUserSession', JSON.stringify(currentUser)); 
            
            await fetchDataFromServer();

            showDashboard(currentUser.role);
            if (currentUser.role === 'sekolah') {
                showLoginInfoModal();
            }
        } else {
            throw new Error(loginData.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        showSmartNotification(error, 'error', 'login');
    } finally {
        hideButtonLoading(loginBtn, originalText);
        hideLoader();
    }
}

// ==========================================================
// == TAMBAHKAN KEMBALI FUNGSI YANG HILANG INI ==
// ==========================================================
// === FINAL: Simpan HANYA SATU versi dari fungsi ini ===
async function fetchDataFromServer() {
  try {
    if (typeof showLoader === 'function') showLoader('Memuat data dari server...');

    const result = await fetchWithAuth(apiUrl('/api/data/all'));

    if (!result?.success) {
      throw new Error(result?.message || 'Gagal memuat data dari server.');
    }

    // Update state global
    database = result.data;
    
    // PERFORMANCE: Invalidate all table caches when data changes from server
    Object.keys(tableDataCache).forEach(tableId => {
        invalidateTableCache(tableId);
    });
    
    // Debug: Log nilai data after fetch
    console.log('Data fetched from server:');
    console.log('Total siswa:', database.siswa?.length || 0);
    console.log('Total nilai records:', Object.keys(database.nilai || {}).filter(k => k !== '_mulokNames').length);
    console.log('Sample nilai data:', Object.keys(database.nilai || {}).slice(0, 3).map(nisn => ({
        nisn, 
        semesterCount: Object.keys(database.nilai[nisn] || {}).length,
        sampleData: database.nilai[nisn]
    })));
    console.log('Full nilai keys:', Object.keys(database.nilai || {}));

    // Re-render section aktif di Admin
    const activeAdminSection = document.querySelector('#adminDashboard .content-section.active');
    if (activeAdminSection && typeof renderAdminTable === 'function') {
      renderAdminTable(activeAdminSection.id);
    }

    // Re-render section aktif di Sekolah
    const activeSekolahSection = document.querySelector('#sekolahDashboard .content-section.active');
    if (activeSekolahSection) {
      const tableId = activeSekolahSection.dataset.tableId || activeSekolahSection.id;
      if (typeof rerenderActiveTable === 'function') {
        rerenderActiveTable(tableId);
      } else if (typeof switchSekolahContent === 'function') {
        switchSekolahContent(activeSekolahSection.id);
      }
    }

    // Update ranking widget jika user sedang di dashboard
    if (currentUser && currentUser.role === 'sekolah' && 
        activeSekolahSection && activeSekolahSection.id === 'dashboardSection') {
      updateRankingWidget();
    }

    return true;
  } catch (error) {
    console.error('Fetch error:', error);
    if (typeof showNotification === 'function') {
      showNotification(error.message || 'Gagal memuat data dari server.', 'error');
    }
    return false;
  } finally {
    if (typeof hideLoader === 'function') hideLoader();
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
    if (typeof switchContent === 'function') switchContent('sekolah');
  } else if (role === 'sekolah' && sekolahDashboard) {
    sekolahDashboard.style.display = 'flex';
    const defaultTarget = 'dashboardSection';
    document.querySelectorAll('#sekolahDashboard .menu-item').forEach(m => m.classList.remove('active'));
    const defaultLink = document.querySelector(`.menu-item[data-target="${defaultTarget}"]`);
    if (defaultLink) defaultLink.classList.add('active');
    if (typeof switchSekolahContent === 'function') switchSekolahContent(defaultTarget);
    renderVersionBadge();
    
    // Check Pro activation menu state after login
    const kodeBiasa = currentUser?.schoolData?.[0];
    const isProForSchool = kodeBiasa ? localStorage.getItem(`kodeProActivated:${kodeBiasa}`) === 'true' : false;
    
    // LOGIKA MENU AKTIVASI:
    // 1. Jika login dengan kode PRO -> disable menu
    // 2. Jika login dengan kode biasa tapi sudah aktivasi PRO -> disable menu  
    // 3. Jika login dengan kode biasa dan belum aktivasi PRO -> enable menu (bisa diklik)
    if (currentUser?.loginType === 'pro' || isProForSchool) {
      disableAktivasiMenu();
    } else if (currentUser?.loginType === 'biasa' && !isProForSchool) {
      enableAktivasiMenu(); // Memastikan menu bisa diklik untuk kode biasa
    }
  }
}

// REPLACE: renderVersionBadge
function renderVersionBadge() {
  const badge = document.getElementById('version-info-badge');
  if (!badge) return;
  if (currentUser?.role !== 'sekolah') {
    badge.innerHTML = '';
    return;
  }
  const loginType = currentUser.loginType;
  badge.innerHTML = (loginType === 'pro')
    ? `<span class="version-badge pro">VERSI PRO <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="gold" stroke="gold" stroke-width="1"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg></span>`
    : `<span class="version-badge biasa">VERSI BIASA</span>`;
}

function switchSekolahContent(targetId) {
    document.querySelectorAll('#sekolahDashboard .content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    
    document.querySelectorAll('#sekolahDashboard .sidebar-menu a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`#sekolahDashboard .sidebar-menu a[data-target="${targetId}"]`);
    if(activeLink && !activeLink.classList.contains('has-submenu')) {
         activeLink.classList.add('active');
    }

    if (targetId === 'dashboardSection') {
        renderDashboardStats();
    } else if (targetId === 'profilSiswaSection') {
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
    } else if (targetId === 'aktivasiKodeProSection') { // Penambahan untuk Aktivasi Kode Pro
        console.log('Switching to aktivasi kode pro section');
        initAktivasiKodePro();
    }
}


function renderDashboardStats() {
    if (currentUser.role !== 'sekolah' || !currentUser.schoolData) return;

    const schoolKodeBiasa = String(currentUser.schoolData[0]);
    const filteredSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);
    const totalSiswa = filteredSiswa.length;

    // --- MENGISI SEMUA INFORMASI BARU DI DASBOR ---
    // Update elements that exist
    const dashboardSchoolName = document.getElementById('dashboardSchoolName');
    if (dashboardSchoolName) {
        dashboardSchoolName.textContent = currentUser.schoolData[4] || 'Dasbor Statistik';
    }
    
    const statTotalSiswa = document.getElementById('statTotalSiswa');
    if (statTotalSiswa) {
        statTotalSiswa.textContent = `${totalSiswa} Siswa`;
    }
    
    const statKurikulum = document.getElementById('statKurikulum');
    if (statKurikulum) {
        statKurikulum.textContent = currentUser.kurikulum;
    }

    // Hitung data completion (siswa dengan NISN dan foto)
    const siswaDataLengkap = filteredSiswa.filter(siswa => {
        const hasNISN = siswa[7] && String(siswa[7]).trim() !== '';
        const hasPhoto = siswa[12] && String(siswa[12]).trim() !== '';
        return hasNISN && hasPhoto;
    }).length;
    
    const statDataCompletion = document.getElementById('statDataCompletion');
    if (statDataCompletion) {
        statDataCompletion.textContent = `${siswaDataLengkap}/${totalSiswa}`;
    }

    // Hitung nilai progress (siswa dengan nilai lengkap untuk semua semester)
    const siswaNilaiLengkap = filteredSiswa.filter(siswa => 
        checkNilaiLengkap(siswa[7], false)
    ).length;
    
    const statNilaiProgress = document.getElementById('statNilaiProgress');
    if (statNilaiProgress) {
        statNilaiProgress.textContent = `${siswaNilaiLengkap}/${totalSiswa}`;
    }

    // --- Dari sini ke bawah adalah logika untuk membuat grafik ---
    if (charts.completionChart) charts.completionChart.destroy();
    if (charts.averageGradeChart) charts.averageGradeChart.destroy();
    
    // --- Logika Grafik Kelengkapan Data (Donat) ---
    if (totalSiswa > 0) {
        const completionCtx = document.getElementById('completionChart');
        if (completionCtx) {
            let nilaiLengkapCount = 0, ijazahLengkapCount = 0;
            filteredSiswa.forEach(siswa => {
                if (checkNilaiLengkap(siswa[7], false)) nilaiLengkapCount++;
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
            });
        }
    }

    // --- Logika Grafik Rata-rata Nilai (Batang) ---
    const avgGradeCtx = document.getElementById('averageGradeChart');
    if (avgGradeCtx && totalSiswa > 0) {
       // --- Logika Grafik Rata-rata Nilai (Batang) ---
const avgGradeCtx = document.getElementById('averageGradeChart');
if (avgGradeCtx && totalSiswa > 0) {
  const kurikulum = currentUser.kurikulum;
  const schoolKodeBiasa = String(currentUser.schoolData[0]);
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
                    const isComplete = checkNilaiLengkapForSemester(siswa[7], semId);
                    if (isComplete) {
                        completedCount++;
                    }
                });

                const percentage = totalSiswa > 0 ? (completedCount / totalSiswa) * 100 : 0;
                console.log(`Semester ${semName} (${semId}): ${completedCount}/${totalSiswa} complete (${Math.round(percentage)}%)`);
                
                // Debug untuk semester pertama saja untuk menghindari spam
                if (semId === '1') {
                    console.log('Debug semester 1 - checking first 3 students:');
                    siswaList.slice(0, 3).forEach(siswa => {
                        const nisn = siswa[7];
                        const nama = siswa[8];
                        const isComplete = checkNilaiLengkapForSemester(nisn, semId);
                        console.log(`Student ${nama} (${nisn}): ${isComplete ? 'Complete' : 'Incomplete'}`);
                        if (!isComplete && database.nilai[nisn]?.[semId]) {
                            console.log(`  Available subjects for ${nisn}:`, Object.keys(database.nilai[nisn][semId] || {}));
                        }
                    });
                }

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
        const nama = String(siswa[8] || '').toLowerCase();
        const nis = String(siswa[5] || '').toLowerCase();
        const nisn = String(siswa[7] || '').toLowerCase();
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
    if (currentUser.role !== 'sekolah' || !currentUser.schoolData) return;
    
    const schoolData = currentUser.schoolData;
    const schoolKodeBiasa = String(schoolData[0]);
    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);

    const searchTerm = searchState.sekolahSiswa;
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);
    
    filteredSiswa = applySort(filteredSiswa, 'sekolahSiswa');

    document.getElementById('sekolahSidebarHeader').textContent = schoolData[5] || 'Dasbor Sekolah';
    
    // Debug untuk melihat data sekolah
    console.log('School data for profil siswa:', {
        kodeBiasa: schoolData[0],
        kodePro: schoolData[1], 
        kecamatan: schoolData[2],
        npsn: schoolData[3],
        namaLengkap: schoolData[4],
        namaSingkat: schoolData[5]
    });
    
    document.getElementById('sekolahInfoPropinsi').textContent = 'KALIMANTAN BARAT';
    document.getElementById('sekolahInfoKabupaten').textContent = 'MELAWI';
    document.getElementById('sekolahInfoKecamatan').textContent = schoolData[2] || '-';
    // NPSN: tampilkan nilai, jika kosong tampilkan 'Belum diisi' dan tandai untuk styling
    const npsnEl = document.getElementById('sekolahInfoNpsn');
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
    document.getElementById('sekolahInfoNama').textContent = schoolData[4] || schoolData[5] || '-';
    document.getElementById('sekolahInfoTotalSiswa').textContent = allSiswa.length;

    const tableBody = document.getElementById('sekolahSiswaTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const tableHead = document.querySelector('#profilSiswaSection thead tr');
    const tableEl = document.querySelector('#profilSiswaSection table');
    const isPro = currentUser.loginType === 'pro';
    if (tableEl) tableEl.classList.toggle('has-photo-col', isPro);

    // Tampilkan kolom sesuai mode: PRO menampilkan FOTO + AKSI, Non‑PRO minimal NO IJAZAH + AKSI(Edit)
    if (isPro) {
        tableHead.innerHTML = `
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="4" data-key-type="number">NO</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="7" data-key-type="string">NISN</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="5" data-key-type="string">NIS</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="6" data-key-type="string">NO PESERTA</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="8" data-key-type="string">NAMA PESERTA</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="9" data-key-type="string">TEMPAT, TANGGAL LAHIR</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="10" data-key-type="string">NAMA ORANG TUA</th>
            <th class="photo-column">FOTO</th>
            <th>NO IJAZAH</th>
            <th class="action-column">AKSI</th>
        `;
    } else {
         tableHead.innerHTML = `
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="4" data-key-type="number">NO</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="7" data-key-type="string">NISN</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="5" data-key-type="string">NIS</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="6" data-key-type="string">NO PESERTA</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="8" data-key-type="string">NAMA PESERTA</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="9" data-key-type="string">TEMPAT, TANGGAL LAHIR</th>
            <th class="sortable" data-table-id="sekolahSiswa" data-key-index="10" data-key-type="string">NAMA ORANG TUA</th>
            <th>NO IJAZAH</th>
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
        const originalIndex = database.siswa.findIndex(s => s === siswa);
        const nisn = siswa[7];
        const row = tableBody.insertRow();
        
        let photoCellHtml = '';
        if (isPro) {
            const hasPhoto = database.sklPhotos && database.sklPhotos[nisn];
            photoCellHtml = hasPhoto
                ? `<div class="photo-thumbnail-container"><img src="${database.sklPhotos[nisn]}" class="photo-thumbnail"></div>`
                : '<span class="no-photo-placeholder">❌</span>';
        }

        let actionCellHtml = '';
        if (isPro) {
             const hasPhoto = database.sklPhotos && database.sklPhotos[nisn];
             actionCellHtml = `
                <button class="btn btn-small btn-edit" onclick="openEditModal(database.siswa[${originalIndex}])">Edit</button>
                <button class="btn btn-small btn-upload" onclick="document.getElementById('profil-photo-input-${nisn}').click();">
                    ${hasPhoto ? 'Ubah Foto' : 'Unggah Foto'}
                </button>
                <input type="file" id="profil-photo-input-${nisn}" class="file-input" accept="image/*" onchange="handleSklPhotoUpload(event, '${nisn}')">
                ${hasPhoto ? `<button class="btn btn-small btn-delete" onclick="deleteSklPhoto('${nisn}')">Hapus</button>` : ''}
            `;
        }
        
        // Perbaikan: Atribut onchange selalu ada agar validasi tetap berjalan
        const ijazahInputHtml = `<input type="text" class="editable-ijazah" value="${siswa[11] || ''}" data-index="${originalIndex}" onchange="saveIjazahNumber(this)">`;
        
        if (isPro) {
            row.innerHTML = `
                <td>${siswa[4] || (start + index + 1)}</td>
                <td>${siswa[7] || ''}</td><td>${siswa[5] || ''}</td><td>${siswa[6] || ''}</td>
                <td>${siswa[8] || ''}</td><td>${siswa[9] || ''}</td><td>${siswa[10] || ''}</td>
                <td class="photo-cell">${photoCellHtml}</td>
                <td>${ijazahInputHtml}</td>
                <td class="action-cell">${actionCellHtml}</td>
            `;
        } else {
             row.innerHTML = `
                <td>${siswa[4] || (start + index + 1)}</td>
                <td>${siswa[7] || ''}</td><td>${siswa[5] || ''}</td><td>${siswa[6] || ''}</td>
                <td>${siswa[8] || ''}</td><td>${siswa[9] || ''}</td><td>${siswa[10] || ''}</td>
                <td>${ijazahInputHtml}</td>
            `;
        }
    });

    optimizedUpdatePaginationControls('sekolahSiswa', filteredSiswa.length);
    updateSortHeaders('sekolahSiswa');
}


function renderIsiNilaiPage(semesterId, semesterName) {
    switchSekolahContent('isiNilaiSection');
    document.getElementById('isiNilaiTitle').textContent = `Isi Nilai - ${semesterName}`;
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
    
    const schoolKodeBiasa = String(currentUser.schoolData[0]);
    const mulokNames = database.nilai._mulokNames?.[schoolKodeBiasa] || {};
    
    // PERUBAHAN UTAMA: Header tabel tidak lagi menggunakan input untuk nama Mulok
    if (currentUser.kurikulum === 'K13') {
        const currentSubjects = subjects.K13.filter(s => !s.startsWith("MULOK"));
        const tr1 = document.createElement('tr');
        tr1.innerHTML = `<th rowspan="2">NO</th><th rowspan="2" class="sortable" data-table-id="isiNilai" data-key-index="8" data-key-type="string">NAMA</th>`;
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
        tr.innerHTML = `<th>NO</th><th class="sortable" data-table-id="isiNilai" data-key-index="8" data-key-type="string">NAMA</th>`;
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
    const rowsPerPage = state.rowsPerPage === 'all' ? filteredSiswa.length : parseInt(state.rowsPerPage);
    const totalPages = rowsPerPage > 0 ? Math.ceil(filteredSiswa.length / rowsPerPage) : 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));
    
    const start = (state.currentPage - 1) * rowsPerPage;
    const end = state.rowsPerPage === 'all' ? filteredSiswa.length : start + rowsPerPage;
    const paginatedData = filteredSiswa.slice(start, end);

    const settings = database.settings[schoolKodeBiasa] || {};
    const subjectVisibility = settings.subjectVisibility || {};

    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[7] || `temp-${start + index}`;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${start + index + 1}</td><td>${siswa[8] || ''}</td>`;

        let rowHtml = '';
        const allSubjectsForKurikulum = subjects[currentUser.kurikulum];

        allSubjectsForKurikulum.forEach(sub => {
            const isVisible = subjectVisibility[sub] !== false;
            const disabledAttribute = isVisible ? '' : 'disabled';

            if (currentUser.kurikulum === 'K13') {
                const ki3 = database.nilai[nisn]?.[semesterId]?.[sub]?.KI3 || '';
                const ki4 = database.nilai[nisn]?.[semesterId]?.[sub]?.KI4 || '';
                let rt = (ki3 !== '' && ki4 !== '') ? Math.round((parseFloat(ki3) + parseFloat(ki4)) / 2) : '';
                
                // Debug: Log nilai yang diambil untuk siswa tertentu
                if (index === 0) { // Log hanya untuk siswa pertama untuk menghindari spam console
                    console.log(`Rendering nilai siswa pertama (${nisn}) - Subject: ${sub}, Semester: ${semesterId}`);
                    console.log('KI3:', ki3, 'KI4:', ki4, 'RT:', rt);
                    console.log('Data nilai siswa:', database.nilai[nisn]?.[semesterId]?.[sub]);
                }
                
                rowHtml += `
                    <td><input type="number" min="0" max="100" value="${ki3}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="KI3" oninput="handleGradeInput(this); calculateRataRata(this);" ${disabledAttribute}></td>
                    <td><input type="number" min="0" max="100" value="${ki4}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="KI4" oninput="handleGradeInput(this); calculateRataRata(this);" ${disabledAttribute}></td>
                    <td><input type="number" value="${rt}" data-nisn="${nisn}" data-semester="${semesterId}" data-subject="${sub}" data-type="RT" readonly></td>`;
            } else { // Kurikulum Merdeka
                const nilai = database.nilai[nisn]?.[semesterId]?.[sub]?.NILAI || '';
                
                // Debug: Log nilai yang diambil untuk siswa tertentu
                if (index === 0) { // Log hanya untuk siswa pertama untuk menghindari spam console
                    console.log(`Rendering nilai siswa pertama (${nisn}) - Subject: ${sub}, Semester: ${semesterId}`);
                    console.log('NILAI:', nilai);
                    console.log('Data nilai siswa:', database.nilai[nisn]?.[semesterId]?.[sub]);
                    console.log('Available NISN in nilai:', Object.keys(database.nilai || {}).filter(k => k !== '_mulokNames').slice(0, 5));
                    console.log('NISN exists in nilai?', database.nilai[nisn] ? 'YES' : 'NO');
                    if (database.nilai[nisn]) {
                        console.log('Available semesters for this NISN:', Object.keys(database.nilai[nisn]));
                    }
                }
                
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
        
        function calculateRataRata(inputElement) {
            const row = inputElement.closest('tr');
            if (!row) return;

            const { nisn, subject } = inputElement.dataset;
            const ki3Input = row.querySelector(`input[data-nisn="${nisn}"][data-subject="${subject}"][data-type="KI3"]`);
            const ki4Input = row.querySelector(`input[data-nisn="${nisn}"][data-subject="${subject}"][data-type="KI4"]`);
            const rtInput = row.querySelector(`input[data-nisn="${nisn}"][data-subject="${subject}"][data-type="RT"]`);

            if (!ki3Input || !ki4Input || !rtInput) return;

            const ki3 = parseFloat(ki3Input.value) || 0;
            const ki4 = parseFloat(ki4Input.value) || 0;

            let avg = '';
            if (ki3Input.value.trim() !== '' && ki4Input.value.trim() !== '') {
                avg = Math.round((ki3 + ki4) / 2);
            }
            
            rtInput.value = avg;
            saveGrade(rtInput);
        }
        
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
            const originalIndex = database.siswa.findIndex(s => s === siswaData);
            if (originalIndex === -1) return;

            document.getElementById('editSiswaIndex').value = originalIndex;
            document.getElementById('editNis').value = siswaData[5] || '';
            document.getElementById('editNisn').value = siswaData[7] || '';
            document.getElementById('editNoPeserta').value = siswaData[6] || '';
            document.getElementById('editNamaPeserta').value = siswaData[8] || '';
            
            const ttl = (siswaData[9] || ',').split(',');
            const tempatLahir = ttl[0] ? ttl[0].trim() : '';
            const tanggalLahirStr = ttl[1] ? ttl[1].trim() : '';
            
            document.getElementById('editTempatLahir').value = tempatLahir;
            document.getElementById('editTanggalLahir').value = parseDateToYMD(tanggalLahirStr);
            
            document.getElementById('editNamaOrtu').value = siswaData[10] || '';
            
            // Tampilkan foto siswa jika ada
            loadFotoSiswa(siswaData[7]); // NISN sebagai identifier
            
            editModal.style.display = 'flex';
        }

        function closeEditModal() {
            editModal.style.display = 'none';
            // Reset foto preview
            resetFotoPreview();
        }
        
        // === FUNGSI DOWNLOAD TEMPLATE ===
        async function downloadIsiNilaiTemplate() {
            if (currentUser.role !== 'sekolah' || !currentUser.schoolData) {
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
                const downloadUrl = apiUrl(`/api/data/template/download?semester=${currentSemester}&kurikulum=${currentUser.kurikulum}&kodeSekolah=${currentUser.schoolData[0]}`);
                
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
                link.download = `Template-Nilai-Sem${currentSemester}-${currentUser.kurikulum}.xlsx`;
                
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
            
            console.log('loadFotoSiswa called with NISN:', nisn);
            console.log('Preview element:', preview);
            console.log('database.sklPhotos:', database.sklPhotos);
            
            if (!nisn || !preview) {
                console.log('NISN or preview element is missing');
                return;
            }
            
            // Cek apakah ada foto tersimpan untuk siswa ini di database.sklPhotos
            if (database.sklPhotos && database.sklPhotos[nisn]) {
                console.log('Photo found in database.sklPhotos:', database.sklPhotos[nisn].substring(0, 50) + '...');
                preview.src = database.sklPhotos[nisn];
                preview.classList.add('uploaded');
            } else {
                console.log('No photo found, using placeholder');
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
            if (!currentUser.schoolData) return;

            const schoolData = currentUser.schoolData;
            const schoolKodeBiasa = String(schoolData[0]);
            const totalSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa).length;

            document.getElementById('infoNamaSekolah').textContent = schoolData[4] || 'Nama Sekolah Tidak Ditemukan';
            document.getElementById('infoJumlahSiswa').textContent = `${totalSiswa} siswa`;
            document.getElementById('infoKurikulum').textContent = currentUser.kurikulum;

            loginInfoModal.style.display = 'flex';
        }

        function closeLoginInfoModal() {
            loginInfoModal.style.display = 'none';
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
        
        console.log('Date processing:', {
            tempatLahir,
            tanggalLahirYMD, 
            tanggalLahirFormatted
        });

        // Foto tidak dapat diubah dari popup edit - hanya dari tabel
        const fotoBase64 = null;
        
        const updatedData = {
            nis: document.getElementById('editNis').value || '',
            nisn: nisnValue,
            noPeserta: document.getElementById('editNoPeserta').value || '',
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

        console.log('Sending update data:', { nisn: nisnValue, updatedData: updatedData });

        // Test koneksi ke server terlebih dahulu
        try {
            const testResponse = await fetch(apiUrl('/api/data/siswa'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Server connection test status:', testResponse.status);
        } catch (testError) {
            console.error('Server connection test failed:', testError);
            throw new Error('Tidak dapat terhubung ke server. Pastikan server sedang berjalan.');
        }

        // Langsung gunakan hasil dari fetchWithAuth
        const result = await fetchWithAuth(apiUrl('/api/data/siswa/update'), {
            method: 'POST',
            body: JSON.stringify({ nisn: nisnValue, updatedData: updatedData })
        });

        console.log('Server response:', result);

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
            currentUser = { isLoggedIn: false, role: null, schoolData: null, loginType: null, kurikulum: null };
        }

        function switchContent(targetId) {
    document.querySelectorAll('#adminDashboard .content-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .sidebar-menu .menu-item').forEach(item => item.classList.remove('active'));

    document.getElementById(targetId).classList.add('active');
    document.querySelector(`#adminDashboard .menu-item[data-target="${targetId}"]`).classList.add('active');
    
    // PERBAIKAN: Menggunakan if/else if yang benar
    if (targetId === 'sekolah') {
        renderAdminTable('sekolah');
    } else if (targetId === 'siswa') {
        renderAdminTable('siswa');
    } else if (targetId === 'rekapNilaiAdmin') {
        renderRekapNilaiAdminPage();
    }
}

    // GANTI SELURUH FUNGSI handleFile DENGAN VERSI FINAL INI
async function handleFile(e, tableId) {
    showLoader();
    const file = e.target.files[0];
    if (!file) {
        hideLoader();
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length > 0) {
                jsonData.shift(); // Menghapus baris header
            }

            // --- PERBAIKAN UTAMA DI SINI ---
            // Menggunakan fetchWithAuth untuk mengirim data ke backend yang aman
            const result = await fetchWithAuth(apiUrl(`/api/data/import/${tableId}`), {
                method: 'POST',
                body: JSON.stringify(jsonData),
            });

            if (result.success) {
                showNotification(result.message, 'success');
                // Ambil data terbaru dari server untuk memastikan sinkronisasi
                await fetchDataFromServer();
                // Render ulang tabel untuk menampilkan data baru
                renderAdminTable(tableId);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error("Error processing or sending Excel file:", error);
            showNotification(error.message || "Gagal memproses file Excel.", 'error');
        } finally {
            hideLoader();
            e.target.value = ''; // Reset input file
        }
    };
    reader.readAsArrayBuffer(file);
}   
        
// Di dalam file E-ijazah.html, ganti seluruh fungsi ini

function renderAdminTable(tableId) {
    const tableBodyId = tableId === 'siswa' ? 'adminSiswaTableBody' : `${tableId}TableBody`;
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    let data;
    if (tableId === 'rekapNilaiAdmin') {
        data = getRekapNilaiLengkapData();
    } else {
        data = database[tableId] || [];
    }

    const searchInput = document.getElementById(`search${capitalize(tableId)}`);
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
    
    const filteredData = searchTerm
        ? data.filter(item => {
            if (['rekapNilaiAdmin', 'sekolah'].includes(tableId)) {
                return Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm)
                );
            }
            return item.some(cell => String(cell).toLowerCase().includes(searchTerm));
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
            rowData.forEach(cellData => {
                const cell = row.insertCell();
                cell.textContent = cellData;
            });

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
            }
            // ==========================================================
        });
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
  const msg = tableId === 'sekolah'
    ? 'Anda akan menghapus SEMUA data SEKOLAH.\nTindakan ini hanya menyasar tabel SEKOLAH.\nJika masih ada SISWA terkait, penghapusan akan DITOLAK.\n\nApakah Anda yakin?'
    : 'Anda akan menghapus SEMUA data SISWA.\nTindakan ini hanya menyasar tabel SISWA.\nJika masih ada NILAI/FOTO terkait, penghapusan akan DITOLAK.\n\nApakah Anda yakin?';

  const confirmed = confirm(msg);
  if (!confirmed) {
    if (typeof showNotification === 'function') showNotification('Dibatalkan.', 'warning');
    return;
  }

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
    } catch (_) {}
    console.error('deleteAllData error:', err);
    if (typeof showNotification === 'function') showNotification(msg, 'error');
  } finally {
    if (typeof hideLoader === 'function') hideLoader();
  }
}




function rerenderActiveTable(tableId) {
    // Jika tidak ada tableId, jangan lakukan apa-apa
    if (!tableId) return;

    // Menormalkan tableId untuk mencakup ID section juga
    if (tableId.endsWith('Section')) {
        tableId = tableId.replace('Section', '');
    }

    if (tableId === 'sekolahSiswa') {
        renderProfilSiswa();
    } else if (tableId === 'isiNilai') {
        const { currentSemester, currentSemesterName } = paginationState.isiNilai;
        // Hanya render jika semester sudah dipilih. Jika belum, jangan lakukan apa-apa.
        if (currentSemester) {
            renderIsiNilaiPage(currentSemester, currentSemesterName);
        }
    } else if (tableId === 'transkripNilai') {
        renderTranskripSiswaTable();
    } else if (tableId === 'skl') {
        renderSklSiswaTable();
    } else if (tableId === 'skkb') {
        renderSkkbSiswaTable();
    } else if (tableId === 'cetakGabungan') {
        renderCetakGabunganPage();
    } else if (tableId === 'rekapNilai') {
        renderRekapNilai();
    } else {
        // Ini untuk tabel di dasbor admin
        renderAdminTable(tableId);
    }
}
        
        function renderGenericSiswaTable(tableId, openModalFn, downloadPdfFn) {
    if (currentUser.role !== 'sekolah' || !currentUser.schoolData) return;
    
    const schoolKodeBiasa = String(currentUser.schoolData[0]);
    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);
    
    const searchTerm = searchState[tableId];
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);
    
    filteredSiswa = applySort(filteredSiswa, tableId);

    const tableBodyId = (tableId === 'transkripNilai') ? 'transkripSiswaTableBody' : `${tableId}SiswaTableBody`;
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const state = paginationState[tableId];
    const rowsPerPage = state.rowsPerPage === 'all' ? filteredSiswa.length : parseInt(state.rowsPerPage);
    const totalPages = rowsPerPage > 0 ? Math.ceil(filteredSiswa.length / rowsPerPage) : 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));
    
    const start = (state.currentPage - 1) * rowsPerPage;
    const end = state.rowsPerPage === 'all' ? filteredSiswa.length : start + rowsPerPage;
    const paginatedData = filteredSiswa.slice(start, end);

    paginatedData.forEach((siswa, index) => {
        const nisn = siswa[7] || `temp-${start + index}`;
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
        
        if (tableId === 'skl' && currentUser.loginType === 'pro') {
            actionButtonsHTML += `
                <button class="btn btn-small btn-upload" onclick="document.getElementById('skl-photo-input-${nisn}').click();">Upload Foto</button>
                <input type="file" id="skl-photo-input-${nisn}" class="file-input" accept="image/*" onchange="handleSklPhotoUpload(event, '${nisn}')">
                <button class="btn btn-small btn-delete" onclick="deleteSklPhoto('${nisn}')">Hapus Foto</button>`;
        }

        row.innerHTML = `
            <td>${start + index + 1}</td>
            <td>${siswa[8] || ''}</td>
            <td>${nisn}</td>
            <td style="text-align: center;">${statusHtml}</td>
            <td>${actionButtonsHTML}</td>`;
    });

    optimizedUpdatePaginationControls(tableId, filteredSiswa.length);
    updateSortHeaders(tableId);
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
    if (currentUser.role !== 'sekolah' || !currentUser.schoolData) return;

    const schoolKodeBiasa = String(currentUser.schoolData[0]);
    const allSiswa = database.siswa.filter(siswa => String(siswa[0]) === schoolKodeBiasa);
    
    const searchTerm = searchState.rekapNilai;
    let filteredSiswa = filterSiswaData(allSiswa, searchTerm);

    const thead = document.getElementById('rekapNilaiThead');
    const tbody = document.getElementById('rekapNilaiTbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // --- PERBAIKAN UTAMA DI SINI ---
    // 1. Mengambil daftar mapel lengkap, termasuk Mulok
    const allSubjects = subjects[currentUser.kurikulum];
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
        const nisn = siswa[7] || `temp-${start + index}`;
        const row = tbody.insertRow();
        row.innerHTML = `<td>${start + index + 1}</td><td>${nisn}</td><td>${siswa[8] || ''}</td>`;
        
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
        
        const schoolName = (currentUser.schoolData[4] || 'SEKOLAH').toUpperCase();
        const kurikulum = currentUser.kurikulum || 'Merdeka';
        
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
                "nama": siswa[8] || '',
                "nisn": siswa[7] || ''
            };
            
            let totalGrades = 0;
            let countValidGrades = 0;
            
            visibleSubjects.forEach(subjectKey => {
                const finalGrade = calculateAverageForSubject(siswa[7], subjectKey);
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
            pdf.text(currentUser.schoolData[2] || '-', valueX, 42); // Kecamatan
            pdf.text(schoolName, valueX, 48); // Nama Sekolah
            pdf.text(currentUser.schoolData[3] || '-', valueX, 54); // NPSN
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
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 8,
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 }, // NO
                1: { halign: 'left', cellWidth: 40 },   // NAMA
                2: { halign: 'center', cellWidth: 25 }, // NISN
            },
            margin: { top: 75, right: 10, bottom: 20, left: 10 },
            tableWidth: 'auto',
            didDrawPage: (data) => {
                // Tambahkan header di setiap halaman baru (kecuali halaman pertama)
                if (data.pageNumber > 1) {
                    addHeader(pdf, data.pageNumber);
                }
            }
        });

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
  const requiredSubjects = subjects[currentUser.kurikulum];

  // Debug hanya untuk NISN tertentu untuk menghindari spam console
  const debugThis = nisn === '1234567890' || Math.random() < 0.01; // Debug 1% siswa secara acak
  
  if (debugThis) {
    console.log(`Checking semester ${semesterId} for NISN ${nisn}`);
    console.log('Required subjects:', requiredSubjects);
    console.log('Student nilai data:', database.nilai[nisn]?.[semesterId]);
  }

  for (const subject of requiredSubjects) {
    const nilaiData = database.nilai[nisn]?.[semesterId]?.[subject];

    // ⛳ Khusus MULOK: jika belum diberi nama kustom, tidak dianggap wajib.
    if (subject.startsWith('MULOK')) {
      const schoolKodeBiasa = String(currentUser.schoolData[0]);
      const mulokName = database.nilai._mulokNames?.[schoolKodeBiasa]?.[subject];
      if (!mulokName || mulokName.trim() === '') {
        if (debugThis) console.log(`Skipping MULOK ${subject} - no custom name`);
        continue; // lewati slot MULOK tanpa nama
      }
    }

    // jika mapel wajib tidak ada sama sekali
    if (!nilaiData) {
      if (debugThis) console.log(`Missing data for subject ${subject}`);
      return false;
    }

    if (currentUser.kurikulum === 'K13') {
      // K13 wajib terisi KI3 & KI4 (boleh hitung RT terpisah, tapi validasi tetap 2 komponen)
      if (!nilaiData.KI3 || String(nilaiData.KI3).trim() === '' ||
          !nilaiData.KI4 || String(nilaiData.KI4).trim() === '') {
        if (debugThis) console.log(`Subject ${subject} incomplete - KI3: ${nilaiData.KI3}, KI4: ${nilaiData.KI4}`);
        return false;
      }
    } else {
      // Merdeka: 1 komponen tunggal 'NILAI' wajib ada
      if (!nilaiData.NILAI || String(nilaiData.NILAI).trim() === '') {
        if (debugThis) console.log(`Subject ${subject} incomplete - NILAI: ${nilaiData.NILAI}`);
        return false;
      }
    }
  }
  return true;
}


        function calculateAverageForSubject(nisn, subjectKey) {
            let totalNilai = 0;
            let countNilai = 0;
            
            // Debug info for debugging - reduced to avoid console spam
            if (subjectKey === 'MTK') {
                console.log(`Calculating average for NISN: ${nisn}, Subject: ${subjectKey}`);
                console.log('Student nilai data exists:', !!database.nilai[nisn]);
                if (database.nilai[nisn]) {
                    console.log('Available semesters for this student:', Object.keys(database.nilai[nisn]));
                }
            }
            
            semesterIds.forEach(semId => {
                const nilaiData = database.nilai[nisn]?.[semId]?.[subjectKey];
                if (subjectKey === 'MTK') {
                    console.log(`Semester ${semId} data for ${subjectKey}:`, nilaiData);
                }
                let nilai;
            if (currentUser.kurikulum === 'K13') {
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
            };
                if (nilai !== '' && !isNaN(nilai)) {
                    totalNilai += parseFloat(nilai);
                    countNilai++;
                }
            });
            return countNilai > 0 ? (totalNilai / countNilai) : null;
        }
        
        function formatDateToIndonesian(dateString) {
            if (!dateString || !dateString.includes('-')) return '';
            const [year, month, day] = dateString.split('-');
            if(!year || !month || !day) return '';
            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
        }


function createTranskripHTML(nisn) {
    const siswa = database.siswa.find(s => s[7] === nisn);
    const sekolah = currentUser.schoolData;
    if (!siswa || !sekolah) return '<p>Data tidak ditemukan.</p>';

    const schoolKodeBiasa = String(sekolah[0]);
    const settings = database.settings[schoolKodeBiasa] || {};

    const { tableRows } = createNilaiTableHTML(nisn, 'transkrip');
    const schoolName = (sekolah[4] || 'NAMA SEKOLAH').toUpperCase();
    const schoolNameHtml = schoolName.length > 40 ? `<p style="font-size: 1em;">${schoolName}</p>` : `<p>${schoolName}</p>`;
    const displayPrintDate = formatDateToIndonesian(settings.printDate) || '.........................';
    
    const transcriptNumberDisplay = (settings.transcriptNumber || '').replace(/ /g, '&nbsp;');
    
    const logoLeftPosTop = settings.logoLeftPosTop || 13;
    const logoLeftPosLeft = settings.logoLeftPosLeft || 15;
    const logoRightPosTop = settings.logoRightPosTop || 13;
    const logoRightPosRight = settings.logoRightPosRight || 15;

    return `
        <div class="transkrip-full-header">
            <img src="${settings.logoLeft || ''}" alt="Logo Kiri" class="transkrip-logo" style="position: absolute; top: ${logoLeftPosTop}mm; left: ${logoLeftPosLeft}mm; width: ${settings.logoLeftSize || 80}px; height: auto;" onerror="this.style.display='none'">
            <div class="transkrip-header-text" style="display: inline-block; vertical-align: middle; padding-top: 13mm;">
                <p>PEMERINTAH KABUPATEN MELAWI</p>
                ${schoolNameHtml}
                <p style="font-weight: normal; font-size: 0.9em;">${settings.schoolAddress || 'Alamat Sekolah Belum Diatur'}</p>
            </div>
            <img src="${settings.logoRight || ''}" alt="Logo Kanan" class="transkrip-logo" style="position: absolute; top: ${logoRightPosTop}mm; right: ${logoRightPosRight}mm; width: ${settings.logoRightSize || 80}px; height: auto;" onerror="this.style.display='none'">
        </div>
        <hr class="transkrip-hr">
        <p class="transkrip-title" style="font-size: 1.2em;">TRANSKRIP NILAI</p>
        <p class="transkrip-nomor">Nomor&nbsp;:&nbsp;${transcriptNumberDisplay}</p>
        <div class="transkrip-student-info-grid">
            <span>Satuan Pendidikan</span><span>:</span><span>${sekolah[4] || ''}</span>
            <span>Nomor Pokok Sekolah Nasional</span><span>:</span><span>${sekolah[3] || ''}</span>
            <span>Nama Lengkap</span><span>:</span><span>${siswa[8] || ''}</span>
            <span>Tempat, Tanggal Lahir</span><span>:</span><span>${siswa[9] || ''}</span>
            <span>Nomor Induk Siswa Nasional</span><span>:</span><span>${siswa[7] || ''}</span>
            <span>Nomor Ijazah</span><span>:</span><span>${siswa[12] || ''}</span>
            <span>Tanggal Kelulusan</span><span>:</span><span>2 Juni 2025</span>
        </div>
        <table id="transkripNilaiTable">
            <thead><tr><th>No</th><th>Mata Pelajaran</th><th>Nilai</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
        <div class="transkrip-signature">
            <div class="transkrip-signature-block">
                <p>Kabupaten Melawi, ${displayPrintDate}</p>
                <p>Kepala,</p><br><br><br>
                <p class="principal-name">${settings.principalName || '.........................................'}</p>
                <p>${settings.principalNip ? 'NIP. ' + settings.principalNip : ''}</p>
            </div>
        </div>`;
}
        
function createSklHTML(nisn) {
    const siswa = database.siswa.find(s => s[7] === nisn);
    const sekolah = currentUser.schoolData;
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
        // PERBAIKAN DI SINI: Menggunakan elemen <p> terpisah untuk setiap baris
        photoBoxContent = `
            <p style="margin: 0;">Pasfoto 3 cm x 4 cm</p>
            <p style="margin: 0;">hitam putih atau</p>
            <p style="margin: 0;">berwarna</p>
        `;
    }

    const displayPrintDate = formatDateToIndonesian(settings.printDate) || '.........................';
    const transcriptNumberDisplay = (settings.transcriptNumber || '').replace(/ /g, '&nbsp;');

    const logoLeftPosTop = settings.logoLeftPosTop || 13;
    const logoLeftPosLeft = settings.logoLeftPosLeft || 15;
    const logoRightPosTop = settings.logoRightPosTop || 13;
    const logoRightPosRight = settings.logoRightPosRight || 15;

    return `
        <div class="transkrip-full-header">
            <img src="${settings.logoLeft || ''}" alt="Logo Kiri" class="transkrip-logo" style="position: absolute; top: ${logoLeftPosTop}mm; left: ${logoLeftPosLeft}mm; width: ${settings.logoLeftSize || 80}px; height: auto;" onerror="this.style.display='none'">
            <div class="transkrip-header-text" style="display: inline-block; vertical-align: middle; padding-top: 13mm;">
                <p>PEMERINTAH KABUPATEN MELAWI</p>
                ${schoolNameHtml}
                <p style="font-weight: normal; font-size: 0.9em;">${settings.schoolAddress || 'Alamat Sekolah Belum Diatur'}</p>
            </div>
            <img src="${settings.logoRight || ''}" alt="Logo Kanan" class="transkrip-logo" style="position: absolute; top: ${logoRightPosTop}mm; right: ${logoRightPosRight}mm; width: ${settings.logoRightSize || 80}px; height: auto;" onerror="this.style.display='none'">
        </div>
        <hr class="transkrip-hr">
        <p class="transkrip-title"><u>SURAT KETERANGAN LULUS</u></p>
        <p class="transkrip-nomor">TAHUN PELAJARAN 2024/2025</p>
        <p class="transkrip-nomor">Nomor:&nbsp;${transcriptNumberDisplay}</p>
        <p class="skl-body-text">Yang bertanda tangan dibawah ini, Kepala ${sekolah[4] || ''} NPSN: ${sekolah[3] || ''} Kecamatan ${sekolah[2] || ''} Kabupaten Melawi Provinsi Kalimantan Barat menerangkan :</p>
        <div class="transkrip-student-info-grid" style="margin-left: 4cm;">
            <span>Nama</span><span>:</span><span>${siswa[8] || ''}</span>
            <span>Tempat Dan Tanggal Lahir</span><span>:</span><span>${siswa[9] || ''}</span>
            <span>Nama Orang Tua/Wali</span><span>:</span><span>${siswa[10] || ''}</span>
            <span>Nomor Induk Siswa</span><span>:</span><span>${siswa[5] || ''}</span>
            <span>Nomor Induk Siswa Nasional</span><span>:</span><span>${siswa[7] || ''}</span>
            <span>Nomor Ijazah</span><span>:</span><span>${siswa[12] || ''}</span>
        </div>
        <p class="skl-lulus-text">LULUS</p>
        <table id="sklNilaiTable">
            <thead><tr><th>No</th><th>Mata Pelajaran</th><th>Nilai</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
        <p class="skl-body-text" style="margin-top: 15px;">Surat Keterangan Kelulusan ini bersifat sementara sampai dikeluarkannya Ijazah.</p>
        <div class="skl-footer">
            <div class="${photoBoxClass}" style="margin-left: ${settings.sklPhotoLayout || 5}%;">${photoBoxContent}</div>
            <div class="transkrip-signature-block">
                <p>Kabupaten Melawi, ${displayPrintDate}</p>
                <p>Kepala Sekolah,</p><br><br><br>
                <p class="principal-name">${settings.principalName || '.........................................'}</p>
                <p>${settings.principalNip ? 'NIP. ' + settings.principalNip : ''}</p>
            </div>
        </div>`;
}

function createSkkbHTML(nisn) {
    const siswa = database.siswa.find(s => s[7] === nisn);
    const sekolah = currentUser.schoolData;
    if (!siswa || !sekolah) return '<p>Data tidak ditemukan.</p>';

    const schoolKodeBiasa = String(sekolah[0]);
    const settings = database.settings[schoolKodeBiasa] || {};

    const schoolName = (sekolah[4] || 'NAMA SEKOLAH').toUpperCase();
    const schoolNameHtml = schoolName.length > 40 ? `<p style="font-size: 1em;">${schoolName}</p>` : `<p>${schoolName}</p>`;
    const displayPrintDate = formatDateToIndonesian(settings.printDate) || '.........................';
    const skkbNumberDisplay = (settings.skkbNumber || '').replace(/ /g, '&nbsp;');

    const logoLeftPosTop = settings.logoLeftPosTop || 13;
    const logoLeftPosLeft = settings.logoLeftPosLeft || 15;
    const logoRightPosTop = settings.logoRightPosTop || 13;
    const logoRightPosRight = settings.logoRightPosRight || 15;

    return `
        <div class="transkrip-full-header">
            <img src="${settings.logoLeft || ''}" alt="Logo Kiri" class="transkrip-logo" style="position: absolute; top: ${logoLeftPosTop}mm; left: ${logoLeftPosLeft}mm; width: ${settings.logoLeftSize || 80}px; height: auto;" onerror="this.style.display='none'">
            <div class="transkrip-header-text" style="display: inline-block; vertical-align: middle; padding-top: 13mm;">
                <p>PEMERINTAH KABUPATEN MELAWI</p>
                ${schoolNameHtml}
                <p style="font-weight: normal; font-size: 0.9em;">${settings.schoolAddress || 'Alamat Sekolah Belum Diatur'}</p>
            </div>
            <img src="${settings.logoRight || ''}" alt="Logo Kanan" class="transkrip-logo" style="position: absolute; top: ${logoRightPosTop}mm; right: ${logoRightPosRight}mm; width: ${settings.logoRightSize || 80}px; height: auto;" onerror="this.style.display='none'">
        </div>
        <hr class="transkrip-hr">
        <p class="transkrip-title"><u>SURAT KETERANGAN BERKELAKUAN BAIK</u></p>
        <p class="transkrip-nomor">Nomor:&nbsp;${skkbNumberDisplay}</p>
        <p class="skl-body-text">Yang bertanda tangan dibawah ini, Kepala ${sekolah[4] || ''} NPSN: ${sekolah[3] || ''} Kecamatan ${sekolah[2] || ''} Kabupaten Melawi Provinsi Kalimantan Barat menerangkan dengan sesungguhnya bahwa :</p>
        <div class="transkrip-student-info-grid" style="margin-left: 4cm;">
            <span>Nama</span><span>:</span><span>${siswa[8] || ''}</span>
            <span>Tempat Dan Tanggal Lahir</span><span>:</span><span>${siswa[9] || ''}</span>
            <span>Nomor Induk Siswa Nasional</span><span>:</span><span>${siswa[7] || ''}</span>
        </div>
        <p class="skl-body-text">Adalah benar-benar siswa kami dan selama menjadi siswa di sekolah ini yang bersangkutan berkelakuan baik.</p>
        <p class="skl-body-text">Demikian surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
        <div class="transkrip-signature" style="margin-top: 50px;">
            <div class="transkrip-signature-block">
                <p>Kabupaten Melawi, ${displayPrintDate}</p>
                <p>Kepala Sekolah,</p><br><br><br>
                <p class="principal-name">${settings.principalName || '.........................................'}</p>
                <p>${settings.principalNip ? 'NIP. ' + settings.principalNip : ''}</p>
            </div>
        </div>`;
}

// GANTI SELURUH FUNGSI createNilaiTableHTML DENGAN VERSI FINAL INI
function createNilaiTableHTML(nisn, docType, semesterId = null) {
    let tableRows = '';
    let totalRataRata = 0;
    let countRataRata = 0;
    const schoolKodeBiasa = String(currentUser.schoolData[0]);
    const settings = database.settings[schoolKodeBiasa] || {};
    const subjectVisibility = settings.subjectVisibility || {};
    const nilaiData = database.nilai[nisn] || {};

    // 1. Filter HANYA mata pelajaran utama yang dicentang (visible)
    const visibleSubjects = transcriptSubjects[currentUser.kurikulum].filter(subject => {
        return subjectVisibility[subject.key] !== false;
    });

    // Membuat baris untuk setiap mapel utama yang visible
    visibleSubjects.forEach((subject, i) => {
        let gradeDisplay;
        if (semesterId) {
            const nilaiSemester = nilaiData[semesterId]?.[subject.key];
            gradeDisplay = (currentUser.kurikulum === 'K13' ? nilaiSemester?.RT : nilaiSemester?.NILAI) || '';
        } else {
            const finalGrade = calculateAverageForSubject(nisn, subject.key);
            gradeDisplay = finalGrade !== null ? finalGrade.toFixed(2) : '';
            if (finalGrade !== null) {
                totalRataRata += finalGrade;
                countRataRata++;
            }
        }
        tableRows += `<tr><td style="text-align: center;">${i + 1}</td><td>${subject.display}</td><td style="text-align: center;">${gradeDisplay}</td></tr>`;
    });

    // 2. Selalu tampilkan baris header untuk "Muatan Lokal"
    const mulokHeaderIndex = visibleSubjects.length + 1;
    tableRows += `<tr><td style="text-align: center;">${mulokHeaderIndex}</td><td>Muatan Lokal</td><td></td></tr>`;

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
                gradeDisplay = (currentUser.kurikulum === 'K13' ? nilaiSemester?.RT : nilaiSemester?.NILAI) || '';
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
        tableRows += `
            <tr>
                <td></td>
                <td> &nbsp; &nbsp; ${alphabet[index]}. ${displayName}</td>
                <td style="text-align: center;">${gradeDisplay}</td>
            </tr>
        `;
    });

    // Menghitung dan menambahkan baris Rata-rata (hanya jika dokumennya adalah SKL)
    if (docType === 'skl' && !semesterId) {
        const finalAverage = countRataRata > 0 ? (totalRataRata / countRataRata).toFixed(2) : '-';
        tableRows += `
            <tr>
                <td colspan="2" style="text-align: center; font-weight: bold;">Rata - Rata</td>
                <td style="font-weight: bold; text-align: center;">${finalAverage}</td>
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
  updateLogoPreviewUI(); // <-- tambahkan baris ini
  sklModal.style.display = 'flex';
}
        
function openSkkbModal(nisn) {
  const content = createSkkbHTML(nisn);
  document.getElementById('skkbContent').innerHTML = content;
  updateLogoPreviewUI(); // <-- tambahkan baris ini
  skkbModal.style.display = 'flex';
}

        async function downloadTranskripPDF(nisn) {
            if (!checkNilaiLengkap(nisn)) return;
            const content = createTranskripHTML(nisn);
            await downloadAsPDF(content, nisn, 'Transkrip');
        }
        
        async function downloadSklPDF(nisn) {
            if (!checkNilaiLengkap(nisn)) return;
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
  const siswa = database.siswa.find(s => s[7] === nisn);
  const sekolah = currentUser.schoolData;

  if (!siswa || !sekolah) {
    showNotification('Data siswa atau sekolah tidak ditemukan.', 'error');
    return;
  }

  // Render ke #pdf-content dengan page box yang ukurannya SAMA seperti preview
  pdfContainer.innerHTML = content;

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
  if (!currentUser?.schoolData) return;

  const schoolKodeBiasa = String(currentUser.schoolData[0]);
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

  // ---- Prefill: Ukuran & Posisi logo + layout pas foto SKL
  setRange('settingLogoLeftSize',   'logoLeftSizeLabel',   settings.logoLeftSize);
  setRange('settingLogoRightSize',  'logoRightSizeLabel',  settings.logoRightSize);
  setRange('settingSklPhotoLayout', 'sklPhotoLayoutLabel', settings.sklPhotoLayout);

  setRange('settingLogoLeftPosTop',  'logoLeftPosTopLabel',   settings.logoLeftPosTop);
  setRange('settingLogoLeftPosLeft', 'logoLeftPosLeftLabel',  settings.logoLeftPosLeft);
  setRange('settingLogoRightPosTop', 'logoRightPosTopLabel',  settings.logoRightPosTop);
  setRange('settingLogoRightPosRight','logoRightPosRightLabel',settings.logoRightPosRight);

  // ---- Prefill: Manajemen Mapel (centang sesuai visibility)
  const subjectContainer = document.getElementById('subjectSelectionContainer');
  if (subjectContainer) {
    subjectContainer.innerHTML = '';
    const kur = currentUser.kurikulum || 'Merdeka';
    const list = (transcriptSubjects?.[kur]) || [];
    const vis = settings.subjectVisibility || {};
    
    console.log('Rendering subject checkboxes:', { kur, list, vis });
    
    list.forEach(s => {
      const checked = vis.hasOwnProperty(s.key) ? !!vis[s.key] : true; // default tampil
      subjectContainer.insertAdjacentHTML('beforeend', `
        <div class="subject-checkbox">
          <input type="checkbox" id="check-${s.key}" data-subject-key="${s.key}" ${checked ? 'checked' : ''}>
          <label for="check-${s.key}">${s.display}</label>
        </div>
      `);
    });
    
    console.log('Subject container rendered with', list.length, 'subjects');
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

}


async function saveSettings(event) {
    try {
        if (!currentUser.schoolData) return;
        const schoolKodeBiasa = String(currentUser.schoolData[0]);
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
                showNotification('Foto berhasil diunggah!', 'success');
                // === PERBAIKAN UTAMA DI SINI ===
                rerenderActiveTable('sekolahSiswa'); // Render ulang tabel profil siswa
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showNotification(error.message || 'Gagal mengunggah foto.', 'error');
        } finally {
            hideLoader();
        }
    };
    reader.readAsDataURL(file);
}

// GANTI SELURUH FUNGSI INI JUGA
async function deleteSklPhoto(nisn) {
    if (confirm('Apakah Anda yakin ingin menghapus foto siswa ini?')) {
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
}
        

// GANTI SELURUH FUNGSI INI
async function handleLogoUpload(event, logoKey, previewId) {
    const file = event.target.files[0];
    if (!file || !currentUser.schoolData) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            showLoader();
            const schoolKodeBiasa = String(currentUser.schoolData[0]);
            const logoData = e.target.result;
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
                
                showNotification('Logo berhasil diunggah dan disimpan!', 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showNotification(error.message || 'Gagal mengunggah logo ke server.', 'error');
            const oldLogo = (database.settings[currentUser.schoolData[0]] && database.settings[currentUser.schoolData[0]][logoKey]);
            document.getElementById(previewId).src = oldLogo || 'https://placehold.co/80x80/f0f0f0/ccc?text=Logo';
        } finally {
            hideLoader();
        }
    };
    reader.readAsDataURL(file);
}


async function deleteAllGradesForSemester() {
    const { currentSemester, currentSemesterName } = paginationState.isiNilai;
    if (!currentSemester) {
        showNotification("Pilih semester terlebih dahulu.", 'warning');
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus semua nilai untuk semester ${currentSemesterName}? Aksi ini tidak dapat dibatalkan.`)) {
        try {
            showLoader();
            const schoolCode = String(currentUser.schoolData[0]);

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
}
        
        function renderCetakGabunganPage() {
            const proMessage = document.getElementById('cetakGabunganProMessage');
            const tableContainer = document.getElementById('cetakGabunganTableContainer');
            const paginationControls = document.querySelector('.pagination-controls[data-table-id="cetakGabungan"]');
            const searchBar = document.getElementById('searchCetakGabungan');

            if (currentUser.loginType !== 'pro') {
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
  const siswa = database.siswa.find(s => s[7] === nisn);
  const sekolah = currentUser.schoolData;

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
    const namaSiswa = (siswa[8] || 'siswa').replace(/ /g, '_');
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
    if (currentUser.role !== 'sekolah' || !currentUser.schoolData) return;

    // Show progress modal
    showBackupProgress();
    
    try {
        updateBackupProgress(10, 'Mempersiapkan data...');
        
        const schoolCode = String(currentUser.schoolData[0]);
        const schoolName = (currentUser.schoolData[5] || 'sekolah').replace(/ /g, '_');

        updateBackupProgress(20, 'Mengumpulkan data sekolah...');

        // Kita gunakan data `database` yang ada di frontend karena sudah paling update
        const backupData = {
            appVersion: '2.6-server',
            backupDate: new Date().toISOString(),
            schoolCode: schoolCode,
            schoolName: currentUser.schoolData[4],
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

        console.log('Backup data summary:', {
            siswa: backupData.siswa.length,
            nilai: Object.keys(backupData.nilai).length,
            photos: Object.keys(backupData.sklPhotos).length
        });

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

function hideBackupProgress() {
    const modal = document.getElementById('backupProgressModal');
    if (modal) {
        modal.remove();
    }
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

function hideRestoreProgress() {
    const modal = document.getElementById('restoreProgressModal');
    if (modal) {
        modal.remove();
    }
}

// Enhanced Restore Function
async function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Prevent multiple simultaneous restore operations
    if (document.getElementById('restoreProgressModal')) {
        console.log('Restore already in progress, ignoring...');
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
                console.log('Restore completed, waiting for database commit...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                updateRestoreProgress(100, 'Memuat ulang data...');
                
                // Try to reload data with retry mechanism
                let dataLoaded = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    console.log(`Loading data attempt ${attempt}...`);
                    await fetchDataFromServer();
                    
                    const nilaiCount = Object.keys(database.nilai || {}).filter(k => k !== '_mulokNames').length;
                    console.log(`After restore attempt ${attempt} - Total nilai records:`, nilaiCount);
                    
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
        currentUser = JSON.parse(savedSession);
        // Migrasi flag PRO legacy bila masih ada (tanpa mengubah loginType)
        if (currentUser?.schoolData?.[0]) {
            migrateLegacyProFlag(currentUser.schoolData[0], currentUser.schoolData?.[1]);
        } else {
            migrateLegacyProFlag(null, null);
        }
        // Jika sekolah ini sudah diaktivasi PRO dan kode cocok, terapkan PRO pada sesi (UI)
        if (currentUser?.role === 'sekolah') {
          const kb = currentUser.schoolData?.[0];
          const kp = currentUser.schoolData?.[1];
          const act = kb && kp && localStorage.getItem(`kodeProActivated:${kb}`) === 'true';
          const stored = kb && localStorage.getItem(`kodeProValue:${kb}`);
          const eq = (val1, val2) => (val1||'').toString().trim().toUpperCase() === (val2||'').toString().trim().toUpperCase();
          if (act && stored && eq(stored, kp)) {
            currentUser.loginType = 'pro';
            localStorage.setItem('currentUserSession', JSON.stringify(currentUser));
          }
        }
        if (currentUser.isLoggedIn) {
            fetchDataFromServer().then(() => {
                showDashboard(currentUser.role);
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
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('sekolahLogoutBtn').addEventListener('click', handleLogout);

    document.querySelectorAll('#adminDashboard .sidebar-menu .menu-item').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            switchContent(item.dataset.target);
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

    document.querySelectorAll('.pagination-controls').forEach(controls => {
        const tableId = controls.dataset.tableId;
        if (!tableId) return;
        const prevButton = controls.querySelector('.prev-page');
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (paginationState[tableId] && paginationState[tableId].currentPage > 1) {
                    paginationState[tableId].currentPage--;
                    rerenderActiveTable(tableId);
                }
            });
        }
        const nextButton = controls.querySelector('.next-page');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const state = paginationState[tableId];
                if (!state) return;
                let data;
                if (tableId === 'sekolah' || tableId === 'siswa') {
                    data = database[tableId];
                } else {
                    if (!currentUser.schoolData) return;
                    const schoolKodeBiasa = String(currentUser.schoolData[0]);
                    const allSiswaForSchool = database.siswa.filter(s => String(s[0]) === schoolKodeBiasa);
                    const searchTerm = searchState[tableId] || '';
                    data = filterSiswaData(allSiswaForSchool, searchTerm);
                }
                if (!data) return;
                const rowsPerPage = state.rowsPerPage === 'all' ? data.length : parseInt(state.rowsPerPage);
                const totalPages = rowsPerPage > 0 ? Math.ceil(data.length / rowsPerPage) : 1;
                if (state.currentPage < totalPages) {
                    state.currentPage++;
                    rerenderActiveTable(tableId);
                }
            });
        }
        const rowsPerPageSelect = controls.querySelector('.rows-per-page');
        if (rowsPerPageSelect) {
            rowsPerPageSelect.addEventListener('change', (e) => {
                if (paginationState[tableId]) {
                    paginationState[tableId].rowsPerPage = e.target.value;
                    paginationState[tableId].currentPage = 1;
                    rerenderActiveTable(tableId);
                }
            });
        }
    });

    document.querySelectorAll('.search-bar').forEach(searchBar => {
        searchBar.addEventListener('input', (e) => {
            const tableId = e.target.dataset.tableId;
            if (searchState.hasOwnProperty(tableId) && paginationState.hasOwnProperty(tableId)) {
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
    console.log('calculateStudentRanking called');
    
    // Detailed debugging of data availability
    console.log('Data availability check:', {
        currentUser: !!currentUser,
        database: !!database,
        'database.siswa': !!(database && database.siswa),
        'database.nilai': !!(database && database.nilai),
        'currentUser.schoolData': currentUser ? currentUser.schoolData : null
    });
    
    if (!currentUser || !database.siswa) {
        console.log('Missing required data - currentUser or database.siswa');
        return [];
    }
    
    if (!database.nilai) {
        console.log('No nilai database - cannot calculate rankings');
        return [];
    }
    
    const schoolCode = currentUser.schoolData[0];
    const schoolStudents = database.siswa.filter(siswa => siswa[0] === schoolCode);
    
    console.log('School code:', schoolCode);
    console.log('School students found:', schoolStudents.length);
    console.log('Sample school student:', schoolStudents[0] ? {
        kodeBiasa: schoolStudents[0][0],
        nisn: schoolStudents[0][7],
        nama: schoolStudents[0][8]
    } : null);
    
    if (schoolStudents.length === 0) {
        console.log('No students found for school');
        return [];
    }
    
    // Get subject keys based on kurikulum
    const kurikulum = currentUser.kurikulum;
    console.log('Kurikulum:', kurikulum);
    
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
    console.log('Subjects for ranking:', subjects.map(s => s.key));
    
    // Calculate average for each student
    const studentsWithAverage = schoolStudents.map(siswa => {
        const nisn = siswa[7]; // NISN index
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
    
    console.log('Students with averages calculated:', studentsWithAverage.length);
    console.log('Sample student data:', studentsWithAverage.slice(0, 3));
    
    // Filter and sort - show students even with 0 average for debugging
    const result = studentsWithAverage
        .filter(student => student.nama && student.nama.trim() !== '') // Only filter by name existence
        .sort((a, b) => b.average - a.average)
        .slice(0, 10); // Top 10 only
        
    console.log('Final ranking result:', result);
    return result;
}

function updateRankingWidget() {
    console.log('updateRankingWidget called');
    const rankingContainer = document.getElementById('rankingContainer');
    if (!rankingContainer) {
        console.log('rankingContainer not found');
        return;
    }
    
    console.log('Database structure check:', {
        hasDatabase: !!database,
        hasSiswa: !!(database && database.siswa),
        hasNilai: !!(database && database.nilai),
        siswaCount: database && database.siswa ? database.siswa.length : 0,
        nilaiKeys: database && database.nilai ? Object.keys(database.nilai).slice(0, 5) : [],
        currentUser: !!currentUser
    });
    
    const rankings = calculateStudentRanking();
    
    if (rankings.length === 0) {
        console.log('No rankings data - showing empty message');
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
  return String((currentUser && currentUser.schoolData && currentUser.schoolData[0]) || '');
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

    const kur = currentUser?.kurikulum || 'Merdeka';
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
    const result = await fetchWithAuth(apiUrl('/api/data/grades/save-bulk'), {
      method: 'POST',
      body: JSON.stringify(gradesToSave)
    });

    if (!result || result.success === false) {
      throw new Error(result?.message || 'Gagal menyimpan nilai (server).');
    }

 
    await fetchDataFromServer();                  // tarik data terbaru dari server
    
    // Debug: Log struktur data nilai setelah fetch
    console.log('Data nilai setelah fetch dari server:', database.nilai);
    console.log('Semester yang dipilih:', semester);
    
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
  const originalIndex = inputElement.dataset.index;
  const newValue = inputElement.value.trim();
  const siswaData = database.siswa[originalIndex];
  if (!siswaData) return;

  const nisn = String(siswaData[7]);
  inputElement.classList.remove('invalid-input');

  // Validasi: boleh kosong, atau 15 digit
  if (newValue !== '' && !/^\d{15}$/.test(newValue)) {
    const msg = 'Nomor Ijazah harus tepat 15 digit dan hanya berisi angka.';
    showNotification(msg, 'error');
    inputElement.classList.add('invalid-input');
    inputElement.value = siswaData[11] || '';
    setTimeout(() => inputElement.classList.remove('invalid-input'), 2500);
    return;
  }

  // Optimistic update (kembalikan jika gagal)
  const prev = siswaData[11];
  siswaData[11] = newValue;

  try {
    const result = await fetchWithAuth(apiUrl('/api/data/siswa/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nisn, updatedData: { noIjazah: newValue } })
    });
    if (!result.success) throw new Error(result.message);
    showNotification('Nomor Ijazah berhasil disimpan!', 'success');
  } catch (err) {
    siswaData[11] = prev;
    showNotification(err.message || 'Gagal menyimpan No. Ijazah ke server.', 'error');
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

    // Clear the table body for a fresh start
    const tableBody = document.getElementById('rekapNilaiTableBody');
    if (tableBody) tableBody.innerHTML = '';

    // Setup the dynamic headers based on a default or selected curriculum
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

    // Initialize the filter logic
    initRekapFilters();
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
function populateSekolahFilter() {
    const kecamatanFilter = document.getElementById('filterKecamatan');
    const sekolahFilter = document.getElementById('filterSekolah');
    const selectedKecamatan = kecamatanFilter.value;

    sekolahFilter.innerHTML = '<option value="">Semua Sekolah</option>';
    
    // Hanya mengisi sekolah jika kecamatan dipilih
    if (selectedKecamatan) {
        // [PERBAIKAN DI SINI] 
        // Membuat pencocokan lebih fleksibel dengan .trim() untuk menghapus spasi
        // dan .toUpperCase() untuk mengabaikan perbedaan huruf besar/kecil.
        const filteredSchools = database.sekolah.filter(s => 
            String(s[2]).trim().toUpperCase() === selectedKecamatan.trim().toUpperCase()
        );
        
        filteredSchools.forEach(sekolah => {
            sekolahFilter.innerHTML += `<option value="${sekolah[0]}">${sekolah[4]}</option>`;
        });
    }
}

// GANTI FUNGSI LAMA DENGAN VERSI BARU INI
// [GANTI FUNGSI INI SECARA KESELURUHAN]
function filterAndRenderRekapNilaiAdminTable() {
    const kurikulumFilter = document.getElementById('filterKurikulum').value;
    const kecamatanFilter = document.getElementById('filterKecamatan').value;
    const sekolahFilter = document.getElementById('filterSekolah').value;
    const downloadBtn = document.getElementById('downloadRekapPdfBtn');

    console.log('Filter values:', { kurikulumFilter, kecamatanFilter, sekolahFilter });
    console.log('Database siswa length:', database.siswa.length);

    // Filter data siswa berdasarkan pilihan
    let filteredSiswa = database.siswa;
    
    if (kecamatanFilter) {
        // Filter berdasarkan kecamatan (s[3] adalah kolom kecamatan di data siswa)
        filteredSiswa = filteredSiswa.filter(s => s[3] === kecamatanFilter);
        console.log('After kecamatan filter:', filteredSiswa.length);
    }
    
    if (sekolahFilter) {
        console.log('Filtering by sekolah:', sekolahFilter);
        console.log('Sample siswa kode sekolah:', database.siswa.slice(0,3).map(s => s[0]));
        // [PERBAIKAN DI SINI]
        // Menggunakan s[0] (kode sekolah siswa) untuk dicocokkan dengan nilai filter (kode sekolah).
        // Sebelumnya: s[2] (nama sekolah siswa), ini yang salah.
        filteredSiswa = filteredSiswa.filter(s => {
            const match = s[0] === sekolahFilter;
            if (match) console.log('Match found for siswa:', s[8], 'with kode:', s[0]);
            return match;
        });
        console.log('After sekolah filter:', filteredSiswa.length);
    }
    
    if (kurikulumFilter) {
        // PERBAIKAN: Data siswa tidak memiliki kolom kurikulum
        // Filter kurikulum harus berdasarkan data sekolah atau user login
        // Untuk sementara, skip filter kurikulum karena tidak ada di data siswa
        console.log('Kurikulum filter skipped - tidak ada kolom kurikulum di data siswa');
    }

    console.log('Final filtered siswa:', filteredSiswa.length);

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
        const nisn = siswa[7] || '';
        const row = tbody.insertRow();
        let rowHTML = `
            <td>${start + index + 1}</td>
            <td>${siswa[2] || '-'}</td> 
            <td>${siswa[8] || '-'}</td>
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
                "nama": siswa[8] || '',
                "nisn": siswa[7] || ''
            };
            
            let totalGrades = 0;
            let countValidGrades = 0;
            
            allSubjects.forEach(subjectKey => {
                const finalGrade = calculateAverageForSubject(siswa[7], subjectKey);
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
                }
            },
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
        const nisn = siswa[7];
        const namaSiswa = siswa[8];
        const namaSekolah = (database.sekolah.find(s => s[0] === siswa[0]) || [])[4] || 'N/A';
        let totalNilai = 0;
        let jumlahMapel = 0;
        const subjectsToCalculate = transcriptSubjects[currentUser.kurikulum || 'Merdeka'];
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
    const filterKecamatan = document.getElementById('filterKecamatan').value;
    const filterSekolah = document.getElementById('filterSekolah').value;

    let filteredSiswa = database.siswa;

    if (filterKecamatan !== 'Semua Kecamatan') {
        const schoolCodesInKecamatan = new Set(database.sekolah.filter(s => s[2] === filterKecamatan).map(s => s[0]));
        filteredSiswa = filteredSiswa.filter(siswa => schoolCodesInKecamatan.has(siswa[0]));
    }
    
    if (filterSekolah !== 'Semua Sekolah') {
        filteredSiswa = filteredSiswa.filter(siswa => siswa[0] === filterSekolah);
    }

    const rekapData = filteredSiswa.map(siswa => {
        const nisn = siswa[7];
        const namaSiswa = siswa[8];
        const namaSekolah = (database.sekolah.find(s => s[0] === siswa[0]) || [])[4] || 'N/A';
        
        let nilaiMapel = {};
        let totalNilai = 0;
        let jumlahMapel = 0;
        
        const subjectsToCalculate = transcriptSubjects[currentUser.kurikulum || 'Merdeka'];
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
                console.log('Tab manajemen mapel dibuka, merender checkbox...');
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
    
    if (!currentUser || !currentUser.schoolData) {
        console.error('currentUser or schoolData not found!');
        return;
    }
    
    const schoolKodeBiasa = String(currentUser.schoolData[0]);
    const settings = database?.settings?.[schoolKodeBiasa] || {};
    
    subjectContainer.innerHTML = '';
    const kur = currentUser.kurikulum || 'Merdeka';
    const list = (transcriptSubjects?.[kur]) || [];
    const vis = settings.subjectVisibility || {};
    
    console.log('Rendering subject checkboxes:', { kur, list, vis, currentUser });
    
    list.forEach(s => {
        const checked = vis.hasOwnProperty(s.key) ? !!vis[s.key] : true; // default tampil
        subjectContainer.insertAdjacentHTML('beforeend', `
            <div class="subject-checkbox">
                <input type="checkbox" id="check-${s.key}" data-subject-key="${s.key}" ${checked ? 'checked' : ''}>
                <label for="check-${s.key}">${s.display}</label>
            </div>
        `);
    });
    
    console.log('Subject container rendered with', list.length, 'subjects');
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
    if (confirm(`Yakin ingin menghapus sekolah dengan kode ${kodeBiasa}? Semua data siswa dan nilai terkait akan ikut terhapus permanen.`)) {
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
}

// === FINAL: Ganti SELURUH fungsi handleFile Anda dengan ini ===
// === FINAL: Ganti SELURUH fungsi handleFile Anda dengan ini ===
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
    try { (event?.currentTarget || event?.target)?.blur?.(); } catch {}
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
    try { (event?.currentTarget || event?.target)?.blur?.(); } catch {}
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
    try { (event?.currentTarget || event?.target)?.blur?.(); } catch {}
  }
}
// ====== INIT LOGIN UI (ringan, tidak mengubah handleLogin) ======
(function initLoginUI() {
  // autofocus ke appCode
  const code = document.getElementById('appCode');
  if (code) code.focus();

  // tombol "Tempel" ambil dari clipboard
  const pasteBtn = document.getElementById('pasteBtn');
  if (pasteBtn && navigator.clipboard) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && code) code.value = text.trim();
      } catch { /* no-op */ }
    });
  }

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

  // reset pagination ke halaman pertama kalau ada
  if (paginationState?.isiNilai) {
    paginationState.isiNilai.currentPage = 1;
  }

  // kalau ada fungsi render halaman, panggil itu
  if (typeof window.renderIsiNilaiPage === 'function') {
    window.renderIsiNilaiPage(sem, semName);
  }
  // fallback: kalau ada fungsi render tabel saja
  else if (typeof window.renderIsiNilaiPage === 'function') {
    window.renderIsiNilaiPage(sem);
  }
  // fallback ekstra: kalau app pakai router internal per menu
  else if (typeof window.switchSekolahContent === 'function') {
    try { window.switchSekolahContent('isiNilai'); } catch {}
  }

  // optional: perbarui info paginasi jika ada util-nya
  if (typeof window.updatePaginationControls === 'function') {
    try { window.updatePaginationControls('isiNilai'); } catch {}
  }
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
    console.log('Updating live preview in settings tab');
    
    // Update data sekolah dari currentUser dan settings
    if (currentUser?.schoolData) {
      const schoolKodeBiasa = String(currentUser.schoolData[0]);
      const settings = database?.settings?.[schoolKodeBiasa] || {};
      
      // Update nama sekolah dan alamat
      const schoolNameEl = document.getElementById('livePreviewSchoolName');
      const schoolAddressEl = document.getElementById('livePreviewSchoolAddress');
      
      if (schoolNameEl) {
        const schoolName = (currentUser.schoolData[4] || 'NAMA SEKOLAH').toUpperCase();
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
      
      console.log(`Live preview left logo - Top: ${finalLeftTop}mm, Left: ${finalLeftLeft}mm, Size: ${finalLeftSize}px`);
      
      // Show logo if src is set and not placeholder
      const logoLeftPreview = document.getElementById('logoLeftPreview');
      if (logoLeftPreview && logoLeftPreview.src && !logoLeftPreview.src.includes('placehold.co')) {
        livePreviewLeft.src = logoLeftPreview.src;
        livePreviewLeft.style.display = 'block';
        hasLogo = true;
      } else {
        livePreviewLeft.style.display = 'none';
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
      
      console.log(`Live preview right logo - Top: ${finalRightTop}mm, Right: ${finalRightRight}mm, Size: ${finalRightSize}px`);
      
      // Show logo if src is set and not placeholder
      const logoRightPreview = document.getElementById('logoRightPreview');
      if (logoRightPreview && logoRightPreview.src && !logoRightPreview.src.includes('placehold.co')) {
        livePreviewRight.src = logoRightPreview.src;
        livePreviewRight.style.display = 'block';
        hasLogo = true;
      } else {
        livePreviewRight.style.display = 'none';
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

  console.log('Roots found for document preview:', roots.map(r => r.id));

  // Terapkan ke setiap dokumen yang sedang ada di DOM
  roots.forEach(root => {
    // di template, logo pakai alt "Logo Kiri" & "Logo Kanan"
    const leftImg  = root.querySelector('img[alt="Logo Kiri"]');
    const rightImg = root.querySelector('img[alt="Logo Kanan"]');

    console.log(`In root ${root.id}:`, { 
      leftImg: !!leftImg, 
      rightImg: !!rightImg,
      leftTop, leftLeft, leftSize,
      rightTop, rightRight, rightSize
    });

    if (leftImg) {
      if (leftTop   != null) leftImg.style.top   = `${leftTop}mm`;
      if (leftLeft  != null) leftImg.style.left  = `${leftLeft}mm`;
      if (leftSize  != null) leftImg.style.width = `${leftSize}px`;
      console.log('Updated left logo:', leftImg.style.cssText);
    }
    if (rightImg) {
      if (rightTop   != null) rightImg.style.top   = `${rightTop}mm`;
      if (rightRight != null) rightImg.style.right = `${rightRight}mm`;
      if (rightSize  != null) rightImg.style.width = `${rightSize}px`;
      console.log('Updated right logo:', rightImg.style.cssText);
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
  
  console.log('Binding live logo preview events...');
  
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      console.log(`Binding event for ${id}`);
      el.addEventListener('input', () => {
        console.log(`Slider ${id} changed to ${el.value}`);
        // Update label
        updateSliderLabel(id);
        // Update live preview
        updateLogoPreviewUI();
      });
    } else {
      console.warn(`Element ${id} not found`);
    }
  });

  form.dataset.liveLogoBound = '1';
  console.log('Live logo preview events bound successfully');
}

// ===== AKTIVASI KODE PRO FUNCTIONALITY =====
function initAktivasiKodePro() {
  console.log('Initializing Aktivasi Kode Pro...');
  const kodeProInput = document.getElementById('kodeProInput');
  const aktivasiButton = document.getElementById('aktivasiButton');
  const menuAktivasiKodePro = document.getElementById('menuAktivasiKodePro');
  
  console.log('Elements found:', {
    kodeProInput: !!kodeProInput,
    aktivasiButton: !!aktivasiButton,
    menuAktivasiKodePro: !!menuAktivasiKodePro
  });
  
  // Check if already activated (scoped per sekolah) — hanya untuk UI, tidak mengubah loginType
  const schoolKodeBiasa = currentUser?.schoolData?.[0];
  const schoolKodePro = currentUser?.schoolData?.[1]; // kodePro dari database
  const isProForSchool = schoolKodeBiasa ? localStorage.getItem(`kodeProActivated:${schoolKodeBiasa}`) === 'true' : false;
  
  // Jika sekolah sudah punya kodePro di database, atau sudah teraktivasi di localStorage
  if (schoolKodePro || (currentUser?.loginType === 'pro' && isProForSchool)) {
    disableAktivasiMenu();
    showSuccessStatus();
    return;
  }
  
  // Bind input listeners sekali saja
  if (kodeProInput && kodeProInput.dataset.bound !== '1') {
    console.log('Binding listeners to kodeProInput');
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
        
        // Validasi kecocokan kode pro dengan sekolah yang sedang login (client-side)
        const expectedPro = (currentUser?.schoolData?.[1] || '').toString().trim().toUpperCase();
        const inputPro = kodePro.toString().trim().toUpperCase();
        if (!expectedPro || inputPro !== expectedPro) {
          hideLoader();
          showNotification('Kode Pro tidak sesuai untuk sekolah ini.', 'error');
          return;
        }

        // Mark as activated (per sekolah)
        if (schoolKodeBiasa) {
          localStorage.setItem(`kodeProActivated:${schoolKodeBiasa}`, 'true');
          localStorage.setItem(`kodeProValue:${schoolKodeBiasa}`, kodePro);
        }
        
        // Aktifkan fitur PRO pada sesi saat ini (setelah validasi berhasil)
        if (currentUser && currentUser.isLoggedIn && currentUser.role === 'sekolah') {
          currentUser.loginType = 'pro';
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
    
    const kodeBiasa = currentUser?.schoolData?.[0];
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
    console.log('Menu Aktivasi Kode Pro disabled - tidak bisa diklik');
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
  if (document.getElementById('sekolahDashboard') && currentUser) {
    const kodeBiasa = currentUser?.schoolData?.[0];
    const isProForSchool = kodeBiasa ? localStorage.getItem(`kodeProActivated:${kodeBiasa}`) === 'true' : false;
    
    // LOGIKA MENU AKTIVASI (konsisten dengan showSekolahDashboard):
    // 1. Jika login dengan kode PRO -> disable menu
    // 2. Jika login dengan kode biasa tapi sudah aktivasi PRO -> disable menu
    // 3. Jika login dengan kode biasa dan belum aktivasi PRO -> enable menu (bisa diklik)
    if (currentUser?.loginType === 'pro' || isProForSchool) {
      disableAktivasiMenu();
    } else if (currentUser?.loginType === 'biasa' && !isProForSchool) {
      enableAktivasiMenu(); // Memastikan menu bisa diklik untuk kode biasa
    }
  }
});

// --- REKAP NILAI ADMIN FILTER LOGIC ---
function initRekapFilters() {
    const kurikulumSelect = document.getElementById('filterKurikulum');
    const kecamatanSelect = document.getElementById('filterKecamatan');
    const sekolahSelect = document.getElementById('filterSekolah');
    const searchBtn = document.getElementById('searchRekapBtn');
    const rekapTableBody = document.getElementById('rekapNilaiTableBody');

    // 1. Initial state setup
    kecamatanSelect.innerHTML = '<option value="">-- Pilih Kurikulum Dahulu --</option>';
    sekolahSelect.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
    kecamatanSelect.disabled = true;
    sekolahSelect.disabled = true;
    searchBtn.disabled = true;
    if(rekapTableBody) rekapTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 20px;">Silakan lengkapi semua filter di atas untuk menampilkan data.</td></tr>';


    // 2. Event listener for Kurikulum change
    kurikulumSelect.onchange = async () => {
        const selectedKurikulum = kurikulumSelect.value;
        
        // Reset subsequent filters
        sekolahSelect.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        sekolahSelect.disabled = true;
        searchBtn.disabled = true;
        if(rekapTableBody) rekapTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center; padding: 20px;">Silakan lengkapi semua filter di atas untuk menampilkan data.</td></tr>';

        if (selectedKurikulum) {
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
        } else {
            kecamatanSelect.innerHTML = '<option value="">-- Pilih Kurikulum Dahulu --</option>';
            kecamatanSelect.disabled = true;
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
        
        if (!filters.kurikulum || !filters.kecamatan || !filters.sekolah) {
            showNotification('Harap lengkapi semua filter sebelum mencari.', 'warning');
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
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        const existingText = loadingOverlay.querySelector('.loading-text');
        if (existingText) {
            existingText.textContent = message;
        } else {
            const spinner = loadingOverlay.querySelector('.spinner');
            if (spinner) {
                const loadingText = document.createElement('div');
                loadingText.className = 'loading-text';
                loadingText.textContent = message;
                spinner.parentNode.appendChild(loadingText);
            }
        }
        loadingOverlay.style.display = 'flex';
    }

    // Show skeleton if requested
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

// Enhanced notification with loading states
function showNotification(message, type = 'info', duration = 3000, showLoading = false) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    // Create notification content
    let iconHTML = '';
    switch (type) {
        case 'success':
            iconHTML = '✅';
            break;
        case 'error':
            iconHTML = '❌';
            break;
        case 'warning':
            iconHTML = '⚠️';
            break;
        case 'loading':
            iconHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px;"></div>';
            break;
        default:
            iconHTML = 'ℹ️';
    }

    notification.innerHTML = `
        <div class="notification-content">
            ${iconHTML} ${message}
        </div>
    `;
    
    notification.className = `notification show ${type}`;
    notification.style.display = 'block';

    // Auto hide notification unless it's loading type
    if (type !== 'loading' && duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, duration);
    }
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

// Network status monitoring
const NetworkMonitor = {
    statusElement: null,
    isOnline: navigator.onLine,

    init: () => {
        // Create network status indicator
        NetworkMonitor.statusElement = document.createElement('div');
        NetworkMonitor.statusElement.className = 'network-status';
        NetworkMonitor.statusElement.id = 'networkStatus';
        document.body.appendChild(NetworkMonitor.statusElement);

        // Listen for online/offline events
        window.addEventListener('online', NetworkMonitor.handleOnline);
        window.addEventListener('offline', NetworkMonitor.handleOffline);

        // Initial status
        NetworkMonitor.updateStatus();
    },

    handleOnline: () => {
        NetworkMonitor.isOnline = true;
        NetworkMonitor.updateStatus();
        showNotification('🌐 Koneksi internet pulih', 'success', 3000);
    },

    handleOffline: () => {
        NetworkMonitor.isOnline = false;
        NetworkMonitor.updateStatus();
        showNotification('📡 Koneksi internet terputus', 'error', 0);
    },

    updateStatus: () => {
        if (!NetworkMonitor.statusElement) return;

        if (NetworkMonitor.isOnline) {
            NetworkMonitor.statusElement.textContent = '🟢 Online';
            NetworkMonitor.statusElement.className = 'network-status online';
        } else {
            NetworkMonitor.statusElement.textContent = '🔴 Offline';
            NetworkMonitor.statusElement.className = 'network-status offline';
        }
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

// ===== ACCESSIBILITY ENHANCEMENTS =====
const AccessibilityManager = {
    init: () => {
        AccessibilityManager.setupKeyboardNavigation();
        AccessibilityManager.setupAriaAttributes();
        AccessibilityManager.setupFocusManagement();
        AccessibilityManager.setupScreenReaderAnnouncements();
        AccessibilityManager.setupTabTrapForModals();
    },

    // Keyboard navigation for menu items
    setupKeyboardNavigation: () => {
        const menuItems = document.querySelectorAll('.menu-item, .submenu-item');
        
        menuItems.forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'menuitem');
            
            item.addEventListener('keydown', (e) => {
                const currentIndex = Array.from(menuItems).indexOf(e.target);
                let targetIndex = -1;

                switch (e.key) {
                    case 'ArrowDown':
                    case 'ArrowRight':
                        e.preventDefault();
                        targetIndex = (currentIndex + 1) % menuItems.length;
                        break;
                    case 'ArrowUp':
                    case 'ArrowLeft':
                        e.preventDefault();
                        targetIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
                        break;
                    case 'Home':
                        e.preventDefault();
                        targetIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        targetIndex = menuItems.length - 1;
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        e.target.click();
                        break;
                    case 'Escape':
                        e.target.blur();
                        break;
                }

                if (targetIndex >= 0) {
                    menuItems[targetIndex].focus();
                }
            });
        });
    },

    // Setup ARIA attributes for better screen reader support
    setupAriaAttributes: () => {
        // Tables
        document.querySelectorAll('table').forEach(table => {
            table.setAttribute('role', 'table');
            table.setAttribute('aria-label', 'Data table');
        });

        // Buttons
        document.querySelectorAll('.btn').forEach(btn => {
            if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
                const icon = btn.querySelector('svg');
                if (icon) {
                    btn.setAttribute('aria-label', 'Action button');
                }
            }
        });

        // Form inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label && !input.getAttribute('aria-labelledby')) {
                input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
                if (!label.id) label.id = `label-${input.id}`;
            }

            if (input.hasAttribute('required')) {
                input.setAttribute('aria-required', 'true');
            }
        });

        // Loading states
        document.querySelectorAll('.loading-overlay').forEach(overlay => {
            overlay.setAttribute('aria-live', 'polite');
            overlay.setAttribute('aria-label', 'Loading content');
        });

        // Notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'assertive');
        });
    },

    // Focus management for better keyboard navigation
    setupFocusManagement: () => {
        // Focus trap for modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('keydown', AccessibilityManager.trapFocus);
        });

        // Return focus to trigger element when closing modals
        let lastFocusedElement = null;
        
        // Store focus before opening modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-modal-trigger]')) {
                lastFocusedElement = e.target;
            }
        });

        // Restore focus when modal closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains('modal-overlay')) {
                        if (lastFocusedElement) {
                            lastFocusedElement.focus();
                            lastFocusedElement = null;
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },

    // Trap focus within modals
    trapFocus: (e) => {
        if (e.key !== 'Tab') return;

        const modal = e.currentTarget;
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    },

    // Screen reader announcements
    setupScreenReaderAnnouncements: () => {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);

        // Function to announce messages to screen readers
        window.announceToScreenReader = (message, priority = 'polite') => {
            const liveRegion = document.getElementById('live-region');
            if (liveRegion) {
                liveRegion.setAttribute('aria-live', priority);
                liveRegion.textContent = message;
                
                // Clear after announcement
                setTimeout(() => {
                    liveRegion.textContent = '';
                }, 1000);
            }
        };
    },

    // Tab trap for modals
    setupTabTrapForModals: () => {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay:not([style*="display: none"])');
                if (openModal) {
                    const closeButton = openModal.querySelector('.close-button, .close-btn');
                    if (closeButton) {
                        closeButton.click();
                    }
                }
            }
        });
    },

    // Announce page changes for single-page application
    announcePageChange: (pageName) => {
        window.announceToScreenReader(`Navigated to ${pageName}`, 'assertive');
        
        // Update page title
        document.title = `E-Ijazah - ${pageName}`;
    },

    // Announce loading states
    announceLoading: (isLoading, context = '') => {
        if (isLoading) {
            window.announceToScreenReader(`Loading ${context}`, 'polite');
        } else {
            window.announceToScreenReader(`Finished loading ${context}`, 'polite');
        }
    },

    // Enhanced table navigation
    setupTableNavigation: () => {
        document.querySelectorAll('.table-container table').forEach(table => {
            const cells = table.querySelectorAll('td, th');
            
            cells.forEach(cell => {
                cell.setAttribute('tabindex', '0');
                
                cell.addEventListener('keydown', (e) => {
                    const currentCell = e.target;
                    const row = currentCell.closest('tr');
                    const cellIndex = Array.from(row.children).indexOf(currentCell);
                    const table = currentCell.closest('table');
                    const rows = Array.from(table.rows);
                    const rowIndex = rows.indexOf(row);
                    
                    let targetCell = null;
                    
                    switch (e.key) {
                        case 'ArrowRight':
                            e.preventDefault();
                            targetCell = row.children[cellIndex + 1];
                            break;
                        case 'ArrowLeft':
                            e.preventDefault();
                            targetCell = row.children[cellIndex - 1];
                            break;
                        case 'ArrowDown':
                            e.preventDefault();
                            if (rows[rowIndex + 1]) {
                                targetCell = rows[rowIndex + 1].children[cellIndex];
                            }
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            if (rows[rowIndex - 1]) {
                                targetCell = rows[rowIndex - 1].children[cellIndex];
                            }
                            break;
                        case 'Home':
                            e.preventDefault();
                            targetCell = row.children[0];
                            break;
                        case 'End':
                            e.preventDefault();
                            targetCell = row.children[row.children.length - 1];
                            break;
                        case 'PageUp':
                            e.preventDefault();
                            targetCell = table.rows[0].children[cellIndex];
                            break;
                        case 'PageDown':
                            e.preventDefault();
                            targetCell = table.rows[table.rows.length - 1].children[cellIndex];
                            break;
                    }
                    
                    if (targetCell) {
                        targetCell.focus();
                    }
                });
            });
        });
    }
};

// Enhanced notification function with accessibility
function showAccessibleNotification(message, type = 'info', duration = 3000) {
    showNotification(message, type, duration);
    
    // Announce to screen readers
    const priority = type === 'error' ? 'assertive' : 'polite';
    window.announceToScreenReader(message, priority);
}

// Initialize error handling and accessibility
document.addEventListener('DOMContentLoaded', () => {
    NetworkMonitor.init();
    AccessibilityManager.init();
    
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
        AccessibilityManager.setupTableNavigation();
    }, 1000);
});
