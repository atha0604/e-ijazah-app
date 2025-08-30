// Theme Manager untuk Dark Mode & Accessibility
const ThemeManager = {
    currentTheme: 'light',
    themes: {
        light: {
            '--bg-primary': '#ffffff',
            '--bg-secondary': '#f8f9fa',
            '--bg-card': '#ffffff',
            '--text-primary': '#333333',
            '--text-secondary': '#666666',
            '--text-muted': '#888888',
            '--border-color': '#e0e0e0',
            '--shadow': 'rgba(0,0,0,0.1)',
            '--accent-primary': '#1e8e3e',
            '--accent-secondary': '#28a745',
            '--danger': '#dc3545',
            '--warning': '#ffc107',
            '--info': '#17a2b8',
            '--success': '#28a745'
        },
        dark: {
            '--bg-primary': '#1a1a1a',
            '--bg-secondary': '#2d2d2d',
            '--bg-card': '#333333',
            '--text-primary': '#ffffff',
            '--text-secondary': '#cccccc',
            '--text-muted': '#999999',
            '--border-color': '#444444',
            '--shadow': 'rgba(255,255,255,0.1)',
            '--accent-primary': '#4caf50',
            '--accent-secondary': '#66bb6a',
            '--danger': '#f44336',
            '--warning': '#ff9800',
            '--info': '#2196f3',
            '--success': '#4caf50'
        }
    },
    
    // Flag to completely disable dark mode if needed
    darkModeEnabled: true,

    // Inisialisasi theme manager
    init: function() {
        console.log('Theme Manager initialized');
        
        // Load saved theme
        const savedTheme = localStorage.getItem('selectedTheme');
        const savedFontSize = localStorage.getItem('fontSize');
        
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
            this.applyTheme(savedTheme);
        }
        
        if (savedFontSize) {
            this.setFontSize(parseInt(savedFontSize));
        }
        
        // Detect system theme preference
        this.detectSystemTheme();
        
        // Add theme toggle button
        this.createThemeControls();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.detectSystemTheme();
                }
            });
        }
    },

    // Deteksi theme sistem
    detectSystemTheme: function() {
        if (this.currentTheme === 'auto' || this.currentTheme === 'light') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.applyTheme('dark');
            } else {
                this.applyTheme('light');
            }
        }
    },

    // Apply theme
    applyTheme: function(themeName) {
        // Check if dark mode is disabled
        if (themeName === 'dark' && !this.darkModeEnabled) {
            console.warn('Dark mode is disabled');
            if (window.showNotification) {
                showNotification('Dark mode sementara dinonaktifkan', 'warning');
            }
            return;
        }
        
        if (!this.themes[themeName]) {
            console.warn('Theme not found:', themeName);
            return;
        }

        const root = document.documentElement;
        const theme = this.themes[themeName];
        
        // Apply CSS variables
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        // Add theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        
        // Update current theme
        this.currentTheme = themeName;
        
        // Save to localStorage
        localStorage.setItem('selectedTheme', themeName);
        
        // Update UI controls
        this.updateThemeControls();
        
        // Log activity
        if (window.SecurityUtils) {
            SecurityUtils.logActivity('THEME_CHANGED', `Changed to ${themeName}`);
        }
        
        console.log(`Theme applied: ${themeName}`);
    },

    // Buat kontrol theme
    createThemeControls: function() {
        // Cari tempat untuk menambahkan kontrol theme
        const settingsSection = document.getElementById('settingSection');
        if (!settingsSection) return;
        
        const themeControlsHTML = `
            <div class="theme-controls-container" style="margin: 20px 0; padding: 20px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color);">
                <h3 style="color: var(--text-primary); margin-bottom: 15px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    Pengaturan Tema & Aksesibilitas
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: var(--text-secondary); margin-bottom: 5px; font-weight: 500;">Tema:</label>
                    <select id="themeSelector" style="padding: 8px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); min-width: 150px;">
                        <option value="light">🌞 Terang</option>
                        <option value="dark" ${this.darkModeEnabled ? '' : 'disabled'}>🌙 Gelap ${this.darkModeEnabled ? '' : '(Dinonaktifkan)'}</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: var(--text-secondary); margin-bottom: 5px; font-weight: 500;">Ukuran Font:</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" id="decreaseFontSize" style="padding: 5px 10px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer;">A-</button>
                        <span id="currentFontSize" style="color: var(--text-primary); min-width: 60px; text-align: center;">100%</span>
                        <button type="button" id="increaseFontSize" style="padding: 5px 10px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer;">A+</button>
                        <button type="button" id="resetFontSize" style="padding: 5px 10px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); cursor: pointer;">Reset</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; color: var(--text-secondary); cursor: pointer;">
                        <input type="checkbox" id="reduceMotion" style="margin-right: 8px;">
                        Kurangi animasi (untuk sensitif gerakan)
                    </label>
                </div>
                
                <div>
                    <button type="button" id="resetThemeSettings" style="padding: 8px 16px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--accent-primary); color: white; cursor: pointer;">
                        Reset ke Default
                    </button>
                </div>
            </div>
        `;
        
        // Tambahkan ke setting section
        const existingContent = settingsSection.innerHTML;
        settingsSection.innerHTML = existingContent + themeControlsHTML;
        
        // Bind event listeners
        this.bindThemeControls();
    },

    // Bind event listeners untuk kontrol theme
    bindThemeControls: function() {
        const themeSelector = document.getElementById('themeSelector');
        const increaseFontSize = document.getElementById('increaseFontSize');
        const decreaseFontSize = document.getElementById('decreaseFontSize');
        const resetFontSize = document.getElementById('resetFontSize');
        const reduceMotion = document.getElementById('reduceMotion');
        const resetThemeSettings = document.getElementById('resetThemeSettings');
        
        if (themeSelector) {
            themeSelector.value = this.currentTheme;
            themeSelector.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        }
        
        if (increaseFontSize) {
            increaseFontSize.addEventListener('click', () => {
                this.changeFontSize(10);
            });
        }
        
        if (decreaseFontSize) {
            decreaseFontSize.addEventListener('click', () => {
                this.changeFontSize(-10);
            });
        }
        
        if (resetFontSize) {
            resetFontSize.addEventListener('click', () => {
                this.setFontSize(100);
            });
        }
        
        if (reduceMotion) {
            const savedReduceMotion = localStorage.getItem('reduceMotion') === 'true';
            reduceMotion.checked = savedReduceMotion;
            this.setReducedMotion(savedReduceMotion);
            
            reduceMotion.addEventListener('change', (e) => {
                this.setReducedMotion(e.target.checked);
            });
        }
        
        if (resetThemeSettings) {
            resetThemeSettings.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }
    },

    // Update kontrol theme UI
    updateThemeControls: function() {
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.value = this.currentTheme;
        }
    },

    // Ubah ukuran font
    changeFontSize: function(delta) {
        const currentSize = parseInt(localStorage.getItem('fontSize')) || 100;
        const newSize = Math.max(80, Math.min(150, currentSize + delta));
        this.setFontSize(newSize);
    },

    // Set ukuran font
    setFontSize: function(percentage) {
        document.documentElement.style.fontSize = `${percentage}%`;
        localStorage.setItem('fontSize', percentage.toString());
        
        const display = document.getElementById('currentFontSize');
        if (display) {
            display.textContent = `${percentage}%`;
        }
    },

    // Set reduced motion
    setReducedMotion: function(reduce) {
        if (reduce) {
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
            document.documentElement.style.setProperty('--transition-duration', '0.01ms');
        } else {
            document.documentElement.style.removeProperty('--animation-duration');
            document.documentElement.style.removeProperty('--transition-duration');
        }
        
        localStorage.setItem('reduceMotion', reduce.toString());
    },

    // Reset ke pengaturan default
    resetToDefaults: function() {
        this.applyTheme('light');
        this.setFontSize(100);
        this.setReducedMotion(false);
        
        const reduceMotion = document.getElementById('reduceMotion');
        if (reduceMotion) {
            reduceMotion.checked = false;
        }
        
        if (window.showNotification) {
            showNotification('Pengaturan tema direset ke default', 'success');
        }
    },

    // Toggle tema (untuk keyboard shortcut)
    toggleTheme: function() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    },

    // Get current theme info
    getThemeInfo: function() {
        return {
            current: this.currentTheme,
            available: Object.keys(this.themes),
            fontSize: parseInt(localStorage.getItem('fontSize')) || 100,
            reducedMotion: localStorage.getItem('reduceMotion') === 'true',
            darkModeEnabled: this.darkModeEnabled
        };
    },

    // Disable dark mode (emergency rollback)
    disableDarkMode: function() {
        console.log('Dark mode disabled');
        this.darkModeEnabled = false;
        
        // If currently using dark mode, switch to light
        if (this.currentTheme === 'dark') {
            this.applyTheme('light');
        }
        
        // Update UI
        this.updateThemeControls();
        
        if (window.showNotification) {
            showNotification('Dark mode telah dinonaktifkan', 'info');
        }
    },

    // Enable dark mode
    enableDarkMode: function() {
        console.log('Dark mode enabled');
        this.darkModeEnabled = true;
        this.updateThemeControls();
        
        if (window.showNotification) {
            showNotification('Dark mode telah diaktifkan', 'success');
        }
    }
};

// Keyboard shortcut untuk toggle theme (Ctrl+Shift+T)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        ThemeManager.toggleTheme();
    }
});

// Auto-initialize saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Delay sedikit untuk memastikan elemen sudah ada
    setTimeout(() => {
        ThemeManager.init();
    }, 100);
});

window.ThemeManager = ThemeManager;