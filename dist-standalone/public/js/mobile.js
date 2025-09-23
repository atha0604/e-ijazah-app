// Responsive UI functionality for E-Ijazah Application
// LAPTOP/DESKTOP FOCUSED - Optimized for educational institution use

// Mobile sidebar functionality - DISABLED for laptop-focused application
function toggleMobileSidebar() {
    // This application is designed for laptop/desktop use in educational institutions
    // Mobile menu is disabled to maintain optimal desktop experience
    console.log('Mobile menu disabled - application optimized for laptop/desktop use');
    return false;
}

function closeMobileSidebar() {
    // No-op - mobile menu disabled
    return false;
}

// Responsive helper functions - kept for compatibility
function isMobileDevice() {
    return window.innerWidth <= 768;
}

function isTabletDevice() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isLaptopDevice() {
    return window.innerWidth > 1024;
}

// Laptop-optimized UI adjustments
function adjustLaptopUI() {
    // Ensure optimal experience on laptops and desktops
    if (isLaptopDevice()) {
        document.body.classList.add('laptop-view');
        document.body.classList.remove('mobile-view', 'tablet-view');
    } else if (isTabletDevice()) {
        document.body.classList.add('tablet-view');
        document.body.classList.remove('mobile-view', 'laptop-view');
    } else {
        // Small screens still get desktop-like experience
        document.body.classList.add('mobile-view');
        document.body.classList.remove('tablet-view', 'laptop-view');
    }
}

// Initialize laptop-focused functionality
function initLaptopUI() {
    console.log('Initializing laptop-focused UI');

    // Hide any mobile-specific elements
    const hamburgerBtns = document.querySelectorAll('.menu-toggle');
    hamburgerBtns.forEach(btn => {
        btn.style.display = 'none';
    });

    // Hide mobile overlays
    const overlays = document.querySelectorAll('.sidebar-overlay');
    overlays.forEach(overlay => {
        overlay.style.display = 'none';
    });

    // Ensure sidebars are always visible on laptop
    const sidebars = document.querySelectorAll('.sidebar');
    sidebars.forEach(sidebar => {
        sidebar.style.position = 'static';
        sidebar.style.display = 'block';
        sidebar.style.left = 'auto';
        sidebar.style.transform = 'none';
    });

    // Adjust UI for current screen size
    adjustLaptopUI();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLaptopUI);
} else {
    initLaptopUI();
}

// Also initialize when window loads (fallback)
window.addEventListener('load', initLaptopUI);

// Adjust UI on resize
window.addEventListener('resize', adjustLaptopUI);

// Expose functions globally for compatibility
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;