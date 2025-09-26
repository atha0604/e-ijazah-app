// Sekolah dashboard functionality
import '../assets/css/sekolah.css';
import { createSidebar, initializeSidebar } from '../components/sidebar.js';

// Initialize sekolah dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sekolah dashboard initializing...');

  // Inject sidebar
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = createSidebar('sekolah', 'SMA NEGERI 1');
    initializeSidebar();
  }

  // Initialize navigation
  initializeNavigation();

  // Load initial data
  loadSchoolStats();
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

window.showSection = function(sectionId) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update menu active state
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  const menuItem = document.querySelector(`[data-target="${sectionId}"]`);
  if (menuItem) {
    menuItem.classList.add('active');
  }
};

function loadSchoolStats() {
  // Simulate loading school statistics
  setTimeout(() => {
    const totalSiswaEl = document.getElementById('totalSiswaSekolah');
    const totalKelasEl = document.getElementById('totalKelas');
    const dataLengkapEl = document.getElementById('dataLengkapSekolah');

    if (totalSiswaEl) totalSiswaEl.textContent = '450';
    if (totalKelasEl) totalKelasEl.textContent = '18';
    if (dataLengkapEl) dataLengkapEl.textContent = '95%';
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

// Siswa management functions
window.tambahSiswa = function() {
  console.log('Tambah siswa clicked');
  // TODO: Implement add student functionality
};

console.log('Sekolah dashboard loaded');