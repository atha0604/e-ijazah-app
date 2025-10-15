// Admin dashboard functionality
import '../assets/css/admin.css';
import { createSidebar, initializeSidebar } from '../components/sidebar.js';

// Global variables untuk compatibility dengan sistem original
window.database = window.database || {
    sekolah: [],
    siswa: [],
    nilai: {},
    settings: {},
    sklPhotos: {}
};

window.currentUser = window.currentUser || {
    role: 'admin',
    schoolData: ['', '', '', '', 'DINAS PENDIDIKAN', 'PRASETYA LUKMANA']
};

// Load data dari backend
async function loadDataFromBackend() {
  try {
    const token = localStorage.getItem('jwtToken');
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch data sekolah
    const sekolahResponse = await fetch('/api/data/sekolah', { headers });
    const sekolahResult = await sekolahResponse.json();
    if (sekolahResult.success) {
      window.database.sekolah = sekolahResult.data;
    }

    // Fetch semua data siswa (tanpa parameter kodeSekolah)
    const siswaResponse = await fetch('/api/data/siswa', { headers });
    const siswaResult = await siswaResponse.json();
    if (siswaResult.success) {
      window.database.siswa = siswaResult.data;
    }
  } catch (error) {
    console.error('Error loading data from backend:', error);
  }
}

// Check authentication before loading dashboard
function checkAuthentication() {
  const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token || userRole !== 'admin') {
    // No token or not admin, redirect to login
    window.location.href = '/admin-login.html';
    return false;
  }

  return true;
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async function() {
  // Check authentication first
  if (!checkAuthentication()) {
    return; // Stop execution if not authenticated
  }

  // Update header with user info
  updateHeaderSchoolName();

  // Inject sidebar
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = createSidebar('admin', 'PRASETYA LUKMANA');
    initializeSidebar();
  }

  // Initialize navigation
  initializeNavigation();

  // Load data dari backend
  await loadDataFromBackend();

  // Load initial data
  loadDashboardStats();

  // Initialize sections
  initializeSekolahSection();
  initializeSiswaSection();
});

function initializeNavigation() {
  // Handle menu clicks
  document.addEventListener('click', function(e) {
    if (e.target.closest('.menu-item')) {
      e.preventDefault();
      const target = e.target.closest('.menu-item').dataset.target;
      if (target) {
        showSection(target);
      }
    }
  });
}

async function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Load data when switching to specific sections
  if (sectionId === 'sekolah') {
    await loadDataFromBackend(); // Refresh data
    loadSekolahData();
  } else if (sectionId === 'siswa') {
    await loadDataFromBackend(); // Refresh data
    loadSiswaData();
  } else if (sectionId === 'dashboardContent') {
    await loadDataFromBackend(); // Refresh data
    loadDashboardStats();
  } else if (sectionId === 'sinkronisasi') {
    loadSyncStatus();
  }
}

function loadDashboardStats() {
  // Load statistics dari database
  const totalSekolahEl = document.getElementById('totalSekolah');
  const totalSiswaEl = document.getElementById('totalSiswa');
  const dataLengkapEl = document.getElementById('dataLengkap');

  const sekolahCount = window.database.sekolah.length;
  const siswaCount = window.database.siswa.length;

  if (totalSekolahEl) totalSekolahEl.textContent = sekolahCount;
  if (totalSiswaEl) totalSiswaEl.textContent = siswaCount;
  if (dataLengkapEl) {
    // Hitung siswa dengan data lengkap (contoh: yang punya NISN)
    const dataLengkapCount = window.database.siswa.filter(s => s[0]).length;
    dataLengkapEl.textContent = dataLengkapCount;
  }
}

// Mobile sidebar toggle
window.toggleMobileSidebar = function() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
};

// Update header dengan nama user
function updateHeaderSchoolName() {
  try {
    if (!window.currentUser || !window.currentUser.schoolData) return;
    const schoolName = window.currentUser.schoolData[4] || window.currentUser.schoolData[5] || 'PRASETYA LUKMANA';

    const headerNameEl = document.getElementById('headerUserName');
    if (headerNameEl && schoolName) {
      headerNameEl.textContent = schoolName;
    }
  } catch (e) {
    console.warn('updateHeaderSchoolName warning:', e);
  }
}

