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

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin dashboard initializing...');

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

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

function loadDashboardStats() {
  // Load statistics dari database
  setTimeout(() => {
    const totalSekolahEl = document.getElementById('totalSekolahStat');
    const totalSiswaEl = document.getElementById('totalSiswaStat');
    const sekolahCountEl = document.getElementById('sekolahCount');
    const siswaCountEl = document.getElementById('siswaCount');

    const sekolahCount = window.database.sekolah.length;
    const siswaCount = window.database.siswa.length;

    if (totalSekolahEl) totalSekolahEl.textContent = sekolahCount;
    if (totalSiswaEl) totalSiswaEl.textContent = siswaCount;
    if (sekolahCountEl) sekolahCountEl.textContent = sekolahCount;
    if (siswaCountEl) siswaCountEl.textContent = siswaCount;

    // Update kecamatan statistics
    updateKecamatanStats();
  }, 500);
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
      console.log('Tambah sekolah clicked');
      // TODO: Show modal tambah sekolah
    });
  }

  // Search functionality
  const searchSekolah = document.getElementById('searchSekolah');
  if (searchSekolah) {
    searchSekolah.addEventListener('input', function() {
      // TODO: Implement search
      console.log('Search sekolah:', this.value);
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
function loadSekolahData() {
  const tableBody = document.getElementById('sekolahTableBody');
  if (!tableBody) return;

  if (window.database.sekolah.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #666;">Belum ada data sekolah. Klik "Tambah Sekolah" untuk menambahkan data.</td></tr>';
    return;
  }

  let html = '';
  window.database.sekolah.forEach((sekolah, index) => {
    html += `
      <tr>
        <td>${sekolah[0] || '-'}</td>
        <td>${sekolah[1] || '-'}</td>
        <td>${sekolah[2] || '-'}</td>
        <td>${sekolah[3] || '-'}</td>
        <td>${sekolah[4] || '-'}</td>
        <td>${sekolah[5] || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editSekolah(${index})">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41L18.37 3.29c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteSekolah(${index})" style="margin-left: 5px;">
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
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">Belum ada data siswa.</td></tr>';
    return;
  }

  let html = '';
  window.database.siswa.forEach((siswa, index) => {
    html += `
      <tr>
        <td>${siswa[0] || '-'}</td>
        <td>${siswa[1] || '-'}</td>
        <td>${siswa[2] || '-'}</td>
        <td>${siswa[3] || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editSiswa(${index})">
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
      console.log('Show schools in kecamatan:', kecamatan);
      // TODO: Show modal dengan daftar sekolah di kecamatan
    });
  });
}

// Global functions untuk compatibility
window.editSekolah = function(index) {
  console.log('Edit sekolah:', index);
  // TODO: Show edit modal
};

window.deleteSekolah = function(index) {
  if (confirm('Yakin ingin menghapus data sekolah ini?')) {
    window.database.sekolah.splice(index, 1);
    loadSekolahData();
    loadDashboardStats();
  }
};

window.editSiswa = function(index) {
  console.log('Edit siswa:', index);
  // TODO: Show edit modal
};

window.generateSmartExcelTemplate = function(type) {
  console.log('Generate template for:', type);
  // TODO: Generate Excel template
};

window.closeSekolahKecamatanModal = function() {
  const modal = document.getElementById('sekolahKecamatanModal');
  if (modal) modal.style.display = 'none';
};

console.log('Admin dashboard with full functionality loaded');