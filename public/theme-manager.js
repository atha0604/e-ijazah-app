// Font Size & Accessibility Manager 
const ThemeManager = {
    currentFontSize: 100,

    // Inisialisasi theme manager
    init: function() {
        console.log('Font Size & Accessibility Manager initialized');
        
        // Load saved font size
        const savedFontSize = localStorage.getItem('fontSize');
        
        if (savedFontSize) {
            this.setFontSize(parseInt(savedFontSize));
        }
        
        // Add accessibility controls
        this.createAccessibilityControls();
    },

    // Buat kontrol aksesibilitas
    createAccessibilityControls: function() {
        // Cari tempat untuk menambahkan kontrol accessibility
        const settingsSection = document.getElementById('settingSection');
        if (!settingsSection) return;
        
        const accessibilityControlsHTML = `
            <div class="accessibility-controls-container" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;">
                <h3 style="color: #333333; margin-bottom: 15px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Pengaturan Aksesibilitas
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #666666; margin-bottom: 5px; font-weight: 500;">Ukuran Font:</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" id="decreaseFontSize" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #e0e0e0; background: #ffffff; color: #333333; cursor: pointer;">A-</button>
                        <span id="currentFontSize" style="color: #333333; min-width: 60px; text-align: center;">100%</span>
                        <button type="button" id="increaseFontSize" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #e0e0e0; background: #ffffff; color: #333333; cursor: pointer;">A+</button>
                        <button type="button" id="resetFontSize" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #e0e0e0; background: #ffffff; color: #333333; cursor: pointer;">Reset</button>
                    </div>
                    <small style="color: #888888; font-style: italic;">Ubah ukuran teks untuk kenyamanan membaca</small>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; color: #666666; cursor: pointer;">
                        <input type="checkbox" id="reduceMotion" style="margin-right: 8px;">
                        Kurangi animasi (untuk sensitif gerakan)
                    </label>
                    <small style="color: #888888; font-style: italic; margin-left: 20px;">Mengurangi efek animasi untuk menghindari mabuk gerakan</small>
                </div>
                
                <div>
                    <button type="button" id="resetAccessibilitySettings" style="padding: 8px 16px; border-radius: 4px; border: 1px solid #1e8e3e; background: #1e8e3e; color: white; cursor: pointer;">
                        Reset ke Default
                    </button>
                </div>
            </div>
        `;
        
        // Tambahkan ke setting section
        const existingContent = settingsSection.innerHTML;
        settingsSection.innerHTML = existingContent + accessibilityControlsHTML;
        
        // Bind event listeners
        this.bindAccessibilityControls();
    },

    // Bind event listeners untuk kontrol accessibility
    bindAccessibilityControls: function() {
        const increaseFontSize = document.getElementById('increaseFontSize');
        const decreaseFontSize = document.getElementById('decreaseFontSize');
        const resetFontSize = document.getElementById('resetFontSize');
        const reduceMotion = document.getElementById('reduceMotion');
        const resetAccessibilitySettings = document.getElementById('resetAccessibilitySettings');
        
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
        
        if (resetAccessibilitySettings) {
            resetAccessibilitySettings.addEventListener('click', () => {
                this.resetToDefaults();
            });
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
        this.setFontSize(100);
        this.setReducedMotion(false);
        
        const reduceMotion = document.getElementById('reduceMotion');
        if (reduceMotion) {
            reduceMotion.checked = false;
        }
        
        if (window.showNotification) {
            showNotification('Pengaturan aksesibilitas direset ke default', 'success');
        }
    },

    // Get current accessibility info
    getAccessibilityInfo: function() {
        return {
            fontSize: parseInt(localStorage.getItem('fontSize')) || 100,
            reducedMotion: localStorage.getItem('reduceMotion') === 'true'
        };
    }
};

// Auto-initialize saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Delay sedikit untuk memastikan elemen sudah ada
    setTimeout(() => {
        ThemeManager.init();
    }, 100);
});

window.ThemeManager = ThemeManager;