// Initialize sekolah section
function initializeSekolahSection() {
  // Tambah sekolah button
  const btnTambahSekolah = document.getElementById('btnTambahSekolah');
  if (btnTambahSekolah) {
    btnTambahSekolah.addEventListener('click', function() {
      // TODO: Show modal tambah sekolah
    });
  }

  // Search functionality
  const searchSekolah = document.getElementById('searchSekolah');
  if (searchSekolah) {
    searchSekolah.addEventListener('input', function() {
      // TODO: Implement search
    });
  }

  // Load sekolah data
  loadSekolahData();
}

// Initialize siswa section
function initializeSiswaSection() {
  // Load siswa data
  loadSiswaData();
}

// Load sekolah data
window.loadSekolahData = function() {
  const tableBody = document.getElementById('sekolahTableBody');
  if (!tableBody) return;

  if (window.database.sekolah.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">Belum ada data sekolah. Klik "Tambah Sekolah" untuk menambahkan data.</td></tr>';
    return;
  }

  let html = '';
  window.database.sekolah.forEach((sekolah, index) => {
    const kodeBiasa = sekolah[0];
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${sekolah[3] || '-'}</td>
        <td>${sekolah[4] || '-'}</td>
        <td>${sekolah[2] || '-'}</td>
        <td><span class="badge badge-success">Aktif</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editSekolah('${kodeBiasa}')">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41L18.37 3.29c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteSekolah('${kodeBiasa}')" style="margin-left: 5px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Hapus
          </button>
        </td>
      </tr>
    `;
  });
  tableBody.innerHTML = html;
}

// Load siswa data
function loadSiswaData() {
  const tableBody = document.getElementById('siswaTableBody');
  if (!tableBody) return;

  if (window.database.siswa.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">Belum ada data siswa.</td></tr>';
    return;
  }

  let html = '';
  window.database.siswa.forEach((siswa, index) => {
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${siswa[0] || '-'}</td>
        <td>${siswa[8] || '-'}</td>
        <td>${siswa[3] || '-'}</td>
        <td>${siswa[4] || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editSiswa('${siswa[0]}')">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41L18.37 3.29c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            Edit
          </button>
        </td>
      </tr>
    `;
  });
  tableBody.innerHTML = html;
}

// Update kecamatan statistics
function updateKecamatanStats() {
  const kecamatanCards = document.querySelectorAll('.kecamatan-card');

  kecamatanCards.forEach(card => {
    const kecamatan = card.dataset.kecamatan;
    const siswaCount = window.database.siswa.filter(siswa => siswa[4] === kecamatan).length;
    const countEl = card.querySelector('.kecamatan-count');
    if (countEl) countEl.textContent = siswaCount;

    // Add click handler
    card.addEventListener('click', function() {
      // TODO: Show modal dengan daftar sekolah di kecamatan
    });
  });
}

// Global functions untuk compatibility
window.editSekolah = function(kodeBiasa) {
  // TODO: Show edit modal
};

