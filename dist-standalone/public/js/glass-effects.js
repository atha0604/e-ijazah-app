// Glass Morphism Effects and Enhancements
// Modern Dashboard Functionality

// Initialize Glass Theme
function initGlassTheme() {
    // Add glass-animate class to elements as they appear
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('glass-animate');
            }
        });
    }, observerOptions);

    // Observe all glass elements
    const glassElements = document.querySelectorAll('.content-section, .stat-card, .dashboard-header, .sidebar');
    glassElements.forEach(el => observer.observe(el));
}

// Create Statistics Dashboard
function createStatsGrid() {
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-grid';
    statsContainer.innerHTML = `
        <div class="stat-card glass-animate">
            <div class="stat-icon">📊</div>
            <div class="stat-number" data-target="0">0</div>
            <div class="stat-label">Total Data</div>
        </div>
        <div class="stat-card glass-animate">
            <div class="stat-icon">👥</div>
            <div class="stat-number" data-target="0">0</div>
            <div class="stat-label">Total Siswa</div>
        </div>
        <div class="stat-card glass-animate">
            <div class="stat-icon">🏫</div>
            <div class="stat-number" data-target="0">0</div>
            <div class="stat-label">Total Sekolah</div>
        </div>
        <div class="stat-card glass-animate">
            <div class="stat-icon">📈</div>
            <div class="stat-number" data-target="89">0</div>
            <div class="stat-label">Completion</div>
        </div>
    `;

    return statsContainer;
}

// Animated Counter for Statistics
function animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const increment = target > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));

    let current = start;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;

        if (current === target) {
            clearInterval(timer);
            if (element.closest('.stat-card').querySelector('.stat-label').textContent === 'Completion') {
                element.textContent = target + '%';
            }
        }
    }, stepTime);
}

// Update Statistics with Real Data
function updateGlassStats() {
    if (window.database) {
        const siswaCount = window.database.siswa ? window.database.siswa.length : 0;
        const sekolahCount = window.database.sekolah ? window.database.sekolah.length : 0;
        const totalData = siswaCount + sekolahCount;

        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].setAttribute('data-target', totalData);
            statNumbers[1].setAttribute('data-target', siswaCount);
            statNumbers[2].setAttribute('data-target', sekolahCount);

            // Animate counters
            animateCounter(statNumbers[0], totalData);
            animateCounter(statNumbers[1], siswaCount);
            animateCounter(statNumbers[2], sekolahCount);
            animateCounter(statNumbers[3], 89);
        }
    }
}

// Create Floating Action Buttons
function createFloatingActions() {
    const fabContainer = document.createElement('div');
    fabContainer.className = 'floating-actions';
    fabContainer.innerHTML = `
        <button class="fab" title="Refresh Data" onclick="refreshData()">
            🔄
        </button>
        <button class="fab" title="Export Data" onclick="showExportOptions()">
            📤
        </button>
        <button class="fab" title="Quick Add" onclick="showQuickAdd()">
            ➕
        </button>
    `;

    document.body.appendChild(fabContainer);
}

// Add Glass Effect to Tables
function enhanceTablesWithGlass() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.closest('.table-container')) {
            const container = document.createElement('div');
            container.className = 'table-container';
            table.parentNode.insertBefore(container, table);
            container.appendChild(table);
        }
    });
}

// Enhance Existing Content Sections
function enhanceContentSections() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        // Add stats grid to admin dashboard
        if (section.id === 'adminDashboard' && !section.querySelector('.stats-grid')) {
            const title = section.querySelector('h2');
            if (title) {
                const statsGrid = createStatsGrid();
                title.parentNode.insertBefore(statsGrid, title.nextSibling);
            }
        }
    });
}

// Smooth Scrolling for Glass Elements
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize Glass Theme Effects
function initializeGlassEffects() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initGlassTheme();
                enhanceContentSections();
                enhanceTablesWithGlass();
                createFloatingActions();
                addSmoothScrolling();

                // Update stats when data is available
                if (window.database) {
                    updateGlassStats();
                } else {
                    // Wait for data to load
                    const checkData = setInterval(() => {
                        if (window.database) {
                            updateGlassStats();
                            clearInterval(checkData);
                        }
                    }, 1000);
                }
            }, 500);
        });
    } else {
        setTimeout(() => {
            initGlassTheme();
            enhanceContentSections();
            enhanceTablesWithGlass();
            createFloatingActions();
            addSmoothScrolling();
            updateGlassStats();
        }, 500);
    }
}

// Utility Functions for FAB
function refreshData() {
    showNotification('🔄 Refreshing data...', 'info');
    if (typeof fetchData === 'function') {
        fetchData();
    }
}

function showExportOptions() {
    showNotification('📤 Export options coming soon!', 'info');
}

function showQuickAdd() {
    showNotification('➕ Quick add feature coming soon!', 'info');
}

// Initialize when script loads
initializeGlassEffects();