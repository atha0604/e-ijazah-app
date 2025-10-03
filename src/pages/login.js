// Login page functionality
import '../assets/css/login.css';

// Global variables untuk compatibility
window.database = {
    sekolah: [],
    siswa: [],
    nilai: {},
    settings: {},
    sklPhotos: {}
};

// Login form handler - Same as original
function handleLogin(event) {
  event.preventDefault();

  const appCodeInput = document.getElementById('appCode');
  const appCode = appCodeInput.value.trim();
  const kurikulum = document.querySelector('input[name="kurikulum"]:checked').value;

  if (!appCode) {
    alert('Masukkan kode aplikasi terlebih dahulu');
    appCodeInput.focus();
    return;
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Memproses...';
  submitBtn.disabled = true;

  // Simulate server authentication
  setTimeout(() => {
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // Simple role detection logic
    if (appCode.toLowerCase().includes('admin') || appCode.toLowerCase().includes('dinas')) {
      // Store user data
      window.currentUser = {
        role: 'admin',
        appCode: appCode,
        kurikulum: kurikulum,
        schoolData: ['', '', '', '', 'DINAS PENDIDIKAN', 'ADMIN SYSTEM']
      };
      window.location.href = 'admin.html';
    } else {
      // Store user data
      window.currentUser = {
        role: 'sekolah',
        appCode: appCode,
        kurikulum: kurikulum,
        schoolData: ['', '', '', '', appCode.toUpperCase(), 'SEKOLAH']
      };
      window.location.href = 'sekolah.html';
    }
  }, 1000);
}

// Make handleLogin global for inline onclick
window.handleLogin = handleLogin;

// Initialize login page
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const appCodeInput = document.getElementById('appCode');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      if (appCodeInput) appCodeInput.value = '';
      document.getElementById('kurikulumMerdeka').checked = true;
    });
  }

  // Auto focus on app code input
  if (appCodeInput) {
    appCodeInput.focus();
  }

  // Initialize particles animation
  initParticlesAnimation();
});

function initParticlesAnimation() {
  const particles = document.querySelectorAll('.particle');
  particles.forEach(particle => {
    // Add random movement
    particle.addEventListener('animationiteration', function() {
      const randomX = Math.random() * 20 - 10;
      const randomY = Math.random() * 20 - 10;
      particle.style.transform = `translate(${randomX}px, ${randomY}px)`;
    });
  });
}

console.log('Login page loaded with particles animation');