// Mobile UI functionality for E-Ijazah Application
// Safe mobile sidebar and responsive UI functions

// DEBUG: Simple alert test function
function testMobileFunction() {
    alert('Mobile function is working! Button clicked successfully.');
    console.log('TEST: Mobile function executed');
}

// Mobile sidebar functionality with debug logging
function toggleMobileSidebar() {
    console.log('DEBUG: toggleMobileSidebar called');
    alert('Hamburger clicked! Checking sidebar...');
    // Try multiple possible sidebar IDs
    const sidebar = document.getElementById('adminSidebar') ||
                   document.getElementById('sekolahSidebar') ||
                   document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    console.log('DEBUG: Elements found:', {
        sidebar: !!sidebar,
        overlay: !!overlay,
        sidebarClass: sidebar?.className,
        overlayClass: overlay?.className
    });

    if (sidebar && overlay) {
        const isOpen = sidebar.classList.contains('mobile-open');
        console.log('DEBUG: Sidebar currently open:', isOpen);

        if (isOpen) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
            console.log('DEBUG: Sidebar closed');
            alert('Sidebar closed!');
        } else {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('DEBUG: Sidebar opened');
            alert('Sidebar should be open now!');
        }

        // Add haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    } else {
        console.log('DEBUG: Normal elements not found, trying fallback...');
        alert('Normal sidebar not found, trying fallback...');

        // Fallback - find ANY sidebar-like element
        const anySidebar = document.querySelector('aside') ||
                          document.querySelector('[class*="sidebar"]') ||
                          document.querySelector('nav') ||
                          document.getElementById('adminSidebar') ||
                          document.getElementById('sekolahSidebar');

        console.log('DEBUG: Fallback sidebar found:', !!anySidebar, anySidebar?.tagName, anySidebar?.className);

        if (anySidebar) {
            // Create overlay if doesn't exist
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay active';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background: rgba(0,0,0,0.6);
                    z-index: 9998;
                `;
                overlay.onclick = closeMobileSidebar;
                document.body.appendChild(overlay);
            }

            // Force show sidebar
            anySidebar.style.cssText = `
                display: block !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 280px !important;
                height: 100vh !important;
                z-index: 9999 !important;
                background: #ffffff !important;
                border-right: 1px solid #ccc !important;
                overflow-y: auto !important;
                padding: 20px !important;
            `;
            anySidebar.classList.add('mobile-open');
            document.body.style.overflow = 'hidden';
            console.log('DEBUG: Fallback sidebar displayed');
            alert('Fallback sidebar created and displayed!');
        } else {
            console.log('DEBUG: No sidebar found at all');
            alert('ERROR: No sidebar element found anywhere!');
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
    console.log('DEBUG: initMobile called');

    // Find hamburger button with multiple selectors
    const hamburgerBtn = document.querySelector('.menu-toggle') ||
                        document.querySelector('[onclick*="toggleMobileSidebar"]') ||
                        document.querySelector('button[class*="menu"]') ||
                        document.querySelector('button[class*="toggle"]');

    console.log('DEBUG: Hamburger button found:', !!hamburgerBtn, hamburgerBtn?.outerHTML);

    if (hamburgerBtn) {
        // Remove existing listeners to prevent duplicates
        hamburgerBtn.removeEventListener('click', toggleMobileSidebar);
        hamburgerBtn.removeEventListener('touchstart', toggleMobileSidebar);

        // Add multiple event types for maximum compatibility
        hamburgerBtn.addEventListener('click', function(e) {
            console.log('DEBUG: Click event triggered');
            e.preventDefault();
            e.stopPropagation();
            toggleMobileSidebar();
        });

        hamburgerBtn.addEventListener('touchstart', function(e) {
            console.log('DEBUG: Touch event triggered');
            e.preventDefault();
            e.stopPropagation();
            toggleMobileSidebar();
        }, { passive: false });

        hamburgerBtn.addEventListener('touchend', function(e) {
            console.log('DEBUG: Touch end event triggered');
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        // Also try onclick attribute approach
        hamburgerBtn.onclick = function(e) {
            console.log('DEBUG: Onclick attribute triggered');
            e.preventDefault();
            e.stopPropagation();
            toggleMobileSidebar();
            return false;
        };

        // Make button VERY visible for debugging
        hamburgerBtn.style.cssText = `
            display: block !important;
            position: relative !important;
            z-index: 99999 !important;
            font-size: 24px !important;
            padding: 15px !important;
            background: red !important;
            border: 3px solid black !important;
            border-radius: 8px !important;
            color: white !important;
            font-weight: bold !important;
            cursor: pointer !important;
            min-width: 60px !important;
            min-height: 60px !important;
        `;

        console.log('DEBUG: Button styled and events attached');
        alert('Hamburger button found and configured! It should be RED now.');
    } else {
        console.log('DEBUG: No hamburger button found');
        alert('ERROR: Hamburger button not found! Check HTML structure.');

        // Create a fallback button
        const fallbackBtn = document.createElement('button');
        fallbackBtn.innerHTML = '☰ MENU';
        fallbackBtn.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            z-index: 99999 !important;
            font-size: 18px !important;
            padding: 15px !important;
            background: blue !important;
            border: 3px solid white !important;
            border-radius: 8px !important;
            color: white !important;
            font-weight: bold !important;
            cursor: pointer !important;
        `;
        fallbackBtn.onclick = toggleMobileSidebar;
        document.body.appendChild(fallbackBtn);
        console.log('DEBUG: Fallback button created');
        alert('Fallback BLUE button created in top-left corner!');
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