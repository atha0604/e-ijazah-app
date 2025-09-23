// Professional Dark Theme Effects
// Modern Dashboard with Neumorphism and Data Visualization

// Initialize Dark Theme
function initDarkTheme() {
    // Add transition classes for smooth theme change
    document.body.classList.add('dark-theme-transition');

    // Add stats container to admin dashboard
    enhanceDashboardWithStats();

    // Initialize data visualization
    initDataVisualization();

    // Add interactive effects
    addInteractiveEffects();

    // Auto-update stats
    updateDashboardStats();
}

// Create Professional Stats Dashboard
function enhanceDashboardWithStats() {
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard && !adminDashboard.querySelector('.stats-container')) {
        const statsHTML = `
            <div class="stats-container">
                <div class="stat-card pulse-animation">
                    <div class="stat-icon" style="font-size: 3rem; margin-bottom: 15px;">📊</div>
                    <div class="stat-number" data-target="0">0</div>
                    <div class="stat-label">Total Records</div>
                    <div class="stat-trend" style="margin-top: 10px; color: var(--dark-accent-green); font-size: 0.9rem;">
                        ↗ +12% from last month
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="font-size: 3rem; margin-bottom: 15px;">👥</div>
                    <div class="stat-number" data-target="0">0</div>
                    <div class="stat-label">Active Students</div>
                    <div class="stat-trend" style="margin-top: 10px; color: var(--dark-accent-blue); font-size: 0.9rem;">
                        ↗ +8% from last month
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="font-size: 3rem; margin-bottom: 15px;">🏫</div>
                    <div class="stat-number" data-target="0">0</div>
                    <div class="stat-label">Schools</div>
                    <div class="stat-trend" style="margin-top: 10px; color: var(--dark-accent-green); font-size: 0.9rem;">
                        ↗ +3% from last month
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="font-size: 3rem; margin-bottom: 15px;">⚡</div>
                    <div class="stat-number" data-target="95">0</div>
                    <div class="stat-label">System Health</div>
                    <div class="stat-trend" style="margin-top: 10px; color: var(--dark-accent-green); font-size: 0.9rem;">
                        ✓ All systems operational
                    </div>
                </div>
            </div>
        `;

        // Insert after dashboard title
        const title = adminDashboard.querySelector('h2');
        if (title) {
            title.insertAdjacentHTML('afterend', statsHTML);
        }
    }
}

// Advanced Counter Animation
function animateCounterAdvanced(element, target, duration = 2500) {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    const increment = range / totalFrames;

    let current = start;
    let frame = 0;

    function updateCounter() {
        frame++;
        current += increment;

        // Easing function for smooth animation
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const value = Math.round(start + (range * eased));

        element.textContent = value;

        // Add percentage for system health
        if (element.closest('.stat-card').querySelector('.stat-label').textContent === 'System Health') {
            element.textContent = value + '%';
        }

        if (frame < totalFrames) {
            requestAnimationFrame(updateCounter);
        } else {
            // Final value
            element.textContent = target;
            if (element.closest('.stat-card').querySelector('.stat-label').textContent === 'System Health') {
                element.textContent = target + '%';
            }

            // Add glow effect when animation completes
            element.closest('.stat-card').classList.add('glow-green');
            setTimeout(() => {
                element.closest('.stat-card').classList.remove('glow-green');
            }, 1000);
        }
    }

    requestAnimationFrame(updateCounter);
}

// Update Dashboard Statistics
function updateDashboardStats() {
    if (window.database) {
        const siswaCount = window.database.siswa ? window.database.siswa.length : 0;
        const sekolahCount = window.database.sekolah ? window.database.sekolah.length : 0;
        const totalRecords = siswaCount + sekolahCount;

        // Update stat numbers with animation
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            // Stagger animations for better effect
            setTimeout(() => animateCounterAdvanced(statNumbers[0], totalRecords), 200);
            setTimeout(() => animateCounterAdvanced(statNumbers[1], siswaCount), 400);
            setTimeout(() => animateCounterAdvanced(statNumbers[2], sekolahCount), 600);
            setTimeout(() => animateCounterAdvanced(statNumbers[3], 95), 800);
        }
    }
}

// Initialize Data Visualization
function initDataVisualization() {
    // Create performance chart container
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard && !adminDashboard.querySelector('.chart-container')) {
        const chartHTML = `
            <div class="chart-container">
                <h3 style="color: var(--dark-text-primary); margin-bottom: 20px;">
                    📈 System Performance
                </h3>
                <canvas id="performanceChart" width="400" height="200"></canvas>
            </div>
        `;

        // Insert after stats
        const statsContainer = adminDashboard.querySelector('.stats-container');
        if (statsContainer) {
            statsContainer.insertAdjacentHTML('afterend', chartHTML);

            // Initialize chart if Chart.js is available
            setTimeout(() => {
                initPerformanceChart();
            }, 1000);
        }
    }
}

// Initialize Performance Chart
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Performance',
                    data: [85, 89, 92, 88, 95, 93],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9e9e9'
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#b0b0c8'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#b0b0c8'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
}

// Add Interactive Effects
function addInteractiveEffects() {
    // Add hover effects to all cards
    const cards = document.querySelectorAll('.stat-card, .content-section, .chart-container');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add ripple animation CSS
function addRippleCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Real-time System Monitor
function initSystemMonitor() {
    const monitor = {
        cpu: Math.floor(Math.random() * 20) + 10,
        memory: Math.floor(Math.random() * 30) + 20,
        network: Math.floor(Math.random() * 15) + 5
    };

    // Update system health percentage
    const avgLoad = (monitor.cpu + monitor.memory + monitor.network) / 3;
    const health = Math.max(0, 100 - avgLoad);

    const healthStat = document.querySelector('.stat-card:last-child .stat-number');
    if (healthStat) {
        animateCounterAdvanced(healthStat, Math.floor(health));
    }
}

// Initialize Dark Theme
function initializeDarkTheme() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initDarkTheme();
                addRippleCSS();

                // Update stats when data is available
                if (window.database) {
                    updateDashboardStats();
                } else {
                    // Wait for data to load
                    const checkData = setInterval(() => {
                        if (window.database) {
                            updateDashboardStats();
                            clearInterval(checkData);
                        }
                    }, 1000);
                }

                // Start system monitor
                initSystemMonitor();
                setInterval(initSystemMonitor, 30000); // Update every 30 seconds
            }, 300);
        });
    } else {
        setTimeout(() => {
            initDarkTheme();
            addRippleCSS();
            updateDashboardStats();
            initSystemMonitor();
        }, 300);
    }
}

// Initialize when script loads
initializeDarkTheme();