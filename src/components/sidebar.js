// Reusable sidebar component
export function createSidebar(userType = 'admin', userName = 'User') {
  const sidebarHTML = `
    <div class="sidebar-overlay" onclick="closeMobileSidebar()"></div>
    <aside class="sidebar" id="${userType}Sidebar" role="navigation" aria-label="${userType} Navigation Menu">
      <div class="sidebar-header">
        👤 ${userName.toUpperCase()}
        <div style="font-size: 12px; font-weight: normal; color: rgba(255,255,255,0.7); margin-top: 4px;">
          Peran : ${userType === 'admin' ? 'Dinas Kab/Kota' : 'Sekolah'}
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">MENU UTAMA</div>
        <ul class="sidebar-menu" role="menubar">
          ${getSidebarMenuItems(userType)}
        </ul>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">PENGATURAN</div>
        <ul class="sidebar-menu" role="menubar">
          ${getSettingsMenuItems(userType)}
        </ul>
      </div>
    </aside>
  `;
  return sidebarHTML;
}

function getSidebarMenuItems(userType) {
  if (userType === 'admin') {
    return `
      <li><a href="#" class="menu-item active" data-target="dashboardContent">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        Dashboard
      </a></li>
      <li><a href="#" class="menu-item" data-target="sekolah">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        Database Sekolah
      </a></li>
      <li><a href="#" class="menu-item" data-target="siswa">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Database Siswa
      </a></li>
      <li><a href="#" class="menu-item" data-target="rekapNilaiAdmin">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Rekap Nilai
      </a></li>
      <li><a href="#" class="menu-item" data-target="sinkronisasi">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>
        Sinkronisasi
      </a></li>
    `;
  } else {
    return `
      <li><a href="#" class="menu-item active" data-target="dashboardContent">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        Dashboard
      </a></li>
      <li><a href="#" class="menu-item" data-target="sekolahSiswa">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Data Siswa
      </a></li>
    `;
  }
}

function getSettingsMenuItems(userType) {
  return `
    <li><a href="#" class="menu-item" data-target="pengaturanAkun">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="m12 1 2.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z"></path></svg>
      Pengaturan Akun
    </a></li>
    <li><a href="#" onclick="handleLogout()" class="menu-item logout-menu-item">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16,17 21,12 16,7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Keluar
    </a></li>
  `;
}

// Initialize sidebar functionality
export function initializeSidebar() {
  // Mobile sidebar toggle
  window.closeMobileSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  };

  // Menu item click handlers
  document.addEventListener('click', function(e) {
    if (e.target.closest('.menu-item')) {
      const menuItems = document.querySelectorAll('.menu-item');
      menuItems.forEach(item => item.classList.remove('active'));
      e.target.closest('.menu-item').classList.add('active');
    }
  });
}

// Logout handler
window.handleLogout = function() {
  if (confirm('Yakin ingin keluar dari aplikasi?')) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
};