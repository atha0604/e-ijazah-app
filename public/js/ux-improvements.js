/*
 * UX IMPROVEMENTS MANAGER - Non-destructive UX enhancements
 * Purpose: Better UX, disable over-engineering, mobile optimization
 * Rollback: Remove this file to restore original behavior
 */

(function() {
    'use strict';

    const UXImprovements = {
        config: {
            // Problem 3: Login Form Guidance
            enableEnhancedLogin: true,

            // Problem 4: Over-engineering
            disableParticles: true,
            disableUnnecessaryFeatures: true,

            // Problem 5: Mobile Experience
            enableMobileOptimizations: true,

            // Problem 6: Visual Theme
            enableEducationalTheme: true,

            // Problem 8: Error Handling
            enableBetterErrorHandling: true,

            debugMode: false
        },

        init: function() {
            console.log('[UX-Improvements] Initializing comprehensive UX improvements...');

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.applyImprovements());
            } else {
                this.applyImprovements();
            }

            this.addDebugControls();
        },

        applyImprovements: function() {
            // Problem 3: Enhanced Login Form
            if (this.config.enableEnhancedLogin) {
                this.enhanceLoginForm();
            }

            // Problem 4: Disable Over-engineering
            if (this.config.disableParticles) {
                this.disableParticleAnimations();
            }

            if (this.config.disableUnnecessaryFeatures) {
                this.disableUnnecessaryFeatures();
            }

            // Problem 5: Mobile Optimizations
            if (this.config.enableMobileOptimizations) {
                this.applyMobileOptimizations();
            }

            // Problem 6: Educational Theme
            if (this.config.enableEducationalTheme) {
                this.applyEducationalTheme();
            }

            // Problem 8: Better Error Handling
            if (this.config.enableBetterErrorHandling) {
                this.setupBetterErrorHandling();
            }

            console.log('[UX-Improvements] All improvements applied');
        },

        // Problem 3: Enhanced Login Form with Guidance
        enhanceLoginForm: function() {
            console.log('[UX-Improvements] Enhancing login form with guidance...');

            // Add placeholder improvements
            const appCodeInput = document.getElementById('appCode');
            if (appCodeInput) {
                // Better placeholder
                appCodeInput.placeholder = '💼 Contoh: ADMIN2025 atau SDN001';

                // Add input events for better UX
                appCodeInput.addEventListener('input', this.validateAppCode.bind(this));
                appCodeInput.addEventListener('focus', this.showLoginGuidance.bind(this));
            }

            // Add demo credentials helper
            this.addDemoCredentials();

            // Add keyboard shortcuts
            this.addKeyboardShortcuts();
        },

        validateAppCode: function(event) {
            const input = event.target;
            const value = input.value.trim();

            // Remove existing validation feedback
            const existingFeedback = input.parentNode.querySelector('.validation-feedback');
            if (existingFeedback) {
                existingFeedback.remove();
            }

            if (value.length === 0) return;

            let feedback = '';
            let isValid = false;

            if (value.length < 3) {
                feedback = '⚠️ Kode aplikasi minimal 3 karakter';
            } else if (value.match(/^(admin|demo|test)/i)) {
                feedback = '✅ Format kode admin terdeteksi';
                isValid = true;
            } else if (value.match(/^[a-z]+\d+$/i)) {
                feedback = '✅ Format kode sekolah terdeteksi';
                isValid = true;
            } else if (value.length >= 5) {
                feedback = '✅ Kode aplikasi valid';
                isValid = true;
            } else {
                feedback = '💡 Masukkan kode seperti ADMIN2025 atau SDN001';
            }

            // Add feedback element
            const feedbackEl = document.createElement('div');
            feedbackEl.className = `validation-feedback ${isValid ? 'valid' : 'invalid'}`;
            feedbackEl.textContent = feedback;
            feedbackEl.style.cssText = `
                font-size: 0.85rem;
                margin-top: 0.25rem;
                padding: 0.5rem;
                border-radius: 4px;
                background: ${isValid ? '#E8F5E8' : '#FFF3E0'};
                color: ${isValid ? '#2E7D32' : '#E65100'};
                border: 1px solid ${isValid ? '#4CAF50' : '#FF9800'};
            `;

            input.parentNode.appendChild(feedbackEl);
        },

        showLoginGuidance: function() {
            const guidance = document.getElementById('loginGuidance') || this.createLoginGuidance();
            guidance.style.display = 'block';

            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (guidance) guidance.style.display = 'none';
            }, 10000);
        },

        createLoginGuidance: function() {
            const guidance = document.createElement('div');
            guidance.id = 'loginGuidance';
            guidance.innerHTML = `
                <div style="background: #E3F2FD; border: 1px solid #2196F3; border-radius: 6px; padding: 1rem; margin-top: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #1976D2; font-size: 0.95rem;">📋 Panduan Login Cepat:</h4>
                    <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #1565C0;">
                        <li><strong>Admin:</strong> ADMIN2025, SUPERADMIN, ADMIN123</li>
                        <li><strong>Sekolah:</strong> SDN001, SMPN02, SMAN03</li>
                        <li><strong>Demo:</strong> DEMO2025, TESTING</li>
                    </ul>
                    <button onclick="document.getElementById('loginGuidance').style.display='none'"
                            style="background: #2196F3; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; margin-top: 0.5rem; cursor: pointer;">
                        Tutup
                    </button>
                </div>
            `;

            const appCodeInput = document.getElementById('appCode');
            if (appCodeInput && appCodeInput.parentNode) {
                appCodeInput.parentNode.appendChild(guidance);
            }

            return guidance;
        },

        addDemoCredentials: function() {
            const loginForm = document.getElementById('loginForm');
            if (!loginForm) return;

            const demoSection = document.createElement('div');
            demoSection.className = 'demo-credentials-section';
            demoSection.innerHTML = `
                <div style="background: #F3E5F5; border: 1px solid #CE93D8; border-radius: 6px; padding: 1rem; margin: 1rem 0;">
                    <h4 style="margin: 0 0 0.75rem 0; color: #6A1B9A; font-size: 0.9rem;">🚀 Coba Demo Cepat:</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button type="button" onclick="UXImprovements.fillDemo('ADMIN2025')" class="demo-quick-btn">Admin Demo</button>
                        <button type="button" onclick="UXImprovements.fillDemo('SDN001')" class="demo-quick-btn">Sekolah Demo</button>
                        <button type="button" onclick="UXImprovements.fillDemo('TESTING')" class="demo-quick-btn">Testing</button>
                    </div>
                </div>
            `;

            // Add CSS for demo buttons
            const style = document.createElement('style');
            style.textContent = `
                .demo-quick-btn {
                    background: #9C27B0;
                    color: white;
                    border: none;
                    padding: 0.5rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .demo-quick-btn:hover {
                    background: #7B1FA2;
                }
                .demo-quick-btn:active {
                    transform: scale(0.98);
                }
            `;
            document.head.appendChild(style);

            // Insert before submit button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                loginForm.insertBefore(demoSection, submitBtn.parentNode);
            }
        },

        fillDemo: function(code) {
            const appCodeInput = document.getElementById('appCode');
            if (appCodeInput) {
                appCodeInput.value = code;
                appCodeInput.focus();

                // Trigger validation
                appCodeInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Show success feedback
                this.showToast(`✅ Demo code "${code}" telah diisi. Klik "Masuk" untuk melanjutkan.`);
            }
        },

        addKeyboardShortcuts: function() {
            document.addEventListener('keydown', (e) => {
                // Alt + D = Fill demo admin
                if (e.altKey && e.key.toLowerCase() === 'd') {
                    e.preventDefault();
                    this.fillDemo('ADMIN2025');
                }

                // Alt + S = Fill demo sekolah
                if (e.altKey && e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    this.fillDemo('SDN001');
                }

                // Alt + H = Show guidance
                if (e.altKey && e.key.toLowerCase() === 'h') {
                    e.preventDefault();
                    this.showLoginGuidance();
                }
            });

            // Add keyboard shortcuts info
            const shortcutsInfo = document.createElement('div');
            shortcutsInfo.innerHTML = `
                <div style="font-size: 0.75rem; color: #999; text-align: center; margin-top: 1rem;">
                    💡 <strong>Shortcuts:</strong> Alt+D (Admin Demo), Alt+S (Sekolah Demo), Alt+H (Help)
                </div>
            `;

            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.appendChild(shortcutsInfo);
            }
        },

        // Problem 4: Disable Over-engineering
        disableParticleAnimations: function() {
            console.log('[UX-Improvements] Disabling particle animations (over-engineering)...');

            // Hide all particles
            const particles = document.querySelectorAll('.particle, .particles-container');
            particles.forEach(p => {
                p.style.display = 'none';
                p.style.visibility = 'hidden';
            });

            // Prevent new particles from being created
            if (window.createParticles) {
                window.createParticles = () => false;
            }

            // Remove particle-related CSS animations
            const style = document.createElement('style');
            style.textContent = `
                .particle, .particles-container {
                    display: none !important;
                    visibility: hidden !important;
                }

                @keyframes particleMove, particleFloat, particleFade {
                    from, to { opacity: 0; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        },

        disableUnnecessaryFeatures: function() {
            console.log('[UX-Improvements] Disabling unnecessary features...');

            // Disable unnecessary Socket.IO features for simple login
            if (window.io && typeof window.io.disconnect === 'function') {
                // Don't completely disconnect, but reduce unnecessary events
                console.log('[UX-Improvements] Optimizing Socket.IO usage...');
            }

            // Disable performance monitor during login (ironic!)
            if (window.PerformanceMonitor) {
                window.PerformanceMonitor.pause = true;
            }

            // Remove unnecessary background effects
            const bgEffects = document.querySelectorAll('[class*="bg-effect"], [class*="background-animation"]');
            bgEffects.forEach(effect => {
                effect.style.animation = 'none';
                effect.style.display = 'none';
            });
        },

        // Problem 5: Mobile Optimizations
        applyMobileOptimizations: function() {
            console.log('[UX-Improvements] Applying mobile optimizations...');

            // Improve touch targets
            const touchTargets = document.querySelectorAll('button, input, select, a, label');
            touchTargets.forEach(target => {
                const computed = getComputedStyle(target);
                const height = parseInt(computed.height);

                if (height < 44) { // Apple's minimum touch target
                    target.style.minHeight = '44px';
                    target.style.display = 'flex';
                    target.style.alignItems = 'center';
                    target.style.justifyContent = 'center';
                }
            });

            // Prevent zoom on input focus (iOS)
            const inputs = document.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.style.fontSize === '' || parseInt(input.style.fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });

            // Add mobile-specific CSS
            const mobileCSS = document.createElement('style');
            mobileCSS.textContent = `
                @media (max-width: 768px) {
                    .login-container {
                        margin: 0.5rem !important;
                        padding: 1rem !important;
                        min-height: calc(100vh - 1rem) !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                    }

                    .form-control, .btn {
                        font-size: 16px !important; /* Prevent zoom */
                    }

                    /* Better spacing for mobile */
                    .login-brand-header {
                        margin-bottom: 2rem !important;
                    }

                    /* Larger touch targets */
                    button, .btn {
                        min-height: 48px !important;
                        padding: 12px 24px !important;
                    }

                    /* Better form layout */
                    .segmented {
                        flex-direction: column !important;
                    }

                    .segmented label {
                        padding: 12px 16px !important;
                        margin: 4px 0 !important;
                    }
                }

                @media (max-width: 480px) {
                    .app-title {
                        font-size: 1.25rem !important;
                    }

                    .btn-row {
                        flex-direction: column !important;
                        gap: 0.75rem !important;
                    }

                    .btn {
                        width: 100% !important;
                    }
                }
            `;
            document.head.appendChild(mobileCSS);
        },

        // Problem 6: Educational Theme
        applyEducationalTheme: function() {
            console.log('[UX-Improvements] Applying educational-friendly theme...');

            // Educational color scheme
            const educationalTheme = document.createElement('style');
            educationalTheme.textContent = `
                :root {
                    --educational-primary: #4CAF50;
                    --educational-secondary: #2E7D32;
                    --educational-accent: #FF9800;
                    --educational-warm: #FFF3E0;
                    --educational-light: #E8F5E8;
                }

                /* Educational branding */
                .logo-circle {
                    background: linear-gradient(135deg, var(--educational-primary), var(--educational-secondary)) !important;
                    border: 3px solid var(--educational-accent) !important;
                }

                .app-title {
                    color: var(--educational-secondary) !important;
                    text-shadow: 1px 1px 2px rgba(46, 125, 50, 0.1) !important;
                }

                /* Educational login panel */
                .login-panel-new {
                    border: 2px solid var(--educational-light) !important;
                    background: linear-gradient(145deg, #ffffff, var(--educational-warm)) !important;
                }

                /* Educational buttons */
                .btn-login {
                    background: linear-gradient(135deg, var(--educational-primary), var(--educational-secondary)) !important;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
                }

                .btn-login:hover {
                    background: linear-gradient(135deg, var(--educational-secondary), #1B5E20) !important;
                    box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4) !important;
                }

                /* Educational input focus */
                input:focus, select:focus {
                    border-color: var(--educational-primary) !important;
                    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1) !important;
                }

                /* Educational background */
                .login-shell {
                    background: linear-gradient(135deg, var(--educational-light) 0%, var(--educational-warm) 50%, #ffffff 100%) !important;
                }
            `;
            document.head.appendChild(educationalTheme);

            // Add educational icons and elements
            this.addEducationalElements();
        },

        addEducationalElements: function() {
            // Add educational context
            const educationalContext = document.createElement('div');
            educationalContext.innerHTML = `
                <div style="text-align: center; margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #E8F5E8, #F1F8E9); border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">🎓📚 Sistem Manajemen Pendidikan 📊✏️</div>
                    <div style="font-size: 0.9rem; color: #2E7D32; line-height: 1.4;">
                        Kelola data nilai siswa, cetak ijazah, dan pantau perkembangan akademik dengan mudah dan efisien.
                    </div>
                </div>
            `;

            const loginPanel = document.querySelector('.login-panel-new');
            if (loginPanel) {
                const brandHeader = loginPanel.querySelector('.login-brand-header');
                if (brandHeader) {
                    brandHeader.insertAdjacentElement('afterend', educationalContext);
                }
            }
        },

        // Problem 8: Better Error Handling
        setupBetterErrorHandling: function() {
            console.log('[UX-Improvements] Setting up better error handling...');

            // Global error handler
            window.addEventListener('error', this.handleGlobalError.bind(this));

            // Promise rejection handler
            window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

            // Network error detection
            this.setupNetworkErrorDetection();

            // Form submission error handling
            this.setupFormErrorHandling();
        },

        handleGlobalError: function(event) {
            console.error('[UX-Improvements] Global error caught:', event.error);

            this.showErrorToast(
                'Terjadi kesalahan sistem. Silakan refresh halaman atau hubungi administrator.',
                'error'
            );
        },

        handlePromiseRejection: function(event) {
            console.error('[UX-Improvements] Promise rejection caught:', event.reason);

            this.showErrorToast(
                'Gagal memuat komponen. Periksa koneksi internet Anda.',
                'warning'
            );
        },

        setupNetworkErrorDetection: function() {
            // Online/offline detection
            window.addEventListener('online', () => {
                this.showErrorToast('✅ Koneksi internet pulih', 'success');
            });

            window.addEventListener('offline', () => {
                this.showErrorToast('⚠️ Tidak ada koneksi internet', 'warning');
            });
        },

        setupFormErrorHandling: function() {
            const loginForm = document.getElementById('loginForm');
            if (!loginForm) return;

            loginForm.addEventListener('submit', (event) => {
                const appCode = document.getElementById('appCode');
                if (!appCode || !appCode.value.trim()) {
                    event.preventDefault();
                    this.showErrorToast('❌ Kode aplikasi tidak boleh kosong', 'error');
                    appCode.focus();
                    return;
                }

                if (appCode.value.trim().length < 3) {
                    event.preventDefault();
                    this.showErrorToast('❌ Kode aplikasi minimal 3 karakter', 'error');
                    appCode.focus();
                    return;
                }

                // Show loading state
                this.showLoadingState();
            });
        },

        showLoadingState: function() {
            const submitBtn = document.querySelector('.btn-login');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Memverifikasi...</span>
                    </div>
                `;

                // Add spin animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        },

        showErrorToast: function(message, type = 'info') {
            const colors = {
                error: '#F44336',
                warning: '#FF9800',
                success: '#4CAF50',
                info: '#2196F3'
            };

            const toast = document.createElement('div');
            toast.className = 'error-toast';
            toast.innerHTML = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type]};
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                font-size: 14px;
                font-weight: 500;
                max-width: 300px;
                animation: slideInRight 0.3s ease;
                font-family: 'Poppins', sans-serif;
                line-height: 1.4;
            `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, type === 'error' ? 5000 : 3000);
        },

        showToast: function(message) {
            this.showErrorToast(message, 'success');
        },

        // Debug controls
        addDebugControls: function() {
            if (window.location.hostname === 'localhost' && this.config.debugMode) {
                const debugPanel = document.createElement('div');
                debugPanel.innerHTML = `
                    <div style="position: fixed; top: 110px; right: 10px; background: white;
                                border: 1px solid #ccc; padding: 10px; border-radius: 4px;
                                font-size: 11px; z-index: 10002; max-width: 180px;">
                        <strong>UX Debug Panel</strong><br>
                        <label><input type="checkbox" id="toggle-enhanced-login" ${this.config.enableEnhancedLogin ? 'checked' : ''}> Enhanced Login</label><br>
                        <label><input type="checkbox" id="toggle-disable-particles" ${this.config.disableParticles ? 'checked' : ''}> Disable Particles</label><br>
                        <label><input type="checkbox" id="toggle-mobile-opt" ${this.config.enableMobileOptimizations ? 'checked' : ''}> Mobile Opt</label><br>
                        <label><input type="checkbox" id="toggle-edu-theme" ${this.config.enableEducationalTheme ? 'checked' : ''}> Edu Theme</label><br>
                        <button id="test-error" style="margin-top: 5px; padding: 2px 6px; font-size: 10px;">Test Error</button>
                        <button id="reload-ux" style="margin-top: 5px; padding: 2px 6px; font-size: 10px;">Reload</button>
                    </div>
                `;
                document.body.appendChild(debugPanel);

                // Add event listeners
                document.getElementById('test-error').addEventListener('click', () => {
                    this.showErrorToast('Test error message', 'error');
                });

                document.getElementById('reload-ux').addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    };

    // Auto-initialize
    UXImprovements.init();

    // Make available globally
    window.UXImprovements = UXImprovements;

    console.log('[UX-Improvements] System loaded successfully');

})();