window.deleteSekolah = async function(kodeBiasa) {
  if (confirm('Yakin ingin menghapus data sekolah ini?')) {
    try {
      const response = await fetch('/api/data/sekolah/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kodeBiasa })
      });
      const result = await response.json();
      if (result.success) {
        await loadDataFromBackend();
        loadSekolahData();
        loadDashboardStats();
        alert('Data sekolah berhasil dihapus');
      } else {
        alert('Gagal menghapus data sekolah: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting sekolah:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  }
};

window.editSiswa = function(nisn) {
  // TODO: Show edit modal
};

window.generateSmartExcelTemplate = function(type) {
  // TODO: Generate Excel template
};

window.closeSekolahKecamatanModal = function() {
  const modal = document.getElementById('sekolahKecamatanModal');
  if (modal) modal.style.display = 'none';
};

// ============================================
// SINKRONISASI FUNCTIONS
// ============================================

async function loadSyncStatus() {
  const centralServerUrl = localStorage.getItem('central_server_url') || 'https://e-ijazah-app-test.up.railway.app';

  // Set saved URL
  const urlInput = document.getElementById('centralServerUrl');
  if (urlInput) {
    urlInput.value = centralServerUrl;
  }

  try {
    // Test server status
    const pingResponse = await fetch(`${centralServerUrl}/api/sync/ping`);
    if (pingResponse.ok) {
      document.getElementById('syncOnlineStatus').innerHTML = '🟢 Online';
      document.getElementById('syncOnlineStatus').className = 'status-online';
    } else {
      throw new Error('Server offline');
    }

    // Get stats
    const statsResponse = await fetch(`${centralServerUrl}/api/admin/stats`);
    const statsData = await statsResponse.json();

    if (statsData.success) {
      document.getElementById('syncTotalRecords').textContent =
        parseInt(statsData.stats.total_siswa || 0) + parseInt(statsData.stats.total_nilai || 0);
      document.getElementById('syncActiveSchools').textContent = statsData.stats.sekolah_active || 0;
    }

    // Get school sync status
    const sekolahResponse = await fetch(`${centralServerUrl}/api/admin/sekolah`);
    const sekolahData = await sekolahResponse.json();

    if (sekolahData.success) {
      renderSchoolSyncTable(sekolahData.data);

      // Update last sync time from first record
      if (sekolahData.data.length > 0 && sekolahData.data[0].last_sync) {
        const lastSync = new Date(sekolahData.data[0].last_sync);
        document.getElementById('syncLastTime').textContent = formatRelativeTime(lastSync);
      }
    }

  } catch (error) {
    console.error('Error loading sync status:', error);
    document.getElementById('syncOnlineStatus').innerHTML = '🔴 Offline';
    document.getElementById('syncOnlineStatus').className = 'status-offline';
  }
}

function renderSchoolSyncTable(data) {
  const tbody = document.getElementById('schoolSyncStatusTable');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
          Belum ada data sinkronisasi dari sekolah
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(school => {
    const statusClass =
      school.status === 'up-to-date' ? 'badge-success' :
      school.status === 'outdated' ? 'badge-warning' :
      'badge-danger';

    const statusText =
      school.status === 'up-to-date' ? '✅ Terbaru' :
      school.status === 'outdated' ? '⚠️ Perlu Update' :
      '❌ Kritis';

    const lastSync = school.last_sync ? new Date(school.last_sync).toLocaleString('id-ID') : '-';

    return `
      <tr>
        <td>${school.npsn}</td>
        <td>${school.nama_lengkap}</td>
        <td>${school.kecamatan || '-'}</td>
        <td>${school.total_siswa || 0}</td>
        <td>${school.total_nilai || 0}</td>
        <td>${lastSync}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');
}

window.testCentralServerConnection = async function() {
  const urlInput = document.getElementById('centralServerUrl');
  const serverUrl = urlInput.value.trim();

  if (!serverUrl) {
    alert('❌ Masukkan URL server terlebih dahulu');
    return;
  }

  try {
    const response = await fetch(`${serverUrl}/api/sync/ping`);

    if (response.ok) {
      const data = await response.json();
      alert(`✅ Koneksi berhasil!\n\nServer: ${data.message}\nTimestamp: ${new Date(data.timestamp).toLocaleString('id-ID')}`);
    } else {
      throw new Error(`Server responded with ${response.status}`);
    }
  } catch (error) {
    alert(`❌ Koneksi gagal: ${error.message}`);
  }
};

window.saveCentralServerConfig = function() {
  const urlInput = document.getElementById('centralServerUrl');
  const serverUrl = urlInput.value.trim();

  if (!serverUrl) {
    alert('❌ URL server harus diisi');
    return;
  }

  localStorage.setItem('central_server_url', serverUrl);
  alert('✅ Konfigurasi tersimpan');

  // Reload status
  loadSyncStatus();
};

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID');
}

// Admin dashboard loaded