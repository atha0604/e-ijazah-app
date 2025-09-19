// Mobile UI functionality for E-Ijazah Application
// Safe mobile sidebar and responsive UI functions

// Mobile sidebar functionality
function toggleMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar') || document.getElementById('sekolahSidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar') || document.getElementById('sekolahSidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    }
}

// Close mobile sidebar on window resize if viewport becomes larger
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMobileSidebar();
    }
});

// Mobile responsive helper functions
function isMobileDevice() {
    return window.innerWidth <= 768;
}

function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

// Mobile-specific UI adjustments
function adjustMobileUI() {
    if (isMobileDevice()) {
        document.body.classList.add('mobile-view');
        // Auto close sidebar on mobile
        closeMobileSidebar();
    } else {
        document.body.classList.remove('mobile-view');
    }
}