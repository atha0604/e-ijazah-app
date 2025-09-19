// Mobile UI functionality for E-Ijazah Application
// Safe mobile sidebar and responsive UI functions

// Mobile sidebar functionality with debug logging
function toggleMobileSidebar() {
    // Try multiple possible sidebar IDs
    const sidebar = document.getElementById('adminSidebar') ||
                   document.getElementById('sekolahSidebar') ||
                   document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('mobile-open');

        if (isOpen) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto'; // Enable body scroll
        } else {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }

        // Add haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    } else {
        // Fallback - force show sidebar
        const anySidebar = document.querySelector('aside') || document.querySelector('[class*="sidebar"]');
        if (anySidebar) {
            anySidebar.style.display = 'block';
            anySidebar.style.position = 'fixed';
            anySidebar.style.top = '0';
            anySidebar.style.left = '0';
            anySidebar.style.width = '280px';
            anySidebar.style.height = '100vh';
            anySidebar.style.zIndex = '9999';
            anySidebar.style.background = 'var(--bg-card, #ffffff)';
            anySidebar.classList.add('mobile-open');
        }
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar') ||
                   document.getElementById('sekolahSidebar') ||
                   document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable body scroll
    }

    // Also close any force-opened sidebar
    const anySidebar = document.querySelector('aside[style*="position: fixed"]');
    if (anySidebar) {
        anySidebar.style.display = '';
        anySidebar.style.position = '';
        anySidebar.style.left = '';
        anySidebar.style.zIndex = '';
        anySidebar.classList.remove('mobile-open');
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

// Initialize mobile functionality when DOM is ready
function initMobile() {
    // Add touch event listeners for better mobile support
    const hamburgerBtn = document.querySelector('.menu-toggle');
    if (hamburgerBtn) {
        // Remove existing listeners to prevent duplicates
        hamburgerBtn.removeEventListener('click', toggleMobileSidebar);
        hamburgerBtn.removeEventListener('touchstart', toggleMobileSidebar);

        // Add both click and touch events
        hamburgerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileSidebar();
        });

        hamburgerBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileSidebar();
        }, { passive: false });

        // Make button more visible for debugging
        if (isMobileDevice()) {
            hamburgerBtn.style.display = 'block';
            hamburgerBtn.style.position = 'relative';
            hamburgerBtn.style.zIndex = '9999';
            hamburgerBtn.style.fontSize = '24px';
            hamburgerBtn.style.padding = '12px';
            hamburgerBtn.style.background = 'rgba(0,0,0,0.1)';
            hamburgerBtn.style.border = '1px solid #ccc';
            hamburgerBtn.style.borderRadius = '4px';
        }
    }

    // Add touch listeners to overlay
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
        overlay.addEventListener('touchstart', closeMobileSidebar, { passive: true });
    }

    // Adjust UI for mobile
    adjustMobileUI();
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobile);
} else {
    initMobile();
}

// Also initialize when window loads (fallback)
window.addEventListener('load', initMobile);

// Re-initialize on resize
window.addEventListener('resize', adjustMobileUI);